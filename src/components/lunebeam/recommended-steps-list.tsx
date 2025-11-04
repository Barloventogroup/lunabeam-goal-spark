import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { Step, Goal, Substep, StepStatus, StepType } from '@/types';
import { stepsService } from '@/services/goalsService';
import { pointsService } from '@/services/pointsService';
import { StepCard } from './step-card';
import { SubstepDrawer } from './substep-drawer';
import { StepChatModal } from './step-chat-modal';
import { StepEditModal } from './step-edit-modal';
import { ExpressCheckInCard } from './express-check-in-card';
import { useToast } from '@/hooks/use-toast';
import { notificationsService } from '@/services/notificationsService';
import { supabase } from '@/integrations/supabase/client';
import { cleanStepTitle } from '@/utils/stepUtils';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState<Step | null>(null);
  const [checkInStep, setCheckInStep] = useState<Step | null>(null);
  const [substepDrawerOpen, setSubstepDrawerOpen] = useState(false);
  const [selectedStepForSubsteps, setSelectedStepForSubsteps] = useState<Step | null>(null);
  const [currentSubsteps, setCurrentSubsteps] = useState<Substep[]>([]);
  const [goalName, setGoalName] = useState<string>('');
  const { toast } = useToast();
  
  // Check for incomplete generation
  const generationIncomplete = (goal.metadata as any)?.generation_incomplete === true;
  const failedDays = (goal.metadata as any)?.failed_days || [];
  const successfulDays = (goal.metadata as any)?.successful_days || 0;
  const totalExpectedDays = (goal.metadata as any)?.total_expected_days || 0;

  // Fetch scaffolding steps for all steps (batched in single query)
  useEffect(() => {
    const fetchAllScaffoldingSteps = async () => {
      try {
        // Batch fetch all scaffolding steps in a single query
        const stepIds = steps.map(s => s.id);
        
        const { data: allScaffoldingSteps, error } = await supabase
          .from('steps')
          .select('*')
          .in('parent_step_id', stepIds)
          .eq('is_scaffolding', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching scaffolding steps:', error);
          return;
        }

        // Group scaffolding steps by parent_step_id for O(1) lookup
        const newSubstepsMap: Record<string, Substep[]> = {};
        (allScaffoldingSteps || []).forEach(scaffoldingStep => {
          const parentId = scaffoldingStep.parent_step_id;
          if (!parentId) return;
          if (!newSubstepsMap[parentId]) {
            newSubstepsMap[parentId] = [];
          }
          // Map scaffolding step to legacy Substep format for compatibility
          newSubstepsMap[parentId].push({
            id: scaffoldingStep.id,
            step_id: parentId,
            title: scaffoldingStep.title,
            description: scaffoldingStep.notes,
            is_planned: scaffoldingStep.is_planned || false,
            completed_at: scaffoldingStep.status === 'done' ? scaffoldingStep.updated_at : undefined,
            initiated_at: scaffoldingStep.initiated_at,
            points_awarded: scaffoldingStep.points_awarded || 0,
            created_at: scaffoldingStep.created_at,
            updated_at: scaffoldingStep.updated_at,
            due_date: scaffoldingStep.due_date
          } as Substep);
        });

        // Apply deduplication to each step's substeps
        Object.keys(newSubstepsMap).forEach(stepId => {
          newSubstepsMap[stepId] = dedupeSubsteps(newSubstepsMap[stepId]);
        });
        
        setSubstepsMap(newSubstepsMap);
      } catch (error) {
        console.error('Error fetching substeps:', error);
      }
    };

    if (steps.length > 0) {
      fetchAllScaffoldingSteps();
    }
  }, [steps]);

  // Fetch goal name
  useEffect(() => {
    if (goal?.title) {
      setGoalName(goal.title);
    }
  }, [goal?.title]);

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
    // Open check-in modal instead of directly completing
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setCheckInStep(step);
    }
  };

  const handleCheckInComplete = async () => {
    if (!checkInStep) return;
    
    const stepId = checkInStep.id;
    if (awaitingStepUpdate === stepId) return;
    
    setAwaitingStepUpdate(stepId);
    
    try {
      // Refresh scaffolding steps
      const { data: allScaffoldingSteps } = await supabase
        .from('steps')
        .select('*')
        .in('parent_step_id', steps.map(s => s.id))
        .eq('is_scaffolding', true);
      
      const newSubstepsMap: Record<string, Substep[]> = {};
      (allScaffoldingSteps || []).forEach(scaffoldingStep => {
        const parentId = scaffoldingStep.parent_step_id;
        if (!parentId) return;
        if (!newSubstepsMap[parentId]) {
          newSubstepsMap[parentId] = [];
        }
        newSubstepsMap[parentId].push({
          id: scaffoldingStep.id,
          step_id: parentId,
          title: scaffoldingStep.title,
          description: scaffoldingStep.notes,
          is_planned: scaffoldingStep.is_planned || false,
          completed_at: scaffoldingStep.status === 'done' ? scaffoldingStep.updated_at : undefined,
          initiated_at: scaffoldingStep.initiated_at,
          points_awarded: scaffoldingStep.points_awarded || 0,
          created_at: scaffoldingStep.created_at,
          updated_at: scaffoldingStep.updated_at,
          due_date: scaffoldingStep.due_date
        } as Substep);
      });
      Object.keys(newSubstepsMap).forEach(stepId => {
        newSubstepsMap[stepId] = dedupeSubsteps(newSubstepsMap[stepId]);
      });
      setSubstepsMap(newSubstepsMap);

      setExpandedSteps(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });

      // Trigger parent refresh
      if (onStepsChange) {
        onStepsChange();
      }
      
      setCheckInStep(null);
    } catch (error) {
      console.error('Error refreshing after check-in:', error);
    } finally {
      setAwaitingStepUpdate(null);
    }
  };

  const handleCheckInDefer = async (action: 'split' | 'tomorrow') => {
    if (!checkInStep) return;
    
    if (action === 'split') {
      setCurrentHelpStep(checkInStep);
      setHelpModalOpen(true);
      setCheckInStep(null);
    } else if (action === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await stepsService.updateStep(checkInStep.id, {
        due_date: tomorrow.toISOString().split('T')[0]
      });
      
      toast({
        title: "Step rescheduled",
        description: "We'll remind you tomorrow"
      });
      
      setCheckInStep(null);
      onStepsChange?.();
    }
  };

  const handleSkipStep = async (stepId: string) => {
    if (awaitingStepUpdate === stepId) return;
    setAwaitingStepUpdate(stepId);
    try {
      await stepsService.skipStep(stepId);
      const updatedSteps = steps.map(s =>
        s.id === stepId ? { ...s, status: 'skipped' as StepStatus } : s
      );
      onStepsUpdate?.(updatedSteps, goal);
      toast({ title: "Step skipped" });
    } catch (error) {
      console.error('Error skipping step:', error);
      toast({ title: "Error", description: "Failed to skip step", variant: "destructive" });
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
      // Update the scaffolding step to mark as initiated
      await supabase
        .from('steps')
        .update({ initiated_at: new Date().toISOString(), status: 'in_progress' })
        .eq('id', substepId);
      
      // Refresh scaffolding steps for this parent
      const { data: scaffoldingSteps } = await supabase
        .from('steps')
        .select('*')
        .eq('parent_step_id', stepId)
        .eq('is_scaffolding', true);
      
      const substeps = dedupeSubsteps((scaffoldingSteps || []).map(s => ({
        id: s.id,
        step_id: stepId,
        title: s.title,
        description: s.notes,
        is_planned: s.is_planned || false,
        completed_at: s.status === 'done' ? s.updated_at : undefined,
        initiated_at: s.initiated_at,
        points_awarded: s.points_awarded || 0,
        created_at: s.created_at,
        updated_at: s.updated_at,
        due_date: s.due_date
      } as Substep)));
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
      status: substep.completed_at ? 'done' : 'not_started' as StepStatus,
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
      // Complete the scaffolding step and award points
      await supabase
        .from('steps')
        .update({ status: 'done', points_awarded: 2, updated_at: new Date().toISOString() })
        .eq('id', substepId);
      
      // Refresh scaffolding steps for this parent
      const { data: scaffoldingSteps } = await supabase
        .from('steps')
        .select('*')
        .eq('parent_step_id', stepId)
        .eq('is_scaffolding', true);
      
      const substeps = dedupeSubsteps((scaffoldingSteps || []).map(s => ({
        id: s.id,
        step_id: stepId,
        title: s.title,
        description: s.notes,
        is_planned: s.is_planned || false,
        completed_at: s.status === 'done' ? s.updated_at : undefined,
        initiated_at: s.initiated_at,
        points_awarded: s.points_awarded || 0,
        created_at: s.created_at,
        updated_at: s.updated_at,
        due_date: s.due_date
      } as Substep)));
      setSubstepsMap(prev => ({ ...prev, [stepId]: substeps }));
      
      const completedCount = substeps.filter(s => s.completed_at !== null).length;
      const totalCount = substeps.length;
      const allCompleted = completedCount === totalCount;
      
      if (allCompleted) {
        const step = steps.find(s => s.id === stepId);
        if (step && step.status !== 'done') {
          // Auto-complete main step when all substeps are done
          await handleMarkComplete(stepId);
          // Don't show additional toast here - handleMarkComplete handles it
        }
      } else {
        // Show progress toast
        const remaining = totalCount - completedCount;
        if (remaining === 1) {
          toast({
            title: "Almost there! 💪",
            description: "One more substep to complete this step!",
          });
        } else {
          toast({
            title: "Progress!",
            description: `${completedCount} of ${totalCount} substeps done`,
          });
        }

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

  const handleBreakDown = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    setSelectedStepForSubsteps(step);
    
    // Load substeps for this step
    const substeps = substepsMap[stepId] || [];
    setCurrentSubsteps(substeps);
    setSubstepDrawerOpen(true);
  };

  const refreshSubsteps = async () => {
    // Reload all substeps
    try {
      const stepIds = steps.map(s => s.id);
      
      const { data: allScaffoldingSteps, error } = await supabase
        .from('steps')
        .select('*')
        .in('parent_step_id', stepIds)
        .eq('is_scaffolding', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching scaffolding steps:', error);
        return;
      }

      const newSubstepsMap: Record<string, Substep[]> = {};
      (allScaffoldingSteps || []).forEach(scaffoldingStep => {
        const parentId = scaffoldingStep.parent_step_id;
        if (!parentId) return;
        if (!newSubstepsMap[parentId]) {
          newSubstepsMap[parentId] = [];
        }
        newSubstepsMap[parentId].push({
          id: scaffoldingStep.id,
          step_id: parentId,
          title: scaffoldingStep.title,
          description: scaffoldingStep.notes,
          is_planned: scaffoldingStep.is_planned || false,
          completed_at: scaffoldingStep.status === 'done' ? scaffoldingStep.updated_at : undefined,
          initiated_at: scaffoldingStep.initiated_at,
          points_awarded: scaffoldingStep.points_awarded || 0,
          created_at: scaffoldingStep.created_at,
          updated_at: scaffoldingStep.updated_at,
          due_date: scaffoldingStep.due_date
        } as Substep);
      });

      Object.keys(newSubstepsMap).forEach(stepId => {
        newSubstepsMap[stepId] = dedupeSubsteps(newSubstepsMap[stepId]);
      });
      
      setSubstepsMap(newSubstepsMap);
      
      // Update current substeps if drawer is open
      if (selectedStepForSubsteps) {
        setCurrentSubsteps(newSubstepsMap[selectedStepForSubsteps.id] || []);
      }
    } catch (error) {
      console.error('Error refreshing substeps:', error);
    }
    
    onStepsChange?.();
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!window.confirm('Are you sure you want to delete this step?')) return;
    
    try {
      await supabase.from('steps').delete().eq('id', stepId);
      toast({ title: "Step deleted" });
      onStepsChange?.();
    } catch (error) {
      console.error('Error deleting step:', error);
      toast({ title: "Error", description: "Failed to delete step", variant: "destructive" });
    }
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
      {/* Incomplete generation warning banner */}
      {generationIncomplete && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-warning">Incomplete Step Generation</h4>
              <p className="text-sm text-warning-foreground mt-1">
                Only {successfulDays} of {totalExpectedDays} days were generated successfully.
                {failedDays.length > 0 && ` ${failedDays.length} days failed.`}
                {' '}Please try recreating this goal or contact support.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
          {/* Visible steps */}
          {groupedSteps.map((group) => (
            <StepCard
              key={group.mainStep.id}
              step={group.mainStep}
              goalId={goal.id}
              goalName={goalName}
              scaffoldingSteps={group.subSteps}
              onComplete={handleMarkComplete}
              onSkip={handleSkipStep}
              onBreakDown={handleBreakDown}
              onEdit={(stepId) => {
                const step = steps.find(s => s.id === stepId);
                if (step) handleEditStep(step);
              }}
              onDelete={handleDeleteStep}
              onCheckIn={handleCheckInStep}
              onScaffoldingComplete={(substepId) => handleCompleteSubstep(substepId, group.mainStep.id)}
              onScaffoldingBreakDown={(substepId) => {
                const substep = group.subSteps.find(s => s.id === substepId);
                if (substep) handleSubstepHelp(substep, group.mainStep);
              }}
              isExpanded={expandedSteps.has(group.mainStep.id)}
              onToggleExpand={() => toggleStepExpanded(group.mainStep.id)}
              isBlocked={isStepBlocked(group.mainStep)}
            />
          ))}

          {/* Show queued steps button */}
          {queuedSteps.length > 0 && !showingQueuedSteps && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowingQueuedSteps(true)}
                className="text-sm"
              >
                Show {queuedSteps.length} more upcoming steps
              </Button>
            </div>
          )}

          {/* Queued steps (collapsible) */}
          {showingQueuedSteps && (
            <>
              <div className="space-y-6 opacity-60">
                {queuedGroupedSteps.map((group) => (
                  <StepCard
                    key={group.mainStep.id}
                    step={group.mainStep}
                    goalId={goal.id}
                    goalName={goalName}
                    scaffoldingSteps={group.subSteps}
                onComplete={handleMarkComplete}
                onSkip={handleSkipStep}
                onBreakDown={handleBreakDown}
                    onEdit={(stepId) => {
                      const step = steps.find(s => s.id === stepId);
                      if (step) handleEditStep(step);
                    }}
                    onDelete={handleDeleteStep}
                    onCheckIn={handleCheckInStep}
                    onScaffoldingComplete={(substepId) => handleCompleteSubstep(substepId, group.mainStep.id)}
                    onScaffoldingBreakDown={(substepId) => {
                      const substep = group.subSteps.find(s => s.id === substepId);
                      if (substep) handleSubstepHelp(substep, group.mainStep);
                    }}
                    isExpanded={expandedSteps.has(group.mainStep.id)}
                    onToggleExpand={() => toggleStepExpanded(group.mainStep.id)}
                    isBlocked={isStepBlocked(group.mainStep)}
                  />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowingQueuedSteps(false)}
                  className="text-sm"
                >
                  Show fewer steps
                </Button>
              </div>
            </>
          )}
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

        {checkInStep && (
          <ExpressCheckInCard
            step={checkInStep}
            goal={goal}
            isOpen={true}
            onClose={() => setCheckInStep(null)}
            onComplete={handleCheckInComplete}
            mode="modal"
          />
        )}

        {selectedStepForSubsteps && (
          <SubstepDrawer
            isOpen={substepDrawerOpen}
            onClose={() => setSubstepDrawerOpen(false)}
            parentStep={selectedStepForSubsteps}
            goalId={goal.id}
            goalName={goalName}
            substeps={currentSubsteps}
            onSubstepComplete={(substepId) => handleCompleteSubstep(substepId, selectedStepForSubsteps.id)}
            onSubstepSkip={handleSkipStep}
            onSubstepEdit={(substepId) => {
              const substep = currentSubsteps.find(s => s.id === substepId);
              if (substep) {
                const stepForEdit: Step = {
                  ...substep,
                  goal_id: goal.id,
                  order_index: 0,
                  status: substep.completed_at ? 'done' : 'not_started',
                  type: 'action',
                  is_required: true,
                  dependency_step_ids: [],
                };
                handleEditStep(stepForEdit);
              }
            }}
            onSubstepDelete={handleDeleteStep}
            onSubstepCheckIn={handleCheckInStep}
            onGenerateSubsteps={(parentStepId) => {
              const step = steps.find(s => s.id === parentStepId);
              if (step) handleNeedHelp(step);
              setSubstepDrawerOpen(false);
            }}
            onAddManually={(parentStepId) => {
              const step = steps.find(s => s.id === parentStepId);
              if (step) handleNeedHelp(step);
              setSubstepDrawerOpen(false);
            }}
            onRefresh={refreshSubsteps}
          />
        )}
      </div>
    </>
  );
};
