import React from 'react';
import { Calendar, ChevronDown, CheckCircle2, Circle, Clock, Pause, MoreVertical, MessageSquare, Check, Edit, PauseCircle, Split } from 'lucide-react';
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
import { ScaffoldingStepCard } from './scaffolding-step-card';
import type { Step, Substep } from '@/types';
import { format } from 'date-fns';

interface StepCardProps {
  step: Step;
  goalId: string;
  scaffoldingSteps: Substep[];
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'skipped':
      return <Pause className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
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
  const completedScaffolding = scaffoldingSteps.filter(s => !!s.completed_at).length;
  const totalScaffolding = scaffoldingSteps.length;
  const hasScaffolding = totalScaffolding > 0;

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
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-base leading-tight flex-1">
              {step.title}
            </h4>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onCheckIn(step.id)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Check-in
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onComplete(step.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Set as complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(step.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSkip(step.id)}>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBreakDown(step.id)}>
                  <Split className="h-4 w-4 mr-2" />
                  Break it down
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            {step.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Due {formatDate(step.due_date)}
              </div>
            )}
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-3">
            {(step.explainer || step.notes) && (
              <div className="text-xs text-muted-foreground leading-relaxed break-words">
                {step.explainer || step.notes}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onBreakDown(step.id)}
              className="w-full"
            >
              Need help?
            </Button>

            {hasScaffolding && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Broken down steps:</p>
                <div className="space-y-2">
                  {scaffoldingSteps.map((substep) => (
                    <ScaffoldingStepCard
                      key={substep.id}
                      step={substep}
                      onComplete={onScaffoldingComplete}
                      onBreakDown={onScaffoldingBreakDown}
                    />
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
