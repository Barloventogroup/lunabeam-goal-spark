import * as React from 'react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { StepCard } from './step-card';
import { supabase } from '@/integrations/supabase/client';
import type { Step, Substep } from '@/types';

interface SubstepDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parentStep: Step;
  goalId: string;
  goalName?: string;
  substeps: Substep[];
  onSubstepComplete: (substepId: string) => void;
  onSubstepSkip: (substepId: string) => void;
  onSubstepEdit: (substepId: string) => void;
  onSubstepDelete: (substepId: string) => void;
  onSubstepCheckIn: (substepId: string) => void;
  onGenerateSubsteps: (parentStepId: string) => void;
  onAddManually: (parentStepId: string) => void;
  onRefresh: () => void;
}

export const SubstepDrawer: React.FC<SubstepDrawerProps> = ({
  isOpen,
  onClose,
  parentStep,
  goalId,
  goalName,
  substeps,
  onSubstepComplete,
  onSubstepSkip,
  onSubstepEdit,
  onSubstepDelete,
  onSubstepCheckIn,
  onGenerateSubsteps,
  onAddManually,
  onRefresh,
}) => {
  const [expandedSubstepId, setExpandedSubstepId] = useState<string | null>(null);
  const [nestedDrawerOpen, setNestedDrawerOpen] = useState(false);
  const [selectedSubstepForNesting, setSelectedSubstepForNesting] = useState<Step | null>(null);
  const [nestedSubsteps, setNestedSubsteps] = useState<Substep[]>([]);

  // Check if all substeps are completed to auto-complete parent
  useEffect(() => {
    if (substeps.length > 0) {
      const allCompleted = substeps.every(s => !!s.completed_at);
      if (allCompleted && parentStep.status !== 'done') {
        // Auto-complete parent step
        handleAutoCompleteParent();
      }
    }
  }, [substeps, parentStep]);

  const handleAutoCompleteParent = async () => {
    try {
      await supabase
        .from('steps')
        .update({ status: 'done' })
        .eq('id', parentStep.id);
      onRefresh();
    } catch (error) {
      console.error('Error auto-completing parent step:', error);
    }
  };

  const handleBreakDownSubstep = async (substepId: string) => {
    const substep = substeps.find(s => s.id === substepId);
    if (substep) {
      // Convert Substep to Step for nested drawer
      const stepForNesting: Step = {
        ...substep,
        goal_id: goalId,
        order_index: 0,
        status: substep.completed_at ? 'done' : 'todo',
        type: 'action',
        is_required: true,
        dependency_step_ids: [],
        created_at: substep.created_at,
        updated_at: substep.updated_at,
      };
      setSelectedSubstepForNesting(stepForNesting);
      await loadNestedSubsteps(substepId);
      setNestedDrawerOpen(true);
    }
  };

  const loadNestedSubsteps = async (parentSubstepId: string) => {
    try {
      // Load substeps for this substep (from steps table with parent_step_id)
      const { data, error } = await supabase
        .from('steps')
        .select('*')
        .eq('parent_step_id', parentSubstepId)
        .eq('is_scaffolding', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Convert to Substep format
      const substepsData = (data || []).map(s => ({
        id: s.id,
        step_id: parentSubstepId,
        title: s.title,
        description: s.notes,
        is_planned: s.is_planned || false,
        completed_at: s.status === 'done' ? s.updated_at : undefined,
        initiated_at: s.initiated_at,
        points_awarded: s.points_awarded || 0,
        created_at: s.created_at,
        updated_at: s.updated_at,
        due_date: s.due_date
      } as Substep));
      
      setNestedSubsteps(substepsData);
    } catch (error) {
      console.error('Error loading nested substeps:', error);
      setNestedSubsteps([]);
    }
  };

  const isEmpty = substeps.length === 0;

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent side="right">
      <DrawerHeader className="pt-safe">
        <div className="flex items-center gap-3 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DrawerTitle className="text-base">
            {parentStep.title} - Substeps
          </DrawerTitle>
        </div>
      </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Break this step down into smaller, manageable substeps
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onAddManually(parentStep.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onGenerateSubsteps(parentStep.id)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </Button>
                </div>
              </div>
            ) : (
              substeps.map((substep) => {
                // Convert Substep to Step for StepCard
                const stepForCard: Step = {
                  ...substep,
                  goal_id: goalId,
                  order_index: 0,
                  status: substep.completed_at ? 'done' : 'todo',
                  type: 'action',
                  is_required: true,
                  dependency_step_ids: [],
                  created_at: substep.created_at,
                  updated_at: substep.updated_at,
                };

                return (
                  <StepCard
                    key={substep.id}
                    step={stepForCard}
                    goalId={goalId}
                    goalName={goalName}
                    scaffoldingSteps={[]}
                    onComplete={onSubstepComplete}
                    onSkip={onSubstepSkip}
                    onBreakDown={() => handleBreakDownSubstep(substep.id)}
                    onEdit={onSubstepEdit}
                    onDelete={onSubstepDelete}
                    onCheckIn={onSubstepCheckIn}
                    onScaffoldingComplete={() => {}}
                    onScaffoldingBreakDown={() => {}}
                    isExpanded={expandedSubstepId === substep.id}
                    onToggleExpand={() => setExpandedSubstepId(
                      expandedSubstepId === substep.id ? null : substep.id
                    )}
                    isBlocked={false}
                  />
                );
              })
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Nested drawer for substep's substeps */}
      {selectedSubstepForNesting && (
        <SubstepDrawer
          isOpen={nestedDrawerOpen}
          onClose={() => setNestedDrawerOpen(false)}
          parentStep={selectedSubstepForNesting}
          goalId={goalId}
          goalName={goalName}
          substeps={nestedSubsteps}
          onSubstepComplete={onSubstepComplete}
          onSubstepSkip={onSubstepSkip}
          onSubstepEdit={onSubstepEdit}
          onSubstepDelete={onSubstepDelete}
          onSubstepCheckIn={onSubstepCheckIn}
          onGenerateSubsteps={onGenerateSubsteps}
          onAddManually={onAddManually}
          onRefresh={() => {
            if (selectedSubstepForNesting) {
              loadNestedSubsteps(selectedSubstepForNesting.id);
            }
            onRefresh();
          }}
        />
      )}
    </>
  );
};
