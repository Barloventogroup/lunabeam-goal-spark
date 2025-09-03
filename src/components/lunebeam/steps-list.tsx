import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  AlertTriangle
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
  onOpenChat: () => void;
}

export const StepsList: React.FC<StepsListProps> = ({ 
  goal, 
  steps, 
  onStepsUpdate,
  onOpenChat 
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  // Calculate progress
  const actionableSteps = steps.filter(s => s.type === 'action' && !s.hidden);
  const doneSteps = actionableSteps.filter(s => s.status === 'done');
  const progressPercent = actionableSteps.length > 0 
    ? Math.round((doneSteps.length / actionableSteps.length) * 100) 
    : 0;

  // Get visible steps (first 5, ordered by dependencies and impact)
  const visibleSteps = getVisibleSteps(steps);
  const queuedSteps = steps.filter(s => !visibleSteps.includes(s));

  function getVisibleSteps(allSteps: Step[]): Step[] {
    const actionable = allSteps.filter(s => s.type === 'action' && !s.hidden);
    
    // Sort by: precursors first, then by impact/ease
    const sorted = actionable.sort((a, b) => {
      // Steps with no precursors first
      if (a.precursors.length === 0 && b.precursors.length > 0) return -1;
      if (a.precursors.length > 0 && b.precursors.length === 0) return 1;
      
      // Then by impact (higher first) and ease (easier first)
      const aScore = a.metadata.scoreImpact * 10 - a.metadata.scoreEase;
      const bScore = b.metadata.scoreImpact * 10 - b.metadata.scoreEase;
      return bScore - aScore;
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

      const { step: updatedStep, goal: updatedGoal } = await stepsService.updateStep(stepId, {
        status: newStatus
      });

      const updatedSteps = steps.map(s => s.id === stepId ? updatedStep : s);
      onStepsUpdate(updatedSteps, updatedGoal);

      // Check for unlocked dependencies
      if (newStatus === 'done') {
        const unlockedSteps = checkForUnlockedSteps(updatedSteps, stepId);
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
    return allSteps.filter(step => 
      step.precursors.includes(completedStepId) &&
      step.precursors.every(precursorId => 
        allSteps.find(s => s.id === precursorId)?.status === 'done'
      )
    );
  };

  const handleStepFeedback = async (stepId: string, feedbackType: 'tooBig' | 'confusing' | 'notRelevant') => {
    try {
      if (feedbackType === 'notRelevant') {
        // Hide the step
        const { step: updatedStep, goal: updatedGoal } = await stepsService.updateStep(stepId, {
          hidden: true
        });
        
        const updatedSteps = steps.map(s => s.id === stepId ? updatedStep : s);
        onStepsUpdate(updatedSteps, updatedGoal);
        
        toast({
          description: "Step hidden. No worries - everyone's path is different."
        });
      } else if (feedbackType === 'tooBig') {
        // TODO: Implement step splitting
        toast({
          description: "We'll help break this down into smaller steps soon!"
        });
      } else if (feedbackType === 'confusing') {
        // TODO: Implement explainer rewrite
        toast({
          description: "We'll work on making this clearer!"
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
    return step.precursors.some(precursorId => {
      const precursor = steps.find(s => s.id === precursorId);
      return precursor && precursor.status !== 'done';
    });
  };

  const getStepIcon = (step: Step) => {
    if (isStepBlocked(step)) {
      return <Circle className="h-5 w-5 text-muted-foreground opacity-50" />;
    }

    switch (step.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'doing':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPrecursorText = (step: Step): string | null => {
    const incompletePrecursors = step.precursors.filter(precursorId => {
      const precursor = steps.find(s => s.id === precursorId);
      return precursor && precursor.status !== 'done';
    });

    if (incompletePrecursors.length === 0) return null;

    const precursorTitles = incompletePrecursors.map(id => {
      const precursor = steps.find(s => s.id === id);
      return precursor?.title || 'Unknown step';
    });

    return `Unlocks after: ${precursorTitles.join(', ')}`;
  };

  if (visibleSteps.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Steps to get rolling</CardTitle>
          <Button variant="ghost" size="sm" onClick={onOpenChat}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <p className="text-muted-foreground">We'll start you with a few quick wins.</p>
            <Button 
              onClick={generateSteps}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate steps
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">Steps to get rolling</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{doneSteps.length}/{actionableSteps.length} done</span>
            <span>•</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenChat}>
          <MessageCircle className="h-4 w-4" />
        </Button>
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
        <div className="space-y-3">
          {visibleSteps.map((step) => {
            const isBlocked = isStepBlocked(step);
            const precursorText = getPrecursorText(step);
            const isExpanded = expandedSteps.has(step.id);

            return (
              <div key={step.id} className="space-y-2">
                <div className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                  isBlocked ? 'opacity-60' : 'hover:bg-muted/50'
                }`}>
                  <button
                    onClick={() => !isBlocked && handleStepToggle(step.id, step.status)}
                    disabled={isBlocked}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {getStepIcon(step)}
                  </button>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${step.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {step.title}
                      </span>
                      {isBlocked && (
                        <Badge variant="outline" className="text-xs">
                          Blocked
                        </Badge>
                      )}
                    </div>
                    
                    {step.explainer && (
                      <p className="text-sm text-muted-foreground">
                        {step.explainer}
                        {step.explainer.length > 80 && (
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
                        <Clock className="h-3 w-3" />
                        {precursorText}
                      </div>
                    )}

                    {step.estimated_effort_min && (
                      <div className="text-xs text-muted-foreground">
                        About {step.estimated_effort_min} min
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
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

                {/* Expanded content */}
                {isExpanded && step.supportingLinks?.length > 0 && (
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent className="ml-8 p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">More help:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {step.supportingLinks.slice(0, 3).map((link, index) => (
                            <li key={index}>• {link}</li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </div>

        {/* Show more steps */}
        {queuedSteps.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
              Show next steps ({queuedSteps.length})
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};