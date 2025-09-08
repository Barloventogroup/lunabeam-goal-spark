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
  ArrowDown,
  Calendar
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
import { stepValidationService } from '@/services/stepValidationService';

// Utility function to format dates
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

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

  // Compute sorted actionable steps and split into visible + queued
  const sortedActionableSteps = steps
    .filter(s => (!s.type || s.type === 'action') && !s.hidden)
    .sort((a, b) => {
      // Parse week/session for main steps
      const aWeekMatch = a.title.match(/Week (\d+)/);
      const aSessionMatch = a.title.match(/Session (\d+)/);
      const bWeekMatch = b.title.match(/Week (\d+)/);
      const bSessionMatch = b.title.match(/Session (\d+)/);
      
      const aIsMainStep = aWeekMatch && aSessionMatch;
      const bIsMainStep = bWeekMatch && bSessionMatch;
      
      // Both are main steps - sort by week then session
      if (aIsMainStep && bIsMainStep) {
        const aWeek = parseInt(aWeekMatch[1]);
        const bWeek = parseInt(bWeekMatch[1]);
        if (aWeek !== bWeek) return aWeek - bWeek;
        
        const aSession = parseInt(aSessionMatch[1]);
        const bSession = parseInt(bSessionMatch[1]);
        return aSession - bSession;
      }
      
      // One is main, one is sub - use order_index to group them properly
      if (aIsMainStep && !bIsMainStep) {
        // Check if b should come right after a
        const aIndex = a.order_index ?? 0;
        const bIndex = b.order_index ?? Number.POSITIVE_INFINITY;
        return bIndex > aIndex && bIndex < aIndex + 10 ? -1 : aIndex - bIndex;
      }
      
      if (!aIsMainStep && bIsMainStep) {
        // Check if a should come right after b
        const aIndex = a.order_index ?? Number.POSITIVE_INFINITY;
        const bIndex = b.order_index ?? 0;
        return aIndex > bIndex && aIndex < bIndex + 10 ? 1 : aIndex - bIndex;
      }
      
      // Both are sub-steps - sort by order_index
      const aIndex = a.order_index ?? Number.POSITIVE_INFINITY;
      const bIndex = b.order_index ?? Number.POSITIVE_INFINITY;
      if (aIndex !== bIndex) return aIndex - bIndex;
      
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const visibleSteps = sortedActionableSteps.slice(0, 10);
  const queuedSteps = sortedActionableSteps.slice(10);

  // Group steps with their sub-steps
  const groupedSteps = visibleSteps.reduce((acc, step) => {
    const isMainStep = step.title.includes('Week ') && step.title.includes('Session');
    
    if (isMainStep) {
      acc.push({
        mainStep: step,
        subSteps: []
      });
    } else {
      // This is a sub-step, find its parent main step
      const lastGroup = acc[acc.length - 1];
      if (lastGroup) {
        lastGroup.subSteps.push(step);
      } else {
        // No main step found, treat as standalone
        acc.push({
          mainStep: step,
          subSteps: []
        });
      }
    }
    
    return acc;
  }, [] as Array<{ mainStep: Step; subSteps: Step[] }>);

  const queuedGroupedSteps = queuedSteps.reduce((acc, step) => {
    const isMainStep = step.title.includes('Week ') && step.title.includes('Session');
    
    if (isMainStep) {
      acc.push({
        mainStep: step,
        subSteps: []
      });
    } else {
      const lastGroup = acc[acc.length - 1];
      if (lastGroup) {
        lastGroup.subSteps.push(step);
      } else {
        acc.push({
          mainStep: step,
          subSteps: []
        });
      }
    }
    
    return acc;
  }, [] as Array<{ mainStep: Step; subSteps: Step[] }>);

  const handleMarkComplete = async (stepId: string) => {
    try {
      // Validate step completion first
      const validation = await stepValidationService.validateStepCompletion(stepId, steps, goal);
      
      if (!validation.canComplete) {
        const suggestions = validation.blockedBy 
          ? stepValidationService.getNextStepSuggestions(validation.blockedBy)
          : [];
        
        toast({
          title: 'Hold on a moment! 🤔',
          description: validation.friendlyMessage || validation.reason || 'This step cannot be completed yet.',
          variant: 'destructive',
        });
        
        // Show suggestions if available
        if (suggestions.length > 0) {
          setTimeout(() => {
            toast({
              title: 'Here\'s what to do next:',
              description: suggestions.join(' • '),
              duration: 8000,
            });
          }, 2000);
        }
        return;
      }

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
          title: "Awesome! You unlocked the next step! 🎉",
          description: `"${unlockedSteps[0].title}" is now ready for you.`,
        });
      } else {
        toast({
          title: "Step completed! 🌟",
          description: "You're building great momentum. Keep it up!"
        });
      }
    } catch (error) {
      console.error('Failed to update step:', error);
      toast({
        title: 'Oops, something hiccupped! 😅',
        description: 'No worries - just try marking that step complete again.',
        variant: 'destructive'
      });
    }
  };

  // Helper function to check if all sub-steps are completed
  const areAllSubStepsCompleted = (subSteps: Step[]): boolean => {
    return subSteps.length === 0 || subSteps.every(subStep => subStep.status === 'done');
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
    // Check if step has incomplete dependencies
    if (step.dependency_step_ids && step.dependency_step_ids.length > 0) {
      const incompleteDependencies = step.dependency_step_ids
        .map(depId => steps.find(s => s.id === depId))
        .filter(depStep => depStep && depStep.status !== 'done');
      
      if (incompleteDependencies.length > 0) {
        return true;
      }
    }

    // Check week progression
    const currentWeekMatch = step.title.match(/Week (\d+)/i);
    if (currentWeekMatch) {
      const currentWeek = parseInt(currentWeekMatch[1]);
      const previousStepsIncomplete = steps.some(s => {
        const weekMatch = s.title.match(/Week (\d+)/i);
        if (!weekMatch) return false;
        
        const stepWeek = parseInt(weekMatch[1]);
        return stepWeek < currentWeek && s.is_required && s.status !== 'done' && s.status !== 'skipped';
      });
      
      if (previousStepsIncomplete) {
        return true;
      }
    }

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
                <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
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
                 <TableRow className="border-b border-border">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead className="w-20">Due</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {(showingQueuedSteps ? [...groupedSteps, ...queuedGroupedSteps] : groupedSteps).map((group, groupIndex) => {
                const { mainStep, subSteps } = group;
                const isBlocked = isStepBlocked(mainStep);
                const precursorText = getPrecursorText(mainStep);
                const isExpanded = expandedSteps.has(mainStep.id);
                const allSubStepsCompleted = areAllSubStepsCompleted(subSteps);

                return (
                  <React.Fragment key={mainStep.id}>
                     {/* Main step row */}
                     <TableRow className={`border-b border-border ${isBlocked ? 'opacity-60' : 'hover:bg-muted/50'} cursor-pointer`}>
                       <TableCell className="p-2 w-8">
                         {(subSteps.length > 0 || mainStep.explainer || mainStep.notes) && (
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => toggleStepExpanded(mainStep.id)}
                             className="text-muted-foreground hover:text-foreground p-1 h-auto"
                           >
                             {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                           </Button>
                         )}
                       </TableCell>
                       
                        <TableCell className="p-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${mainStep.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {mainStep.title.replace(/^Day\s+\d+:\s*/i, '')}
                              </span>
                              {isBlocked && (
                                <Badge variant="outline" className="text-xs">
                                  Blocked
                                </Badge>
                              )}
                              {subSteps.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {subSteps.filter(s => s.status === 'done').length}/{subSteps.length} sub-steps
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

                       <TableCell className="p-2">
                         {mainStep.due_date ? (
                           <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <Calendar className="h-3 w-3" />
                             <span>{formatDate(mainStep.due_date)}</span>
                           </div>
                         ) : (
                           <span className="text-xs text-muted-foreground">—</span>
                         )}
                       </TableCell>

                        <TableCell className="p-2 text-center">
                          {getStepIcon(mainStep)}
                        </TableCell>

                       <TableCell className="p-2">
                         <div className="flex items-center gap-2">
                           {mainStep.status !== 'done' && (
                             <Button
                               onClick={() => !isBlocked && handleMarkComplete(mainStep.id)}
                               disabled={isBlocked || (subSteps.length > 0 && !allSubStepsCompleted)}
                               className="h-7 px-3 text-xs rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors disabled:opacity-50"
                               variant="outline"
                               size="sm"
                             >
                               Mark Complete
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>

                     {/* Expanded content row - sub-steps cards or description */}
                     {isExpanded && (
                       <TableRow className="border-b border-border">
                         <TableCell></TableCell>
                         <TableCell colSpan={4} className="p-0 bg-muted/20">
                           {subSteps.length > 0 ? (
                             <div className="p-4">
                               {/* Main step description section */}
                               <div className="mb-6 pb-4 border-b border-border">
                                 <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">
                                   {(mainStep.explainer?.trim() || mainStep.notes?.trim() || "Here are the sub-steps to complete this main step.")}
                                 </p>
                                 <button
                                   onClick={() => handleNeedHelp(mainStep)}
                                   className="text-primary hover:text-primary/80 underline text-sm cursor-pointer bg-transparent border-none p-0"
                                 >
                                   Need more help?
                                 </button>
                               </div>
                               
                               {/* Google Flights style sub-steps cards */}
                               <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                                 {subSteps.map((subStep) => (
                                   <div
                                     key={subStep.id}
                                       className={`flex-shrink-0 w-80 border rounded-lg p-4 bg-background transition-all duration-200 ${
                                         subStep.status === 'done' 
                                           ? 'border-green-200 bg-green-50/50' 
                                           : 'border-border hover:border-primary/40'
                                       }`}
                                   >
                                     {/* Sub-step title */}
                                     <div className="flex items-center gap-2 mb-3">
                                       <h4 className={`text-sm font-medium ${
                                         subStep.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                                       }`}>
                                         {subStep.title}
                                       </h4>
                                       {subStep.status === 'done' && (
                                         <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                       )}
                                     </div>

                                     {/* Sub-step description */}
                                     <div className="mb-4 min-h-[60px]">
                                       <p className="text-xs text-muted-foreground leading-relaxed">
                                         {subStep.explainer?.trim() || subStep.notes?.trim() || "Complete this sub-step to move forward."}
                                       </p>
                                     </div>

                                     {/* Due date if present */}
                                     {subStep.due_date && (
                                       <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                                         <Calendar className="h-3 w-3" />
                                         <span>Due {formatDate(subStep.due_date)}</span>
                                       </div>
                                     )}

                                     {/* Mark complete button */}
                                     <div className="flex gap-2">
                                       {subStep.status !== 'done' ? (
                                         <Button
                                           onClick={() => handleMarkComplete(subStep.id)}
                                           className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                           size="sm"
                                         >
                                           Mark Complete
                                         </Button>
                                       ) : (
                                         <Button
                                           variant="outline"
                                           className="w-full h-8 text-xs border-green-200 text-green-700 cursor-default"
                                           size="sm"
                                           disabled
                                         >
                                           Completed
                                         </Button>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ) : (
                             /* Regular description for steps without sub-steps */
                             <div className="p-4">
                               <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                 {(mainStep.explainer?.trim() || mainStep.notes?.trim() || "We're here to support you! If you need more details about this step, just tap \"Need More Help\" and we'll provide personalized guidance to help you succeed.")}
                                 {"\n\n"}
                                 <button
                                   onClick={() => handleNeedHelp(mainStep)}
                                   className="text-primary hover:text-primary/80 underline text-sm cursor-pointer bg-transparent border-none p-0"
                                 >
                                   Need more help?
                                 </button>
                               </p>
                             </div>
                           )}
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