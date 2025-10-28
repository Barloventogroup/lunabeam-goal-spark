import React from 'react';
import { CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Substep } from '@/types';

interface ScaffoldingStepCardProps {
  step: Substep;
  onComplete: (stepId: string) => void;
  onBreakDown: (stepId: string) => void;
}

export const ScaffoldingStepCard: React.FC<ScaffoldingStepCardProps> = ({
  step,
  onComplete,
  onBreakDown,
}) => {
  const isCompleted = !!step.completed_at;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border-l-4 
        transition-all duration-200
        ${isCompleted 
          ? 'bg-success/10 border-success' 
          : 'bg-accent/30 border-accent hover:bg-accent/50'
        }
      `}
    >
      <button
        onClick={() => onComplete(step.id)}
        className="shrink-0 transition-colors duration-200"
        disabled={isCompleted}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        )}
      </button>

      <span
        className={`
          flex-1 text-sm
          ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}
        `}
      >
        {step.title}
      </span>

      {!isCompleted && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onBreakDown(step.id)}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
