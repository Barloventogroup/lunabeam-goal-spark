import React from 'react';
import { Calendar, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Step, Substep } from '@/types';
import { format } from 'date-fns';

interface StepCardProps {
  step: Step;
  goalId: string;
  scaffoldingSteps: Substep[]; // Note: scaffoldingSteps should always be [] - substeps are now in drawer
  onComplete: (stepId: string) => void;
  onSkip: (stepId: string) => void;
  onBreakDown: (stepId: string) => void;
  onEdit: (stepId: string) => void;
  onDelete: (stepId: string) => void;
  onCheckIn: (stepId: string) => void;
  onScaffoldingComplete: (substepId: string) => void;
  onScaffoldingBreakDown: (substepId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isBlocked: boolean;
}

const getStatusBadgeVariant = (status: string): "active" | "default" | "planned" | "secondary" | "outline" => {
  switch (status) {
    case 'done':
      return 'default';
    case 'in_progress':
      return 'active';
    case 'skipped':
      return 'secondary';
    case 'not_started':
    default:
      return 'planned';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in_progress':
      return 'In Progress';
    case 'skipped':
      return 'Paused';
    case 'todo':
    case 'not_started':
    default:
      return 'Not Started';
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), 'MMM d');
  } catch {
    return null;
  }
};

export const StepCard: React.FC<StepCardProps> = ({
  step,
  scaffoldingSteps,
  onComplete,
  onSkip,
  onBreakDown,
  onEdit,
  onDelete,
  onCheckIn,
  onScaffoldingComplete,
  onScaffoldingBreakDown,
  isExpanded,
  onToggleExpand,
  isBlocked,
}) => {
  const substepCount = scaffoldingSteps.length;
  const hasSubsteps = substepCount > 0;

  return (
    <Card className={`relative transition-shadow hover:shadow-md ${isBlocked ? 'opacity-50' : ''}`}>
      {isBlocked && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center">
          <Badge variant="secondary" className="text-sm">
            Blocked - Complete previous steps first
          </Badge>
        </div>
      )}

      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild className="w-full">
            <div className="flex flex-col gap-2 cursor-pointer hover:bg-muted/50 -m-6 p-6 rounded-t-lg transition-colors">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm leading-tight flex-1">
                  {step.title}
                </h4>
                <Badge variant={getStatusBadgeVariant(step.status)}>
                  {getStatusLabel(step.status)}
                </Badge>
              </div>
              
              {step.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due {formatDate(step.due_date)}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="pt-0">
          <CollapsibleContent className="space-y-3">
            {(step.explainer || step.notes) && (
              <div className="text-xs text-muted-foreground leading-relaxed break-words">
                {step.explainer || step.notes}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(step.id);
                }}
              >
                Check-in
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(step.id);
                }}
              >
                Complete
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(step.id);
                }}
              >
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip(step.id);
                }}
              >
                Pause
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBreakDown(step.id);
                }}
              >
                {hasSubsteps ? `View ${substepCount} substep${substepCount !== 1 ? 's' : ''}` : 'Break it down'}
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
