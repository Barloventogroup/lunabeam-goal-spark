import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { stepValidationService } from '@/services/stepValidationService';
import type { Goal, Step } from '@/types';

interface BlockedStepGuidanceProps {
  step: Step;
}

export const BlockedStepGuidance: React.FC<BlockedStepGuidanceProps> = ({ step }) => {
  const [guidance, setGuidance] = useState<string>('');
  const [blockedBy, setBlockedBy] = useState<Step[]>([]);

  useEffect(() => {
    const getValidationInfo = async () => {
      try {
        // Create a minimal goal object for validation
        const mockGoal: Goal = {
          id: step.goal_id || '',
          owner_id: '',
          created_by: '',
          title: '',
          description: '',
          domain: 'other',
          priority: 'medium',
          start_date: undefined,
          due_date: undefined,
          status: 'active',
          progress_pct: 0,
          streak_count: 0,
          tags: [],
          created_at: '',
          updated_at: ''
        };

        // Get all steps (this would need to be passed from parent in real implementation)
        // For now, we'll just show generic guidance
        setGuidance("Complete earlier steps first to unlock this one");
      } catch (error) {
        setGuidance("Complete required steps first");
      }
    };

    getValidationInfo();
  }, [step]);

  return (
    <div className="flex items-center gap-1 text-xs text-amber-600/80 mt-1">
      <ArrowRight className="h-3 w-3" />
      <span>{guidance}</span>
    </div>
  );
};