import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, Calendar, Target } from 'lucide-react';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal } from '@/types';

// Helper to get context-aware prerequisite suggestions
function getPrerequisiteSuggestions(goalTitle: string, goalDomain?: string): string[] {
  const titleLower = goalTitle.toLowerCase();
  
  // Study/learning goals
  if (titleLower.includes('study') || titleLower.includes('homework') || 
      titleLower.includes('read') || titleLower.includes('learn') || 
      titleLower.includes('research')) {
    return [
      'Clear a quiet workspace',
      'Charge laptop or gather materials',
      'Set phone to Do Not Disturb'
    ];
  }
  
  // Exercise/fitness goals
  if (titleLower.includes('exercise') || titleLower.includes('workout') || 
      titleLower.includes('run') || titleLower.includes('walk') || 
      titleLower.includes('gym') || goalDomain === 'health') {
    return [
      'Layout workout clothes the night before',
      'Set out water bottle and shoes',
      'Prepare gym bag'
    ];
  }
  
  // Cooking/meal goals
  if (titleLower.includes('cook') || titleLower.includes('meal') || 
      titleLower.includes('recipe') || titleLower.includes('dinner')) {
    return [
      'Check you have all ingredients',
      'Clear counter space',
      'Thaw frozen items in advance'
    ];
  }
  
  // Creative/practice goals
  if (titleLower.includes('practice') || titleLower.includes('draw') || 
      titleLower.includes('write') || titleLower.includes('paint') || 
      titleLower.includes('instrument')) {
    return [
      'Set up materials in your workspace',
      'Ensure instrument is tuned/charged',
      'Clear space for creative work'
    ];
  }
  
  // Cleaning/organizing goals
  if (titleLower.includes('clean') || titleLower.includes('organize') || 
      titleLower.includes('tidy') || titleLower.includes('declutter')) {
    return [
      'Gather cleaning supplies',
      'Have trash bags ready',
      'Play motivating music'
    ];
  }
  
  // Job/career goals
  if (titleLower.includes('interview') || titleLower.includes('resume') || 
      titleLower.includes('job') || goalDomain === 'employment') {
    return [
      'Update resume with recent achievements',
      'Prepare professional outfit',
      'Research the company/role'
    ];
  }
  
  // Social/communication goals
  if (titleLower.includes('call') || titleLower.includes('reach out') || 
      titleLower.includes('contact') || titleLower.includes('friend')) {
    return [
      'Save their contact info',
      'Note conversation topics',
      'Find a quiet time/place'
    ];
  }
  
  // Default generic suggestions
  return [
    'Prepare materials needed',
    'Clear your workspace',
    'Set a reminder'
  ];
}

