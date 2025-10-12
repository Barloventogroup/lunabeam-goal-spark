import React, { useEffect, useState } from 'react';
import { Calendar, MoreVertical, Trash2, CheckCircle2, UserPlus, Share2, Edit, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { goalsService, stepsService } from '@/services/goalsService';
import { getDomainDisplayName } from '@/utils/domainUtils';
import { supabase } from '@/integrations/supabase/client';
import { generateMicroStepsSmart } from '@/services/microStepsGenerator';
import { GoalFactorSummary } from './goal-factor-summary';
import { RecommendedStepsList } from './recommended-steps-list';
import { SupporterSetupStepsList } from './supporter-setup-steps-list';
import { StepsChat } from './steps-chat';
import { StepChatModal } from './step-chat-modal';
import { ProgressBar } from './progress-bar';
import { GoalEditModal } from './goal-edit-modal';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { Goal, Step, GoalProgress } from '@/types';

interface GoalDetailV2Props {
  goalId: string;
  onBack: () => void;
}

export const GoalDetailV2: React.FC<GoalDetailV2Props> = ({ goalId, onBack }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showStepChat, setShowStepChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [chatStep, setChatStep] = useState<Step | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [isViewerSupporter, setIsViewerSupporter] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  useEffect(() => {
    // Auto-generate steps for new goals
    if (goal && steps.length === 0 && (goal as any).metadata?.wizardContext && !generatingSteps && !generationError) {
      generateStepsForNewGoal();
    }
  }, [goal, steps]);

  const calculateProgress = async (goalSteps: Step[]): Promise<GoalProgress> => {
    const actionableSteps = goalSteps.filter(s => (!s.type || s.type === 'action') && !s.hidden && s.status !== 'skipped');
    
    // Fetch substeps for all steps to include in count
    let totalCompletableItems = 0;
    let completedItems = 0;
    
    for (const step of actionableSteps) {
      const { data: substeps } = await supabase
        .from('substeps')
        .select('*')
        .eq('step_id', step.id)
        .order('created_at', { ascending: true });
      
      const stepSubsteps = substeps || [];
      
      if (stepSubsteps.length > 0) {
        // If step has substeps, count each substep
        totalCompletableItems += stepSubsteps.length;
        completedItems += stepSubsteps.filter(sub => sub.completed_at).length;
      } else {
        // If no substeps, count the main step
        totalCompletableItems += 1;
        completedItems += step.status === 'done' ? 1 : 0;
      }
    }
    
    console.log('Goal progress calculation debug:', {
      totalSteps: goalSteps.length,
      actionableSteps: actionableSteps.length,
      totalCompletableItems,
      completedItems,
      actionableStepsDetails: actionableSteps.map(s => ({ id: s.id, title: s.title, status: s.status, type: s.type, hidden: s.hidden }))
    });
    
    return {
      done: completedItems,
      actionable: totalCompletableItems,
      percent: totalCompletableItems > 0 ? Math.round((completedItems / totalCompletableItems) * 100) : 0
    };
  };

  const loadGoalData = async () => {
    try {
      setLoading(true);
      
      // Get current user and goal data
      const [{ data: { user } }, goalData, stepsData] = await Promise.all([
        supabase.auth.getUser(),
        goalsService.getGoal(goalId),
        stepsService.getSteps(goalId)
      ]);
      
      setCurrentUser(user);

      if (goalData) {
        // Fetch owner and creator profiles, and check if viewer is a supporter
        const [ownerData, creatorData, supporterRelationship] = await Promise.all([
          supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.owner_id).single(),
          supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.created_by).single(),
          user ? supabase.from('supporters').select('id, role, permission_level').eq('individual_id', goalData.owner_id).eq('supporter_id', user.id).maybeSingle() : Promise.resolve({ data: null })
        ]);
        
        setOwnerProfile(ownerData.data);
        setCreatorProfile(creatorData.data);
        setIsViewerSupporter(!!supporterRelationship.data);
        
        // Use steps as-is, no auto-generation
        const finalSteps = stepsData || [];

        const progress = await calculateProgress(finalSteps);
        setGoal({ ...goalData, progress });
        setSteps(finalSteps);
      } else {
        toast({
          title: "Goal not found",
          description: "This goal might have been deleted or you don't have access to it.",
          variant: "destructive",
        });
        onBack();
      }
    } catch (error) {
      console.error('Failed to load goal:', error);
      toast({
        title: "Failed to load goal",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepsUpdate = async (updatedSteps: Step[], updatedGoal: Goal) => {
    const progress = await calculateProgress(updatedSteps);
    setSteps(updatedSteps);
    setGoal({ ...updatedGoal, progress });
  };

  const handleOpenStepChat = (step: Step) => {
    setSelectedStep(step);
    setShowStepChat(true);
  };

  const handleStepChatUpdate = async (newSteps: Step[]) => {
    // Reload steps from database to get the latest data
    try {
      const updatedSteps = await stepsService.getSteps(goalId);
      const progress = await calculateProgress(updatedSteps);
      setSteps(updatedSteps);
      if (goal) {
        setGoal({ ...goal, progress });
      }
    } catch (error) {
      console.error('Failed to reload steps:', error);
    }
  };

  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoal({
      ...updatedGoal,
      progress: goal?.progress // Preserve existing progress data
    });
  };

  const handleDeleteGoal = async () => {
    try {
      await goalsService.deleteGoal(goalId);
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

  const generateStepsForNewGoal = async () => {
    const goalMetadata = (goal as any)?.metadata;
    if (!goalMetadata?.wizardContext) return;
    
    setGeneratingSteps(true);
    setGenerationError(false);
    
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
        
        // Fix: Ensure Date object
        startDate: new Date(wizardData.startDate),
        
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
      const baseStartDate = new Date(wizardData.startDate);
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
          const goalEndDate = goal!.due_date ? new Date(goal!.due_date) : null;
          const estimatedMaxOccurrences = goal!.frequency_per_week * (goal!.duration_weeks || 1);
          
          while (true) {
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
            
            // Stop conditions:
            // 1. Reached goal due_date
            // 2. Generated enough occurrences (as safety limit)
            if ((goalEndDate && currentDate > goalEndDate) || 
                occurrenceDates.length >= estimatedMaxOccurrences) {
              break;
            }
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
      
      // Safety check: verify goal due_date can accommodate all occurrences
      const lastOccurrenceDate = occurrenceDates[occurrenceDates.length - 1];
      const goalDueDateObj = goal!.due_date ? new Date(goal!.due_date) : null;
      
      if (goalDueDateObj && lastOccurrenceDate > goalDueDateObj) {
        console.error('Goal due date is too early for all planned occurrences');
        const daysDifference = Math.ceil((lastOccurrenceDate.getTime() - new Date(goal!.start_date).getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(
          `Goal due date (${format(goalDueDateObj, 'MMM d, yyyy')}) is before the last planned occurrence (${format(lastOccurrenceDate, 'MMM d, yyyy')}). ` +
          `Please extend the goal duration to at least ${daysDifference} days.`
        );
      }
      
      // Generate and save steps for each occurrence with retry logic
      let successfulDays = 0;
      let failedDays: { day: number; date: Date; error: string }[] = [];
      
      for (let dayIndex = 0; dayIndex < occurrenceDates.length; dayIndex++) {
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
        
        // Add small delay between days to avoid overwhelming the edge function
        if (dayIndex < occurrenceDates.length - 1) {
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
      }
      
      // Reload steps
      await loadGoalData();
      
      toast({
        title: "Micro-steps ready! 🎯",
        description: "Your personalized steps have been generated."
      });
      
    } catch (error) {
      console.error('Failed to generate steps:', error);
      setGenerationError(true);
      
      toast({
        title: "Step generation failed",
        description: "We couldn't generate your micro-steps at this time. Use the Generate Steps button to try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSteps(false);
    }
  };

  if (loading || !goal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton onClick={onBack} />
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Loading overlay for step generation with progress */}
      {generatingSteps && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Creating your micro-steps</h3>
                {generationProgress.total > 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    Day {generationProgress.current} of {generationProgress.total}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    🎯 Personalizing your journey...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error state with retry button */}
      {!generatingSteps && steps.length === 0 && generationError && (goal as any)?.metadata?.wizardContext && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">
            We couldn't generate your micro-steps at this time. If you want to try again, click below.
          </p>
          <Button onClick={generateStepsForNewGoal} variant="outline" className="w-full">
            Generate Steps
          </Button>
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
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {goal.progress && (
            <div className="flex items-center gap-3">
              <CircularProgress 
                value={goal.progress.percent || 0} 
                size={36}
                strokeWidth={3}
                color="#2393CC"
              />
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {goal.progress.percent}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {goal.progress.done}/{goal.progress.actionable} done
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

      {/* Tabbed Content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            Summary
          </TabsTrigger>
          <TabsTrigger value="steps">
            Recommended Steps
            {steps.filter(s => !s.is_supporter_step && s.status !== 'done').length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {steps.filter(s => !s.is_supporter_step && s.status !== 'done').length}
              </Badge>
            )}
          </TabsTrigger>
          {isViewerSupporter && steps.filter(s => s.is_supporter_step).length > 0 && (
            <TabsTrigger value="supporter">
              Supporter Setup
              <Badge className="ml-2" variant="secondary">
                {steps.filter(s => s.is_supporter_step && s.status !== 'done').length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <GoalFactorSummary 
            goal={goal}
            wizardContext={(goal as any).metadata?.wizardContext}
          />
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          <RecommendedStepsList
            steps={steps}
            goal={goal}
            onStepsChange={loadGoalData}
            onStepsUpdate={handleStepsUpdate}
            onOpenStepChat={handleOpenStepChat}
          />
        </TabsContent>

        {isViewerSupporter && steps.filter(s => s.is_supporter_step).length > 0 && (
          <TabsContent value="supporter" className="mt-4">
            <SupporterSetupStepsList
              steps={steps}
              goal={goal}
              onStepsChange={loadGoalData}
              onStepsUpdate={handleStepsUpdate}
            />
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