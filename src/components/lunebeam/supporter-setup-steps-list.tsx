import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Clock } from 'lucide-react';
import { supporterSetupStepsService } from '@/services/supporterSetupStepsService';
import type { SupporterSetupStep } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SupporterSetupStepsListProps {
  goalId: string;
  supporterId: string;
}

export const SupporterSetupStepsList: React.FC<SupporterSetupStepsListProps> = ({
  goalId,
  supporterId,
}) => {
  const [steps, setSteps] = useState<SupporterSetupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSteps();
  }, [goalId, supporterId]);

  const loadSteps = async () => {
    try {
      setLoading(true);
      const data = await supporterSetupStepsService.getSupporterSetupSteps(goalId, supporterId);
      setSteps(data);
    } catch (error) {
      console.error('Error loading supporter setup steps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load setup steps',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (stepId: string) => {
    try {
      const updatedStep = await supporterSetupStepsService.toggleSupporterSetupStepStatus(stepId);
      setSteps(steps.map(s => s.id === stepId ? updatedStep : s));
      
      toast({
        title: updatedStep.status === 'done' ? 'Step completed!' : 'Step marked as incomplete',
        description: updatedStep.title,
      });
    } catch (error) {
      console.error('Error toggling step:', error);
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: SupporterSetupStep['status']) => {
    const variants: Record<typeof status, { label: string; className: string; icon: React.ReactNode }> = {
      not_started: {
        label: 'Not Started',
        className: 'bg-muted text-muted-foreground',
        icon: <Circle className="h-3 w-3" />,
      },
      in_progress: {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        icon: <Clock className="h-3 w-3" />,
      },
      done: {
        label: 'Done',
        className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      skipped: {
        label: 'Skipped',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        icon: <Circle className="h-3 w-3" />,
      },
    };

    const variant = variants[status];
    return (
      <Badge className={`flex items-center gap-1 ${variant.className}`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const completedCount = steps.filter(s => s.status === 'done').length;
  const totalCount = steps.length;

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Setup Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Your Setup Checklist
              <Badge variant="outline" className="ml-2">
                {completedCount} / {totalCount}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Steps to help you support this goal
            </p>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors"
            >
              <Checkbox
                checked={step.status === 'done'}
                onCheckedChange={() => handleToggleStep(step.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`font-medium ${
                      step.status === 'done' ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {step.title}
                  </h4>
                  {getStatusBadge(step.status)}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                )}
                {step.estimated_effort_min && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimated time: {step.estimated_effort_min} min
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};
