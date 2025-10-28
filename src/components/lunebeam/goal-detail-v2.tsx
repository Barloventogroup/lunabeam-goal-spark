import React, { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { Calendar, MoreVertical, Trash2, CheckCircle2, UserPlus, Share2, Edit, Users, UserCheck, AlertCircle, Loader2, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useGoalDetail, goalDetailKeys, useDeleteGoalMutation } from '@/hooks/useGoalDetail';
import { goalsService, stepsService } from '@/services/goalsService';
import { getDomainDisplayName } from '@/utils/domainUtils';
import { supabase } from '@/integrations/supabase/client';
import { generateMicroStepsSmart } from '@/services/microStepsGenerator';
import { cn } from '@/lib/utils';

import { RecommendedStepsList } from './recommended-steps-list';
import { SupporterSetupStepsList } from './supporter-setup-steps-list';
import { StepsChat } from './steps-chat';
import { StepChatModal } from './step-chat-modal';
import { ProgressBar } from './progress-bar';
import { GoalEditModal } from './goal-edit-modal';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { Goal, Step, GoalProgress, Substep } from '@/types';

// Lazy load heavy components (Phase 4)
const GoalFactorSummary = lazy(() => import('./goal-factor-summary').then(m => ({ default: m.GoalFactorSummary })));
const GoalCalendarView = lazy(() => import('./goal-calendar-view').then(m => ({ default: m.GoalCalendarView })));

interface GoalDetailV2Props {
  goalId: string;
  onBack: () => void;
}

export const GoalDetailV2: React.FC<GoalDetailV2Props> = ({ goalId, onBack }) => {
  // Use React Query hook for data fetching (Phase 1)
  const { data, isLoading, refetch } = useGoalDetail(goalId);
  const queryClient = useQueryClient();
  const deleteGoalMutation = useDeleteGoalMutation();
  
  const [showChat, setShowChat] = useState(false);
  const [showStepChat, setShowStepChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [chatStep, setChatStep] = useState<Step | undefined>(undefined);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState('summary');
  const { toast } = useToast();

  // Extract data from React Query result
  const goal = data?.goal || null;
  const steps = data?.steps || [];
  const substeps = data?.substeps || [];
  const currentUser = data?.user;
  const ownerProfile = data?.ownerProfile;
  const creatorProfile = data?.creatorProfile;
  const isViewerSupporter = data?.isViewerSupporter || false;

  // Smart real-time updates with React Query (Phase 3)
  useEffect(() => {
    if (!goalId) return;

    let hasShownToast = false;

    const channel = supabase
      .channel(`steps-updates-${goalId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'steps',
        filter: `goal_id=eq.${goalId}`
      }, (payload) => {
        console.log('[GoalDetail] Steps updated, invalidating cache...', payload);
        // Instead of full reload, invalidate React Query cache
        queryClient.invalidateQueries({ queryKey: goalDetailKeys.detail(goalId) });
        
        // Show toast once when AI enhancement completes
        if (!hasShownToast && payload.eventType === 'UPDATE') {
          const step = payload.new as any;
          if (step?.pm_metadata?.enhanced) {
            hasShownToast = true;
            toast({
              title: "Your practice steps were enhanced ✨",
              description: "AI has personalized your learning path",
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, toast, queryClient]);

  useEffect(() => {
    // Trigger daily generation check for habit goals
    if (goal) {
      triggerDailyGeneration();
    }
  }, [goal?.id]);

  useEffect(() => {
    // Auto-generate steps for new goals with stale detection
    const status = (goal as any)?.metadata?.generationStatus;
    const startedAt = (goal as any)?.metadata?.startedAt;
    const queuedAt = (goal as any)?.metadata?.generationQueuedAt;
    
    // Compute gate conditions
    const isQueued = status === 'queued';
    const pendingNoStart = status === 'pending' && !startedAt;
    const isPendingStalled = status === 'pending' && startedAt && 
      (Date.now() - new Date(startedAt).getTime()) > 5 * 60 * 1000;

    // Log gate decision for debugging
    console.info('[AutoGen Gate]', {
      status,
      startedAt,
      queuedAt,
      isQueued,
      pendingNoStart,
      isPendingStalled,
      stepsLength: steps.length,
      generatingSteps,
      generationError,
      hasWizardContext: !!(goal as any)?.metadata?.wizardContext
    });

    const shouldGenerate = 
      goal &&
      steps.length === 0 &&
      (goal as any).metadata?.wizardContext &&
      !generatingSteps &&
      !generationError &&
      status !== 'completed' && // Don't retry completed
      (isQueued || pendingNoStart || isPendingStalled || !status); // Allow generation for these states

    if (shouldGenerate) {
      // Log reason for generation
      if (isQueued) {
        console.info('[AutoGen] Triggering generation for queued goal');
      } else if (pendingNoStart) {
        console.info('[AutoGen] Triggering generation for pending goal without startedAt');
      } else if (isPendingStalled) {
        console.info('[AutoGen] Retrying stalled generation (pending > 5 min)');
      } else if (!status) {
        console.info('[AutoGen] Triggering generation for goal without status');
      }
      
      generateStepsForNewGoal();
    }
  }, [goal, steps]);

  useEffect(() => {
    // On mount, check if goal has stale 'pending' or 'queued' status
    const checkStaleGeneration = async () => {
      if (!goal) return;
      
      const status = (goal as any)?.metadata?.generationStatus;
      const startedAt = (goal as any)?.metadata?.startedAt;
      const queuedAt = (goal as any)?.metadata?.generationQueuedAt;
      
      console.info('[Stale Checker]', { status, startedAt, queuedAt, stepsLength: steps.length });
      
      // Check for stale 'pending' (with startedAt > 3 minutes)
      if (status === 'pending' && startedAt && steps.length === 0) {
        const minutesPending = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60);
        
        if (minutesPending > 3) {
          console.warn(`[Stale Checker] Found stale pending generation (${minutesPending.toFixed(1)} min), marking as failed`);
          
          await supabase
            .from('goals')
            .update({
              metadata: {
                ...goal.metadata,
                generationStatus: 'failed',
                generationError: 'Generation stalled from pending state',
                failedAt: new Date().toISOString()
              } as any
            })
            .eq('id', goal.id);
          
          // Reload to trigger fresh attempt
          await loadGoalData();
          return;
        }
      }
      
      // Check for stale 'queued' (with queuedAt > 3 minutes)
      if (status === 'queued' && queuedAt && steps.length === 0) {
        const minutesQueued = (Date.now() - new Date(queuedAt).getTime()) / (1000 * 60);
        
        if (minutesQueued > 3) {
          console.warn(`[Stale Checker] Found stale queued goal (${minutesQueued.toFixed(1)} min), marking as failed`);
          
          await supabase
            .from('goals')
            .update({
              metadata: {
                ...goal.metadata,
                generationStatus: 'failed',
                generationError: 'Generation stalled from queued state',
                failedAt: new Date().toISOString()
              } as any
            })
            .eq('id', goal.id);
          
          // Reload to trigger fresh attempt
          await loadGoalData();
          return;
        }
      }
    };
    
    if (goal && steps.length === 0) {
      checkStaleGeneration();
    }
  }, [goal?.id, steps.length]);

  // Optimized progress calculation with useMemo (Phase 2)
  const progress = useMemo(() => {
    if (!steps || steps.length === 0) return { done: 0, actionable: 0, percent: 0 };
    
    const actionableSteps = steps.filter(s => 
      (!s.type || s.type === 'action') && !s.hidden && s.status !== 'skipped'
    );
    
    // Group substeps by step_id for O(1) lookup
    const substepsByStep = substeps.reduce((acc, sub) => {
      if (!acc[sub.step_id]) acc[sub.step_id] = [];
      acc[sub.step_id].push(sub);
      return acc;
    }, {} as Record<string, Substep[]>);
    
    let totalCompletableItems = 0;
    let completedItems = 0;
    
    actionableSteps.forEach(step => {
      const stepSubsteps = substepsByStep[step.id] || [];
      
      if (stepSubsteps.length > 0) {
        // If step has substeps, count each substep
        totalCompletableItems += stepSubsteps.length;
        completedItems += stepSubsteps.filter(sub => sub.completed_at).length;
      } else {
        // If no substeps, count the main step
        totalCompletableItems += 1;
        completedItems += step.status === 'done' ? 1 : 0;
      }
    });
    
    return {
      done: completedItems,
      actionable: totalCompletableItems,
      percent: totalCompletableItems > 0 
        ? Math.round((completedItems / totalCompletableItems) * 100) 
        : 0
    };
  }, [steps, substeps]);

  const triggerDailyGeneration = async () => {
    if (!goal?.id) return;
    
    const metadata = (goal as any)?.metadata;
    const isHabitGoal = goal.frequency_per_week && goal.frequency_per_week > 0;
    
    // Only trigger for habit goals with planned occurrences
    if (!isHabitGoal || !metadata?.plannedOccurrences) return;
    
    const lastChecked = metadata?.lastGenerationCheck;
    const now = new Date();
    
    // Only check at most twice per day
    if (lastChecked) {
      const lastCheckedDate = new Date(lastChecked);
      const hoursSince = (now.getTime() - lastCheckedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 12) return;
    }
    
    console.log('Triggering daily generation check for goal:', goal.id);
    
    // Update last check time
    await supabase
      .from('goals')
      .update({
        metadata: {
          ...metadata,
          lastGenerationCheck: now.toISOString()
        } as any
      })
      .eq('id', goal.id);
    
    // Trigger generation (fire and forget, don't block UI)
    const { dailyStepsGenerator } = await import('@/services/dailyStepsGenerator');
    dailyStepsGenerator.generateNextDaySteps(goal.id)
      .then(result => {
        if (result.daysGenerated > 0) {
          console.log(`Generated ${result.daysGenerated} days for goal ${goal.id}`);
          loadGoalData(); // Reload to show new steps
        }
      })
      .catch(err => console.error('Daily generation failed:', err));
  };

  // Reload function simplified - now uses React Query cache invalidation
  const loadGoalData = () => {
    queryClient.invalidateQueries({ queryKey: goalDetailKeys.detail(goalId) });
  };

  const handleStepsUpdate = async () => {
    // Invalidate cache to refetch latest data
    loadGoalData();
  };

  const handleOpenStepChat = (step: Step) => {
    setSelectedStep(step);
    setShowStepChat(true);
  };

  const handleStepChatUpdate = async () => {
    // Invalidate cache to refetch latest data
    loadGoalData();
  };

  const handleGoalUpdate = () => {
    // Invalidate cache to refetch latest data
    loadGoalData();
  };

  const handleDeleteGoal = async () => {
    try {
      await deleteGoalMutation.mutateAsync(goalId);
      toast({
        description: "Goal archived successfully."
      });
      onBack();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: "Failed to archive goal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sanitizeDescription = (text?: string): string => {
    if (!text) return '';
    let out = text.trim();
    
    // Fix frequency patterns
    out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+) times per week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+)x\/week/gi, '$1 times per week');
    
    // Fix double parentheses and nested structures
    out = out.replace(/\(\s*\([^)]+\)\s*\)/g, (match) => {
      const inner = match.replace(/^\(\s*\(/, '(').replace(/\)\s*\)$/, ')');
      return inner;
    });
    
    // Remove outer parentheses around trailing "with ..." clauses
    out = out.replace(/\.?\s*\((with [^)]+)\)\s*$/i, '. $1');
    
    // Fix awkward "to relax/enjoy" patterns
    out = out.replace(/to relax\/enjoy/gi, 'to relax and enjoy');
    
    // Fix standalone "with" clauses at the end
    out = out.replace(/\.\s*with\s+([A-Z])/g, ' with $1');
    
    // Fix double spaces and ensure proper spacing
    out = out.replace(/\s{2,}/g, ' ');
    out = out.replace(/\s*\.\s*\./g, '.');
    
    // Ensure single ending period
    out = out.replace(/\.+\s*$/, '.');
    
    return out;
  };

  const calculateStepDueDate = (startDate: Date, weekNumber: string): Date => {
    const weekMatch = weekNumber.match(/(\d+)(?:-(\d+))?/);
    if (!weekMatch) return startDate;
    
    const week1 = parseInt(weekMatch[1]);
    const week2 = weekMatch[2] ? parseInt(weekMatch[2]) : week1;
    const avgWeek = Math.floor((week1 + week2) / 2);
    
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (avgWeek - 1) * 7);
    return dueDate;
  };

  const generatePMSteps = async () => {
    if (!goal) return;
    
    console.log('[PM Generation] Starting PM step generation for goal:', goal.id);
    setGeneratingSteps(true);
    setGenerationError(false);
    
    try {
      const pmMetadata = (goal as any)?.pm_metadata;
      if (!pmMetadata) {
        throw new Error('PM metadata not found on goal');
      }
      
      // Extract motivation and barriers text
      const motivationText = pmMetadata.motivation?.text || pmMetadata.motivation || '';
      const barriersText = Array.isArray(pmMetadata.barriers)
        ? pmMetadata.barriers.map((b: any) => typeof b === 'string' ? b : b.text || '').join('; ')
        : (pmMetadata.barriers?.text || pmMetadata.barriers || '');
      
      // Build PM payload
      const pmPayload = {
        goalId: goal.id,
        title: goal.title,
        domain: goal.domain || 'general',
        duration_weeks: goal.duration_weeks || 4,
        skillAssessment: pmMetadata.skillAssessment || {
          experience: 3,
          confidence: 3,
          helpNeeded: 3,
          calculatedLevel: 3,
          levelLabel: 'Developing'
        },
        smartStart: pmMetadata.smartStart || {
          startingFrequency: 2,
          targetFrequency: 3,
          rampWeeks: 2
        },
        teachingHelper: pmMetadata.teachingHelper,
        prerequisites: pmMetadata.prerequisites || { hasEverything: true },
        barriers: barriersText,
        motivation: motivationText,
        userId: goal.owner_id,
        userName: ownerProfile?.first_name || 'User',
        userAge: undefined,
        is_self_registered: true,
        mode: 'sync'
      };
      
      console.log('[PM Generation] Calling pm-microsteps-scaffold with payload:', {
        goalId: pmPayload.goalId,
        title: pmPayload.title,
        domain: pmPayload.domain
      });
      
      const { data, error } = await supabase.functions.invoke('pm-microsteps-scaffold', {
        body: pmPayload
      });
      
      if (error) {
        console.error('[PM Generation] Edge function error:', error);
        
        // Check if it's a safety violation
        if (data?.safety_violation || data?.code === 'SAFETY_VIOLATION_LAYER_2') {
          toast({
            title: "Goal needs review",
            description: "Your goal will be generated shortly after quick review.",
            duration: 5000
          });
          setGeneratingSteps(false);
          return;
        }
        
        // Check if AI is unavailable
        if (data?.useFallback || error.message?.includes('timeout') || error.message?.includes('failed') || error.message?.includes('unavailable')) {
          toast({
            title: "AI temporarily unavailable",
            description: "Please try again in a moment.",
            variant: "destructive"
          });
          setGeneratingSteps(false);
          return;
        }
        
        throw error;
      }
      
      // Normalize response shape: prefer steps, fall back to microSteps
      const stepsToUse = data?.steps || data?.microSteps;
      
      if (!stepsToUse || stepsToUse.length === 0) {
        console.warn('[PM Generation] No steps returned');
        
        toast({
          title: "AI temporarily unavailable",
          description: "Please try again in a moment.",
          variant: "destructive"
        });
        setGeneratingSteps(false);
        return;
      }
      
      console.log(`[PM Generation] Received ${stepsToUse.length} steps, saving to database`);
      
      // Transform and save steps
      const startDate = goal.start_date ? new Date(goal.start_date) : new Date();
      const stepsToInsert = stepsToUse.map((step: any, index: number) => ({
        goal_id: goal.id,
        title: step.title,
        notes: step.description || '',
        estimated_effort_min: step.estimatedDuration || 30,
        step_type: 'habit',
        is_planned: true,
        status: 'not_started',
        order_index: index,
        due_date: calculateStepDueDate(startDate, step.weekNumber || 'Week 1').toISOString().split('T')[0],
        pm_metadata: {
          phase: step.phase || 1,
          weekNumber: step.weekNumber || 'Week 1',
          supportLevel: step.supportLevel || 'medium',
          difficulty: step.difficulty || 2,
          prerequisites: step.prerequisites || [],
          safetyNotes: step.safetyNotes,
          qualityIndicators: step.qualityIndicators || [],
          independenceIndicators: step.independenceIndicators || []
        } as any
      }));
      
      const { error: insertError } = await supabase
        .from('steps')
        .insert(stepsToInsert);
      
      if (insertError) {
        console.error('[PM Generation] Failed to insert steps:', insertError);
        throw insertError;
      }
      
      console.log('[PM Generation] Successfully saved steps to database');
      
      // Update goal status
      await supabase
        .from('goals')
        .update({
          status: 'active',
          metadata: {
            ...(goal as any).metadata,
            generationStatus: 'complete',
            generatedAt: new Date().toISOString()
          } as any
        })
        .eq('id', goal.id);
      
      toast({
        title: "Practice plan created!",
        description: `Generated ${stepsToUse.length} personalized steps.`,
        duration: 4000
      });
      
      // Reload goal data
      await loadGoalData();
      
    } catch (error: any) {
      console.error('[PM Generation] Error:', error);
      setGenerationError(true);
      
      toast({
        title: "Could not generate steps",
        description: "AI is temporarily unavailable. Please try again later.",
        variant: "destructive"
      });
      
      setGeneratingSteps(false);
    }
  };

  const generateStepsForNewGoal = async () => {
    const goalMetadata = (goal as any)?.metadata;
    if (!goalMetadata?.wizardContext && !goalMetadata?.pmContext) return;
    
    console.info('[Generation] Starting step generation', {
      goalId: goal?.id,
      goalTitle: goal?.title,
      goalType: goal?.goal_type,
      currentStatus: goalMetadata?.generationStatus
    });
    
    // Check if this is a PM goal
    const isPMGoal = goal?.goal_type === 'progressive_mastery';
    
    if (isPMGoal) {
      console.log('[PM Generation] Detected PM goal, using PM generation path');
      return generatePMSteps();
    }
    
    setGeneratingSteps(true);
    setGenerationError(false);
    
    // NOTE: Don't set 'pending' status here - wait until we're about to call edge function
    // This prevents deadlock if early validation fails
    
    // Add timeout: If generation takes more than 2 minutes, abort
    const timeoutId = setTimeout(async () => {
      console.error('Step generation timed out after 2 minutes');
      setGeneratingSteps(false);
      setGenerationError(true);
      
      // Persist failure state
      await supabase
        .from('goals')
        .update({ 
          metadata: {
            ...goal?.metadata,
            generationStatus: 'failed',
            generationError: 'Generation timed out after 2 minutes',
            failedAt: new Date().toISOString()
          } as any
        })
        .eq('id', goal!.id);
      
      toast({
        title: "Generation Timeout",
        description: "Step generation is taking too long. Please try again or contact support.",
        variant: "destructive"
      });
    }, 120000); // 2 minutes
    
    try {
      const wizardData = goalMetadata.wizardContext;
      
      // Build enriched data for step generation
      const enrichedData = {
        goalTitle: wizardData.goalTitle,
        goalMotivation: wizardData.goalMotivation,
        customMotivation: wizardData.customMotivation,
        goalType: wizardData.goalType,
        challengeAreas: wizardData.challengeAreas,
        customChallenges: wizardData.customChallenges,
        
        // Fix: Map prerequisite correctly
        hasPrerequisites: !!wizardData.prerequisite,
        customPrerequisites: wizardData.prerequisite || '',
        
        // Fix: Ensure Date object with timezone handling
        startDate: (() => {
          const date = new Date(wizardData.startDate);
          // Reset to midnight in local timezone to avoid day-of-week confusion
          date.setHours(0, 0, 0, 0);
          return date;
        })(),
        
        timeOfDay: wizardData.timeOfDay,
        customTime: wizardData.customTime,
        supportContext: wizardData.supportContext,
        primarySupporterName: wizardData.primarySupporterName,
        primarySupporterRole: wizardData.primarySupporterRole,
        
        // Fix: Add category (required by templates)
        category: goal!.domain || 'general',
        
        // Fix: Add person names for context
        supportedPersonName: ownerProfile?.first_name || 'them',
        supporterName: wizardData.primarySupporterName
      };
      
      // Calculate all occurrence dates for habit goals
      const isHabitGoal = goal!.frequency_per_week && goal!.frequency_per_week > 0;
      
      const occurrenceDates: Date[] = [];
      // Normalize baseStartDate to midnight to ensure proper day-of-week comparisons
      const baseStartDate = new Date(wizardData.startDate);
      baseStartDate.setHours(0, 0, 0, 0);
      
      // Pre-check: if start date is after goal end date, fail fast
      const dueEnd = goal!.due_date ? new Date(goal!.due_date) : null;
      if (dueEnd) {
        dueEnd.setHours(23, 59, 59, 999);
        if (baseStartDate > dueEnd) {
          throw new Error(
            `Start date (${format(baseStartDate, 'MMM d, yyyy')}) is after goal end date (${format(dueEnd, 'MMM d, yyyy')}). Please adjust your dates.`
          );
        }
      }
      
      const startTime = wizardData.customTime || wizardData.timeOfDay || '08:00';
      const [startHour, startMin] = startTime.split(':').map(Number);
      
      if (isHabitGoal) {
        // Get selected days from wizard context
        const selectedDays = (wizardData as any).selectedDays || [];
        const dayMap: Record<string, number> = {
          'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
        };
        const selectedDayNumbers = selectedDays.map((d: string) => dayMap[d]).sort();
        
        if (selectedDayNumbers.length > 0) {
          // Generate occurrences on selected weekdays within date range
          let currentDate = new Date(baseStartDate);
          // Add safety: Calculate soft max based on date range to prevent infinite loop
          const goalEndDate = goal!.due_date ? new Date(goal!.due_date) : null;
          if (goalEndDate) goalEndDate.setHours(23, 59, 59, 999);
          
          const daysBetween = goalEndDate 
            ? Math.ceil((goalEndDate.getTime() - baseStartDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const maxIterations = daysBetween ? Math.min(daysBetween + 7, 365) : 365;
          let iterations = 0;
          
          while (iterations < maxIterations) {
            iterations++;
            const currentDayOfWeek = currentDate.getDay();
            
            // If this is a selected day, add it
            if (selectedDayNumbers.includes(currentDayOfWeek)) {
              // Don't add dates before start_date
              if (currentDate >= baseStartDate) {
                const occurrenceDate = new Date(currentDate);
                occurrenceDate.setHours(startHour, startMin || 0, 0, 0);
                occurrenceDates.push(occurrenceDate);
              }
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Stop condition: Reached goal due_date
            if (goalEndDate && currentDate > goalEndDate) {
              break;
            }
          }
          
          // Add error handling: If loop maxed out, throw error
          if (iterations >= maxIterations) {
            console.error('Step generation loop exceeded maximum iterations');
            clearTimeout(timeoutId);
            throw new Error('Failed to generate schedule - date range too large or invalid configuration');
          }
          
          // Add validation: If no occurrences found, throw clear error
          if (occurrenceDates.length === 0) {
            const selectedDayNames = selectedDays.map((d: string) => d.toUpperCase()).join(', ');
            clearTimeout(timeoutId);
            throw new Error(
              `No occurrences found for selected days (${selectedDayNames}) between ${format(baseStartDate, 'MMM d, yyyy')} and ${goalEndDate ? format(goalEndDate, 'MMM d, yyyy') : 'end date'}. Please check your schedule.`
            );
          }
        } else {
          // Fallback: consecutive days (if selectedDays missing)
          const estimatedMaxOccurrences = goal!.frequency_per_week * (goal!.duration_weeks || 1);
          for (let i = 0; i < estimatedMaxOccurrences; i++) {
            const occurrenceDate = new Date(baseStartDate);
            occurrenceDate.setDate(occurrenceDate.getDate() + i);
            occurrenceDate.setHours(startHour, startMin || 0, 0, 0);
            occurrenceDates.push(occurrenceDate);
          }
        }
      } else {
        baseStartDate.setHours(startHour, startMin || 0, 0, 0);
        occurrenceDates.push(baseStartDate);
      }
      
      const totalOccurrences = occurrenceDates.length;
      
      console.log(`Generating steps for ${occurrenceDates.length} days...`);
      console.log('Occurrence dates:', occurrenceDates.map(d => format(d, 'EEE MMM d, yyyy HH:mm')));
      console.log('Selected days from wizard:', (wizardData as any).selectedDays);
      console.log('Base start date (normalized):', format(baseStartDate, 'EEE MMM d, yyyy HH:mm'));
      console.log('Goal date range:', {
        start: format(new Date(goal!.start_date), 'MMM d, yyyy'),
        end: goal!.due_date ? format(new Date(goal!.due_date), 'MMM d, yyyy') : 'no end date'
      });
      
      // Safety check: verify goal due_date can accommodate all occurrences
      const lastOccurrenceDate = occurrenceDates[occurrenceDates.length - 1];
      const goalDueDateObj = goal!.due_date ? new Date(goal!.due_date) : null;
      
      // Create end-of-day version of due date for comparison
      const goalDueDateEnd = goalDueDateObj ? new Date(goalDueDateObj) : null;
      if (goalDueDateEnd) {
        goalDueDateEnd.setHours(23, 59, 59, 999);
        console.log('Goal due date (end-of-day):', format(goalDueDateEnd, 'EEE MMM d, yyyy HH:mm'));
      }
      
      // Graceful trimming: if occurrences extend past end date, trim them
      if (goalDueDateEnd && lastOccurrenceDate > goalDueDateEnd) {
        const originalCount = occurrenceDates.length;
        const trimmedDates = occurrenceDates.filter(d => d <= goalDueDateEnd);
        
        console.log(`Trimming occurrences: ${originalCount} → ${trimmedDates.length} (${originalCount - trimmedDates.length} sessions after end date)`);
        
        if (trimmedDates.length === 0) {
          // No valid occurrences remain after trimming
          const selectedDayNames = ((wizardData as any).selectedDays || []).map((d: string) => d.toUpperCase()).join(', ');
          throw new Error(
            `No ${selectedDayNames} days occur between ${format(baseStartDate, 'MMM d, yyyy')} and ${format(goalDueDateEnd, 'MMM d, yyyy')}. Please extend your end date or adjust selected days.`
          );
        }
        
        // Update occurrenceDates array
        occurrenceDates.length = 0;
        occurrenceDates.push(...trimmedDates);
        
        // Show toast about trimmed sessions
        toast({
          title: "Schedule Adjusted",
          description: `${originalCount - trimmedDates.length} session${originalCount - trimmedDates.length > 1 ? 's' : ''} fell after your end date and ${originalCount - trimmedDates.length > 1 ? 'were' : 'was'} skipped. Generating ${trimmedDates.length} sessions.`,
          duration: 5000
        });
      }
      
      // For habit goals, only generate first day initially
      const daysToGenerate = isHabitGoal ? Math.min(1, occurrenceDates.length) : occurrenceDates.length;
      
      console.log(`Habit goal: ${isHabitGoal}, generating ${daysToGenerate} of ${occurrenceDates.length} total occurrences`);
      
      // Store all occurrence dates in metadata for future generation
      if (isHabitGoal && occurrenceDates.length > 1) {
        await supabase
          .from('goals')
          .update({
            metadata: {
              ...goal?.metadata,
              plannedOccurrences: occurrenceDates.map(d => d.toISOString()),
              lastGeneratedOccurrenceIndex: -1, // Will be 0 after first day
              totalPlannedOccurrences: occurrenceDates.length,
              wizardContext: goalMetadata.wizardContext // Preserve for future generation
            } as any
          })
          .eq('id', goal!.id);
      }
      
      // Generate and save steps for each occurrence with retry logic
      let successfulDays = 0;
      let failedDays: { day: number; date: Date; error: string }[] = [];
      
      for (let dayIndex = 0; dayIndex < daysToGenerate; dayIndex++) {
        const occurrenceDate = occurrenceDates[dayIndex];
        setGenerationProgress({ current: dayIndex + 1, total: occurrenceDates.length });
        console.log(`Generating steps for day ${dayIndex + 1} of ${occurrenceDates.length}...`);
        
        try {
          // Update enriched data with this occurrence's date
          const dailyEnrichedData = {
            ...enrichedData,
            startDate: occurrenceDate,
            supporterName: wizardData.primarySupporterName
          };
          
          // Retry logic for robust generation
          let retryCount = 0;
          const maxRetries = 3;
          let generationSuccess = false;
          let individualSteps: any[] = [];
          
          while (retryCount < maxRetries && !generationSuccess) {
            try {
              // On first attempt of first day, mark as pending now that we're actually calling AI
              if (dayIndex === 0 && retryCount === 0) {
                console.info('[Generation] Setting status to pending, about to call AI');
                await supabase
                  .from('goals')
                  .update({ 
                    metadata: {
                      ...goal?.metadata,
                      generationStatus: 'pending',
                      startedAt: new Date().toISOString()
                    } as any
                  })
                  .eq('id', goal!.id);
              }

              individualSteps = await generateMicroStepsSmart(dailyEnrichedData, 'individual');
              
              if (!individualSteps || individualSteps.length === 0) {
                throw new Error('No steps returned from generation');
              }
              
              generationSuccess = true;
              
            } catch (error: any) {
              retryCount++;
              console.error(`Attempt ${retryCount}/${maxRetries} failed for day ${dayIndex + 1}:`, error);
              
              if (error.message?.includes('429') || error.message?.includes('rate limit')) {
                console.log(`Rate limited. Waiting 5 seconds before retry ${retryCount}...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
              } else if (retryCount >= maxRetries) {
                throw error;
              } else {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
        
        // Save individual steps with timing and dependencies
        const savedIndividualSteps: any[] = [];
        const goalStartDate = new Date(occurrenceDate);
        
        for (let i = 0; i < individualSteps.length; i++) {
          const microStep = individualSteps[i];
          const isLastStep = i === individualSteps.length - 1;
          const isCompletionStep = microStep.title.toLowerCase().includes('complete:') || 
                                    microStep.title.toLowerCase().includes('help complete:');
          
          // Determine step_type based on goal characteristics and position
          let stepType = 'action';
          
          if (isLastStep || isCompletionStep) {
            // Last step: 'habit' for daily habit goals, 'milestone' for time-bound goals
            stepType = isHabitGoal ? 'habit' : 'milestone';
          }
          
          // Calculate due date based on step position
          let stepDueDate: Date = new Date(goalStartDate);
          if (i === 0 && microStep.title.toLowerCase().includes('get ready by')) {
            // Prerequisite step: due day before at 8 PM
            stepDueDate.setDate(stepDueDate.getDate() - 1);
            stepDueDate.setHours(20, 0, 0, 0);
          } else if (i === 1 || microStep.title.toLowerCase().includes('at ')) {
            // Activation step: due at exact start time
            stepDueDate = new Date(goalStartDate);
          } else {
            // Follow-up steps: due 1 hour after start
            stepDueDate = new Date(goalStartDate);
            stepDueDate.setHours(startHour + 1, 0, 0, 0);
          }
          
          const { step } = await stepsService.createStep(goal!.id, {
            title: microStep.title,
            step_type: stepType,
            is_required: true,
            estimated_effort_min: 15,
            is_planned: true,
            notes: microStep.description,
            is_supporter_step: false,
            due_date: stepDueDate.toISOString()
          });
          
          savedIndividualSteps.push(step);
          
          // Set dependency on previous step (if exists)
          if (i > 0 && savedIndividualSteps[i - 1]) {
            await supabase
              .from('steps')
              .update({ dependency_step_ids: [savedIndividualSteps[i - 1].id] })
              .eq('id', step.id);
          }
        }
        
        // Generate supporter steps if needed for this day
        if (wizardData.primarySupporterRole === 'hands_on_helper') {
          // Parse individual's start time
          const [startHourStr, startMinStr] = startTime.split(':');
          const startHourNum = parseInt(startHourStr);
          const startMinNum = parseInt(startMinStr || '0');
          
          // Calculate supporter prep time (2 hours BEFORE individual starts)
          let prepHour: number;
          let prepMin: number = 0;
          
          if (startHourNum <= 10) {
            // Early morning goals: supporter preps at 8 AM (or earlier if goal is before 10 AM)
            prepHour = Math.min(8, startHourNum - 2);
            prepMin = 0;
          } else {
            // Later goals: supporter preps exactly 2 hours before
            prepHour = startHourNum - 2;
            prepMin = startMinNum;
          }
          
          // Format prep time with proper AM/PM
          const prepPeriod = prepHour >= 12 ? 'PM' : 'AM';
          const prepDisplayHour = prepHour % 12 || 12;
          const prepTimeFormatted = `${prepDisplayHour}:${prepMin.toString().padStart(2, '0')} ${prepPeriod}`;
          
          const supporterEnrichedData = {
            ...enrichedData,
            startDate: occurrenceDate,
            supporterTimingOffset: `by ${prepTimeFormatted}`,
            // Add context for supporter templates
            individualStartTime: startTime,
            individualStartDay: format(occurrenceDate, 'EEEE')
          };
          
          const supporterSteps = await generateMicroStepsSmart(supporterEnrichedData, 'supporter');
          const savedSupporterSteps: any[] = [];
          
          // Save supporter steps with dependencies
          for (let i = 0; i < supporterSteps.length; i++) {
            const coachStep = supporterSteps[i];
            
            // Calculate supporter step due dates
            let stepDueDate: Date;
            if (i === 0 && coachStep.title.toLowerCase().includes('prep')) {
              // Environmental prep: due at prep time (calculated above)
              stepDueDate = new Date(goalStartDate);
              stepDueDate.setHours(prepHour, prepMin, 0, 0);
            } else if (i === 1 || coachStep.title.toLowerCase().includes('at ')) {
              // Activation assist: due at individual's start time
              stepDueDate = new Date(goalStartDate);
            } else {
              // Monitoring steps: due 30 min after individual starts
              stepDueDate = new Date(goalStartDate);
              stepDueDate.setMinutes(startMinNum + 30);
            }
            
            // Format timing context for notes
            const timingHint = i === 0 
              ? `\n\nℹ️ Recommended timing: Before individual starts at ${startTime}`
              : `\n\nℹ️ Recommended timing: Around ${stepDueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
            
            const { step } = await stepsService.createStep(goal!.id, {
              title: coachStep.title,
              step_type: 'action',
              is_required: false, // Supporter steps are guidelines, not blocking requirements
              estimated_effort_min: 10,
              is_planned: true,
              notes: coachStep.description + timingHint,
              is_supporter_step: true,
              due_date: stepDueDate.toISOString()
            });
            
            savedSupporterSteps.push(step);
            // No dependencies set - supporter steps are independent but contextually timed
          }
        }
        
        successfulDays++;
        
        // Update lastGeneratedOccurrenceIndex
        if (isHabitGoal) {
          await supabase
            .from('goals')
            .update({
              metadata: {
                ...(goal?.metadata as any),
                lastGeneratedOccurrenceIndex: dayIndex
              } as any
            })
            .eq('id', goal!.id);
        }
        
        // Add small delay between days to avoid overwhelming the edge function
        if (dayIndex < daysToGenerate - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (outerError: any) {
        console.error(`Failed to generate steps for day ${dayIndex + 1}:`, outerError);
        failedDays.push({
          day: dayIndex + 1,
          date: occurrenceDate,
          error: outerError.message || 'Unknown error'
        });
      }
      }
      
      // Post-generation validation
      console.log(`Generation complete: ${successfulDays}/${occurrenceDates.length} days successful`);
      setGenerationProgress({ current: 0, total: 0 });
      
      if (failedDays.length > 0) {
        console.error('Failed to generate steps for the following days:', failedDays);
        
        await supabase
          .from('goals')
          .update({ 
            metadata: {
              ...goal?.metadata as any,
              generation_incomplete: true,
              failed_days: failedDays.map(f => ({ ...f, date: f.date.toISOString() })),
              successful_days: successfulDays,
              total_expected_days: occurrenceDates.length
            } as any
          })
          .eq('id', goal!.id);
        
        toast({
          title: "⚠️ Partial Step Generation",
          description: `Generated steps for ${successfulDays} of ${occurrenceDates.length} days. ${failedDays.length} days failed.`,
          variant: "destructive"
        });
      } else if (successfulDays < occurrenceDates.length) {
        console.warn(`Only ${successfulDays} of ${occurrenceDates.length} days generated`);
        
        // For habit goals, generating only day 1 is EXPECTED behavior
        if (isHabitGoal && successfulDays === 1) {
          console.log('Habit goal: Day 1 generated successfully, remaining days will generate automatically');
          // Don't mark as incomplete - this is expected
        } else {
          // Actual incomplete generation for non-habit goals or multiple failures
          await supabase
            .from('goals')
            .update({ 
              metadata: {
                ...goal?.metadata as any,
                generation_incomplete: true,
                successful_days: successfulDays,
                total_expected_days: occurrenceDates.length
              } as any
            })
            .eq('id', goal!.id);
          
          toast({
            title: "⚠️ Incomplete Step Generation",
            description: `Only ${successfulDays} of ${occurrenceDates.length} days generated successfully. Please try recreating this goal or contact support.`,
            variant: "destructive"
          });
        }
      }
      
      // Reload steps
      await loadGoalData();
      
      clearTimeout(timeoutId); // Clear timeout on success
      
      // On success, mark generation as completed AND change status to 'active'
      if (failedDays.length === 0) {
        await supabase
          .from('goals')
          .update({ 
            status: 'active',
            metadata: {
              ...goal?.metadata,
              generationStatus: 'completed',
              generationComplete: true,
              completedAt: new Date().toISOString()
            } as any
          })
          .eq('id', goal!.id);
      }
      
      toast({
        title: "Micro-steps ready! 🎯",
        description: isHabitGoal && occurrenceDates.length > 1
          ? `✅ Day 1 steps generated! The next ${occurrenceDates.length - 1} ${occurrenceDates.length - 1 === 1 ? 'day' : 'days'} will be generated automatically as you complete each day.`
          : "Your personalized steps have been generated."
      });
      
    } catch (error: any) {
      clearTimeout(timeoutId); // Ensure timeout is cleared
      console.error('Failed to generate steps:', error);
      setGeneratingSteps(false);
      setGenerationError(true);
      
      // Determine user-friendly error message
      let errorMessage = 'Failed to generate your plan. Please try again.';
      
      if (error.message?.includes('No occurrences found')) {
        errorMessage = error.message;
      } else if (error.message?.includes('date range too large')) {
        errorMessage = 'Your goal duration is too long. Please choose a shorter time period.';
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorMessage = 'Our system is busy right now. Please wait a moment and try again.';
      } else if (error.message?.includes('due date is too early') || error.message?.includes('Start date')) {
        errorMessage = error.message;
      }
      
      // Persist failure state with detailed error
      await supabase
        .from('goals')
        .update({ 
          metadata: {
            ...goal?.metadata,
            generationStatus: 'failed',
            generationError: error.message || 'Unknown error during generation',
            failedAt: new Date().toISOString()
          } as any
        })
        .eq('id', goal!.id);
      
      toast({
        title: "Step generation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      clearTimeout(timeoutId);
      setGeneratingSteps(false);
      setGenerationProgress(null);
    }
  };

  // Loading skeleton (Phase 6)
  if (isLoading || !data) {
    return (
      <div className="min-h-[100dvh] bg-background px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <BackButton onClick={onBack} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Handle case where goal not found
  if (!goal) {
    toast({
      title: "Goal not found",
      description: "This goal might have been deleted or you don't have access to it.",
      variant: "destructive",
    });
    onBack();
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="px-4 py-6 space-y-6">
        {/* Removed full-screen loading overlay - now using inline message in Recommended Steps tab */}

        {/* Error state with retry button */}
      {generationError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800">Step Generation Failed</h4>
              <p className="text-sm text-red-700 mt-1">
                We couldn't create your plan. This might be due to:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>Invalid date range (no selected days fall within your goal period)</li>
                <li>System overload (try again in a moment)</li>
                <li>Connection issues</li>
              </ul>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setGenerationError(false);
                    generateStepsForNewGoal();
                  }}
                  disabled={generatingSteps}
                >
                  {generatingSteps ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry Generation'
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={onBack}
                >
                  Back to Goals
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <BackButton onClick={onBack} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground capitalize">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={getStatusColor(goal.status)}>
                {goal.status === 'active' ? 'In Progress' : goal.status}
              </Badge>
              {goal.domain && getDomainDisplayName(goal.domain) && getDomainDisplayName(goal.domain) !== 'General' && (
                <Badge variant="outline" className="capitalize">
                  {getDomainDisplayName(goal.domain)}
                </Badge>
              )}
              {goal.due_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">Due {formatDate(goal.due_date)}</span>
                </Badge>
              )}
              
              {/* Ownership badges */}
              {currentUser && goal.owner_id !== currentUser.id && ownerProfile && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  For {ownerProfile.first_name}
                </Badge>
              )}
              {currentUser && goal.created_by !== currentUser.id && creatorProfile && goal.owner_id === currentUser.id && (
                <Badge variant="outline" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Created by {creatorProfile.first_name}
                </Badge>
              )}
              
              {/* Progressive Mastery skill level badge */}
              {(goal as any)?.metadata?.skill_assessment && (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  {(goal as any).metadata.skill_assessment.level_label?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Unknown'}
                  {(goal as any).metadata.skill_assessment.skipped && (
                    <span className="ml-1 text-muted-foreground">(Self-assessed)</span>
                  )}
                </Badge>
              )}
              
              {/* Habit goal generation status */}
              {goal.frequency_per_week && goal.frequency_per_week > 0 && (goal as any)?.metadata?.totalPlannedOccurrences && (
                <Badge variant="secondary" className="text-xs">
                  Day {Math.floor(steps.length / 4)} of {(goal as any).metadata.totalPlannedOccurrences} generated
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {progress && (
            <div className="flex items-center gap-3">
              <CircularProgress 
                value={progress.percent || 0} 
                size={36}
                strokeWidth={3}
                color="#2393CC"
              />
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {progress.percent}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {progress.done}/{progress.actionable} done
                </div>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="bg-transparent hover:bg-gray-100 border-transparent">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border border-input shadow-lg z-50">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Open check-in modal */}}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Check In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Add buddy functionality */}}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Buddy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Share functionality */}}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {goal.status === 'completed' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive this goal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the goal to your archived goals. You can restore it later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteGoal}>
                        Archive Goal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <TabsList className={cn(
          "w-full",
          isViewerSupporter && steps.filter(s => s.is_supporter_step).length > 0
            ? "grid grid-cols-4"
            : "grid grid-cols-3"
        )}>
          <TabsTrigger value="summary" className="text-center">
            Summary
          </TabsTrigger>
          <TabsTrigger value="steps" className="text-center">
            Steps
            {steps.filter(s => !s.is_supporter_step && s.status !== 'done').length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {steps.filter(s => !s.is_supporter_step && s.status !== 'done').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-center">
            Results
          </TabsTrigger>
          {isViewerSupporter && steps.filter(s => s.is_supporter_step).length > 0 && (
            <TabsTrigger value="supporter" className="text-center">
              Supporter Setup
              <Badge className="ml-2" variant="secondary">
                {steps.filter(s => s.is_supporter_step && s.status !== 'done').length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="summary" className="mt-4 px-4">
          {activeTab === 'summary' && (
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <GoalFactorSummary
              goal={goal}
              wizardContext={(() => {
                const existingContext = (goal as any).metadata?.wizardContext;
                if (existingContext && existingContext.goalType === 'progressive_mastery' && existingContext.pmAssessment) {
                  return existingContext;
                }
                // Reconstruct from goal.metadata for PM goals
                if ((goal as any).goal_type === 'progressive_mastery' || (goal as any)?.metadata?.skill_assessment) {
                  const md = (goal as any).metadata || {};
                  const sa = md.skill_assessment || {};
                  const ss = md.smart_start || {};
                  const helper = md.teaching_helper || {};
                  const toTitle = (s?: string) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : undefined;
                  const hasAssessment = typeof sa.q1_familiarity === 'number' || typeof sa.q2_confidence === 'number' || typeof sa.q3_independence === 'number' || typeof sa.q3_help_needed === 'number';
                  
                  // Reconstruct barriers from various possible sources
                  const reconstructedBarriers = (() => {
                    if (md.barriers && typeof md.barriers === 'object') {
                      return md.barriers;
                    }
                    // Try to reconstruct from old format
                    const priority1 = md.barrier_priority1 || md.challenge_priority1;
                    const priority2 = md.barrier_priority2 || md.challenge_priority2;
                    const details = md.barrier_details || md.challenge_details;
                    if (priority1 || priority2 || details) {
                      return { priority1, priority2, details };
                    }
                    return undefined;
                  })();
                  
                  // Reconstruct prerequisites
                  const reconstructedPrerequisites = (() => {
                    if (md.prerequisites && typeof md.prerequisites === 'object') {
                      return md.prerequisites;
                    }
                    if (md.prerequisites_ready !== undefined) {
                      return {
                        ready: md.prerequisites_ready,
                        needs: md.prerequisites_needs
                      };
                    }
                    return undefined;
                  })();
                  
                  return {
                    ...existingContext,
                    goalTitle: goal.title,
                    goalType: 'progressive_mastery',
                    goalTypeLabel: 'Progressive Mastery',
                    domain: goal.domain,
                    frequency: goal.frequency_per_week,
                    startDate: goal.start_date,
                    endDate: goal.due_date,
                    selectedDays: md.selected_days || [],
                    customTime: md.custom_time,
                    timeOfDay: md.time_of_day,
                    pmAssessment: hasAssessment ? {
                      q1_experience: sa.q1_familiarity,
                      q2_confidence: sa.q2_confidence,
                      q3_help_needed: typeof sa.q3_help_needed === 'number' ? sa.q3_help_needed : (typeof sa.q3_independence === 'number' ? 6 - sa.q3_independence : undefined),
                      calculatedLevel: sa.calculated_level,
                      levelLabel: toTitle(sa.level_label)
                    } : undefined,
                    pmPracticePlan: {
                      startingFrequency: ss.user_selected_initial ?? ss.suggested_initial ?? goal.frequency_per_week,
                      targetFrequency: ss.target_frequency ?? goal.frequency_per_week,
                      durationWeeks: goal.duration_weeks ?? null,
                      smartStartAccepted: ss.suggestion_accepted ?? true
                    },
                    pmHelper: (helper && (helper.helper_id || helper.helper_name)) ? {
                      helperId: helper.helper_id,
                      helperName: helper.helper_name,
                      supportTypes: helper.relationship
                    } : undefined,
                    goalMotivation: md.motivation,
                    customMotivation: md.motivation_text,
                    barriers: reconstructedBarriers,
                    prerequisites: reconstructedPrerequisites
                  };
                }
                return existingContext;
              })()}
                />
              </Suspense>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4 px-4">
          {activeTab === 'calendar' && (
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <GoalCalendarView goal={goal} steps={steps} />
              </Suspense>
            </div>
          )}
        </TabsContent>

        <TabsContent value="steps" className="mt-4 px-4">
          {activeTab === 'steps' && (
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              {generatingSteps ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12 text-center">
                    <div className="space-y-3">
                      <p className="text-lg text-muted-foreground">
                        Microsteps being generated
                        <span className="inline-flex ml-1">
                          <span className="animate-dot-pulse">.</span>
                          <span className="animate-dot-pulse animation-delay-200">.</span>
                          <span className="animate-dot-pulse animation-delay-400">.</span>
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This usually takes 10-20 seconds
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : generationError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <div className="space-y-2">
                      <p className="text-lg font-semibold">Generation failed</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        We couldn't generate your personalized steps. This might be due to a temporary issue.
                      </p>
                    </div>
                    <Button 
                      onClick={() => generateStepsForNewGoal()} 
                      variant="default"
                      className="mt-4"
                    >
                      Retry Generation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : steps.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground py-8">
                    No recommended steps yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <RecommendedStepsList
                steps={steps}
                goal={goal}
                onStepsChange={loadGoalData}
                onStepsUpdate={handleStepsUpdate}
                onOpenStepChat={handleOpenStepChat}
              />
              )}
            </div>
          )}
        </TabsContent>

        {isViewerSupporter && steps.filter(s => s.is_supporter_step).length > 0 && (
          <TabsContent value="supporter" className="mt-4 px-4">
            {activeTab === 'supporter' && (
              <div className="max-w-4xl mx-auto px-2 sm:px-4">
                <SupporterSetupStepsList
                steps={steps}
                goal={goal}
                onStepsChange={loadGoalData}
                onStepsUpdate={handleStepsUpdate}
              />
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Step Chat Modal */}
      <StepChatModal
        isOpen={showStepChat}
        onClose={() => setShowStepChat(false)}
        step={selectedStep}
        goal={goal}
        onStepsUpdate={handleStepChatUpdate}
      />

      {/* Steps Chat */}
      <StepsChat 
        goal={goal}
        steps={steps}
        step={chatStep}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Goal Edit Modal */}
      <GoalEditModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        goal={goal}
        onGoalUpdate={handleGoalUpdate}
      />
    </div>
  );
};