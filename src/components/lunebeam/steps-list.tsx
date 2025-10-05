import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, Calendar, ChevronDown, ChevronUp, ArrowDown, MessageSquare, Plus, MoreHorizontal, Edit, Hourglass, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircularProgress } from '@/components/ui/circular-progress';
import { Fireworks } from '@/components/ui/fireworks';
import { GoalCompletionCelebration } from './goal-completion-celebration';
import type { Step, Goal, Substep, StepStatus, StepType } from '@/types';
import { stepsService } from '@/services/goalsService';
import { stepValidationService } from '@/services/stepValidationService';
import { pointsService } from '@/services/pointsService';
import { BlockedStepGuidance } from './blocked-step-guidance';
import { StepChatModal } from './step-chat-modal';
import { StepEditModal } from './step-edit-modal';
import { useToast } from '@/hooks/use-toast';
import { notificationsService } from '@/services/notificationsService';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { cleanStepTitle } from '@/utils/stepUtils';
import { parseISO, isBefore } from 'date-fns';

// Utility function to format dates
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

// Normalize substep titles for deduping (case/spacing-insensitive)
const normalizeSubstepTitle = (title?: string) => {
  const base = cleanStepTitle(title || '');
  return base.toLowerCase().replace(/\s+/g, ' ').trim();
};

// Deduplicate substeps by normalized title, preferring completed and earliest created
const dedupeSubsteps = (subs: Substep[]): Substep[] => {
  const byKey = new Map<string, Substep>();
  for (const s of subs) {
    const key = normalizeSubstepTitle(s.title);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, s);
      continue;
    }
    const existingCompleted = !!existing.completed_at;
    const currentCompleted = !!s.completed_at;
    if (currentCompleted && !existingCompleted) {
      byKey.set(key, s);
      continue;
    }
    if (currentCompleted === existingCompleted) {
      const existingCreated = new Date((existing as any).created_at || 0).getTime();
      const currentCreated = new Date((s as any).created_at || 0).getTime();
      if (currentCreated < existingCreated) byKey.set(key, s);
    }
  }
  return Array.from(byKey.values());
};

interface StepsListProps {
  steps: Step[];
  goal: Goal;
  onStepsChange?: () => void;
  onStepsUpdate?: (updatedSteps: Step[], updatedGoal: Goal) => void;
  onOpenStepChat?: (step: Step) => void;
}

interface BlockedStepInfo {
  canComplete: boolean;
  reason?: string;
  prerequisites?: string[];
  suggestions?: string[];
}

interface StepGroup {
  mainStep: Step;
  subSteps: Substep[];
}

