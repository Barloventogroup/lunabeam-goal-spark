import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, Calendar, ChevronDown, ChevronUp, ArrowDown, Plus, MoreHorizontal, Edit, Hourglass, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cleanStepTitle } from '@/utils/stepUtils';
import { parseISO, isBefore } from 'date-fns';
import Lottie from 'lottie-react';
import successAnimation from '@/assets/success-animation.json';

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

interface RecommendedStepsListProps {
  steps: Step[];
  goal: Goal;
  onStepsChange?: () => void;
  onStepsUpdate?: (updatedSteps: Step[], updatedGoal: Goal) => void;
  onOpenStepChat?: (step: Step) => void;
}

interface StepGroup {
  mainStep: Step;
  subSteps: Substep[];
}

export const RecommendedStepsList: React.FC<RecommendedStepsListProps> = ({
  steps,
  goal,
  onStepsChange,
  onStepsUpdate,
  onOpenStepChat
}) => {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [currentHelpStep, setCurrentHelpStep] = useState<Step | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showingQueuedSteps, setShowingQueuedSteps] = useState(false);
  const [awaitingStepUpdate, setAwaitingStepUpdate] = useState<string | null>(null);
  const [substepsMap, setSubstepsMap] = useState<Record<string, Substep[]>>({});
  // const [showGoalCelebration, setShowGoalCelebration] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState<Step | null>(null);
  // const [showFireworks, setShowFireworks] = useState(false);
  // const [showSuccessCheck, setShowSuccessCheck] = useState(false);
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
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [awaitingStepUpdate]);

  // Filter individual steps only (non-supporter steps)
  const individualSteps = steps
    .filter(s => (!s.type || s.type === 'action') && !s.hidden && !s.is_supporter_step)
    .sort((a, b) => (a.order_index ?? Number.POSITIVE_INFINITY) - (b.order_index ?? Number.POSITIVE_INFINITY));

  // Compute sorted actionable steps and split into visible + queued
  const sortedActionableSteps = individualSteps
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
        const aIndex = a.order_index ?? 0;
        const bIndex = b.order_index ?? Number.POSITIVE_INFINITY;
        return bIndex > aIndex && bIndex < aIndex + 10 ? -1 : aIndex - bIndex;
      }
      
      if (!aIsMainStep && bIsMainStep) {
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

  // Group steps with their substeps from database
  const groupedSteps: StepGroup[] = visibleSteps.map((step) => ({
    mainStep: step,
    subSteps: substepsMap[step.id] || []
  }));
  
  const queuedGroupedSteps: StepGroup[] = queuedSteps.map((step) => ({
    mainStep: step,
    subSteps: substepsMap[step.id] || []
  }));

  // Define isStepBlocked
  const isStepBlocked = (step: Step): boolean => {
    // Strict sequential gating for individual steps
    const currentIdx = sortedActionableSteps.findIndex(s => s.id === step.id);
    if (currentIdx > -1) {
      for (let i = 0; i < currentIdx; i++) {
        const prev = sortedActionableSteps[i];
        const required = prev.is_required !== false;
        if (!required) continue;
        if ((prev.type && prev.type !== 'action') || prev.hidden) continue;
        const prevSubs = substepsMap[prev.id] || [];
        const prevComplete = prevSubs.length > 0
          ? prevSubs.every(sub => sub.completed_at)
          : prev.status === 'done' || prev.status === 'skipped';
        if (!prevComplete) {
          return true;
        }
      }
    }

    // Check explicit dependencies
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

      if (currentWeek > 1) {
        const allPrevWeekSteps = steps.filter(s => {
          const prevWeekMatch = s.title.match(/Week (\d+)/i);
          if (!prevWeekMatch) return false;
          const stepWeek = parseInt(prevWeekMatch[1]);
          return stepWeek < currentWeek && s.is_required;
        });

        const incompleteSteps = allPrevWeekSteps.filter(s => {
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

        if (incompleteSteps.length > 0) {
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

        const incompleteSessionSteps = currentWeekSteps.filter(s => {
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

        if (incompleteSessionSteps.length > 0) {
          return true;
        }
      }
    }

    return false;
  };

  const handleMarkComplete = async (stepId: string) => {
    if (awaitingStepUpdate === stepId) return;
    
    setAwaitingStepUpdate(stepId);
    
    try {
      const result = await stepsService.completeStep(stepId);

      const updatedSteps = steps.map(s =>
        s.id === stepId ? { ...s, status: 'done' as StepStatus, updated_at: new Date().toISOString() } : s
      );
      if (onStepsUpdate) {
        onStepsUpdate(updatedSteps, result.goal);
      } else if (onStepsChange) {
        onStepsChange();
      }
      
      // Refresh substeps
      const substepsPromises = steps.map(async (step) => {
        try {
          const substeps = await pointsService.getSubsteps(step.id);
          return { stepId: step.id, substeps };
        } catch (error) {
          return { stepId: step.id, substeps: [] };
        }
      });
      const results = await Promise.all(substepsPromises);
      const newSubstepsMap: Record<string, Substep[]> = {};
      results.forEach(({ stepId, substeps }) => {
        newSubstepsMap[stepId] = dedupeSubsteps(substeps);
      });
      setSubstepsMap(newSubstepsMap);

      setExpandedSteps(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });

      // setShowSuccessCheck(true);
      // setTimeout(() => setShowSuccessCheck(false), 2000);

      // Check if all planned steps are complete and handle goal completion logic
      const remainingPlanned = updatedSteps.filter(s => s.is_planned && s.status !== 'done');
      const allPlannedComplete = remainingPlanned.length === 0;
      
      // Check if goal is at or past its due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const goalDueDate = goal.due_date ? new Date(goal.due_date) : null;
      const isAtOrPastEnd = goalDueDate ? today >= goalDueDate : false;
      
      if (allPlannedComplete && isAtOrPastEnd) {
        // Mark goal as completed
        await supabase
          .from('goals')
          .update({ 
            status: 'completed',
            last_completed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', goal.id);
        
        toast({
          title: "Goal completed! 🏆",
          description: `Amazing work! You've completed "${goal.title}"!`,
        });
      } else if (allPlannedComplete && !isAtOrPastEnd) {
        // Daily completion for habit goals - schedule next occurrence
        const isHabitGoal = goal.frequency_per_week && goal.frequency_per_week > 0;
        
        if (isHabitGoal) {
          const { smartSchedulingService } = await import('@/services/smartSchedulingService');
          const { scheduledTime, success } = await smartSchedulingService.scheduleNextHabitOccurrence(goal.id);
          
          if (success) {
            toast({
              title: "Today completed! ✨",
              description: `You're set for tomorrow at ${scheduledTime}`,
            });
          } else {
            toast({
              title: "Step completed!",
              description: `Great job! You've completed this step.`,
            });
          }
        } else {
          toast({
            title: "Step completed!",
            description: `Great job! You've completed this step.`,
          });
        }
      } else {
        toast({
          title: "Step completed!",
          description: `Great job! You've completed this step.`,
        });
      }

      // Send notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationsService.notifyStepComplete(user.id, goal.id, stepId);

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
    }
  };

  const handleCheckInStep = async (stepId: string) => {
    try {
      await stepsService.checkInStep(stepId);
      
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

      // Send notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationsService.notifyCheckIn(user.id, goal.id, stepId);
        
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
              await notificationsService.createCheckInNotification(admin.supporter_id, {
                individual_name: userName,
                goal_title: goal.title,
                step_title: stepTitle
              });
            } catch (error) {
              console.error('Failed to create notification for admin:', admin.supporter_id, error);
            }
          }
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
      
      const substeps = dedupeSubsteps(await pointsService.getSubsteps(stepId));
      setSubstepsMap(prev => ({ ...prev, [stepId]: substeps }));
      
      toast({
        title: "Checked in!",
        description: "You've started working on this substep.",
      });

      // Send notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await notificationsService.notifyCheckIn(user.id, goal.id, stepId, substepId);
        
        const { data: adminSupporters } = await supabase
          .from('supporters')
          .select('supporter_id')
          .eq('individual_id', user.id)
          .eq('is_admin', true);

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

          for (const admin of adminSupporters) {
            try {
              await notificationsService.createCheckInNotification(admin.supporter_id, {
                individual_name: userName,
                goal_title: goal.title,
                step_title: `${stepTitle} - ${substepTitle}`
              });
            } catch (error) {
              console.error('Failed to create substep notification for admin:', admin.supporter_id, error);
            }
          }
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
    if (onOpenStepChat) {
      onOpenStepChat(step);
    } else {
      setCurrentHelpStep(step);
      setHelpModalOpen(true);
    }
  };

  const handleSubstepHelp = (substep: Substep, parentStep: Step) => {
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
    
    if (onOpenStepChat) {
      onOpenStepChat(substepAsStep);
    } else {
      setCurrentHelpStep(substepAsStep);
      setHelpModalOpen(true);
    }
  };

  const handleCompleteSubstep = async (substepId: string, stepId: string) => {
    try {
      await pointsService.completeSubstep(substepId);
      
      const substeps = dedupeSubsteps(await pointsService.getSubsteps(stepId));
      setSubstepsMap(prev => ({ ...prev, [stepId]: substeps }));
      
      const allCompleted = substeps.every(s => s.completed_at !== null);
      if (allCompleted) {
        // setShowFireworks(true);
        
        const step = steps.find(s => s.id === stepId);
        if (step && step.status !== 'done') {
          await handleMarkComplete(stepId);
          toast({
            title: "Step completed!",
            description: "All substeps finished - main step marked complete!",
          });
        }
      } else {
        // setShowFireworks(true);
        
        toast({
          title: "Substep completed!",
          description: "Great progress on breaking down this step.",
        });

        // Send notifications
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await notificationsService.notifyStepComplete(user.id, goal.id, stepId, substepId);

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
          }
        }
      }

      if (onStepsChange) {
        onStepsChange();
      }

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
    const updatedSteps = steps.map(s =>
      s.id === updatedStep.id ? updatedStep : s
    );
    
    if (onStepsUpdate) {
      onStepsUpdate(updatedSteps, goal);
    } else if (onStepsChange) {
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

  const isStepDone = (step: Step): boolean => {
    return step.status === 'done';
  };

  const getStepIcon = (step: Step) => {
    if (isStepBlocked(step)) {
      return null;
    }

    const stepSubsteps = substepsMap[step.id] || [];
    const allSubstepsCompleted = areAllSubStepsCompleted(stepSubsteps);

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
        if (hasBeenInitiated && !isStepDone(step)) {
          return <Clock className="h-5 w-5 text-blue-600" />;
        }
        
        if (stepSubsteps.length > 0) {
          if (allSubstepsCompleted) {
            return <CheckCircle2 className="h-5 w-5 text-amber-600" />;
          } else {
            const hasInitiatedSubsteps = stepSubsteps.some(sub => (sub as any).initiated_at);
            if (hasInitiatedSubsteps) {
              return <Clock className="h-5 w-5 text-blue-600" />;
            }
          }
        }
        return null;
    }
  };

  const hasDependencies = (step: Step): boolean => {
    return step.dependency_step_ids && step.dependency_step_ids.length > 0;
  };

  const getPrecursorText = (step: Step): string | null => {
    if (hasDependencies(step)) {
      const dependencyCount = step.dependency_step_ids?.length || 0;
      return `Requires ${dependencyCount} other step${dependencyCount > 1 ? 's' : ''}`;
    }
    return null;
  };

  if (steps.filter(s => !s.is_supporter_step).length === 0) {
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
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-foreground">Recommended steps</CardTitle>
            <p className="text-sm text-muted-foreground">Here's a short list of steps for you to work on as you progress toward your goal.</p>
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
                {(showingQueuedSteps ? [...groupedSteps, ...queuedGroupedSteps] : groupedSteps).map((group) => {
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

                            {/* Show description inline without requiring expansion */}
                            {mainStep.notes && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {mainStep.notes}
                              </p>
                            )}

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
                                
                                {/* Substeps cards */}
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

        {/* Fireworks Animation - Temporarily disabled */}
        {/* <Fireworks 
          isVisible={showFireworks} 
          onComplete={() => setShowFireworks(false)} 
        />
        
        <GoalCompletionCelebration
          isOpen={showGoalCelebration}
          onClose={() => setShowGoalCelebration(false)}
          goalTitle={goal.title}
        />
        
        {/* Success Animation */}
        {/* {showSuccessCheck && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <Lottie 
              animationData={successAnimation} 
              loop={false}
              style={{ width: 300, height: 300 }}
            />
          </div>
        )} */}
      </Card>
    </>
  );
};
