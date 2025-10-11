import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goal Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goal.description && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
              <p className="text-foreground capitalize">{goal.description}</p>
            </div>
          )}
          
          {goal.domain && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Category</h4>
              <Badge variant="outline" className="capitalize">
                {getDomainDisplayName(goal.domain)}
              </Badge>
            </div>
          )}
          
          {goal.due_date && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Timeline</h4>
              <p className="text-foreground">
                Due: {new Date(goal.due_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground italic">
              This goal was created before detailed tracking was available. Edit the goal to add more structured information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full structured summary with wizard context
  return (
    <div className="space-y-4">
      {/* Motivation */}
      {(wizardContext.goalMotivation || wizardContext.customMotivation) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              {wizardContext.customMotivation || wizardContext.goalMotivation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Barriers & Challenges */}
      {(wizardContext.challengeAreas?.length > 0 || wizardContext.customChallenges) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Barriers & Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wizardContext.customChallenges ? (
              <p className="text-foreground">{wizardContext.customChallenges}</p>
            ) : (
              <ul className="space-y-2">
                {wizardContext.challengeAreas.map((challenge: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span className="text-foreground capitalize">{challenge.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Support System */}
      {(wizardContext.primarySupporterName || wizardContext.supportContext) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Support System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {wizardContext.primarySupporterName && (
              <div>
                <span className="text-sm text-muted-foreground">Primary Supporter: </span>
                <span className="font-medium text-foreground">{wizardContext.primarySupporterName}</span>
                {wizardContext.primarySupporterRole && (
                  <span className="text-muted-foreground ml-1">
                    ({wizardContext.primarySupporterRole.replace(/_/g, ' ')})
                  </span>
                )}
              </div>
            )}
            {wizardContext.supportContext && (
              <div>
                <span className="text-sm text-muted-foreground">Support Type: </span>
                <span className="text-foreground capitalize">{wizardContext.supportContext.replace(/_/g, ' ')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prerequisites */}
      {wizardContext.prerequisite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-purple-500" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{wizardContext.prerequisite}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline & Frequency */}
      {(wizardContext.startDate || wizardContext.durationWeeks || wizardContext.frequencyPerWeek) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              Timeline & Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {wizardContext.startDate && (
              <div>
                <span className="text-sm text-muted-foreground">Start Date: </span>
                <span className="font-medium text-foreground">
                  {new Date(wizardContext.startDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            {wizardContext.timeOfDay && (
              <div>
                <span className="text-sm text-muted-foreground">Time: </span>
                <span className="text-foreground capitalize">
                  {wizardContext.customTime || wizardContext.timeOfDay.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            {wizardContext.frequencyPerWeek && (
              <div>
                <span className="text-sm text-muted-foreground">Frequency: </span>
                <span className="text-foreground">{wizardContext.frequencyPerWeek} times per week</span>
              </div>
            )}
            {wizardContext.durationWeeks && (
              <div>
                <span className="text-sm text-muted-foreground">Duration: </span>
                <span className="text-foreground">{wizardContext.durationWeeks} weeks</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal Type/Category */}
      {(wizardContext.goalType || goal.domain) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-500" />
              Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {goal.domain && (
                <Badge variant="outline" className="capitalize">
                  {getDomainDisplayName(goal.domain)}
                </Badge>
              )}
              {wizardContext.goalType && wizardContext.goalType !== goal.domain && (
                <Badge variant="secondary" className="capitalize">
                  {wizardContext.goalType.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
