import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Users, Calendar, Target } from 'lucide-react';
import { getDomainDisplayName } from '@/utils/domainUtils';
import type { Goal } from '@/types';

// Helper functions to map assessment scores to labels
const getExperienceLabel = (value: number): string => {
  const labels = {
    1: "Brand new to this",
    2: "Tried once or twice",
    3: "Some experience",
    4: "Pretty experienced",
    5: "Very experienced"
  };
  return labels[value as keyof typeof labels] || `${value}/5`;
};
const getConfidenceLabel = (value: number): string => {
  const labels = {
    1: "Not confident at all",
    2: "A little nervous",
    3: "Somewhat confident",
    4: "Pretty confident",
    5: "Very confident"
  };
  return labels[value as keyof typeof labels] || `${value}/5`;
};
const getHelpNeededLabel = (value: number): string => {
  const labels = {
    1: "Full help - do it for me",
    2: "A lot - step-by-step guidance",
    3: "Some help - available if stuck",
    4: "A little - just check my work",
    5: "No help - can do alone"
  };
  return labels[value as keyof typeof labels] || `${value}/5`;
};
const getSkillLevelDisplay = (assessment: any): {
  label: string;
  emoji: string;
} => {
  // Handle both camelCase and snake_case
  const level = assessment?.calculatedLevel || assessment?.calculated_level || 1;
  let label = assessment?.levelLabel || assessment?.level_label || '';

  // Convert snake_case to Title Case (e.g., 'early_learner' → 'Early Learner')
  if (label.includes('_')) {
    label = label.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // Ensure first letter is capitalized for camelCase labels
  if (label && !label.includes(' ')) {
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }
  const emojis = ['🌱', '📚', '🚀', '⭐', '🏆'];
  const emoji = emojis[level - 1] || '🌱';
  return {
    label: label || 'Beginner',
    emoji
  };
};

// Utility functions for formatting
const truncate = (text: string | undefined, maxLen: number) => {
  if (!text) return text;
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
};
const formatDisplayTime = (hhmm?: string) => {
  if (!hhmm) return '';
  const [H, M] = hhmm.split(':').map(Number);
  const period = H >= 12 ? 'PM' : 'AM';
  const hour12 = H % 12 || 12;
  return `${hour12}:${M.toString().padStart(2, '0')} ${period}`;
};
const abbreviateDays = (days: string[]) => {
  const dayAbbreviations: Record<string, string> = {
    'Monday': 'M',
    'Tuesday': 'Tu',
    'Wednesday': 'W',
    'Thursday': 'Th',
    'Friday': 'F',
    'Saturday': 'Sa',
    'Sunday': 'Su'
  };
  return days.map(d => dayAbbreviations[d] || d.substring(0, 2)).join(', ');
};

// Challenge areas for PM goals (matching wizard)
const challengeAreas = [{
  id: 'initiation',
  label: 'Just Starting',
  description: 'Initiation'
}, {
  id: 'attention',
  label: 'Staying Focused',
  description: 'Attention'
}, {
  id: 'time',
  label: 'Remembering',
  description: 'Time'
}, {
  id: 'planning',
  label: 'Knowing What\'s Next',
  description: 'Planning'
}];

// Helper to get context-aware prerequisite suggestions
function getPrerequisiteSuggestions(goalTitle: string, goalDomain?: string): string[] {
  const titleLower = goalTitle.toLowerCase();

  // Study/learning goals
  if (titleLower.includes('study') || titleLower.includes('homework') || titleLower.includes('read') || titleLower.includes('learn') || titleLower.includes('research')) {
    return ['Clear a quiet workspace', 'Charge laptop or gather materials', 'Set phone to Do Not Disturb'];
  }

  // Exercise/fitness goals
  if (titleLower.includes('exercise') || titleLower.includes('workout') || titleLower.includes('run') || titleLower.includes('walk') || titleLower.includes('gym') || goalDomain === 'health') {
    return ['Layout workout clothes the night before', 'Set out water bottle and shoes', 'Prepare gym bag'];
  }

  // Cooking/meal goals
  if (titleLower.includes('cook') || titleLower.includes('meal') || titleLower.includes('recipe') || titleLower.includes('dinner')) {
    return ['Check you have all ingredients', 'Clear counter space', 'Thaw frozen items in advance'];
  }

  // Creative/practice goals
  if (titleLower.includes('practice') || titleLower.includes('draw') || titleLower.includes('write') || titleLower.includes('paint') || titleLower.includes('instrument')) {
    return ['Set up materials in your workspace', 'Ensure instrument is tuned/charged', 'Clear space for creative work'];
  }

  // Cleaning/organizing goals
  if (titleLower.includes('clean') || titleLower.includes('organize') || titleLower.includes('tidy') || titleLower.includes('declutter')) {
    return ['Gather cleaning supplies', 'Have trash bags ready', 'Play motivating music'];
  }

  // Job/career goals
  if (titleLower.includes('interview') || titleLower.includes('resume') || titleLower.includes('job') || goalDomain === 'employment') {
    return ['Update resume with recent achievements', 'Prepare professional outfit', 'Research the company/role'];
  }

  // Social/communication goals
  if (titleLower.includes('call') || titleLower.includes('reach out') || titleLower.includes('contact') || titleLower.includes('friend')) {
    return ['Save their contact info', 'Note conversation topics', 'Find a quiet time/place'];
  }

  // Default generic suggestions
  return ['Prepare materials needed', 'Clear your workspace', 'Set a reminder'];
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
    return <div className="space-y-4">
        <div className="py-8 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">{goal.title}</h1>
          {goal.description && <p className="text-center text-muted-foreground mt-4">
              {goal.description}
            </p>}
          {goal.domain && <div className="mt-4 text-center">
              <Badge variant="secondary">{getDomainDisplayName(goal.domain)}</Badge>
            </div>}
          <Separator className="my-6" />
          <p className="text-center text-sm text-muted-foreground">
            View your practice steps in the <strong>Recommended Steps</strong> tab
          </p>
        </div>
      </div>;
  }

  // Detect if this is a PM goal
  const isPMGoal = wizardContext.goalType === 'progressive_mastery';

  // If goal has skill assessment data, use Commitment & Activation layout
  if (wizardContext.pmAssessment || wizardContext.pmSkillAssessment) {
    const assessment = wizardContext.pmAssessment || wizardContext.pmSkillAssessment;
    const {
      pmPracticePlan,
      pmHelper,
      selectedDays,
      customTime,
      timeOfDay
    } = wizardContext;

    // Get category label
    const categories = [{
      id: 'health',
      label: 'Health & Well Being'
    }, {
      id: 'education',
      label: 'Education - Academic Readiness'
    }, {
      id: 'employment',
      label: 'Employment'
    }, {
      id: 'independent_living',
      label: 'Independent Living'
    }, {
      id: 'social_skills',
      label: 'Social / Self-Advocacy'
    }, {
      id: 'postsecondary',
      label: 'Postsecondary Education'
    }, {
      id: 'fun_recreation',
      label: 'Fun & Recreation'
    }];
    const categoryLabel = categories.find(c => c.id === goal.domain)?.label;

    // Get motivation label
    const motivations = [{
      id: 'independence',
      label: 'To be more independent'
    }, {
      id: 'employment',
      label: 'For work or career'
    }, {
      id: 'social',
      label: 'To connect with others'
    }, {
      id: 'health',
      label: 'For my health'
    }, {
      id: 'education',
      label: 'For school or learning'
    }, {
      id: 'enjoyment',
      label: 'Because I enjoy it'
    }, {
      id: 'responsibility',
      label: 'It\'s my responsibility'
    }, {
      id: 'other',
      label: 'Other reason'
    }];
    const motivationLabel = wizardContext.goalMotivation ? motivations.find(m => m.id === wizardContext.goalMotivation)?.label || wizardContext.customMotivation : undefined;

    // Get goal type label
    const goalTypeLabel = isPMGoal ? 'Progressive Mastery' : 'Habit';

    // Format days of week
    const abbreviatedDays = selectedDays && selectedDays.length > 0 ? abbreviateDays(selectedDays) : undefined;
    return <div className="space-y-6">
        {/* Goal Title */}
        

          {/* Goal Summary - 2x2 Grid matching Commitment & Activation */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <span>Goal Summary</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skill Assessment - Always first */}
              <div className="rounded-2xl bg-pink-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
                <h4 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
                  Skill Assessment
                </h4>
                <div className="space-y-1.5">
                  <p className="text-base">
                    <span className="text-muted-foreground text-base">Starting Level:</span>{' '}
                    <span className="font-semibold">
                      {(() => {
                    const {
                      label,
                      emoji
                    } = getSkillLevelDisplay(assessment);
                    return `${label} ${emoji}`;
                  })()}
                    </span>
                  </p>
                  <p className="text-base">
                    <span className="text-muted-foreground text-base">Experience:</span>{' '}
                    <span className="font-medium">{getExperienceLabel(assessment.q1_experience)}</span>
                  </p>
                  <p className="text-base">
                    <span className="text-muted-foreground text-base">Confidence:</span>{' '}
                    <span className="font-medium">{getConfidenceLabel(assessment.q2_confidence)}</span>
                  </p>
                  <p className="text-base">
                    <span className="text-muted-foreground text-base">Help Needed:</span>{' '}
                    <span className="font-medium">{getHelpNeededLabel(assessment.q3_help_needed)}</span>
                  </p>
                </div>
              </div>

              {/* The Goal */}
              <div className="rounded-2xl bg-blue-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
                <h4 className="text-base font-semibold text-blue-700 mb-2">The Goal</h4>
                <div className="space-y-1.5">
                  <p className="text-base">
                    <span className="text-muted-foreground text-base">Goal:</span>{' '}
                    <span className="font-semibold">{goal.title}</span>
                  </p>
                  {categoryLabel && <p className="text-base">
                      <span className="text-muted-foreground text-base">Category:</span>{' '}
                      <span className="font-medium">{categoryLabel}</span>
                    </p>}
                  {motivationLabel && <p className="text-base">
                      <span className="text-muted-foreground text-base">Why:</span>{' '}
                      <span className="font-medium">{truncate(motivationLabel, 40)}</span>
                    </p>}
                  {goalTypeLabel && <p className="text-base">
                      <span className="text-muted-foreground text-base">Type:</span>{' '}
                      <span className="font-medium">{goalTypeLabel}</span>
                    </p>}
                </div>
              </div>

              {/* Challenges */}
              <div className="rounded-2xl bg-orange-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
                <h4 className="text-base font-semibold text-orange-700 mb-2">Challenges</h4>
                <div className="space-y-1.5">
                  {wizardContext.barriers?.priority1 && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">1st Priority:</span>{' '}
                      <span className="font-medium">
                        {challengeAreas.find(c => c.id === wizardContext.barriers.priority1)?.label || wizardContext.barriers.priority1}
                      </span>
                    </p>}
                  {wizardContext.barriers?.priority2 && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">2nd Priority:</span>{' '}
                      <span className="font-medium">
                        {challengeAreas.find(c => c.id === wizardContext.barriers.priority2)?.label || wizardContext.barriers.priority2}
                      </span>
                    </p>}
                  {wizardContext.barriers?.details && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Details:</span>{' '}
                      <span className="font-medium">{truncate(wizardContext.barriers.details, 50)}</span>
                    </p>}
                  {wizardContext.prerequisites && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Prerequisites:</span>{' '}
                      <span className="font-medium">
                        {wizardContext.prerequisites.ready ? 'Ready to start' : 'Need some things'}
                        {!wizardContext.prerequisites.ready && wizardContext.prerequisites.needs && ` - ${truncate(wizardContext.prerequisites.needs, 30)}`}
                      </span>
                    </p>}
                </div>
              </div>

              {/* Practice Schedule */}
              <div className="rounded-2xl bg-emerald-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
                <h4 className="text-base font-semibold text-emerald-700 mb-2">Practice Schedule</h4>
                <div className="space-y-1.5">
                  {(wizardContext.startDate || goal.start_date) && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Starts:</span>{' '}
                      <span className="font-medium">
                        {wizardContext.startDate ? new Date(wizardContext.startDate).toLocaleDateString('en-US') : new Date(goal.start_date).toLocaleDateString('en-US')}
                      </span>
                    </p>}
                  {wizardContext.endDate && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Ends:</span>{' '}
                      <span className="font-medium">{new Date(wizardContext.endDate).toLocaleDateString()}</span>
                    </p>}
                  {pmPracticePlan && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Frequency:</span>{' '}
                      <span className="font-medium">
                        {pmPracticePlan.smartStartAccepted && pmPracticePlan.startingFrequency !== pmPracticePlan.targetFrequency ? `Starting ${pmPracticePlan.startingFrequency}x/week` : `${pmPracticePlan.targetFrequency}x/week`}
                      </span>
                    </p>}
                  {abbreviatedDays && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Days:</span>{' '}
                      <span className="font-medium">{abbreviatedDays}</span>
                    </p>}
                  {pmPracticePlan?.startTime && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Practice Time:</span>{' '}
                      <span className="font-medium">{formatDisplayTime(pmPracticePlan.startTime)}</span>
                    </p>}
                  {pmPracticePlan?.sendAdvanceReminder && pmPracticePlan?.startTime && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Reminder:</span>{' '}
                      <span className="font-medium">10 min before ({(() => {
                    const [hours, minutes] = pmPracticePlan.startTime.split(':');
                    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
                    const reminderMinutes = totalMinutes >= 10 ? totalMinutes - 10 : totalMinutes + 1440 - 10;
                    const reminderHour = Math.floor(reminderMinutes / 60) % 24;
                    const reminderMin = reminderMinutes % 60;
                    const period = reminderHour >= 12 ? 'PM' : 'AM';
                    const displayHour = reminderHour % 12 || 12;
                    return `${displayHour}:${String(reminderMin).padStart(2, '0')} ${period}`;
                  })()})</span>
                    </p>}
                  {pmPracticePlan?.smartStartAccepted && pmPracticePlan.startingFrequency !== pmPracticePlan.targetFrequency && <p className="text-xs text-muted-foreground italic mt-2">
                      Smart Start: Building up to {pmPracticePlan.targetFrequency}x/week
                    </p>}
                </div>
              </div>

              {/* Learning Support */}
              <div className="rounded-2xl bg-purple-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
                <h4 className="text-base font-semibold text-purple-700 mb-2">Learning Support</h4>
                <div className="space-y-1.5">
                  {pmHelper && <>
                      <p className="text-sm">
                        <span className="text-muted-foreground text-sm">Learning:</span>{' '}
                        <span className="font-medium">
                          {pmHelper.helperId === 'none' ? 'Independently' : 'With support'}
                        </span>
                      </p>
                      {pmHelper.helperId !== 'none' && <>
                          {pmHelper.helperName && <p className="text-sm">
                              <span className="text-muted-foreground text-sm">Helper:</span>{' '}
                              <span className="font-medium">{pmHelper.helperName}</span>
                            </p>}
                          {pmHelper.supportTypes && <p className="text-sm">
                              <span className="text-muted-foreground text-sm">Relationship:</span>{' '}
                              <span className="font-medium capitalize">{pmHelper.supportTypes.replace(/_/g, ' ')}</span>
                            </p>}
                        </>}
                    </>}
                </div>
              </div>
            </div>
          </div>

        {/* Invite Supporter Button */}
        {onInviteSupporter && <Button onClick={onInviteSupporter} variant="outline" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Invite Teaching Helper
          </Button>}
      </div>;
  }

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
  const challenges = isPMGoal ? [] // PM goals use barriers instead
  : wizardContext.customChallenges ? [wizardContext.customChallenges] : wizardContext.challengeAreas || [];
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
  return <div className="space-y-6">
      {/* Goal Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight">{goal.title}</h1>

      {/* 2x2 Grid Summary (Matching Creation Flow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Skill Assessment - Always first if exists */}
        {wizardContext?.pmAssessment && <div className="rounded-2xl bg-pink-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                Skill Assessment
              </h4>
              <div className="space-y-1.5">
                <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Starting Level:</span>{' '}
                  <span className="font-semibold">
                    {(() => {
                const {
                  label,
                  emoji
                } = getSkillLevelDisplay(wizardContext.pmAssessment);
                return `${label} ${emoji}`;
              })()}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Experience:</span>{' '}
                  <span className="font-medium">{getExperienceLabel(wizardContext.pmAssessment.q1_experience)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Confidence:</span>{' '}
                  <span className="font-medium">{getConfidenceLabel(wizardContext.pmAssessment.q2_confidence)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Help Needed:</span>{' '}
                  <span className="font-medium">{getHelpNeededLabel(wizardContext.pmAssessment.q3_help_needed)}</span>
                </p>
              </div>
            </div>}

        {/* The Goal / Learning Goal */}
        <div className="rounded-2xl bg-blue-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">
              {isPMGoal ? 'Learning Goal' : 'The Goal'}
            </h4>
            <div className="space-y-1.5">
              {isPMGoal && wizardContext?.pmAssessment && <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Starting Level:</span>{' '}
                  <span className="font-semibold">
                    {wizardContext.pmAssessment.levelLabel} {['🌱', '📚', '🚀', '⭐', '🏆'][wizardContext.pmAssessment.calculatedLevel - 1]}
                  </span>
                </p>}
              {goal.domain && <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Category:</span>{' '}
                  <span className="font-medium">{getDomainDisplayName(goal.domain)}</span>
                </p>}
              {motivation && <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Why:</span>{' '}
                  <span className="font-medium">{motivation.length > 60 ? motivation.substring(0, 60) + '...' : motivation}</span>
                </p>}
            </div>
          </div>

        {/* Challenges */}
        <div className="rounded-2xl bg-orange-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
            <h4 className="text-sm font-semibold text-orange-700 mb-2">Challenges</h4>
            <div className="space-y-1.5">
              {wizardContext?.barriers ? <>
                  {wizardContext.barriers.priority1 && <p className="text-sm flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">1st</Badge>
                      <span className="capitalize">{wizardContext.barriers.priority1.replace(/_/g, ' ')}</span>
                    </p>}
                  {wizardContext.barriers.priority2 && <p className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">2nd</Badge>
                      <span className="capitalize">{wizardContext.barriers.priority2.replace(/_/g, ' ')}</span>
                    </p>}
                  {wizardContext.barriers.details && <p className="text-xs text-muted-foreground italic mt-1">
                      {wizardContext.barriers.details}
                    </p>}
                </> : challenges.length > 0 ? challenges.map((challenge: string, idx: number) => <p key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span className="capitalize">{challenge.replace(/_/g, ' ')}</span>
                  </p>) : <p className="text-sm text-muted-foreground italic">No challenges noted</p>}
              {wizardContext?.prerequisite && <p className="text-sm mt-2">
                  <span className="text-muted-foreground text-sm">Prerequisites:</span>{' '}
                  <span className="font-medium">{wizardContext.prerequisite}</span>
                </p>}
            </div>
          </div>

        {/* When & How Often / Practice Schedule */}
        <div className="rounded-2xl bg-emerald-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">
              {isPMGoal ? 'Practice Schedule' : 'When & How Often'}
            </h4>
            <div className="space-y-1.5">
              {wizardContext?.startDate && <p className="text-sm">
                  <span className="text-muted-foreground text-sm">Starts:</span>{' '}
                  <span className="font-medium">{formatStartDate()}</span>
                </p>}
              {isPMGoal && wizardContext?.pmPracticePlan ? <>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-sm">Practice:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmPracticePlan.startingFrequency}×/week
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-sm">Duration:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmPracticePlan.durationWeeks ? `${wizardContext.pmPracticePlan.durationWeeks} weeks` : 'Ongoing'}
                    </span>
                  </p>
                </> : <>
                  {wizardContext?.frequency && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Frequency:</span>{' '}
                      <span className="font-medium">{wizardContext.frequency}</span>
                    </p>}
                  {wizardContext?.selectedDays && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Days:</span>{' '}
                      <span className="font-medium">{wizardContext.selectedDays.join(', ')}</span>
                    </p>}
                  {wizardContext?.customTime && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Time:</span>{' '}
                      <span className="font-medium">{wizardContext.customTime}</span>
                    </p>}
                </>}
            </div>
          </div>

        {/* The Team / Learning Support */}
        <div className="rounded-2xl bg-purple-50/50 p-4 border-0 shadow-sm hover:shadow-md transition-shadow min-h-[160px]">
            <h4 className="text-sm font-semibold text-purple-700 mb-2">
              {isPMGoal ? 'Learning Support' : 'The Team'}
            </h4>
            <div className="space-y-1.5">
              {wizardContext?.pmHelper ? <>
                  <p className="text-sm">
                    <span className="text-muted-foreground text-sm">Mode:</span>{' '}
                    <span className="font-medium">
                      {wizardContext.pmHelper.helperId === 'none' ? 'Independent' : 'With helper'}
                    </span>
                  </p>
                  {wizardContext.pmHelper.helperName && wizardContext.pmHelper.helperId !== 'none' && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Helper:</span>{' '}
                      <span className="font-medium">{wizardContext.pmHelper.helperName}</span>
                    </p>}
                </> : <>
                  {wizardContext?.supportContext && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Working:</span>{' '}
                      <span className="font-medium capitalize">{wizardContext.supportContext.replace(/_/g, ' ')}</span>
                    </p>}
                  {wizardContext?.primarySupporterName && <p className="text-sm">
                      <span className="text-muted-foreground text-sm">Supporter:</span>{' '}
                      <span className="font-medium">{wizardContext.primarySupporterName}</span>
                    </p>}
                  {!wizardContext?.primarySupporterName && onInviteSupporter && <Button variant="outline" size="sm" className="w-full mt-2" onClick={onInviteSupporter}>
                      👉 Find a supporter
                    </Button>}
                </>}
            </div>
          </div>
      </div>
    </div>;
};