import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Goal, Step, StepStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { stepsService } from '@/services/goalsService';

interface StepsListProps {
  goal: Goal;
  steps: Step[];
  onStepsUpdate: (steps: Step[], goal: Goal) => void;
  onOpenStepChat?: (step: Step) => void;
}

export const StepsList: React.FC<StepsListProps> = ({ 
  goal, 
  steps, 
  onStepsUpdate,
  onOpenStepChat
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showingQueuedSteps, setShowingQueuedSteps] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Calculate progress
  const actionableSteps = steps.filter(s => 
    (!s.type || s.type === 'action') && !s.hidden && s.status !== 'skipped'
  );
  const doneSteps = actionableSteps.filter(s => s.status === 'done');
  const progressPercent = actionableSteps.length > 0 
    ? Math.round((doneSteps.length / actionableSteps.length) * 100) 
    : 0;

  // Get visible steps (first 5, ordered by dependencies and impact)
  const visibleSteps = getVisibleSteps(steps);
  const queuedSteps = steps.filter(s => 
    (!s.type || s.type === 'action') && !s.hidden && !visibleSteps.includes(s)
  );

  function getVisibleSteps(allSteps: Step[]): Step[] {
    const actionable = allSteps.filter(s => 
      (!s.type || s.type === 'action') && !s.hidden
    );
    
    // Sort by: required steps first, then by order_index
    const sorted = actionable.sort((a, b) => {
      // Required steps first
      if (a.is_required && !b.is_required) return -1;
      if (!a.is_required && b.is_required) return 1;
      
      // Then by order_index (if available)
      if (a.order_index !== undefined && b.order_index !== undefined) {
        return a.order_index - b.order_index;
      }
      
      // Fallback to creation time
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return sorted.slice(0, 5);
  }

  const handleMarkComplete = async (stepId: string) => {
    try {
      const newStatus: StepStatus = 'done';
      const isTemp = stepId.startsWith('step_');

      let stepsAfter: Step[] = steps;
      if (isTemp) {
        stepsAfter = steps.map(s => s.id === stepId ? { ...s, status: newStatus } as Step : s);
        onStepsUpdate(stepsAfter, goal);
      } else {
        const { step: updatedStep, goal: updatedGoal } = await stepsService.updateStep(stepId, {
          status: newStatus
        });
        stepsAfter = steps.map(s => s.id === stepId ? updatedStep : s);
        onStepsUpdate(stepsAfter, updatedGoal);
      }

      // Check for unlocked dependencies
      const unlockedSteps = checkForUnlockedSteps(stepsAfter, stepId);
      if (unlockedSteps.length > 0) {
        toast({
          title: "Nice! Next step is ready.",
          description: `${unlockedSteps[0].title} is now available.`,
        });
      } else {
        toast({
          description: "Step done! You're making great progress 🎉"
        });
      }
    } catch (error) {
      console.error('Failed to update step:', error);
      toast({
        title: 'Something got stuck',
        description: 'Mind trying that step update again?',
        variant: 'destructive'
      });
    }
  };

  const checkForUnlockedSteps = (allSteps: Step[], completedStepId: string): Step[] => {
    // For now, database steps don't have complex dependency logic
    return [];
  };

  const handleNeedHelp = (step: Step) => {
    if (onOpenStepChat) {
      onOpenStepChat(step);
    }
  };

  const generateSteps = async () => {
    if (generating) return;
    
    setGenerating(true);
    try {
      // TODO: Implement AI step generation
      toast({
        description: "Step generation coming soon! For now, you can add steps manually."
      });
    } catch (error) {
      console.error('Failed to generate steps:', error);
      toast({
        title: 'Couldn\'t generate steps',
        description: 'Give it another try when you\'re ready',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const isStepBlocked = (step: Step): boolean => {
    // For database steps, we don't have complex precursor logic yet
    return false;
  };

  const getStepIcon = (step: Step) => {
    if (isStepBlocked(step)) {
      return null; // No icon for blocked steps
    }

    switch (step.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'doing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return null; // No icon for todo steps
    }
  };

  const hasDependencies = (step: Step, allSteps: Step[]): boolean => {
    return step.dependency_step_ids && step.dependency_step_ids.length > 0;
  };

  const getPrecursorText = (step: Step): string | null => {
    if (hasDependencies(step, steps)) {
      const dependencyCount = step.dependency_step_ids?.length || 0;
      return `Requires ${dependencyCount} other step${dependencyCount > 1 ? 's' : ''}`;
    }
    return null;
  };

    if (steps.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recommended steps</CardTitle>
            <p className="text-sm text-muted-foreground">AI-generated action items tailored to your goal. Click to mark progress, provide feedback, or get more help.</p>
          </CardHeader>
          <CardContent className="py-6">
            <p className="text-muted-foreground mb-4">We're preparing a few quick wins for you…</p>
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold text-foreground">Recommended steps</CardTitle>
          <p className="text-sm text-muted-foreground">Here's a short list of steps and things to keep in mind as you work on your goal.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {actionableSteps.length === 0 ? 'No actionable steps' : `${doneSteps.length}/${actionableSteps.length} done`}
            </span>
            {actionableSteps.length > 0 && (
              <>
                <span>•</span>
                <span>{progressPercent}%</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Step</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showingQueuedSteps ? [...visibleSteps, ...queuedSteps] : visibleSteps).map((step, index) => {
                const isBlocked = isStepBlocked(step);
                const precursorText = getPrecursorText(step);
                const isExpanded = expandedSteps.has(step.id);

                return (
                  <React.Fragment key={step.id}>
                    {/* Main step row */}
                    <TableRow className={`${isBlocked ? 'opacity-60' : 'hover:bg-muted/50'} cursor-pointer`}>
                      <TableCell className="p-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleStepExpanded(step.id)}
                          className="text-muted-foreground hover:text-foreground p-1 h-auto"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      
                      <TableCell className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${step.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {step.title.replace(/^Day\s+\d+:\s*/i, '')}
                            </span>
                            {isBlocked && (
                              <Badge variant="outline" className="text-xs">
                                Blocked
                              </Badge>
                            )}
                          </div>

                          {precursorText && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <ArrowDown className="h-3 w-3" />
                              {precursorText}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          {getStepIcon(step)}
                        </div>
                      </TableCell>

                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          {step.status !== 'done' && (
                            <Button
                              onClick={() => !isBlocked && handleMarkComplete(step.id)}
                              disabled={isBlocked}
                              className="h-8 px-4 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                              variant="outline"
                              size="sm"
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded content row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell colSpan={3} className="p-3 border-t">
                          <div className="pl-4">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {(step.explainer?.trim() || step.notes?.trim() || "We're here to support you! If you need more details about this step, just tap \"Need More Help\" and we'll provide personalized guidance to help you succeed.")}
                              {"\n\n"}
                              <button
                                onClick={() => handleNeedHelp(step)}
                                className="text-blue-600 hover:text-blue-800 underline text-sm cursor-pointer bg-transparent border-none p-0 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Need more help?
                              </button>
                            </p>
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

        {/* Show more steps */}
        {queuedSteps.length > 0 && !showingQueuedSteps && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={() => setShowingQueuedSteps(true)}
            >
              Show next steps ({queuedSteps.length})
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Show fewer steps */}
        {showingQueuedSteps && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={() => setShowingQueuedSteps(false)}
            >
              Show fewer steps
              <ChevronUp className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};