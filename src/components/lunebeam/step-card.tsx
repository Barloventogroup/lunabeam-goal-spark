import * as React from 'react';
import { Calendar, MoreHorizontal, Info, ClipboardCheck, CheckCircle2, Pencil, PauseCircle, Split } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const getStatusBadgeVariant = (status: string): "activeGreen" | "default" | "planned" | "secondary" | "outline" => {
  switch (status) {
    case 'done':
      return 'default';
    case 'in_progress':
      return 'activeGreen';
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
      return 'Completed';
    case 'in_progress':
      return 'Active';
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
        <CardHeader className="px-4 pt-1 pb-1">
          <div className="flex flex-col gap-1.5">
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
                  <DropdownMenuContent align="end" className="w-48 z-[60] border-0">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCheckIn(step.id);
                    }}>
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Check-in
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-30" />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onComplete(step.id);
                    }}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-30" />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(step.id);
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-30" />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onSkip(step.id);
                    }}>
                      <PauseCircle className="mr-2 h-4 w-4" />
                      Pause
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-30" />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onBreakDown(step.id);
                    }}>
                      <Split className="mr-2 h-4 w-4" />
                      {hasSubsteps ? `View ${substepCount} substep${substepCount !== 1 ? 's' : ''}` : 'Break it down'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Due date */}
            {step.due_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

        <CardContent className="p-0">
          <CollapsibleContent className="space-y-0 px-4 pb-3 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up duration-100">
            {/* Separator */}
            <Separator className="mb-3 opacity-30" />
            
            {/* Description */}
            {(step.explainer || step.notes) && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {step.explainer || step.notes}
                </p>
              </div>
            )}
            
            {/* Goal name */}
            {goalName && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Goal</p>
                <p className="text-sm text-muted-foreground">{goalName}</p>
              </div>
            )}
            
            {/* Created by */}
            {createdBy && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Created by</p>
                <p className="text-sm text-muted-foreground">{createdBy}</p>
              </div>
            )}
            
            {/* Created date */}
            {step.created_at && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Created</p>
                <p className="text-sm text-muted-foreground">
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
