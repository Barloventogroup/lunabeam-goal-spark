import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Target, Clock } from 'lucide-react';
import { smartSchedulingService } from '@/services/smartSchedulingService';

interface MilestoneNotificationsProps {
  onNavigateToGoal?: (goalId: string) => void;
}

export const MilestoneNotifications: React.FC<MilestoneNotificationsProps> = ({
  onNavigateToGoal
}) => {
  const [upcomingMilestones, setUpcomingMilestones] = useState<Array<{
    goalId: string;
    milestone: {
      id: string;
      steps: any[];
      dueDate: string;
      title: string;
    };
  }>>([]);

  useEffect(() => {
    loadUpcomingMilestones();
  }, []);

  const loadUpcomingMilestones = async () => {
    try {
      const milestones = await smartSchedulingService.getUpcomingMilestones();
      setUpcomingMilestones(milestones);
    } catch (error) {
      console.error('Failed to load milestone notifications:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (upcomingMilestones.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Upcoming Milestones</h3>
        <Badge variant="secondary" className="text-xs">
          3 days ahead
        </Badge>
      </div>

      {upcomingMilestones.map(({ goalId, milestone }) => (
        <Card key={`${goalId}-${milestone.id}`} className="border-l-4 border-l-primary/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                {milestone.title}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {formatDate(milestone.dueDate)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <Clock className="inline h-4 w-4 mr-1" />
                {milestone.steps.length} steps due in 3 days
              </div>
              
              <div className="space-y-1">
                {milestone.steps.slice(0, 2).map((step, index) => (
                  <div key={index} className="text-sm bg-muted/50 p-2 rounded">
                    • {step.title}
                  </div>
                ))}
                {milestone.steps.length > 2 && (
                  <div className="text-xs text-muted-foreground pl-2">
                    +{milestone.steps.length - 2} more steps
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToGoal?.(goalId)}
                  className="flex-1"
                >
                  View Goal
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Open schedule adjustment dialog
                    console.log('Adjust schedule for milestone:', milestone.id);
                  }}
                  className="text-xs"
                >
                  Adjust Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};