import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, Calendar } from 'lucide-react';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal } from '@/types';

interface GoalFactorSummaryProps {
  goal: Goal;
  wizardContext?: any;
  onInviteSupporter?: () => void;
}

export const GoalFactorSummary: React.FC<GoalFactorSummaryProps> = ({ 
  goal, 
  wizardContext,
  onInviteSupporter 
}) => {
  // If no wizard context, show simplified summary
  if (!wizardContext) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold">{goal.title}</h1>
          {goal.description && (
            <p className="text-center text-muted-foreground mt-4">
              {goal.description}
            </p>
          )}
          <div className="text-center text-sm text-muted-foreground italic pt-6 border-t mt-6">
            This goal was created before detailed tracking was available.
          </div>
        </CardContent>
      </Card>
    );
  }

  const motivation = wizardContext.customMotivation || wizardContext.goalMotivation;
  const challenges = wizardContext.customChallenges 
    ? [wizardContext.customChallenges]
    : wizardContext.challengeAreas || [];
  const hasSupport = wizardContext.primarySupporterName || wizardContext.supportContext;
  const prerequisite = wizardContext.prerequisite;

  // Format start date
  const formatStartDate = () => {
    if (!wizardContext.startDate) return null;
    const date = new Date(wizardContext.startDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time display
  const formatTimeDisplay = () => {
    const parts = [];
    if (wizardContext.customTime) {
      parts.push(wizardContext.customTime);
    } else if (wizardContext.timeOfDay) {
      parts.push(wizardContext.timeOfDay.replace(/_/g, ' '));
    }
    if (wizardContext.frequencyPerWeek) {
      parts.push('Daily');
    }
    return parts.join(' ');
  };

  // Full structured summary with 5-card layout
  return (
    <div className="space-y-4">
      {/* Card 1: Goal Summary */}
      <Card>
        <CardContent className="py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{goal.title}</h1>
        </CardContent>
      </Card>

      {/* Card 2: Why it Matters */}
      {motivation && (
        <Card className="bg-primary/5 dark:bg-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">💡</span>
              Why it Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base md:text-lg leading-relaxed">
              {motivation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Card 3: The Game Plan */}
      {(wizardContext.startDate || wizardContext.timeOfDay || wizardContext.customTime || prerequisite) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              The Game Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wizardContext.startDate && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Starts:</span>
                <p className="text-base font-medium">{formatStartDate()}</p>
              </div>
            )}
            {(wizardContext.timeOfDay || wizardContext.customTime) && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Time:</span>
                <p className="text-base font-medium capitalize">{formatTimeDisplay()}</p>
              </div>
            )}
            
            <div className="pt-2">
              <span className="text-sm font-medium text-muted-foreground block mb-2">Prerequisites:</span>
              {prerequisite ? (
                <p className="text-sm leading-relaxed">{prerequisite}</p>
              ) : (
                <div className="text-muted-foreground italic text-sm">
                  <p className="font-medium text-foreground mb-1">None set</p>
                  <p className="flex items-start gap-2">
                    <span className="text-base">💭</span>
                    <span>Consider simple prep like "Layout clothes the night before"</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 4: Roadblocks */}
      {challenges.length > 0 && (
        <Card className="border-l-4 border-destructive shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="h-5 w-5" />
              Roadblocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Challenges you might face:</p>
            <ul className="space-y-2">
              {challenges.map((challenge: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span className="capitalize">{challenge.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Card 5: Support System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Support System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Who's on your team?</p>
          
          {hasSupport ? (
            <div className="space-y-1">
              {wizardContext.primarySupporterName && (
                <p className="font-medium text-base">{wizardContext.primarySupporterName}</p>
              )}
              {wizardContext.primarySupporterRole && (
                <p className="text-sm text-muted-foreground capitalize">
                  {wizardContext.primarySupporterRole.replace(/_/g, ' ')}
                </p>
              )}
              {wizardContext.supportContext && (
                <p className="text-sm capitalize">
                  {wizardContext.supportContext.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Currently: <span className="font-medium text-foreground">Alone</span>
              </p>
              {onInviteSupporter && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onInviteSupporter}
                >
                  👉 Find a supporter
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
