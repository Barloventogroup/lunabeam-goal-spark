import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
        <CardContent className="py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center">{goal.title}</h1>
          {goal.description && (
            <p className="text-center text-muted-foreground mt-4">
              {goal.description}
            </p>
          )}
          {goal.domain && (
            <div className="mt-4 text-center">
              <Badge variant="secondary">{getDomainDisplayName(goal.domain)}</Badge>
            </div>
          )}
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            View your practice steps in the <strong>Recommended Steps</strong> tab
          </p>
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

  // Consolidated single-card summary
  return (
    <Card>
      <CardContent className="py-8 space-y-6">
        {/* Goal Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight">{goal.title}</h1>

        {/* PM Starting Level Section */}
        {isPMGoal && wizardContext.pmAssessment && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Your Starting Level</h2>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold">
                    {wizardContext.pmAssessment.levelLabel} {['🌱', '🌿', '🌳', '🎯', '⭐'][wizardContext.pmAssessment.calculatedLevel - 1]}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Experience:</span>
                    <span className="font-medium">
                      {wizardContext.pmAssessment.q1_experience === 1 ? 'Brand new' : 
                       wizardContext.pmAssessment.q1_experience === 2 ? 'Just started' :
                       wizardContext.pmAssessment.q1_experience === 3 ? 'Some experience' :
                       wizardContext.pmAssessment.q1_experience === 4 ? 'Pretty experienced' : 'Very experienced'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Confidence:</span>
                    <span className="font-medium">
                      {wizardContext.pmAssessment.q2_confidence === 1 ? 'Not confident' : 
                       wizardContext.pmAssessment.q2_confidence === 2 ? 'A little nervous' :
                       wizardContext.pmAssessment.q2_confidence === 3 ? 'Somewhat confident' :
                       wizardContext.pmAssessment.q2_confidence === 4 ? 'Pretty confident' : 'Very confident'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Help needed:</span>
                    <span className="font-medium">
                      {wizardContext.pmAssessment.q3_help_needed === 1 ? 'Full help' : 
                       wizardContext.pmAssessment.q3_help_needed === 2 ? 'A lot' :
                       wizardContext.pmAssessment.q3_help_needed === 3 ? 'Some help' :
                       wizardContext.pmAssessment.q3_help_needed === 4 ? 'A little' : 'No help'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Why it Matters Section */}
        {motivation && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h2 className="text-lg font-semibold">Why it Matters</h2>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
                <p className="text-base md:text-lg leading-relaxed">
                  {motivation}
                </p>
              </div>
            </div>
          </>
        )}

        {/* The Game Plan Section */}
        {(wizardContext.startDate || wizardContext.timeOfDay || wizardContext.customTime || prerequisite || isPMGoal) && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg font-semibold">The Game Plan</h2>
              </div>
              <div className="space-y-3">
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
              </div>
            </div>
          </>
        )}

        {/* Roadblocks Section */}
        {(challenges.length > 0 || (isPMGoal && wizardContext.barriers)) && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold text-destructive">Roadblocks</h2>
              </div>
              <div className="border-l-4 border-destructive pl-4">
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
                      <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted mt-2">
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
              </div>
            </div>
          </>
        )}

        {/* Support System Section */}
        <Separator />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Support System</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Who's on your team?</p>
          
          {hasSupport ? (
            <div className="space-y-1">
              {isPMGoal && wizardContext.pmHelper?.helperName ? (
                <>
                  <p className="text-sm text-muted-foreground">Learning with:</p>
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
        </div>
      </CardContent>
    </Card>
  );
};
