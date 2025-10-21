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

  // Consolidated single-card summary with 2x2 grid
  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        {/* Goal Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight">{goal.title}</h1>

        {/* PM Skill Assessment (if PM goal with assessment) */}
        {isPMGoal && wizardContext?.pmAssessment && (
          <div className="rounded-2xl bg-purple-50/50 p-4 border border-gray-200 mb-4">
            <h4 className="text-sm font-semibold text-purple-700 mb-3">Skill Assessment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Experience:</span>{' '}
                  <span className="font-medium">
                    {['Brand new', 'Tried once/twice', 'Some experience', 'Pretty experienced', 'Very experienced'][wizardContext.pmAssessment.q1_experience - 1]}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Confidence:</span>{' '}
                  <span className="font-medium">
                    {['Not confident', 'A little nervous', 'Somewhat confident', 'Pretty confident', 'Very confident'][wizardContext.pmAssessment.q2_confidence - 1]}
                  </span>
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Help Needed:</span>{' '}
                  <span className="font-medium">
                    {['Full help', 'A lot', 'Some help', 'A little', 'No help'][wizardContext.pmAssessment.q3_help_needed - 1]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2x2 Grid Summary (Matching Creation Flow) */}
        <div className="grid grid-cols-2 gap-3">
          {/* The Goal / Learning Goal */}
          <div className="rounded-2xl bg-blue-50/50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">
              {isPMGoal ? 'Learning Goal' : 'The Goal'}
            </h4>
            <div className="space-y-1.5">
              {isPMGoal && wizardContext?.pmAssessment && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Starting Level:</span>{' '}
                  <span className="font-semibold">
                    {wizardContext.pmAssessment.levelLabel} {['🌱', '🌿', '🌳', '🎯', '⭐'][wizardContext.pmAssessment.calculatedLevel - 1]}
                  </span>
                </p>
              )}
              {goal.domain && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Category:</span>{' '}
                  <span className="font-medium">{getDomainDisplayName(goal.domain)}</span>
                </p>
              )}
              {motivation && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Why:</span>{' '}
                  <span className="font-medium">{motivation.length > 60 ? motivation.substring(0, 60) + '...' : motivation}</span>
                </p>
              )}
            </div>
          </div>

          {/* Challenges */}
          <div className="rounded-2xl bg-orange-50/50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-orange-700 mb-2">Challenges</h4>
            <div className="space-y-1.5">
              {isPMGoal && wizardContext?.barriers ? (
                <>
                  {wizardContext.barriers.priority1 && (
                    <p className="text-sm flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">1st</Badge>
                      <span className="capitalize">{wizardContext.barriers.priority1.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  {wizardContext.barriers.priority2 && (
                    <p className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">2nd</Badge>
                      <span className="capitalize">{wizardContext.barriers.priority2.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  {wizardContext.barriers.details && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {wizardContext.barriers.details}
                    </p>
                  )}
                </>
              ) : challenges.length > 0 ? (
                challenges.map((challenge: string, idx: number) => (
                  <p key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span className="capitalize">{challenge.replace(/_/g, ' ')}</span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No challenges noted</p>
              )}
              {wizardContext?.prerequisite && (
                <p className="text-sm mt-2">
                  <span className="text-muted-foreground text-xs">Prerequisites:</span>{' '}
                  <span className="font-medium">{wizardContext.prerequisite}</span>
                </p>
              )}
            </div>
          </div>

          {/* When & How Often / Practice Schedule */}
          <div className="rounded-2xl bg-emerald-50/50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">
              {isPMGoal ? 'Practice Schedule' : 'When & How Often'}
            </h4>
            <div className="space-y-1.5">
              {wizardContext?.startDate && (
                <p className="text-sm">
                  <span className="text-muted-foreground text-xs">Starts:</span>{' '}
                  <span className="font-medium">{formatStartDate()}</span>
                </p>
              )}
              {isPMGoal && wizardContext?.pmPracticePlan ? (
                <>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-xs">Practice:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmPracticePlan.startingFrequency}×/week
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-xs">Duration:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmPracticePlan.durationWeeks ? `${wizardContext.pmPracticePlan.durationWeeks} weeks` : 'Ongoing'}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  {wizardContext?.frequency && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Frequency:</span>{' '}
                      <span className="font-medium">{wizardContext.frequency}</span>
                    </p>
                  )}
                  {wizardContext?.selectedDays && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Days:</span>{' '}
                      <span className="font-medium">{wizardContext.selectedDays.join(', ')}</span>
                    </p>
                  )}
                  {wizardContext?.customTime && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Time:</span>{' '}
                      <span className="font-medium">{wizardContext.customTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* The Team / Learning Support */}
          <div className="rounded-2xl bg-purple-50/50 p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-purple-700 mb-2">
              {isPMGoal ? 'Learning Support' : 'The Team'}
            </h4>
            <div className="space-y-1.5">
              {isPMGoal && wizardContext?.pmHelper ? (
                <>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-xs">Mode:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmHelper.helperId === 'none' ? 'Independent' : 'With helper'}
                    </span>
                  </p>
                  {wizardContext.pmHelper.helperName && wizardContext.pmHelper.helperId !== 'none' && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Helper:</span>{' '}
                      <span className="font-medium">{wizardContext.pmHelper.helperName}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  {wizardContext?.supportContext && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Working:</span>{' '}
                      <span className="font-medium capitalize">{wizardContext.supportContext.replace(/_/g, ' ')}</span>
                    </p>
                  )}
                  {wizardContext?.primarySupporterName && (
                    <p className="text-sm">
                      <span className="text-muted-foreground text-xs">Supporter:</span>{' '}
                      <span className="font-medium">{wizardContext.primarySupporterName}</span>
                    </p>
                  )}
                  {!wizardContext?.primarySupporterName && onInviteSupporter && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2"
                      onClick={onInviteSupporter}
                    >
                      👉 Find a supporter
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
