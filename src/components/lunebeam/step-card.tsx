import * as React from 'react';
import { Calendar, MoreHorizontal, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Step, Substep } from '@/types';
import { format } from 'date-fns';

interface StepCardProps {
  step: Step;
  goalId: string;
  goalName?: string;
  createdBy?: string;
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
  goalName,
  createdBy,
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
        <CardHeader className="p-6 pb-3">
          <div className="flex flex-col gap-4">
            {/* Title + Status + 3-dot menu */}
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight flex-1">
                {step.title}
              </h4>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={getStatusBadgeVariant(step.status)}>
                  {getStatusLabel(step.status)}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-[60]">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCheckIn(step.id);
                    }}>
                      Check-in
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onComplete(step.id);
                    }}>
                      Complete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(step.id);
                    }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onSkip(step.id);
                    }}>
                      Pause
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onBreakDown(step.id);
                    }}>
                      {hasSubsteps ? `View ${substepCount} substep${substepCount !== 1 ? 's' : ''}` : 'Break it down'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Due date */}
            {step.due_date && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due {formatDate(step.due_date)}
              </div>
            )}
            
            {/* Info icon */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-auto p-0 hover:bg-transparent"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">Info</span>
                </div>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-6 px-6">
          <CollapsibleContent className="space-y-4">
            {/* Description */}
            {(step.explainer || step.notes) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Description</p>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  {step.explainer || step.notes}
                </p>
              </div>
            )}
            
            {/* Goal name */}
            {goalName && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Goal</p>
                <p className="text-xs text-muted-foreground">{goalName}</p>
              </div>
            )}
            
            {/* Created by */}
            {createdBy && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Created by</p>
                <p className="text-xs text-muted-foreground">{createdBy}</p>
              </div>
            )}
            
            {/* Created date */}
            {step.created_at && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">Created</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(step.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
