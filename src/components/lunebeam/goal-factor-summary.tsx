import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, AlertCircle, Users, ClipboardList, Calendar, Tag } from 'lucide-react';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal } from '@/types';

interface GoalFactorSummaryProps {
  goal: Goal;
  wizardContext?: any;
}

export const GoalFactorSummary: React.FC<GoalFactorSummaryProps> = ({ goal, wizardContext }) => {
  // If no wizard context, show simplified summary
  if (!wizardContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {goal.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goal.description && (
            <p className="text-foreground leading-relaxed">{goal.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {goal.domain && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Category</span>
                <Badge variant="outline" className="capitalize">
                  {getDomainDisplayName(goal.domain)}
                </Badge>
              </div>
            )}
            {goal.due_date && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Due Date</span>
                <p className="text-sm text-foreground">
                  {new Date(goal.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground italic pt-4 border-t">
            This goal was created before detailed tracking was available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const motivation = wizardContext.customMotivation || wizardContext.goalMotivation;
  const challenges = wizardContext.customChallenges 
    ? [wizardContext.customChallenges]
    : wizardContext.challengeAreas || [];
  const hasSupport = wizardContext.primarySupporterName || wizardContext.supportContext;
  const hasTimeline = wizardContext.startDate || wizardContext.durationWeeks || wizardContext.frequencyPerWeek;
  const prerequisite = wizardContext.prerequisite;

  // Full structured summary with wizard context
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {goal.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Motivation */}
        {motivation && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Why I want this
              </span>
            </div>
            <p className="text-foreground leading-relaxed pl-6">
              {motivation}
            </p>
          </div>
        )}

        {/* Challenges */}
        {challenges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Challenges to overcome
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {challenges.map((challenge: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs capitalize">
                  {challenge.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Divider before Quick Facts */}
        {(hasSupport || hasTimeline || goal.domain) && (
          <>
            <Separator className="my-6" />

            {/* Quick Facts Grid */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Quick Facts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-6">
                {/* Support */}
                {hasSupport && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium">Support</span>
                    </div>
                    {wizardContext.primarySupporterName && (
                      <p className="text-sm text-foreground">
                        {wizardContext.primarySupporterName}
                      </p>
                    )}
                    {wizardContext.primarySupporterRole && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {wizardContext.primarySupporterRole.replace(/_/g, ' ')}
                      </p>
                    )}
                    {wizardContext.supportContext && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {wizardContext.supportContext.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {hasTimeline && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium">Timeline</span>
                    </div>
                    {wizardContext.frequencyPerWeek && (
                      <p className="text-sm text-foreground">
                        {wizardContext.frequencyPerWeek}x per week
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {wizardContext.durationWeeks && `${wizardContext.durationWeeks} weeks`}
                      {wizardContext.startDate && wizardContext.durationWeeks && ' • '}
                      {wizardContext.startDate && `Starts ${new Date(wizardContext.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                    {wizardContext.timeOfDay && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {wizardContext.customTime || wizardContext.timeOfDay.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Category */}
                {goal.domain && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-indigo-500">
                      <Tag className="h-4 w-4" />
                      <span className="text-xs font-medium">Category</span>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {getDomainDisplayName(goal.domain)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Prerequisites */}
        {prerequisite && (
          <>
            <Separator className="my-6" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">
                  Prerequisites
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed pl-6">
                {prerequisite}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
