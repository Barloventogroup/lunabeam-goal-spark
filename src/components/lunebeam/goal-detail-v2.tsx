import React, { useEffect, useState } from 'react';
import { Calendar, MoreVertical, Trash2, CheckCircle2, UserPlus, Share2 } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { goalsService, stepsService } from '@/services/goalsService';
import { StepsList } from './steps-list';
import { StepsChat } from './steps-chat';
import { StepChatModal } from './step-chat-modal';
import { ProgressBar } from './progress-bar';
import { stepsGenerator } from '@/services/stepsGenerator';
import type { Goal, Step, GoalProgress } from '@/types';

interface GoalDetailV2Props {
  goalId: string;
  onBack: () => void;
}

export const GoalDetailV2: React.FC<GoalDetailV2Props> = ({ goalId, onBack }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showStepChat, setShowStepChat] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [chatStep, setChatStep] = useState<Step | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  const calculateProgress = (goalSteps: Step[]): GoalProgress => {
    const actionableSteps = goalSteps.filter(s => (!s.type || s.type === 'action') && !s.hidden && s.status !== 'skipped');
    const doneSteps = actionableSteps.filter(s => s.status === 'done');
    
    console.log('Goal progress calculation debug:', {
      totalSteps: goalSteps.length,
      actionableSteps: actionableSteps.length,
      doneSteps: doneSteps.length,
      actionableStepsDetails: actionableSteps.map(s => ({ id: s.id, title: s.title, status: s.status, type: s.type, hidden: s.hidden }))
    });
    
    return {
      done: doneSteps.length,
      actionable: actionableSteps.length,
      percent: actionableSteps.length > 0 ? Math.round((doneSteps.length / actionableSteps.length) * 100) : 0
    };
  };

  const loadGoalData = async () => {
    try {
      setLoading(true);
      const [goalData, stepsData] = await Promise.all([
        goalsService.getGoal(goalId),
        stepsService.getSteps(goalId)
      ]);

      if (goalData) {
        // Auto-generate steps if none exist
        let finalSteps = stepsData || [];
        
        if (!stepsData || stepsData.length === 0) {
          try {
            console.log('Generating steps for goal:', goalData.title);
            const generatedSteps = await stepsGenerator.generateSteps(goalData);
            
            // Save each generated step to the database
            const savedSteps: Step[] = [];
            for (const stepData of generatedSteps) {
              try {
                const { step } = await stepsService.createStep(goalData.id, {
                  title: stepData.title,
                  notes: stepData.explainer,
                  is_required: stepData.is_required,
                  estimated_effort_min: stepData.estimated_effort_min,
                  due_date: stepData.due_date,
                });
                savedSteps.push(step);
              } catch (error) {
                console.error('Failed to save generated step:', stepData.title, error);
              }
            }
            
            finalSteps = savedSteps;
            
            toast({
              description: "Generated helpful steps to get you started! 🎯"
            });
          } catch (error) {
            console.error('Failed to generate steps:', error);
          }
        }

        const progress = calculateProgress(finalSteps);
        setGoal({ ...goalData, progress });
        setSteps(finalSteps);
      } else {
        toast({
          title: "Goal not found",
          description: "This goal might have been deleted or you don't have access to it.",
          variant: "destructive",
        });
        onBack();
      }
    } catch (error) {
      console.error('Failed to load goal:', error);
      toast({
        title: "Failed to load goal",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepsUpdate = (updatedSteps: Step[], updatedGoal: Goal) => {
    const progress = calculateProgress(updatedSteps);
    setSteps(updatedSteps);
    setGoal({ ...updatedGoal, progress });
  };

  const handleOpenStepChat = (step: Step) => {
    setSelectedStep(step);
    setShowStepChat(true);
  };

  const handleStepChatUpdate = async (newSteps: Step[]) => {
    // Reload steps from database to get the latest data
    try {
      const updatedSteps = await stepsService.getSteps(goalId);
      const progress = calculateProgress(updatedSteps);
      setSteps(updatedSteps);
      if (goal) {
        setGoal({ ...goal, progress });
      }
    } catch (error) {
      console.error('Failed to reload steps:', error);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await goalsService.deleteGoal(goalId);
      toast({
        description: "Goal archived successfully."
      });
      onBack();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: "Failed to archive goal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDomainDisplayName = (domain: string): string => {
    const domainMap: Record<string, string> = {
      'school': 'Education - High School / Academic Readiness',
      'work': 'Employment',
      'health': 'Health & Well-Being',
      'life': 'Life Skills'
    };
    return domainMap[domain] || domain;
  };

  const sanitizeDescription = (text?: string): string => {
    if (!text) return '';
    let out = text.trim();
    
    // Fix frequency patterns
    out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+) times per week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+)x\/week/gi, '$1 times per week');
    
    // Fix double parentheses and nested structures
    out = out.replace(/\(\s*\([^)]+\)\s*\)/g, (match) => {
      const inner = match.replace(/^\(\s*\(/, '(').replace(/\)\s*\)$/, ')');
      return inner;
    });
    
    // Remove outer parentheses around trailing "with ..." clauses
    out = out.replace(/\.?\s*\((with [^)]+)\)\s*$/i, '. $1');
    
    // Fix awkward "to relax/enjoy" patterns
    out = out.replace(/to relax\/enjoy/gi, 'to relax and enjoy');
    
    // Fix standalone "with" clauses at the end
    out = out.replace(/\.\s*with\s+([A-Z])/g, ' with $1');
    
    // Fix double spaces and ensure proper spacing
    out = out.replace(/\s{2,}/g, ' ');
    out = out.replace(/\s*\.\s*\./g, '.');
    
    // Ensure single ending period
    out = out.replace(/\.+\s*$/, '.');
    
    return out;
  };

  if (loading || !goal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton onClick={onBack} />
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <BackButton onClick={onBack} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={getStatusColor(goal.status)}>
                {goal.status === 'active' ? 'In Progress' : goal.status}
              </Badge>
              {goal.domain && (
                <Badge variant="outline" className="capitalize">
                  {getDomainDisplayName(goal.domain)}
                </Badge>
              )}
              {goal.due_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">Due {formatDate(goal.due_date)}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {goal.progress && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {goal.progress.percent}%
              </div>
              <div className="text-sm text-muted-foreground">
                {goal.progress.done}/{goal.progress.actionable} done
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="bg-transparent hover:bg-gray-100 border-transparent">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border border-input shadow-lg z-50">
              <DropdownMenuItem onClick={() => {/* TODO: Open check-in modal */}}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Check In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Add buddy functionality */}}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Buddy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Share functionality */}}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {goal.status === 'completed' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive this goal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the goal to your archived goals. You can restore it later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteGoal}>
                        Archive Goal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Goal Info */}
      {goal.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{sanitizeDescription(goal.description)}</p>
          </CardContent>
        </Card>
      )}


      {/* Progress Bar */}
      {goal.progress && goal.progress.actionable > 0 && (
        <Card>
          <CardContent className="pt-6">
            <ProgressBar 
              progress={goal.progress}
              size="lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <StepsList 
        goal={goal}
        steps={steps}
        onStepsUpdate={handleStepsUpdate}
        onOpenStepChat={handleOpenStepChat}
      />

      {/* Step Chat Modal */}
      <StepChatModal
        isOpen={showStepChat}
        onClose={() => setShowStepChat(false)}
        step={selectedStep}
        goal={goal}
        onStepsUpdate={handleStepChatUpdate}
      />

      {/* Steps Chat */}
      <StepsChat 
        goal={goal}
        steps={steps}
        step={chatStep}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </div>
  );
};