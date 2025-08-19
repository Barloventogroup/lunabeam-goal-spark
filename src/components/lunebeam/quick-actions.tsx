import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Plus, Award, Clock } from 'lucide-react';

interface QuickActionsProps {
  onCheckinClick: () => void;
  onAddGoalClick: () => void;
  onRewardsClick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCheckinClick,
  onAddGoalClick,
  onRewardsClick,
}) => {
  const getCheckinStatus = () => {
    // Mock logic for check-in readiness
    const hasActiveGoals = true; // Would check actual goals
    const lastCheckin = new Date(); // Would get from store
    const hoursSinceLastCheckin = 8; // Mock calculation
    
    if (hoursSinceLastCheckin >= 24) {
      return { status: 'ready', label: 'Check-in Ready!', variant: 'default' as const };
    } else if (hoursSinceLastCheckin >= 18) {
      return { status: 'upcoming', label: 'Check-in Soon', variant: 'secondary' as const };
    } else {
      return { status: 'done', label: 'Checked In Today', variant: 'outline' as const };
    }
  };

  const checkinStatus = getCheckinStatus();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Actions</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Check-in Ready */}
        <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
          checkinStatus.status === 'ready' ? 'border-primary/50 bg-primary/5' : ''
        }`} onClick={onCheckinClick}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  checkinStatus.status === 'ready' ? 'bg-primary/10 text-primary' : 'bg-muted'
                }`}>
                  {checkinStatus.status === 'done' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{checkinStatus.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {checkinStatus.status === 'ready' && 'Share your progress and reflections'}
                    {checkinStatus.status === 'upcoming' && 'Check-in available in a few hours'}
                    {checkinStatus.status === 'done' && 'Great job staying on track!'}
                  </div>
                </div>
              </div>
              {checkinStatus.status === 'ready' && (
                <Badge variant="default">Ready</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Add Goal */}
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={onAddGoalClick}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="font-medium mb-1">Add Goal</div>
                <div className="text-xs text-muted-foreground">Start something new</div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={onRewardsClick}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-2">
                  <Award className="h-5 w-5" />
                </div>
                <div className="font-medium mb-1">Rewards</div>
                <div className="text-xs text-muted-foreground">View achievements</div>
                <Badge variant="secondary" className="mt-1 text-xs">3 new</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};