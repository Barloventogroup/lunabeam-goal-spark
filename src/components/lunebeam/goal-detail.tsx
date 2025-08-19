import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Target, 
  Flag,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Pause,
  Edit3,
  Trash2,
  SkipForward
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { goalsService, stepsService } from '@/services/goalsService';
import type { Goal, Step } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface GoalDetailProps {
  goalId: string;
  onNavigate: (view: string, goalId?: string) => void;
}

export const GoalDetail: React.FC<GoalDetailProps> = ({ goalId, onNavigate }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoalData = async () => {
    try {
      const [goalData, stepsData] = await Promise.all([
        goalsService.getGoal(goalId),
        stepsService.getSteps(goalId)
      ]);
      
      setGoal(goalData);
      setSteps(stepsData);
    } catch (error) {
      console.error('Failed to load goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load goal. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return;

    try {
      const { step, goal: updatedGoal } = await stepsService.createStep(goalId, {
        title: newStepTitle.trim(),
        is_required: true
      });

      setSteps([...steps, step]);
      setGoal(updatedGoal);
      setNewStepTitle('');
      
      toast({
        description: 'Step added successfully!'
      });
    } catch (error) {
      console.error('Failed to add step:', error);
      toast({
        title: 'Error',
        description: 'Failed to add step. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'done' ? 'not_started' : 'done';
      const { step: updatedStep, goal: updatedGoal } = await stepsService.updateStep(stepId, {
        status: newStatus
      });

      setSteps(steps.map(s => s.id === stepId ? updatedStep : s));
      setGoal(updatedGoal);

      if (newStatus === 'done') {
        toast({
          description: 'Step done. Nice progress!'
        });
      }
    } catch (error) {
      console.error('Failed to update step:', error);
      toast({
        title: 'Error',
        description: 'Failed to update step. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleSkipStep = async (stepId: string) => {
    try {
      const { step: updatedStep, goal: updatedGoal } = await stepsService.skipStep(stepId);
      setSteps(steps.map(s => s.id === stepId ? updatedStep : s));
      setGoal(updatedGoal);
      
      toast({
        description: 'Step skipped'
      });
    } catch (error) {
      console.error('Failed to skip step:', error);
      toast({
        title: 'Error',
        description: 'Failed to skip step. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const updatedGoal = await stepsService.deleteStep(stepId);
      setSteps(steps.filter(s => s.id !== stepId));
      setGoal(updatedGoal);
      
      toast({
        description: 'Step deleted'
      });
    } catch (error) {
      console.error('Failed to delete step:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete step. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'default';
      case 'paused': return 'secondary';
      case 'planned': return 'outline';
      default: return 'default';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-yellow-600" />;
      case 'in_progress':
        return <Pause className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading || !goal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('goals-list')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  const progressPct = goal.progress_pct || 0;
  const requiredSteps = steps.filter(s => s.is_required);
  const doneRequired = requiredSteps.filter(s => s.status === 'done');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('goals-list')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getStatusColor(goal.status)}>
              {goal.status}
            </Badge>
            <Badge variant={getPriorityColor(goal.priority)}>
              <Flag className="h-3 w-3 mr-1" />
              {goal.priority}
            </Badge>
            {goal.domain && (
              <Badge variant="outline">{goal.domain}</Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            {Math.round(progressPct)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {doneRequired.length} of {requiredSteps.length} steps done
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {doneRequired.length}/{requiredSteps.length} required steps
              </span>
            </div>
            <Progress value={progressPct} className="h-3" />
          </div>
          {goal.due_date && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Due {formatDate(goal.due_date)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {goal.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{goal.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Step Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add step"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
            />
            <Button onClick={handleAddStep} disabled={!newStepTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Steps List */}
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No steps yet. Add one tiny step to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <button
                    onClick={() => handleToggleStep(step.id, step.status)}
                    className="flex-shrink-0"
                  >
                    {getStepIcon(step)}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${step.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {step.title}
                      </span>
                      {!step.is_required && (
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      )}
                      {step.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(step.due_date)}
                        </span>
                      )}
                    </div>
                    {step.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.notes}
                      </p>
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
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {step.status !== 'skipped' && (
                        <DropdownMenuItem onClick={() => handleSkipStep(step.id)}>
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteStep(step.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {goal.tags?.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {goal.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};