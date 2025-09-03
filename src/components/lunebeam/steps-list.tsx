import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  CheckCircle2,
  Clock,
  HelpCircle,
  X,
  AlertTriangle,
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
}

export const StepsList: React.FC<StepsListProps> = ({ 
  goal, 
  steps, 
  onStepsUpdate
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
  const queuedSteps = steps.filter(s => !visibleSteps.includes(s));

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

  const handleStepToggle = async (stepId: string, currentStatus: StepStatus) => {
    try {
      let newStatus: StepStatus;
      
      if (currentStatus === 'todo') {
        newStatus = 'doing';
      } else if (currentStatus === 'doing') {
        newStatus = 'done';
      } else {
        newStatus = 'todo';
      }

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
      if (newStatus === 'done') {
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

  const handleStepFeedback = async (stepId: string, feedbackType: 'tooBig' | 'confusing' | 'notRelevant') => {
    try {
      if (feedbackType === 'notRelevant') {
        // Hide the step
        const isTemp = stepId.startsWith('step_');
        
        if (isTemp) {
          const updatedSteps = steps.map(s => s.id === stepId ? { ...s, hidden: true } : s);
          onStepsUpdate(updatedSteps, goal);
        } else {
          const { step: updatedStep, goal: updatedGoal } = await stepsService.updateStep(stepId, {
            status: 'skipped'
          });
          
          const updatedSteps = steps.map(s => s.id === stepId ? updatedStep : s);
          onStepsUpdate(updatedSteps, updatedGoal);
        }
        
        toast({
          description: "Step hidden. No worries - everyone's path is different."
        });
      } else if (feedbackType === 'tooBig') {
        toast({
          title: "\"Too big\" feedback",
          description: "This step feels overwhelming. We'll help break it down into smaller, manageable pieces soon!"
        });
      } else if (feedbackType === 'confusing') {
        toast({
          title: "\"Confusing\" feedback", 
          description: "This step isn't clear. We'll work on making the instructions simpler and more specific!"
        });
      }
    } catch (error) {
      console.error('Failed to process feedback:', error);
      toast({
        title: 'Feedback not saved',
        description: 'Try again when you\'re ready',
        variant: 'destructive'
      });
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
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
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
          <p className="text-sm text-muted-foreground">AI-generated action items tailored to your goal. Click to mark progress, provide feedback, or get more help.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{doneSteps.length}/{actionableSteps.length} done</span>
            <span>•</span>
            <span>{progressPercent}%</span>
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

        {/* Steps list */}
        <div className="space-y-1">
          {(showingQueuedSteps ? steps.filter(s => (!s.type || s.type === 'action') && !s.hidden) : visibleSteps).map((step, index) => {
            const isBlocked = isStepBlocked(step);
            const precursorText = getPrecursorText(step);
            const isExpanded = expandedSteps.has(step.id);
            const hasNextStep = index < (showingQueuedSteps ? steps.filter(s => (!s.type || s.type === 'action') && !s.hidden).length - 1 : visibleSteps.length - 1);

            return (
              <div key={step.id} className="space-y-2">
                <div className={`flex items-center gap-3 p-4 border border-border rounded-lg transition-colors ${
                  isBlocked ? 'opacity-60' : 'hover:bg-muted/50'
                }`}>
                  {getStepIcon(step) && (
                    <button
                      onClick={() => !isBlocked && handleStepToggle(step.id, step.status)}
                      disabled={isBlocked}
                      className="flex-shrink-0"
                    >
                      {getStepIcon(step)}
                    </button>
                  )}
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-base ${step.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.title}
                      </span>
                      {isBlocked && (
                        <Badge variant="outline" className="text-xs">
                          Blocked
                        </Badge>
                      )}
                    </div>
                    
                    {step.notes && (
                      <p className="text-sm text-muted-foreground">
                        {step.notes}
                        {step.notes && step.notes.length > 80 && (
                          <button
                            onClick={() => toggleStepExpanded(step.id)}
                            className="ml-1 text-primary hover:underline"
                          >
                            More
                          </button>
                        )}
                      </p>
                    )}

                    {precursorText && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <ArrowDown className="h-3 w-3" />
                        {precursorText}
                      </div>
                    )}

                    {step.estimated_effort_min && (
                      <div className="text-xs text-muted-foreground">
                        About {step.estimated_effort_min} min
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                        <DropdownMenuItem onClick={() => toggleStepExpanded(step.id)}>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          More help
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStepFeedback(step.id, 'tooBig')}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Too big
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStepFeedback(step.id, 'confusing')}>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Confusing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStepFeedback(step.id, 'notRelevant')}>
                          <X className="h-4 w-4 mr-2" />
                          Not relevant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Dependency arrow connector */}
                {hasNextStep && (
                  <div className="flex justify-center">
                    <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent className="ml-8 p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">More help:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Try breaking this step into even smaller parts</li>
                          <li>• Set a timer for just 5 minutes to get started</li>
                          <li>• Ask someone for help if you get stuck</li>
                        </ul>
                        {step.estimated_effort_min && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Estimated time: {step.estimated_effort_min} minutes
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
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