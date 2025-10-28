import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, UserCheck, ChevronRight } from 'lucide-react';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
  isOwnGoal: boolean;
  isCreatedByMe: boolean;
  ownerName: string;
  creatorName: string;
  onCardClick: () => void;
  onChevronClick: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'activeGreen';
    case 'completed':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'planned':
      return 'planned';
    default:
      return 'default';
  }
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isOwnGoal,
  isCreatedByMe,
  ownerName,
  creatorName,
  onCardClick,
  onChevronClick
}) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow relative">
      <CardHeader className="px-4 pt-1 pb-1">
        <div className="flex justify-between items-center">
          <div className="flex-1 cursor-pointer pr-8" onClick={onCardClick}>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-sm capitalize">{goal.title}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getStatusColor(goal.status)}>
                  {goal.status === 'active' ? 'Active' : goal.status}
                </Badge>
                {goal.domain && ['school', 'work', 'health', 'life'].includes(goal.domain) && (
                  <Badge variant="category">{getDomainDisplayName(goal.domain)}</Badge>
                )}
                
                {!isOwnGoal && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    For {ownerName}
                  </Badge>
                )}
                {!isCreatedByMe && isOwnGoal && (
                  <Badge variant="outline" className="text-xs">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Created by {creatorName}
                  </Badge>
                )}
              </div>
              {goal.due_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due {formatDate(goal.due_date)}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onChevronClick();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-full transition-colors"
            aria-label="View goal details"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
    </Card>
  );
};
