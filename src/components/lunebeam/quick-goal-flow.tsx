import React, { useState } from 'react';
import { GoalIntentStep } from './goal-intent-step';
import { GoalCreationFlowV2 } from './goal-creation-flow-v2';
import { goalsService } from '@/services/goalsService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface QuickGoalFlowProps {
  onComplete: (goalData: { goalId: string }) => void;
  onCancel: () => void;
  efSelectedPillars: string[];
}

export function QuickGoalFlow({
  onComplete,
  onCancel,
  efSelectedPillars
}: QuickGoalFlowProps) {
  const [step, setStep] = useState<'template-selection' | 'creating' | 'lite-mode'>('template-selection');
  const [draftGoalId, setDraftGoalId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGoalSelected = async (goalData: {
    title: string;
    templateId?: string;
    timeframe: 'short_term' | 'mid_term' | 'long_term';
    focusAreas: string[];
  }) => {
    setStep('creating');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create draft goal
      const goal = await goalsService.createGoal({
        title: goalData.title,
        description: `Focus areas: ${goalData.focusAreas.join(', ')}`,
        priority: 'medium',
        owner_id: user.id,
        domain: 'other'
      });
      
      // Update goal with EF metadata
      await supabase
        .from('goals')
        .update({
          metadata: {
            created_via: 'quick_goal',
            ef_focus_areas: goalData.focusAreas,
            template_id: goalData.templateId,
            timeframe: goalData.timeframe,
            needs_full_setup: true
          }
        })
        .eq('id', goal.id);
        
      setDraftGoalId(goal.id);
      setStep('lite-mode');
    } catch (error) {
      console.error('Failed to create draft goal:', error);
      toast({
        title: "Oops, something went wrong",
        description: "Please try again.",
        variant: "destructive"
      });
      onCancel();
    }
  };

  if (step === 'template-selection') {
    return (
      <GoalIntentStep
        selectedPillars={efSelectedPillars}
        onGoalSelected={handleGoalSelected}
        onSkip={onCancel}
      />
    );
  }

  if (step === 'creating') {
    return (
      <Card className="p-6">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Setting up your goal...</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'lite-mode' && draftGoalId) {
    return (
      <GoalCreationFlowV2
        draftGoalId={draftGoalId}
        mode="lite"
        onComplete={() => onComplete({ goalId: draftGoalId })}
        onExit={onCancel}
      />
    );
  }

  return null;
}