// Motivation ID to display label mapping
const motivationLabels: Record<string, string> = {
  'confidence': 'Confidence',
  'future_skill': 'Future Skill',
  'tangible_reward': 'Tangible Reward',
  'accountability': 'Accountability',
  'personal_growth': 'Personal Growth'
};

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

  // Detect if this is a PM goal
  const isPMGoal = wizardContext.goalType === 'progressive_mastery' || wizardContext.pmAssessment;

  // Format motivation display
  const formatMotivation = (): string => {
    const categoryId = wizardContext.goalMotivation;
    const customText = wizardContext.customMotivation;
    
    // If we have custom text
    if (customText) {
      // If we also have a category, show both
      if (categoryId && motivationLabels[categoryId]) {
        return `${motivationLabels[categoryId]}. ${customText}`;
      }
      // Otherwise just custom text
      return customText;
    }
    
    // Fallback: show formatted category or raw value
    if (categoryId && motivationLabels[categoryId]) {
      return motivationLabels[categoryId];
    }
    
    // Last resort: show whatever we have
    return categoryId || '';
  };

  const motivation = formatMotivation();
  
  // Handle challenges differently for PM vs Habit goals
  const challenges = isPMGoal 
    ? [] // PM goals use barriers instead
    : (wizardContext.customChallenges 
        ? [wizardContext.customChallenges]
        : wizardContext.challengeAreas || []);
  
  const hasSupport = wizardContext.primarySupporterName || wizardContext.supportContext || wizardContext.pmHelper?.helperName;
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

      {/* Card 2b: Skill Level (PM goals only) */}
      {isPMGoal && wizardContext.pmAssessment && (
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Your Starting Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-2">
                <p className="text-2xl font-bold">
                  {wizardContext.pmAssessment.levelLabel} {['🌱', '🌿', '🌳', '🎯', '⭐'][wizardContext.pmAssessment.calculatedLevel - 1]}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience:</span>
                  <span className="font-medium">
                    {wizardContext.pmAssessment.q1_experience === 1 ? 'Brand new' : 
                     wizardContext.pmAssessment.q1_experience === 2 ? 'Just started' :
                     wizardContext.pmAssessment.q1_experience === 3 ? 'Some experience' :
                     wizardContext.pmAssessment.q1_experience === 4 ? 'Pretty experienced' : 'Very experienced'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">
                    {wizardContext.pmAssessment.q2_confidence === 1 ? 'Not confident' : 
                     wizardContext.pmAssessment.q2_confidence === 2 ? 'A little nervous' :
                     wizardContext.pmAssessment.q2_confidence === 3 ? 'Somewhat confident' :
                     wizardContext.pmAssessment.q2_confidence === 4 ? 'Pretty confident' : 'Very confident'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Help needed:</span>
                  <span className="font-medium">
                    {wizardContext.pmAssessment.q3_help_needed === 1 ? 'Full help' : 
                     wizardContext.pmAssessment.q3_help_needed === 2 ? 'A lot' :
                     wizardContext.pmAssessment.q3_help_needed === 3 ? 'Some help' :
                     wizardContext.pmAssessment.q3_help_needed === 4 ? 'A little' : 'No help'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: The Game Plan */}
      {(wizardContext.startDate || wizardContext.timeOfDay || wizardContext.customTime || prerequisite || isPMGoal) && (
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
            {isPMGoal && wizardContext.pmSchedule && (
              <>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Practice:</span>
                  <p className="text-base font-medium">
                    Start {wizardContext.pmSchedule.startingFrequency}×/week → Building to {wizardContext.pmSchedule.targetFrequency}×/week
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Duration:</span>
                  <p className="text-base font-medium">{wizardContext.pmSchedule.durationWeeks} weeks</p>
                </div>
              </>
            )}
            {!isPMGoal && (wizardContext.timeOfDay || wizardContext.customTime) && (
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
                  <div className="space-y-1.5 mt-2">
                    <p className="text-xs font-medium text-muted-foreground">💭 Consider:</p>
                    {getPrerequisiteSuggestions(goal.title, goal.domain).map((suggestion, idx) => (
                      <p key={idx} className="flex items-start gap-2 text-xs">
                        <span>•</span>
                        <span>{suggestion}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 4: Roadblocks */}
      {(challenges.length > 0 || (isPMGoal && wizardContext.barriers)) && (
        <Card className="border-l-4 border-destructive shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="h-5 w-5" />
              Roadblocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Challenges you might face:</p>
            {isPMGoal && wizardContext.barriers ? (
              <div className="space-y-3">
                {wizardContext.barriers.priority1 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive" className="mt-0.5">1st</Badge>
                    <span className="capitalize">{wizardContext.barriers.priority1.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {wizardContext.barriers.priority2 && (
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">2nd</Badge>
                    <span className="capitalize">{wizardContext.barriers.priority2.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {wizardContext.barriers.details && (
                  <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted">
                    {wizardContext.barriers.details}
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {challenges.map((challenge: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span className="capitalize">{challenge.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
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
              {isPMGoal && wizardContext.pmHelper?.helperName ? (
                <>
                  <p className="text-sm text-muted-foreground">Learning:</p>
                  <p className="font-medium text-base">{wizardContext.pmHelper.helperName}</p>
                  {wizardContext.pmHelper.supportTypes && (
                    <p className="text-sm text-muted-foreground capitalize">
                      Support: {wizardContext.pmHelper.supportTypes.join(', ').replace(/_/g, ' ')}
                    </p>
                  )}
                </>
              ) : (
                <>
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
                </>
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
