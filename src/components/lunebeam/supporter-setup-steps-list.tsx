import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, ChevronDown, ChevronUp, MoreHorizontal, Edit, Play, Paperclip, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Step, Goal, Substep } from '@/types';
import { stepsService } from '@/services/goalsService';
import { pointsService } from '@/services/pointsService';
import { StepEditModal } from './step-edit-modal';
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

// Normalize substep titles for deduping
const normalizeSubstepTitle = (title?: string) => {
  const base = cleanStepTitle(title || '');
  return base.toLowerCase().replace(/\s+/g, ' ').trim();
};

// Deduplicate substeps
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

interface SupporterSetupStepsListProps {
  steps: Step[];
  goal: Goal;
  onStepsChange?: () => void;
  onStepsUpdate?: (updatedSteps: Step[], updatedGoal: Goal) => void;
  isViewerSupporter?: boolean;
}

export const SupporterSetupStepsList: React.FC<SupporterSetupStepsListProps> = ({
  steps,
  goal,
  onStepsChange,
  onStepsUpdate,
  isViewerSupporter = true
}) => {
  const [showSetupSteps, setShowSetupSteps] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [substepsMap, setSubstepsMap] = useState<Record<string, Substep[]>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState<Step | null>(null);
  const { toast } = useToast();

  // Fetch scaffolding steps for all steps
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

  // Filter supporter setup steps only
  const supporterSetupSteps = steps
    .filter(s => (!s.type || s.type === 'action') && !s.hidden && s.is_supporter_step)
    .sort((a, b) => (a.order_index ?? Number.POSITIVE_INFINITY) - (b.order_index ?? Number.POSITIVE_INFINITY));

  // Supporter steps are exempt from sequential gating - they only respect explicit dependencies
  const isStepBlocked = (step: Step): boolean => {
    if (step.dependency_step_ids && step.dependency_step_ids.length > 0) {
      return step.dependency_step_ids.some(depId => {
        const depStep = steps.find(s => s.id === depId);
        return depStep && depStep.status !== 'done' && depStep.status !== 'skipped';
      });
    }
    return false;
  };

  const handleMarkComplete = async (stepId: string) => {
    try {
      const result = await stepsService.completeStep(stepId);

      const updatedSteps = steps.map(s =>
        s.id === stepId ? { ...s, status: 'done' as const, updated_at: new Date().toISOString() } : s
      );
      
      if (onStepsUpdate) {
        onStepsUpdate(updatedSteps, result.goal);
      } else if (onStepsChange) {
        onStepsChange();
      }

      toast({
        title: "Step completed!",
        description: "Supporter setup step marked complete.",
      });
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive",
      });
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
        description: "You've started working on this setup step.",
      });
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
    } catch (error) {
      console.error('Error checking in substep:', error);
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteSubstep = async (substepId: string, stepId: string) => {
    try {
      // Complete the scaffolding step
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
      
      toast({
        title: "Substep completed!",
        description: "Great progress on this setup task.",
      });

      if (onStepsChange) {
        onStepsChange();
      }
    } catch (error) {
      console.error('Error completing substep:', error);
      toast({
        title: "Error",
        description: "Failed to complete substep. Please try again.",
        variant: "destructive",
      });
    }
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

  const isStepDone = (step: Step): boolean => {
    return step.status === 'done';
  };

  const getStepIcon = (step: Step) => {
    if (isStepBlocked(step)) {
      return null;
    }

    const hasBeenInitiated = !!(step as any).initiated_at;
    
    if (isStepDone(step)) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    
    return null;
  };

  const getPrecursorText = (step: Step): string | null => {
    if (step.dependency_step_ids && step.dependency_step_ids.length > 0) {
      const dependencyCount = step.dependency_step_ids.length;
      return `Requires ${dependencyCount} other step${dependencyCount > 1 ? 's' : ''}`;
    }
    return null;
  };

  if (supporterSetupSteps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">No supporter setup steps</CardTitle>
          <p className="text-sm text-muted-foreground">
            There are no setup steps for supporters for this goal.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader 
          className="pb-4 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setShowSetupSteps(!showSetupSteps)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                Set Up Steps for Supporter
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tasks for you as a supporter to prepare the environment and provide assistance.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {showSetupSteps ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>

        {showSetupSteps && (
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
                  {supporterSetupSteps.map((step) => {
                    const stepSubsteps = substepsMap[step.id] || [];
                    const isExpanded = expandedSteps.has(step.id);
                    const isBlocked = isStepBlocked(step);
                    const precursorText = getPrecursorText(step);
                    const allSubstepsCompleted = stepSubsteps.length > 0 && stepSubsteps.every(sub => sub.completed_at);
                    const hasBeenInitiated = !!(step as any).initiated_at;

                    return (
                      <React.Fragment key={step.id}>
                        {/* Main step row */}
                        <TableRow className={`border-b border-gray-200 ${isBlocked ? 'opacity-40 bg-muted/20' : 'hover:bg-muted/50'}`}>
                          <TableCell className="p-2 w-8">
                            {(stepSubsteps.length > 0 || step.explainer || step.notes) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleStepExpanded(step.id)}
                                className={`p-1 h-auto ${isBlocked ? 'text-muted-foreground/50 hover:text-muted-foreground/70' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                          </TableCell>
                          
                          <TableCell className="p-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isBlocked ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                                  {cleanStepTitle(step.title)}
                                </span>
                                {getStepIcon(step)}
                              </div>
                              {precursorText && (
                                <p className="text-xs text-muted-foreground italic">
                                  {precursorText}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="p-2 text-xs text-muted-foreground">
                            {step.due_date ? formatDate(step.due_date) : '-'}
                          </TableCell>
                          
                          <TableCell className="p-2 text-center">
                            <Badge variant={step.status === 'done' ? 'default' : step.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs">
                              {step.status === 'done' ? 'Done' : step.status === 'in_progress' ? 'In Progress' : 'To Do'}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              {!isStepDone(step) && !isBlocked && (
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
                                    {!hasBeenInitiated && (
                                      <DropdownMenuItem onClick={() => handleCheckInStep(step.id)}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Check In / Start Working
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => {
                                      if (stepSubsteps.length > 0 && !allSubstepsCompleted) {
                                        const proceed = window.confirm('Some substeps are not complete. Mark this step complete anyway?');
                                        if (!proceed) return;
                                      }
                                      handleMarkComplete(step.id);
                                    }}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setCurrentEditStep(step);
                                      setShowEditModal(true);
                                    }}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      // TODO: Implement attach resources functionality
                                    }}>
                                      <Paperclip className="h-4 w-4 mr-2" />
                                      Attach Resources
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      // TODO: Implement nudge functionality
                                    }}>
                                      <Bell className="h-4 w-4 mr-2" />
                                      Nudge
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {isBlocked && (
                                <span className="text-xs text-muted-foreground/70 px-2">Not available yet</span>
                              )}
                              {(step.status === 'done' || allSubstepsCompleted) && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded content row */}
                        {isExpanded && (
                          <TableRow className="border-b border-gray-200">
                            <TableCell colSpan={5} className="p-4 bg-muted/10">
                              <div className="space-y-3">
                                {step.explainer && (
                                  <div className="text-sm text-muted-foreground">
                                    <strong>Explainer:</strong> {step.explainer}
                                  </div>
                                )}
                                
                                {step.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    <strong>Notes:</strong> {step.notes}
                                  </div>
                                )}

                                {stepSubsteps.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">Sub-steps:</div>
                                    <div className="space-y-1.5 pl-4">
                                      {stepSubsteps.map((substep) => (
                                        <div key={substep.id} className="flex items-center justify-between gap-3 p-2 rounded-md bg-background/50 border border-gray-200">
                                          <div className="flex items-center gap-2 flex-1">
                                            {substep.completed_at ? (
                                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                            )}
                                            <span className={`text-sm ${substep.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                              {cleanStepTitle(substep.title)}
                                            </span>
                                          </div>
                                          {!substep.completed_at && (
                                            <div className="flex items-center justify-end gap-1">
                                              {!(substep as any).initiated_at && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleCheckInSubstep(substep.id, step.id)}
                                                  className="h-6 px-2 text-xs"
                                                >
                                                  <Play className="h-3 w-3 mr-1" />
                                                  Start
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleCompleteSubstep(substep.id, step.id)}
                                                className="h-6 px-2 text-xs"
                                              >
                                                Complete
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edit Modal */}
      {currentEditStep && (
        <StepEditModal
          isOpen={showEditModal}
          onOpenChange={setShowEditModal}
          step={currentEditStep}
          goal={goal}
          onStepUpdate={handleStepUpdate}
        />
      )}
    </>
  );
};