export const StepsList: React.FC<StepsListProps> = ({
  steps,
  goal,
  onStepsChange,
  onStepsUpdate,
  onOpenStepChat
}) => {
  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [currentBlockedStep, setCurrentBlockedStep] = useState<Step | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [currentHelpStep, setCurrentHelpStep] = useState<Step | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showingQueuedSteps, setShowingQueuedSteps] = useState(false);
  const [awaitingStepUpdate, setAwaitingStepUpdate] = useState<string | null>(null);
  const [substepsMap, setSubstepsMap] = useState<Record<string, Substep[]>>({});
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState<Step | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const { toast } = useToast();

  // Fetch substeps for all steps
  useEffect(() => {
    const fetchAllSubsteps = async () => {
      const substepsPromises = steps.map(async (step) => {
        try {
          const substeps = await pointsService.getSubsteps(step.id);
          return { stepId: step.id, substeps };
        } catch (error) {
          console.error(`Error fetching substeps for step ${step.id}:`, error);
          return { stepId: step.id, substeps: [] };
        }
      });

      const results = await Promise.all(substepsPromises);
      const newSubstepsMap: Record<string, Substep[]> = {};
      
      results.forEach(({ stepId, substeps }) => {
        newSubstepsMap[stepId] = dedupeSubsteps(substeps);
      });
      
      setSubstepsMap(newSubstepsMap);
    };

    if (steps.length > 0) {
      fetchAllSubsteps();
    }
  }, [steps]);

  useEffect(() => {
    if (awaitingStepUpdate) {
      const timer = setTimeout(() => {
        setAwaitingStepUpdate(null);
      }, 2000); // Clear after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [awaitingStepUpdate]);

  // Compute sorted actionable steps and split into visible + queued
  const sortedActionableSteps = steps
    .filter(s => (!s.type || s.type === 'action') && !s.hidden)
    .sort((a, b) => {
      // Parse week/session for main steps
      const aWeekMatch = a.title.match(/Week (\d+)/);
      const aSessionMatch = a.title.match(/Session (\d+)/);
      const bWeekMatch = b.title.match(/Week (\d+)/);
      const bSessionMatch = b.title.match(/Session (\d+)/);
      
      const aIsMainStep = aWeekMatch && aSessionMatch;
      const bIsMainStep = bWeekMatch && bSessionMatch;
      
      // Both are main steps - sort by week then session
      if (aIsMainStep && bIsMainStep) {
        const aWeek = parseInt(aWeekMatch[1]);
        const bWeek = parseInt(bWeekMatch[1]);
        if (aWeek !== bWeek) return aWeek - bWeek;
        
        const aSession = parseInt(aSessionMatch[1]);
        const bSession = parseInt(bSessionMatch[1]);
        return aSession - bSession;
      }
      
      // One is main, one is sub - use order_index to group them properly
      if (aIsMainStep && !bIsMainStep) {
        // Check if b should come right after a
        const aIndex = a.order_index ?? 0;
        const bIndex = b.order_index ?? Number.POSITIVE_INFINITY;
        return bIndex > aIndex && bIndex < aIndex + 10 ? -1 : aIndex - bIndex;
      }
      
      if (!aIsMainStep && bIsMainStep) {
        // Check if a should come right after b
        const aIndex = a.order_index ?? Number.POSITIVE_INFINITY;
        const bIndex = b.order_index ?? 0;
        return aIndex > bIndex && aIndex < bIndex + 10 ? 1 : aIndex - bIndex;
      }
      
      // Neither is main step - use order_index
      return (a.order_index ?? Number.POSITIVE_INFINITY) - (b.order_index ?? Number.POSITIVE_INFINITY);
    });

  // First 4 actionable steps are visible
  const visibleSteps = sortedActionableSteps.slice(0, 4);
  
  // Rest are queued
  const queuedSteps = sortedActionableSteps.slice(4);

  // Calculate progress including substeps
  const calculateProgress = () => {
    const actionableSteps = steps.filter(s => (!s.type || s.type === 'action') && !s.hidden);
    let totalCompletableItems = 0;
    let completedItems = 0;

    actionableSteps.forEach(step => {
      const stepSubsteps = substepsMap[step.id] || [];
      
      if (stepSubsteps.length > 0) {
        // If step has substeps, count each substep
        totalCompletableItems += stepSubsteps.length;
        completedItems += stepSubsteps.filter(sub => sub.completed_at).length;
      } else {
        // If no substeps, count the main step
        totalCompletableItems += 1;
        if (step.status === 'done') {
          completedItems += 1;
        }
      }
    });

    const progressPercent = totalCompletableItems > 0 
      ? Math.round((completedItems / totalCompletableItems) * 100) 
      : 0;

    return {
      actionableSteps: actionableSteps.length,
      doneSteps: steps.filter(s => s.status === 'done' && s.is_required).length,
      totalCompletableItems,
      completedItems,
      progressPercent
    };
  };

  const progressStats = calculateProgress();

  // Define isStepBlocked before using it
  const isStepBlocked = (step: Step): boolean => {
    // Strict sequential gating: only allow the earliest incomplete required step
    const currentIdx = sortedActionableSteps.findIndex(s => s.id === step.id);
    if (currentIdx > -1) {
      for (let i = 0; i < currentIdx; i++) {
        const prev = sortedActionableSteps[i];
        const required = prev.is_required !== false; // default to required
        if (!required) continue;
        // Skip non-action/hidden items just in case
        if ((prev.type && prev.type !== 'action') || prev.hidden) continue;
        const prevSubs = substepsMap[prev.id] || [];
        const prevComplete = prevSubs.length > 0
          ? prevSubs.every(sub => sub.completed_at)
          : prev.status === 'done' || prev.status === 'skipped';
        if (!prevComplete) {
          return true; // Block until previous required step is complete
        }
      }
    }

    // Check explicit dependencies first
    if (step.dependency_step_ids && step.dependency_step_ids.length > 0) {
      return step.dependency_step_ids.some(depId => {
        const depStep = steps.find(s => s.id === depId);
        return depStep && depStep.status !== 'done' && depStep.status !== 'skipped';
      });
    }

    // Enhanced week-based progression logic
    const weekMatch = step.title.match(/Week (\d+)/i);
    if (weekMatch) {
      const currentWeek = parseInt(weekMatch[1]);

      // For Week 2+, check if ALL Week 1 steps are complete (including substeps)
      if (currentWeek > 1) {
        const allPrevWeekSteps = steps.filter(s => {
          const prevWeekMatch = s.title.match(/Week (\d+)/i);
          if (!prevWeekMatch) return false;
          const stepWeek = parseInt(prevWeekMatch[1]);
          return stepWeek < currentWeek && s.is_required;
        });

        // Check if any previous week step is incomplete
        const incompleteSteps = allPrevWeekSteps.filter(s => {
          if (s.status === 'done' || s.status === 'skipped') {
            return false; // This step is complete
          }
          // For steps with substeps, check if all substeps are complete
          const stepSubsteps = substepsMap[s.id] || [];
          if (stepSubsteps.length > 0) {
            const allSubstepsComplete = stepSubsteps.every(sub => sub.completed_at !== null);
            return !allSubstepsComplete; // Incomplete if any substep is not done
          }
          return true; // Step without substeps that's not marked done
        });

        if (incompleteSteps.length > 0) {
          console.log(`Step ${step.title} blocked by incomplete previous week steps:`, 
            incompleteSteps.map(s => s.title));
          return true;
        }
      }

      // Check session progression within the same week
      const currentSessionMatch = step.title.match(/Session (\d+)/i);
      if (currentSessionMatch) {
        const currentSession = parseInt(currentSessionMatch[1]);
        const currentWeekSteps = steps.filter(s => {
          const weekMatch = s.title.match(/Week (\d+)/i);
          const sessionMatch = s.title.match(/Session (\d+)/i);
          if (!weekMatch || !sessionMatch) return false;
          const stepWeek = parseInt(weekMatch[1]);
          const stepSession = parseInt(sessionMatch[1]);
          return stepWeek === currentWeek && 
                 stepSession < currentSession && 
                 s.is_required;
        });

        // Check if any previous session in the same week is incomplete
        const incompleteSessionSteps = currentWeekSteps.filter(s => {
          if (s.status === 'done' || s.status === 'skipped') {
            return false;
          }
          // For steps with substeps, check if all substeps are complete
          const stepSubsteps = substepsMap[s.id] || [];
          if (stepSubsteps.length > 0) {
            const allSubstepsComplete = stepSubsteps.every(sub => sub.completed_at !== null);
            return !allSubstepsComplete;
          }
          return true;
        });

        if (incompleteSessionSteps.length > 0) {
          console.log(`Step ${step.title} blocked by incomplete previous session steps:`, 
            incompleteSessionSteps.map(s => s.title));
          return true;
        }
      }
    }

    // Special handling for non-week steps that might be part of a progression
    // Check if this step comes after Week 1 steps but Week 1 isn't complete
    const stepIndex = steps.findIndex(s => s.id === step.id);
    if (stepIndex > 0) {
      // Find any previous week 1 steps that are incomplete
      const previousSteps = steps.slice(0, stepIndex);
      const week1Steps = previousSteps.filter(s => {
        const weekMatch = s.title.match(/Week 1/i);
        return weekMatch && s.is_required;
      });

      if (week1Steps.length > 0) {
        const incompleteWeek1Steps = week1Steps.filter(s => {
          if (s.status === 'done' || s.status === 'skipped') {
            return false;
          }
          const stepSubsteps = substepsMap[s.id] || [];
          if (stepSubsteps.length > 0) {
            const allSubstepsComplete = stepSubsteps.every(sub => sub.completed_at !== null);
            return !allSubstepsComplete;
          }
          return true;
        });

        if (incompleteWeek1Steps.length > 0) {
          console.log(`Step ${step.title} blocked by incomplete Week 1 steps:`, 
            incompleteWeek1Steps.map(s => s.title));
          return true;
        }
      }
    }

    return false;
  };

  // Group steps with their substeps from database
  const groupedSteps: StepGroup[] = visibleSteps.map((step) => ({
    mainStep: step,
    subSteps: substepsMap[step.id] || []
  }));
  
  const queuedGroupedSteps: StepGroup[] = queuedSteps.map((step) => ({
    mainStep: step,
    subSteps: substepsMap[step.id] || []
  }));

  console.log('StepsList progress data:', {
    totalSteps: steps.length,
    ...progressStats,
    substepsMapKeys: Object.keys(substepsMap),
    substepCounts: Object.keys(substepsMap).map(stepId => ({
      stepId,
      count: substepsMap[stepId]?.length || 0,
      completed: substepsMap[stepId]?.filter(s => s.completed_at).length || 0
    }))
  });

  // Debug week progression
  const weekSteps = steps.filter(s => s.title.match(/Week (\d+)/i));
  console.log('Week progression debug:', {
    weekSteps: weekSteps.map(s => ({
      title: s.title,
      status: s.status,
      isBlocked: isStepBlocked(s),
      week: s.title.match(/Week (\d+)/i)?.[1]
    }))
  });

  const handleMarkComplete = async (stepId: string) => {
    if (awaitingStepUpdate === stepId) return;

    console.log('[StepsList] handleMarkComplete START', {
      stepId,
      beforeStatus: steps.find(s => s.id === stepId)?.status
    });
    
    setAwaitingStepUpdate(stepId);
    
    try {
      const result = await stepsService.completeStep(stepId);
      console.log('[StepsList] completeStep RESULT', result);

      // Build updated steps for immediate parent update if supported
      const updatedSteps = steps.map(s =>
        s.id === stepId ? { ...s, status: 'done' as StepStatus, updated_at: new Date().toISOString() } : s
      );
      if (onStepsUpdate) {
        console.log('[StepsList] calling onStepsUpdate');
        onStepsUpdate(updatedSteps, result.goal);
      } else if (onStepsChange) {
        console.log('[StepsList] calling onStepsChange');
        onStepsChange();
      }
      
      // Force refresh of substeps data
      const substepsPromises = steps.map(async (step) => {
        try {
          const substeps = await pointsService.getSubsteps(step.id);
          return { stepId: step.id, substeps };
        } catch (error) {
          console.error(`Error fetching substeps for step ${step.id}:`, error);
          return { stepId: step.id, substeps: [] };
        }
      });
      const results = await Promise.all(substepsPromises);
      const newSubstepsMap: Record<string, Substep[]> = {};
      results.forEach(({ stepId, substeps }) => {
        newSubstepsMap[stepId] = dedupeSubsteps(substeps);
      });
      setSubstepsMap(newSubstepsMap);

      // Auto-collapse the step in the UI upon completion
      setExpandedSteps(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });

      // Trigger fireworks animation
      setShowFireworks(true);

      toast({
        title: "Step completed!",
        description: `Great job! You've completed this step.`,
      });

      // Send notifications to supporters for step completion
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Email
        await notificationsService.notifyStepComplete(user.id, goal.id, stepId);

        // In-app notifications to admin supporters
        console.log('Fetching admin supporters for step completion notification...');
        const { data: adminSupporters } = await supabase
          .from('supporters')
          .select('supporter_id')
          .eq('individual_id', user.id)
          .eq('is_admin', true);

        if (adminSupporters && adminSupporters.length > 0) {
          const stepTitle = steps.find(s => s.id === stepId)?.title || 'a step';
          const userName = await supabase
            .from('profiles')
            .select('first_name')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => data?.first_name || 'User');

          for (const admin of adminSupporters) {
            try {
              await notificationsService.createStepCompletionNotification(admin.supporter_id, {
                individual_name: userName,
                step_title: stepTitle,
                goal_title: goal.title
              });
            } catch (err) {
              console.error('Failed to create step completion notification for admin:', admin.supporter_id, err);
            }
          }

          // Check if this is the last step defined in the goal (by order_index)
          const { data: allGoalSteps } = await supabase
            .from('steps')
            .select('id, order_index, status')
            .eq('goal_id', goal.id)
            .order('order_index', { ascending: false });

          const completedStep = allGoalSteps?.find(s => s.id === stepId);
          const isLastStep = allGoalSteps && allGoalSteps[0]?.id === stepId;

          if (isLastStep) {
            // Show celebration modal for the individual
            setShowGoalCelebration(true);
            
            for (const admin of adminSupporters) {
              try {
                await notificationsService.createNotification({
                  user_id: admin.supporter_id,
                  type: 'goal_complete',
                  title: 'Goal Completed! 🎯',
                  message: `${userName} completed goal "${goal.title}"`,
                  data: { goal_id: goal.id, goal_title: goal.title }
                });
                // Optional email notification if supported
                try {
                  // @ts-ignore - method may not exist in older builds
                  await (notificationsService as any).notifyGoalCompleted?.(user.id, goal.id);
                } catch (_) {}
              } catch (err) {
                console.error('Failed to create goal completion notification for admin:', admin.supporter_id, err);
              }
            }
          }
        } else {
          console.log('No admin supporters found for step completion notifications');
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAwaitingStepUpdate(null);
      console.log('[StepsList] handleMarkComplete END', { stepId });
    }
  };

  const handleCheckInStep = async (stepId: string) => {
    try {
      await stepsService.checkInStep(stepId);
      
      // Update the step's initiated_at timestamp locally
      const updatedSteps = steps.map(step => 
        step.id === stepId 
          ? { ...step, initiated_at: new Date().toISOString() } 
          : step
      );
      
      onStepsUpdate?.(updatedSteps, goal);
      
      toast({
        title: "Checked in!",
        description: "You've started working on this step.",
      });

      // Send notifications to supporters
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send email notifications
        await notificationsService.notifyCheckIn(user.id, goal.id, stepId);
        
        // Get admin supporters for in-app notifications
        console.log('Fetching admin supporters for check-in notification...');
        const { data: adminSupporters, error: supportersError } = await supabase
          .from('supporters')
          .select('supporter_id')
          .eq('individual_id', user.id)
          .eq('is_admin', true);

        console.log('Admin supporters found:', adminSupporters?.length || 0, supportersError);

        // Create in-app notifications for each admin
        if (adminSupporters && adminSupporters.length > 0) {
          const stepTitle = steps.find(s => s.id === stepId)?.title || 'a step';
          const userName = await supabase
            .from('profiles')
            .select('first_name')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => data?.first_name || 'User');

          console.log('Creating in-app notifications for admins:', adminSupporters.map(a => a.supporter_id));
          for (const admin of adminSupporters) {
            try {
              await notificationsService.createCheckInNotification(admin.supporter_id, {
                individual_name: userName,
                goal_title: goal.title,
                step_title: stepTitle
              });
              console.log('Created notification for admin:', admin.supporter_id);
            } catch (error) {
              console.error('Failed to create notification for admin:', admin.supporter_id, error);
            }
          }
        } else {
          console.log('No admin supporters found for notifications');
        }
      }
    } catch (error) {
      console.error('Error checking in step:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckInSubstep = async (substepId: string, stepId: string) => {
    try {
      await pointsService.checkInSubstep(substepId);
      
      // Refresh substeps for this step to get the updated initiated_at
      const substeps = dedupeSubsteps(await pointsService.getSubsteps(stepId));
      setSubstepsMap(prev => ({ ...prev, [stepId]: substeps }));
      
      toast({
        title: "Checked in!",
        description: "You've started working on this substep.",
      });

      // Send notifications to supporters
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send email notifications
        await notificationsService.notifyCheckIn(user.id, goal.id, stepId, substepId);
        
        // Get admin supporters for in-app notifications
        console.log('Fetching admin supporters for substep check-in notification...');
        const { data: adminSupporters, error: supportersError } = await supabase
          .from('supporters')
          .select('supporter_id')
          .eq('individual_id', user.id)
          .eq('is_admin', true);

        console.log('Admin supporters found:', adminSupporters?.length || 0, supportersError);

        // Create in-app notifications for each admin
        if (adminSupporters && adminSupporters.length > 0) {
          const substep = substepsMap[stepId]?.find(s => s.id === substepId);
          const stepTitle = steps.find(s => s.id === stepId)?.title || 'a step';
          const substepTitle = substep?.title || 'a substep';
          const userName = await supabase
            .from('profiles')
            .select('first_name')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => data?.first_name || 'User');

          console.log('Creating in-app notifications for substep check-in:', adminSupporters.map(a => a.supporter_id));
          for (const admin of adminSupporters) {
            try {
              await notificationsService.createCheckInNotification(admin.supporter_id, {
                individual_name: userName,
                goal_title: goal.title,
                step_title: `${stepTitle} - ${substepTitle}`
              });
              console.log('Created substep notification for admin:', admin.supporter_id);
            } catch (error) {
              console.error('Failed to create substep notification for admin:', admin.supporter_id, error);
            }
          }
        } else {
          console.log('No admin supporters found for substep notifications');
        }
      }
    } catch (error) {
      console.error('Error checking in substep:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNeedHelp = (step: Step) => {
    setCurrentHelpStep(step);
    setHelpModalOpen(true);
  };

  const handleSubstepHelp = (substep: Substep, parentStep: Step) => {
    // Create a pseudo-step object that represents the substep for help
    const substepAsStep: Step = {
      id: substep.id,
      title: substep.title,
      notes: substep.description || '',
      explainer: `This is a substep of "${parentStep.title}". Focus specifically on: ${substep.title}`,
      estimated_effort_min: 15,
      goal_id: parentStep.goal_id,
      order_index: parentStep.order_index,
      status: substep.completed_at ? 'done' : 'todo' as StepStatus,
      due_date: parentStep.due_date,
      is_required: true,
      points: 2,
      dependency_step_ids: [],
      created_at: substep.created_at,
      updated_at: substep.updated_at,
      is_planned: substep.is_planned || false,
      planned_week_index: null,
      points_awarded: 0,
      step_type: 'action' as StepType,
      type: 'action' as StepType
    };
    
    setCurrentHelpStep(substepAsStep);
    setHelpModalOpen(true);
  };

  const handleCompleteSubstep = async (substepId: string, stepId: string) => {
    try {
      await pointsService.completeSubstep(substepId);
      
      // Refresh substeps for this step
      const substeps = dedupeSubsteps(await pointsService.getSubsteps(stepId));
      setSubstepsMap(prev => ({ ...prev, [stepId]: substeps }));
      
      // Check if all substeps are now completed
      const allCompleted = substeps.every(s => s.completed_at !== null);
      if (allCompleted) {
        // Trigger fireworks animation for substep completion
        setShowFireworks(true);
        
        // Auto-complete the main step
        const step = steps.find(s => s.id === stepId);
        if (step && step.status !== 'done') {
          await handleMarkComplete(stepId);
          toast({
            title: "Step completed!",
            description: "All substeps finished - main step marked complete!",
          });
        }
      } else {
        // Trigger fireworks animation for individual substep completion
        setShowFireworks(true);
        
        toast({
          title: "Substep completed!",
          description: "Great progress on breaking down this step.",
        });

        // Send notifications to supporters for substep completion
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Email
          await notificationsService.notifyStepComplete(user.id, goal.id, stepId, substepId);

          // In-app notifications to admin supporters
          console.log('Fetching admin supporters for substep completion notification...');
          const { data: adminSupporters } = await supabase
            .from('supporters')
            .select('supporter_id')
            .eq('individual_id', user.id)
            .eq('is_admin', true);

          if (adminSupporters && adminSupporters.length > 0) {
            const stepTitle = steps.find(s => s.id === stepId)?.title || 'a step';
            const sub = (substepsMap[stepId] || []).find(s => s.id === substepId);
            const substepTitle = sub?.title || 'a substep';
            const userName = await supabase
              .from('profiles')
              .select('first_name')
              .eq('user_id', user.id)
              .maybeSingle()
              .then(({ data }) => data?.first_name || 'User');

            for (const admin of adminSupporters) {
              try {
                await notificationsService.createStepCompletionNotification(admin.supporter_id, {
                  individual_name: userName,
                  step_title: `${stepTitle} - ${substepTitle}`,
                  goal_title: goal.title
                });
              } catch (err) {
                console.error('Failed to create substep completion notification for admin:', admin.supporter_id, err);
              }
            }
          } else {
            console.log('No admin supporters found for substep completion notifications');
          }
        }
      }

      // Trigger parent component refresh to update counters
      if (onStepsChange) {
        onStepsChange();
      }

      // Trigger points refresh after substep completion
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
    } catch (error) {
      console.error('Error completing substep:', error);
      toast({
        title: "Error",
        description: "Failed to complete substep. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStepsUpdate = async (newSteps: Step[]) => {
    if (onStepsChange) {
      onStepsChange();
    }
    
    // Refresh substeps when new steps are created via chat
    if (currentHelpStep) {
      const substeps = dedupeSubsteps(await pointsService.getSubsteps(currentHelpStep.id));
      setSubstepsMap(prev => ({ ...prev, [currentHelpStep.id]: substeps }));
    }
  };

  const handleEditStep = (step: Step) => {
    setCurrentEditStep(step);
    setShowEditModal(true);
  };

  const handleStepUpdate = async (updatedStep: Step) => {
    // Update local state immediately for better UX
    const updatedSteps = steps.map(s =>
      s.id === updatedStep.id ? updatedStep : s
    );
    
    // If onStepsUpdate is available, use it for immediate update
    if (onStepsUpdate) {
      onStepsUpdate(updatedSteps, goal);
    } else if (onStepsChange) {
      // Fallback to refresh
      onStepsChange();
    }
  };

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const areAllSubStepsCompleted = (subSteps: Substep[]): boolean => {
    return subSteps.length === 0 || subSteps.every(subStep => subStep.completed_at !== null);
  };

  const getBlockedStepInfo = async (step: Step) => {
    try {
      const validation = await stepValidationService.validateStepCompletion(step.id, steps, goal);
      return validation;
    } catch (error) {
      return { canComplete: true };
    }
  };

  const isStepDone = (step: Step): boolean => {
    return step.status === 'done';
  };

  const getStepIcon = (step: Step) => {
    if (isStepBlocked(step)) {
      return null; // No icon for blocked steps
    }

    const stepSubsteps = substepsMap[step.id] || [];
    const allSubstepsCompleted = areAllSubStepsCompleted(stepSubsteps);

    // Check if step is overdue
    const isOverdue = step.due_date && 
                     step.status !== 'done' && 
                     step.status !== 'skipped' && 
                     isBefore(parseISO(step.due_date), new Date().setHours(0, 0, 0, 0));

    if (isOverdue) {
      return <Hourglass className="h-5 w-5 text-red-600" />;
    }

    const status = isStepDone(step) ? 'done' : step.status;
    const hasBeenInitiated = !!(step as any).initiated_at;
    
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'doing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        // Show initiated icon if step has been checked in
        if (hasBeenInitiated && !isStepDone(step)) {
          return <Clock className="h-5 w-5 text-blue-600" />;
        }
        
        // For steps with substeps, show different icon based on completion
        if (stepSubsteps.length > 0) {
          if (allSubstepsCompleted) {
            return <CheckCircle2 className="h-5 w-5 text-amber-600" />;
          } else {
            // Check if any substeps have been initiated
            const hasInitiatedSubsteps = stepSubsteps.some(sub => (sub as any).initiated_at);
            if (hasInitiatedSubsteps) {
              return <Clock className="h-5 w-5 text-blue-600" />;
            }
          }
        }
        return null; // No icon for todo steps without substeps or initiation
    }
  };

  const hasDependencies = (step: Step, allSteps: Step[]): boolean => {
    return step.dependency_step_ids && step.dependency_step_ids.length > 0;
  };

  const getPrecursorText = (step: Step): string | null => {
    if (hasDependencies(step, steps)) {
      const dependencyCount = step.dependency_step_ids?.length || 0;
      return `Requires ${dependencyCount} other step${dependencyCount > 1 ? 's' : ''}`;
    }
    return null;
  };

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">No steps yet</CardTitle>
          <p className="text-sm text-muted-foreground">
            Steps are created when you set up your goal. You can also add steps manually or use "Need more help?" to break down existing steps.
          </p>
        </CardHeader>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground py-8">
            No steps to display
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold text-foreground">Recommended steps</CardTitle>
          <p className="text-sm text-muted-foreground">Here's a short list of steps and things to keep in mind as you work on your goal.</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
                <TableRow className="border-b border-gray-200 bg-muted/20">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-20">Due</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="w-32 text-center">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {(showingQueuedSteps ? [...groupedSteps, ...queuedGroupedSteps] : groupedSteps).map((group, groupIndex) => {
                const { mainStep, subSteps } = group;
                const isBlocked = isStepBlocked(mainStep);
                const precursorText = getPrecursorText(mainStep);
                const isExpanded = expandedSteps.has(mainStep.id);
                const allSubStepsCompleted = areAllSubStepsCompleted(subSteps);

                return (
                  <React.Fragment key={mainStep.id}>
                     {/* Main step row */}
                     <TableRow className={`border-b border-gray-200 ${isBlocked ? 'opacity-40 bg-muted/20' : 'hover:bg-muted/50'}`}>
                       <TableCell className="p-2 w-8">
                         {(subSteps.length > 0 || mainStep.explainer || mainStep.notes) && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => toggleStepExpanded(mainStep.id)}
                             className={`p-1 h-auto ${isBlocked ? 'text-muted-foreground/50 hover:text-muted-foreground/70' : 'text-muted-foreground hover:text-foreground'}`}
                           >
                             {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                           </Button>
                         )}
                       </TableCell>
                       
                        <TableCell className="p-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${
                                isStepDone(mainStep)
                                  ? 'line-through text-muted-foreground' 
                                  : isBlocked 
                                    ? 'text-muted-foreground/70' 
                                    : 'text-foreground'
                              }`}>
                                {cleanStepTitle(mainStep.title)}
                              </span>
                              {subSteps.length > 0 && (
                                <Badge variant="secondary" className={`text-xs ${isBlocked ? 'opacity-50' : ''}`}>
                                  {subSteps.filter(s => s.completed_at).length}/{subSteps.length} substeps
                                </Badge>
                              )}
                            </div>

                            {isBlocked && (
                              <BlockedStepGuidance step={mainStep} />
                            )}

                            {precursorText && !isBlocked && (
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                <ArrowDown className="h-3 w-3" />
                                {precursorText}
                              </div>
                            )}
                          </div>
                        </TableCell>

                       <TableCell className="p-2">
                         {mainStep.due_date ? (
                           <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <Calendar className="h-3 w-3" />
                             <span>{formatDate(mainStep.due_date)}</span>
                           </div>
                         ) : (
                           <span className="text-xs text-muted-foreground">—</span>
                         )}
                       </TableCell>

                         <TableCell className="p-2 text-center">
                           <div className="flex justify-center">
                             {getStepIcon(mainStep)}
                           </div>
                         </TableCell>

                          <TableCell className="p-2">
                            <div className="flex items-center justify-center gap-2">
                              {!isStepDone(mainStep) && !isBlocked && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 hover:bg-muted"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                                     {!(mainStep as any).initiated_at && (
                                       <DropdownMenuItem onClick={() => handleCheckInStep(mainStep.id)}>
                                         <Play className="h-4 w-4 mr-2" />
                                         Check In / Start Working
                                       </DropdownMenuItem>
                                     )}
                                     <DropdownMenuItem onClick={() => {
                                       if (subSteps.length > 0 && !allSubStepsCompleted) {
                                         const proceed = window.confirm('Some substeps are not complete. Mark this step complete anyway?');
                                         if (!proceed) return;
                                       }
                                       handleMarkComplete(mainStep.id);
                                     }}>
                                       <CheckCircle2 className="h-4 w-4 mr-2" />
                                       Mark Complete
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleEditStep(mainStep)}>
                                       <Edit className="h-4 w-4 mr-2" />
                                       Edit
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {isBlocked && (
                                <span className="text-xs text-muted-foreground/70 px-2">Not available yet</span>
                              )}
                            </div>
                          </TableCell>
                     </TableRow>

                     {/* Expanded content row - substeps cards or description */}
                     {isExpanded && (
                       <TableRow className="border-b border-gray-200">
                         <TableCell></TableCell>
                         <TableCell colSpan={4} className="p-0 bg-muted/20">
                           {subSteps.length > 0 ? (
                             <div className="p-4">
                               {/* Main step description section */}
                               <div className="mb-6 pb-4 border-b border-gray-200">
                                 <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">
                                   {(mainStep.explainer?.trim() || mainStep.notes?.trim() || "Here are the sub-steps to complete this main step.")}
                                 </p>
                                 <button
                                   onClick={() => handleNeedHelp(mainStep)}
                                   className="text-primary hover:text-primary/80 underline text-sm cursor-pointer bg-transparent border-none p-0"
                                 >
                                   Need more help?
                                 </button>
                               </div>
                               
                               {/* Google Flights style substeps cards */}
                               <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                                  {subSteps.map((substep) => (
                                    <div
                                      key={substep.id}
                                         className={`flex-shrink-0 w-80 border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                                           substep.completed_at 
                                             ? 'border-green-200 bg-green-50/50' 
                                             : 'bg-background hover:border-gray-300'
                                         }`}
                                    >
                                       {/* Substep title */}
                                       <div className="flex items-center gap-2 mb-3">
                                         <h4 className={`text-sm font-medium ${
                                           substep.completed_at 
                                             ? 'line-through text-muted-foreground' 
                                             : 'text-foreground'
                                         }`}>
                                            {cleanStepTitle(substep.title)}
                                         </h4>
                                         {substep.completed_at && (
                                           <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                         )}
                                         {!substep.completed_at && substep.initiated_at && (
                                           <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                         )}
                                       </div>

                                     {/* Substep description */}
                                     <div className="mb-4 min-h-[60px]">
                                       <p className="text-xs text-muted-foreground leading-relaxed">
                                         {substep.description || "Complete this sub-step to move forward."}
                                       </p>
                                     </div>

                                       {/* Actions */}
                                       <div className="flex flex-col gap-2">
                                          {!substep.completed_at ? (
                                            <>
                                              {!(substep as any).initiated_at && (
                                                <Button
                                                  onClick={() => handleCheckInSubstep(substep.id, mainStep.id)}
                                                  className="w-full h-8 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                                  size="sm"
                                                  variant="outline"
                                                >
                                                  <Play className="h-3 w-3 mr-1" />
                                                  Check In / Start Working
                                                </Button>
                                              )}
                                              <Button
                                                onClick={() => handleCompleteSubstep(substep.id, mainStep.id)}
                                                className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                                size="sm"
                                              >
                                                Mark Complete
                                              </Button>
                                             <button
                                               onClick={() => handleSubstepHelp(substep, mainStep)}
                                               className="text-primary hover:text-primary/80 underline text-xs cursor-pointer bg-transparent border-none p-0 text-center"
                                             >
                                               Need help?
                                             </button>
                                           </>
                                         ) : (
                                           <Button
                                             variant="outline"
                                             className="w-full h-8 text-xs border-green-200 text-green-700 cursor-default"
                                             size="sm"
                                             disabled
                                           >
                                             Completed
                                           </Button>
                                         )}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             </div>
                           ) : (
                             <div className="p-4">
                               <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">
                                 {(mainStep.explainer?.trim() || mainStep.notes?.trim() || "Click 'Need more help?' to break this step down further.")}
                               </p>
                               <button
                                 onClick={() => handleNeedHelp(mainStep)}
                                 className="text-primary hover:text-primary/80 underline text-sm cursor-pointer bg-transparent border-none p-0"
                               >
                                 Need more help?
                               </button>
                             </div>
                           )}
                         </TableCell>
                       </TableRow>
                     )}
                   </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {queuedSteps.length > 0 && !showingQueuedSteps && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowingQueuedSteps(true)}
              className="text-sm text-muted-foreground border-muted hover:bg-muted/20"
            >
              Show {queuedSteps.length} more upcoming steps
            </Button>
          </div>
        )}

        {showingQueuedSteps && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowingQueuedSteps(false)}
              className="text-sm text-muted-foreground border-muted hover:bg-muted/20"
            >
              Show fewer steps
            </Button>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <button
            onClick={() => handleNeedHelp({ id: 'new', title: 'Add New Step', goal_id: goal.id } as Step)}
            className="flex items-center gap-2 text-sm border border-primary/30 text-primary hover:bg-primary/10 px-3 py-2 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add step
          </button>
        </div>
      </CardContent>

      {/* Modals */}
      <StepChatModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        step={currentHelpStep}
        goal={goal}
        onStepsUpdate={handleStepsUpdate}
      />
      
      {currentEditStep && (
        <StepEditModal
          isOpen={showEditModal}
          onOpenChange={setShowEditModal}
          step={currentEditStep}
          goal={goal}
          onStepUpdate={handleStepUpdate}
        />
      )}

      {/* Fireworks Animation */}
      <Fireworks 
        isVisible={showFireworks} 
        onComplete={() => setShowFireworks(false)} 
      />
      
      <GoalCompletionCelebration
        isOpen={showGoalCelebration}
        onClose={() => setShowGoalCelebration(false)}
        goalTitle={goal.title}
      />
    </Card>
  );
};