import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, ArrowRight, Check, Sparkles, Lightbulb, Calendar as CalendarIcon, Clock, Users, Heart, Home, Briefcase, GraduationCap, MessageSquare, Building, Star, PartyPopper, X, User, UserPlus, ChevronRight, Gift, Target, AlertCircle, Shield, HandHelping, Brain, CheckCircle2, ClipboardList } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { goalsService, stepsService } from '@/services/goalsService';
import { goalProposalsService } from '@/services/goalProposalsService';
import { supabase } from '@/integrations/supabase/client';
import { PermissionsService } from '@/services/permissionsService';
import { generateMicroStepsSmart, type MicroStep } from '@/services/microStepsGenerator';
import type { GoalDomain } from '@/types';
import { cleanStepTitle } from '@/utils/stepUtils';
import { SkillAssessmentWizard } from './skill-assessment-wizard';
import { progressiveMasteryService } from '@/services/progressiveMasteryService';
import { notificationsService } from '@/services/notificationsService';
import { addWeeks } from 'date-fns';
import { performSafetyCheck } from '@/services/safetyCheckService';
import { QuestionScreen } from './question-screen';
import { PMStep2_Motivation, PMStep3_Prerequisites, PMStep4_Barriers, PMStep5_Experience, PMStep6_Confidence, PMStep7_HelpNeeded, PMStep9_PracticePlan } from './pm-micro-steps';
interface RedesignedGoalsWizardProps {
  onComplete: (goalData: any) => void;
  onCancel: () => void;
  initialIndividualId?: string;
  isSupporter?: boolean;
}
interface SupportedIndividual {
  user_id: string;
  first_name: string;
  avatar_url?: string;
}

// Category definitions with icons, explanations, and detailed examples
const categories = [{
  id: 'health',
  title: 'Health & Well Being',
  icon: Heart,
  emoji: '🌱',
  description: 'Build healthy habits for mind and body',
  examples: 'Exercise, sleep better, eat well, manage stress',
  detailedExamples: ['Walk daily for 30 minutes', 'Stretch every morning', 'Sleep 8 hours per night', 'Drink more water', 'Practice meditation', 'Eat healthy meals']
}, {
  id: 'education',
  title: 'Education - High School / Academic Readiness',
  icon: GraduationCap,
  emoji: '📘',
  description: 'Academic skills and school success',
  examples: 'Study habits, homework, test prep, reading',
  detailedExamples: ['Complete homework daily', 'Study for 1 hour each evening', 'Read 30 minutes before bed', 'Take organized notes', 'Practice math problems', 'Prepare for upcoming tests']
}, {
  id: 'employment',
  title: 'Employment',
  icon: Briefcase,
  emoji: '💼',
  description: 'Job skills and career preparation',
  examples: 'Resume, interviews, work skills, networking',
  detailedExamples: ['Update resume weekly', 'Practice interview skills', 'Learn new software', 'Network with professionals', 'Apply for jobs daily', 'Develop work portfolio']
}, {
  id: 'independent_living',
  title: 'Independent Living',
  icon: Home,
  emoji: '🏠',
  description: 'Life skills for independence',
  examples: 'Cooking, cleaning, budgeting, transportation',
  detailedExamples: ['Cook a meal from scratch', 'Clean room', 'Track monthly budget', 'Learn public transportation', 'Do laundry independently', 'Grocery shopping']
}, {
  id: 'social_skills',
  title: 'Social / Self-Advocacy',
  icon: MessageSquare,
  emoji: '🗣️',
  description: 'Communication and relationships',
  examples: 'Making friends, speaking up, teamwork',
  detailedExamples: ['Start conversations with peers', 'Practice speaking up in meetings', 'Join a social group', 'Express needs clearly', 'Work on team projects', 'Build friendships']
}, {
  id: 'postsecondary',
  title: 'Postsecondary - Learning After High School',
  icon: Building,
  emoji: '🎓',
  description: 'College, trade school, or training prep',
  examples: 'College apps, study skills, career planning',
  detailedExamples: ['Research college programs', 'Complete application essays', 'Visit campus tours', 'Apply for scholarships', 'Develop study strategies', 'Plan career path']
}, {
  id: 'fun_recreation',
  title: 'Fun / Recreation',
  icon: PartyPopper,
  emoji: '🎉',
  description: 'Hobbies, interests, and enjoyment',
  examples: 'Sports, music, art, games, social activities',
  detailedExamples: ['Play guitar for 30 minutes', 'Paint or draw weekly', 'Join a sports team', 'Play board games with friends', 'Learn a new hobby', 'Attend social events']
}];

// Example goals interface and data
interface ExampleGoal {
  id: string;
  title: string;
  description: string;
  suggestedType: 'reminder' | 'progressive_mastery' | 'practice' | 'new_skill';
  categoryId: string;
}
interface FrequencySuggestion {
  frequency: number;
  rationale: string;
}
interface TeachingHelper {
  helperId: string | 'none';
  helperName: string;
  relationship: 'parent' | 'coach' | 'friend' | 'supporter';
}
const exampleGoalsByCategory: Record<string, ExampleGoal[]> = {
  health: [{
    id: 'walk-daily',
    title: 'Walk daily for 30 minutes',
    description: 'Build cardiovascular health and energy through regular walking',
    suggestedType: 'reminder',
    categoryId: 'health'
  }, {
    id: 'stretch-morning',
    title: 'Stretch every morning',
    description: 'Improve flexibility and reduce tension with daily stretching',
    suggestedType: 'reminder',
    categoryId: 'health'
  }, {
    id: 'sleep-8hours',
    title: 'Sleep 8 hours per night',
    description: 'Establish consistent sleep schedule for better rest',
    suggestedType: 'reminder',
    categoryId: 'health'
  }, {
    id: 'drink-water',
    title: 'Drink more water',
    description: 'Stay hydrated by tracking daily water intake',
    suggestedType: 'reminder',
    categoryId: 'health'
  }, {
    id: 'meditation',
    title: 'Practice meditation',
    description: 'Build mindfulness and reduce stress through daily meditation',
    suggestedType: 'progressive_mastery',
    categoryId: 'health'
  }, {
    id: 'healthy-meals',
    title: 'Eat healthy meals',
    description: 'Improve nutrition by planning and preparing balanced meals',
    suggestedType: 'reminder',
    categoryId: 'health'
  }],
  education: [{
    id: 'homework-daily',
    title: 'Complete homework daily',
    description: 'Stay on top of assignments with consistent daily work',
    suggestedType: 'reminder',
    categoryId: 'education'
  }, {
    id: 'study-evening',
    title: 'Study for 1 hour each evening',
    description: 'Build strong study habits through regular practice',
    suggestedType: 'reminder',
    categoryId: 'education'
  }, {
    id: 'read-bedtime',
    title: 'Read 30 minutes before bed',
    description: 'Improve reading skills and comprehension through daily practice',
    suggestedType: 'reminder',
    categoryId: 'education'
  }, {
    id: 'organized-notes',
    title: 'Take organized notes',
    description: 'Learn effective note-taking strategies for better retention',
    suggestedType: 'progressive_mastery',
    categoryId: 'education'
  }, {
    id: 'math-practice',
    title: 'Practice math problems',
    description: 'Strengthen math skills through regular problem-solving',
    suggestedType: 'reminder',
    categoryId: 'education'
  }, {
    id: 'test-prep',
    title: 'Prepare for upcoming tests',
    description: 'Develop effective test preparation strategies',
    suggestedType: 'practice',
    categoryId: 'education'
  }],
  employment: [{
    id: 'resume-weekly',
    title: 'Update resume weekly',
    description: 'Keep resume current with latest skills and experiences',
    suggestedType: 'reminder',
    categoryId: 'employment'
  }, {
    id: 'interview-skills',
    title: 'Practice interview skills',
    description: 'Build confidence through mock interviews and preparation',
    suggestedType: 'progressive_mastery',
    categoryId: 'employment'
  }, {
    id: 'learn-software',
    title: 'Learn new software',
    description: 'Expand technical skills by mastering new tools',
    suggestedType: 'new_skill',
    categoryId: 'employment'
  }, {
    id: 'network-professionals',
    title: 'Network with professionals',
    description: 'Build connections through regular professional interactions',
    suggestedType: 'reminder',
    categoryId: 'employment'
  }, {
    id: 'apply-jobs',
    title: 'Apply for jobs daily',
    description: 'Maintain consistent job search momentum',
    suggestedType: 'reminder',
    categoryId: 'employment'
  }, {
    id: 'work-portfolio',
    title: 'Develop work portfolio',
    description: 'Showcase skills and accomplishments professionally',
    suggestedType: 'new_skill',
    categoryId: 'employment'
  }],
  independent_living: [{
    id: 'cook-meal',
    title: 'Cook a meal from scratch',
    description: 'Learn to prepare complete meals independently',
    suggestedType: 'progressive_mastery',
    categoryId: 'independent_living'
  }, {
    id: 'clean-room',
    title: 'Clean room',
    description: 'Learn to clean and organize your room effectively',
    suggestedType: 'progressive_mastery',
    categoryId: 'independent_living'
  }, {
    id: 'track-budget',
    title: 'Track monthly budget',
    description: 'Develop financial awareness through budget tracking',
    suggestedType: 'reminder',
    categoryId: 'independent_living'
  }, {
    id: 'public-transport',
    title: 'Learn public transportation',
    description: 'Master navigating buses, trains, and routes independently',
    suggestedType: 'progressive_mastery',
    categoryId: 'independent_living'
  }, {
    id: 'laundry-independent',
    title: 'Do laundry independently',
    description: 'Learn the complete laundry process from start to finish',
    suggestedType: 'progressive_mastery',
    categoryId: 'independent_living'
  }, {
    id: 'grocery-shopping',
    title: 'Grocery shopping',
    description: 'Plan and execute grocery trips independently',
    suggestedType: 'progressive_mastery',
    categoryId: 'independent_living'
  }],
  social_skills: [{
    id: 'start-conversations',
    title: 'Start conversations with peers',
    description: 'Build social confidence by initiating friendly interactions',
    suggestedType: 'progressive_mastery',
    categoryId: 'social_skills'
  }, {
    id: 'speak-up-meetings',
    title: 'Practice speaking up in meetings',
    description: 'Develop self-advocacy skills in group settings',
    suggestedType: 'progressive_mastery',
    categoryId: 'social_skills'
  }, {
    id: 'join-social-group',
    title: 'Join a social group',
    description: 'Connect with others who share similar interests',
    suggestedType: 'new_skill',
    categoryId: 'social_skills'
  }, {
    id: 'express-needs',
    title: 'Express needs clearly',
    description: 'Learn to communicate wants and needs effectively',
    suggestedType: 'progressive_mastery',
    categoryId: 'social_skills'
  }, {
    id: 'team-projects',
    title: 'Work on team projects',
    description: 'Develop collaboration and teamwork skills',
    suggestedType: 'practice',
    categoryId: 'social_skills'
  }, {
    id: 'build-friendships',
    title: 'Build friendships',
    description: 'Strengthen social connections and relationships',
    suggestedType: 'practice',
    categoryId: 'social_skills'
  }],
  postsecondary: [{
    id: 'research-programs',
    title: 'Research college programs',
    description: 'Explore and compare educational options after high school',
    suggestedType: 'new_skill',
    categoryId: 'postsecondary'
  }, {
    id: 'application-essays',
    title: 'Complete application essays',
    description: 'Craft compelling personal statements for applications',
    suggestedType: 'new_skill',
    categoryId: 'postsecondary'
  }, {
    id: 'campus-tours',
    title: 'Visit campus tours',
    description: 'Experience potential schools firsthand',
    suggestedType: 'reminder',
    categoryId: 'postsecondary'
  }, {
    id: 'apply-scholarships',
    title: 'Apply for scholarships',
    description: 'Seek financial aid opportunities for education',
    suggestedType: 'reminder',
    categoryId: 'postsecondary'
  }, {
    id: 'study-strategies',
    title: 'Develop study strategies',
    description: 'Learn effective techniques for college-level learning',
    suggestedType: 'progressive_mastery',
    categoryId: 'postsecondary'
  }, {
    id: 'career-path',
    title: 'Plan career path',
    description: 'Map out educational and career goals',
    suggestedType: 'new_skill',
    categoryId: 'postsecondary'
  }],
  fun_recreation: [{
    id: 'play-guitar',
    title: 'Play guitar for 30 minutes',
    description: 'Build musical skills through regular practice',
    suggestedType: 'reminder',
    categoryId: 'fun_recreation'
  }, {
    id: 'paint-draw',
    title: 'Paint or draw weekly',
    description: 'Express creativity through visual art',
    suggestedType: 'reminder',
    categoryId: 'fun_recreation'
  }, {
    id: 'sports-team',
    title: 'Join a sports team',
    description: 'Participate in organized athletics and teamwork',
    suggestedType: 'new_skill',
    categoryId: 'fun_recreation'
  }, {
    id: 'board-games',
    title: 'Play board games with friends',
    description: 'Enjoy social gaming and strategic thinking',
    suggestedType: 'reminder',
    categoryId: 'fun_recreation'
  }, {
    id: 'new-hobby',
    title: 'Learn a new hobby',
    description: 'Explore and develop a completely new interest',
    suggestedType: 'new_skill',
    categoryId: 'fun_recreation'
  }, {
    id: 'social-events',
    title: 'Attend social events',
    description: 'Engage in community and social activities',
    suggestedType: 'reminder',
    categoryId: 'fun_recreation'
  }]
};

// Goal types
const goalTypes = [{
  id: 'reminder',
  label: 'New Habit',
  description: 'Remember to do something regularly'
}, {
  id: 'progressive_mastery',
  label: 'Progressive Mastery',
  description: 'Learn with increasing independence',
  icon: '🚀'
}];

// Experience levels
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

// Support contexts
const supportContexts = [{
  id: 'alone',
  label: 'Alone',
  description: 'Work on this independently'
}, {
  id: 'parent',
  label: 'With Parent',
  description: 'Parent/guardian helps'
}, {
  id: 'coach',
  label: 'With Coach',
  description: 'Coach or mentor guides'
}, {
  id: 'friend',
  label: 'With Friend',
  description: 'Friend or peer supports'
}];

// Frequency options
const frequencies = [{
  id: 'daily',
  label: 'Daily',
  value: 7
}, {
  id: 'weekdays',
  label: 'Weekdays only',
  value: 5
}, {
  id: 'three_times',
  label: '3 times per week',
  value: 3
}, {
  id: 'twice',
  label: '2 times per week',
  value: 2
}, {
  id: 'weekly',
  label: 'Once per week',
  value: 1
}];

// Time of day options
const timesOfDay = [{
  id: 'morning',
  label: 'Morning',
  description: '6-11 AM'
}, {
  id: 'afternoon',
  label: 'Afternoon',
  description: '12-5 PM'
}, {
  id: 'evening',
  label: 'Evening',
  description: '6-10 PM'
}, {
  id: 'custom',
  label: 'Custom time',
  description: 'Pick specific time'
}];

// Ally roles removed - simplified to just "supporter"

// Motivation options
const motivations = [{
  id: 'confidence',
  label: 'Confidence',
  description: 'Build self-belief and prove I can do it'
}, {
  id: 'future_skill',
  label: 'Future Skill',
  description: 'Prepare for what comes next in life'
}, {
  id: 'tangible_reward',
  label: 'Tangible Reward',
  description: 'Earn something specific I want'
}, {
  id: 'accountability',
  label: 'Accountability',
  description: 'Keep myself on track and committed'
}, {
  id: 'personal_growth',
  label: 'Personal Growth',
  description: 'Develop as a person and reach my potential'
}];

// Text configuration for different flows
const INDIVIDUAL_FLOW_TEXT = {
  step0: {
    subtitle: "Choose who will be working on this goal"
  },
  step1: {
    question: "What do you want to achieve?",
    subtitle: "Describe what you want to achieve and choose how you'll approach it"
  },
  step2: {
    subtitle: "Understanding your motivation helps us support you better"
  },
  step3: {
    question: "Are you fully equipped to start right now?",
    helperText: "If you're not sure, look at your space. Is there anything you'd have to find, clear, or buy before you can touch the work? If so, choose No.",
    options: {
      yes: {
        title: "Yes, I'm ready to go.",
        description: "I have everything I need to start"
      },
      no: {
        title: "No, I need to get one thing first.",
        description: "I need prep steps first"
      }
    },
    conditionalInput: {
      label: "What is the one thing missing/in the way?",
      placeholder: "e.g., guitar picks, clear desk space, permission to use kitchen"
    }
  },
  step4: {
    subtitle: "Select up to two"
  },
  step5: {
    subtitle: "start building the plan to crush this goal"
  },
  step6: {
    subtitle: "(It's great to have allies!)"
  },
  step7: {
    subtitle: "Add an additional motivation for you to complete this goal"
  },
  confirm: {
    subtitle: "Ready to start your goal? First review what we have so far. If everything looks good click Confirm Goal."
  }
};
const getSupporterFlowText = (name?: string) => ({
  step0: {
    subtitle: "Choose who will be working on this goal"
  },
  step1: {
    question: `What should ${name || 'they'} work on?`,
    subtitle: `Describe the specific action ${name || 'they'} need${name ? 's' : ''} to achieve. Be clear and concrete.`
  },
  step2: {
    subtitle: `Understanding ${name ? `${name}'s` : 'their'} motivation helps us support ${name || 'them'} better`
  },
  step3: {
    question: "Is the environment completely prepared? (Tools, space, permissions)",
    helperText: "If you're not sure, focus on the single non-negotiable item or space they need to begin. If that's missing, choose No.",
    options: {
      yes: {
        title: "Yes, all prerequisites are met.",
        description: name ? `${name} has everything needed to start` : "They have everything needed to start"
      },
      no: {
        title: "No, a structural setup is still missing.",
        description: name ? `${name} needs prep steps first` : "They need prep steps first"
      }
    },
    conditionalInput: {
      label: "What is the single most critical missing prerequisite?",
      placeholder: "e.g., keyboard, quiet study area, parent approval for gym membership"
    }
  },
  step4: {
    subtitle: `Select up to two areas that typically feel challenging for ${name || 'them'}`
  },
  step5: {
    subtitle: ""
  },
  step6: {
    subtitle: "(Having support makes a difference!)"
  },
  step7: {
    subtitle: `Add an additional motivation for ${name || 'them'} to complete this goal`
  },
  confirm: {
    subtitle: "Ready to assign this goal? Review the details below and click Confirm when ready."
  }
});
interface WizardData {
  // Step 0: Who is this for (supporters only)
  recipient: 'self' | 'other';
  supportedPersonId?: string;
  supportedPersonName?: string;
  isMyIdea?: boolean;

  // Step 1: Goal description
  goalTitle: string;
  category?: string;
  trackingMode?: 'habit' | 'skill' | 'state';

  // Step 2: Motivation (SHARED - free text, not dropdown)
  motivation?: string;

  // Step 3: Prerequisites (SHARED)
  prerequisites: {
    ready: boolean;
    needs?: string;
  };

  // Step 4: Barriers (SHARED, OPTIONAL)
  barriers?: {
    priority1?: string;
    priority2?: string;
    details?: string;
    context?: string;
  };

  // Old fields for backward compatibility
  goalMotivation?: string;
  customMotivation?: string;
  goalType?: string;
  difficultyArea?: string;
  challengeAreas?: string[];
  customChallenges?: string;
  barrierContext?: string;
  hasPrerequisites: boolean;
  customPrerequisites?: string;

  // Step 6: Scheduling & timing
  startDate: Date;
  endDate?: Date;
  projectCompletionDate?: Date;
  frequency: number;
  selectedDays?: string[];
  timeOfDay?: string;
  customTime?: string;
  isOngoing?: boolean;

  // Teaching helper (habit flow enhancement)
  teachingHelper?: TeachingHelper;

  // Frequency suggestion (habit flow enhancement)
  frequencySuggestion?: FrequencySuggestion;
  frequencySuggestionAccepted?: boolean;

  // Step 7: Context/Support (unified)
  supportContext?: string;
  selectedSupporters?: string[];
  primarySupporterId?: string;
  primarySupporterName?: string;
  supporterTimingOffset?: string;
  sendReminderToMe?: boolean;

  // Step 8: Rewards (supporters only)
  assignReward?: boolean;
  rewardType?: string;
  pointValue?: number;

  // Progressive Mastery specific fields
  pmSkillName?: string;
  pmAssessment?: {
    q1_experience: number;
    q2_confidence: number;
    q3_help_needed: number;
    calculatedLevel?: number;
    levelLabel?: string;
    skipped?: boolean;
    simplifiedChoice?: 'confident' | 'learning';
  };
  pmHelper?: {
    helperId: string | 'none';
    helperName?: string;
    supportTypes?: string[];
  };
  pmPracticePlan?: {
    targetFrequency: number;
    startingFrequency: number;
    smartStartAccepted: boolean;
    durationWeeks: number | null;
    startTime?: string;
    sendAdvanceReminder?: boolean;
  };

  // Old PM fields for backward compatibility
  pmSkillAssessment?: any;
  pmTargetFrequency?: number;
  pmSmartStartPlan?: any;
  pmTeachingHelper?: {
    id: string;
    name: string;
    relationship: string;
  };
  pmDurationWeeks?: number | null;
}
interface SupportedPerson {
  id: string;
  name: string;
  profile?: {
    avatar_url?: string;
  };
}
export const RedesignedGoalsWizard: React.FC<RedesignedGoalsWizardProps> = ({
  onComplete,
  onCancel,
  initialIndividualId,
  isSupporter = false
}) => {
  const [currentStep, setCurrentStep] = useState<number | null>(null); // Start with null to indicate loading
  const [actuallySupportsAnyone, setActuallySupportsAnyone] = useState<boolean | null>(null);
  const [data, setData] = useState<WizardData>({
    recipient: initialIndividualId ? 'other' : 'self',
    supportedPersonId: initialIndividualId,
    goalTitle: '',
    hasPrerequisites: true,
    prerequisites: {
      ready: true
    },
    pmAssessment: {
      q1_experience: 1,
      q2_confidence: 1,
      q3_help_needed: 1
    },
    pmSkillAssessment: {
      q1_experience: 1,
      q2_confidence: 1,
      q3_help_needed: 1
    },
    startDate: new Date(),
    frequency: 3,
    isMyIdea: true
  });
  const [prevGoalType, setPrevGoalType] = useState<string | undefined>(undefined);
  const [supportedPeople, setSupportedPeople] = useState<SupportedPerson[]>([]);
  const [userSupporters, setUserSupporters] = useState<SupportedPerson[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSupporterDialog, setShowSupporterDialog] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<any>(null);
  const [canAssignDirectly, setCanAssignDirectly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end' | 'completion'>('start');
  const [tempHour, setTempHour] = useState<string>("08");
  const [tempMinute, setTempMinute] = useState<string>("00");
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");

  // Helper to switch goal types and reset type-specific data
  const switchGoalType = (newType: 'reminder' | 'progressive_mastery') => {
    // If user has made progress, confirm the switch
    if (currentStep > 1) {
      const confirmed = window.confirm(`Switching to ${newType === 'progressive_mastery' ? 'Progressive Mastery' : 'Habit'} will clear your previous answers. Continue?`);
      if (!confirmed) return;
    }

    // Preserve shared fields
    const sharedFields = {
      goalTitle: data.goalTitle,
      recipient: data.recipient,
      supportedPersonId: data.supportedPersonId,
      supportedPersonName: data.supportedPersonName,
      startDate: data.startDate,
      category: data.category,
      hasPrerequisites: data.hasPrerequisites,
      frequency: data.frequency
    };

    // Clear type-specific fields
    if (newType === 'progressive_mastery') {
      // Switching TO PM: clear habit-specific fields
      setData({
        ...sharedFields,
        goalType: 'progressive_mastery',
        prerequisites: {
          ready: true
        },
        // Clear habit fields
        supportContext: undefined,
        primarySupporterName: undefined,
        selectedSupporters: undefined,
        selectedDays: undefined,
        timeOfDay: undefined,
        customTime: undefined,
        endDate: undefined
      });

      // Reset to PM step 2 (after type selection)
      setCurrentStep(2);
    } else if (newType === 'reminder') {
      // Switching TO Habit: clear PM-specific fields
      setData({
        ...sharedFields,
        goalType: 'reminder',
        prerequisites: {
          ready: true
        },
        // Clear PM fields
        motivation: undefined,
        barriers: undefined,
        pmAssessment: undefined,
        pmHelper: undefined,
        pmPracticePlan: undefined
      });

      // Reset to Habit step 2 (after type selection)
      setCurrentStep(2);
    }
  };
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);
  const [dateValidationWarning, setDateValidationWarning] = useState<string | null>(null);

  // PM Smart Start state variables
  const [pmCustomFrequency, setPMCustomFrequency] = useState<number | undefined>();
  const [pmSuggestionAccepted, setPMSuggestionAccepted] = useState(false);
  // PM Teaching Helper selection state
  const [pmSelectedHelperId, setPMSelectedHelperId] = useState<string | 'none' | null>(data.pmTeachingHelper?.id ?? null);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [modalView, setModalView] = useState<'categories' | 'examples'>('categories');
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<typeof categories[0] | null>(null);
  const [showFrequencySuggestion, setShowFrequencySuggestion] = useState(false);
  const {
    toast
  } = useToast();

  // Show frequency suggestion as toast
  useEffect(() => {
    if (showFrequencySuggestion && data.frequencySuggestion && !data.frequencySuggestionAccepted) {
      toast({
        title: "💡 Tip",
        description: `Based on your challenges, we suggest starting with ${data.frequencySuggestion.frequency} ${data.frequencySuggestion.frequency === 1 ? 'day' : 'days'} per week. ${data.frequencySuggestion.rationale}`,
        duration: 8000
      });
      setShowFrequencySuggestion(false);
    }
  }, [showFrequencySuggestion, data.frequencySuggestion, data.frequencySuggestionAccepted, toast]);

  // Check if current user actually supports anyone
  useEffect(() => {
    const checkSupportsAnyone = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          setActuallySupportsAnyone(false);
          return;
        }
        const {
          data: supporters,
          error
        } = await supabase.from('supporters').select('individual_id').eq('supporter_id', user.id).limit(1);
        if (error) throw error;
        setActuallySupportsAnyone(supporters && supporters.length > 0);
      } catch (error) {
        console.error('Failed to check supporter status:', error);
        setActuallySupportsAnyone(false);
      }
    };
    checkSupportsAnyone();
  }, []);

  // Load supported people for supporters
  useEffect(() => {
    if (isSupporter || actuallySupportsAnyone) {
      loadSupportedPeople();
    }
    loadUserSupporters();
  }, [isSupporter, actuallySupportsAnyone, data.recipient, data.supportedPersonId]);

  // Check permissions when supported person changes
  useEffect(() => {
    if (data.supportedPersonId && data.recipient === 'other') {
      checkAssignPermissions();
    }
  }, [data.supportedPersonId, data.recipient]);

  // Set initial step once we know if user supports anyone
  useEffect(() => {
    if (currentStep === null && actuallySupportsAnyone !== null) {
      // Show step 0 if user actually supports anyone (regardless of user_type classification)
      setCurrentStep(actuallySupportsAnyone ? 0 : 1);
      if (!actuallySupportsAnyone) {
        setData(prev => ({
          ...prev,
          recipient: 'self'
        }));
      }
    }
  }, [actuallySupportsAnyone, currentStep]);

  // Watch for goal type changes and reset incompatible data
  useEffect(() => {
    if (prevGoalType && prevGoalType !== data.goalType && data.goalType) {
      // Reset flow-specific data when goal type changes
      const sharedFields = {
        goalTitle: data.goalTitle,
        category: data.category,
        recipient: data.recipient,
        supportedPersonId: data.supportedPersonId,
        supportedPersonName: data.supportedPersonName,
        startDate: data.startDate,
        frequency: 3
      };
      if (data.goalType === 'progressive_mastery') {
        // Switching to PM: clear habit-specific fields
        setData({
          ...sharedFields,
          goalType: 'progressive_mastery',
          prerequisites: {
            ready: true
          },
          pmAssessment: {
            q1_experience: 1,
            q2_confidence: 1,
            q3_help_needed: 1
          },
          pmSkillAssessment: {
            q1_experience: 1,
            q2_confidence: 1,
            q3_help_needed: 1
          },
          hasPrerequisites: true,
          isMyIdea: true
        });
      } else {
        // Switching to Habit/Practice: clear PM-specific fields and initialize skill assessment
        setData({
          ...sharedFields,
          goalType: data.goalType,
          prerequisites: {
            ready: true
          },
          pmSkillAssessment: {
            q1_experience: 1,
            q2_confidence: 1,
            q3_help_needed: 1
          },
          hasPrerequisites: true,
          isMyIdea: true
        });
      }
    }
    setPrevGoalType(data.goalType);
  }, [data.goalType]);

  // Validate dates whenever they change
  useEffect(() => {
    if (currentStep !== 6) {
      setDateValidationError(null);
      setDateValidationWarning(null);
      return;
    }
    const isProject = data.goalType === 'new_skill';
    const isHabit = data.goalType === 'reminder' || data.goalType === 'practice';

    // Clear previous messages
    setDateValidationError(null);
    setDateValidationWarning(null);
    if (isProject && data.projectCompletionDate) {
      const validation = validateDateRange(data.startDate, data.projectCompletionDate, 'new_skill');
      if (!validation.isValid) {
        setDateValidationError(validation.error || null);
      } else if (validation.warning) {
        setDateValidationWarning(validation.warning);
      }
    }
    if (isHabit && data.endDate) {
      const dateValidation = validateDateRange(data.startDate, data.endDate, data.goalType);
      if (!dateValidation.isValid) {
        setDateValidationError(dateValidation.error || null);
        return;
      }
      if (data.selectedDays && data.selectedDays.length > 0) {
        const occurrenceValidation = validateOccurrencesInDateRange(data.startDate, data.endDate, data.selectedDays);
        if (!occurrenceValidation.isValid) {
          setDateValidationError(occurrenceValidation.error || null);
        } else if (occurrenceValidation.warning) {
          setDateValidationWarning(occurrenceValidation.warning);
        }
      }
    }
  }, [data.startDate, data.endDate, data.projectCompletionDate, data.selectedDays, data.goalType, currentStep]);
  const loadSupportedPeople = async () => {
    try {
      // First, get the supporter relationships
      const {
        data: supporters,
        error: supportersError
      } = await supabase.from('supporters').select('individual_id').eq('supporter_id', (await supabase.auth.getUser()).data.user?.id);
      if (supportersError) throw supportersError;
      if (!supporters || supporters.length === 0) {
        setSupportedPeople([]);
        return;
      }

      // Then get the profile names for those individuals
      const individualIds = supporters.map(s => s.individual_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, first_name').in('user_id', individualIds);
      if (profilesError) throw profilesError;

      // Combine the data
      const people = supporters.map(s => {
        const profile = profiles?.find(p => p.user_id === s.individual_id);
        return {
          id: s.individual_id,
          name: profile?.first_name || 'Unknown'
        };
      });
      setSupportedPeople(people);

      // Set initial name if we have an ID
      if (initialIndividualId) {
        const person = people.find(p => p.id === initialIndividualId);
        if (person) {
          setData(prev => ({
            ...prev,
            supportedPersonName: person.name
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load supported people:', error);
    }
  };
  const loadUserSupporters = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Determine whose supporters to fetch
      const targetIndividualId = data.recipient === 'other' && data.supportedPersonId ? data.supportedPersonId : user.id;
      const {
        data: supporters,
        error
      } = await supabase.from('supporters').select('supporter_id, role, permission_level').eq('individual_id', targetIndividualId);
      if (error) throw error;
      if (!supporters || supporters.length === 0) {
        setUserSupporters([]);
        return;
      }

      // Get profiles for the supporters
      const supporterIds = supporters.map(s => s.supporter_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, first_name, avatar_url').in('user_id', supporterIds);
      if (profilesError) throw profilesError;
      const allies = supporters.map(s => {
        const profile = profiles?.find(p => p.user_id === s.supporter_id);
        return {
          id: s.supporter_id,
          name: profile?.first_name || 'Supporter',
          role: s.role,
          profile: profile ? {
            avatar_url: profile.avatar_url
          } : undefined
        };
      });
      setUserSupporters(allies);
    } catch (error) {
      console.error('Failed to load user supporters:', error);
    }
  };
  const checkAssignPermissions = async () => {
    if (!data.supportedPersonId) return;
    try {
      const canAssign = await PermissionsService.checkPermission(data.supportedPersonId, 'create_goals');
      setCanAssignDirectly(canAssign);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setCanAssignDirectly(false);
    }
  };
  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({
      ...prev,
      ...updates
    }));
  };
  const nextStep = async () => {
    const maxStep = isSupporter ? 12 : 11;
    setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    const minStep = isSupporter ? 0 : 1;

    // Check if user used simplified assessment
    const usedSimplifiedAssessment = data.pmSkillAssessment?.skipped === true || data.pmAssessment?.skipped === true;

    // If coming back from steps after simplified assessment, skip the detailed questions
    if (usedSimplifiedAssessment && currentStep === 8) {
      // From barriers (step 8), go back to intro (step 4)
      setCurrentStep(4);
      return;
    }
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  };
  const getStepTitle = () => {
    const isForOther = data.recipient === 'other';
    const name = data.supportedPersonName;
    const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;

    // Progressive Mastery flow titles
    if (data.goalType === 'progressive_mastery') {
      const pmSupporterTitles = ['Who is this goal for?', `What skill does ${isForOther ? name || 'they' : 'you'} want to learn?`, `Why does this matter${isForOther ? name ? ` to ${name}` : ' to them' : ' to you'}?`, `Before ${isForOther ? name || 'they' : 'you'} start${isForOther && name ? 's' : ''}, what is the single most critical prerequisite that is currently missing?`, 'Quick Skill Check', isForOther ? `How experienced is ${name || 'they'}?` : 'How experienced are you?', isForOther ? `How confident is ${name || 'they'}?` : 'How confident are you?', isForOther ? `How much help does ${name || 'they'} need?` : 'How much help do you need?', 'What might get in the way?', 'Who can help you learn this skill?', 'Set your practice schedule', 'Review Your Learning Plan'];
      const pmNonSupporterTitles = ['What skill do you want to learn?', 'Why does this matter to you?', 'Prerequisites check', 'Quick Skill Check', 'How experienced are you?', 'How confident are you?', 'How much help do you need?', 'What might get in the way?', 'Who can help you learn this skill?', 'Set your practice schedule', 'Review Your Learning Plan'];
      if (actuallySupportsAnyone) {
        return pmSupporterTitles[currentStep] || 'Create Your Goal';
      } else {
        return pmNonSupporterTitles[currentStep - 1] || 'Create Your Goal';
      }
    }

    // Habit flow titles with dynamic branching
    const step9Title = skillLevel >= 4 ? data.goalType === 'new_skill' ? actuallySupportsAnyone ? `When will ${isForOther ? name || 'they' : 'you'} work on this project?` : "When will you work on this project?" : actuallySupportsAnyone ? `Let's build a reliable structure for ${isForOther ? name || 'they' : 'you'}` : "When will you do it?" : "Who can help you learn this skill?";
    const step10Title = skillLevel >= 4 ? "Who's in your corner?" : "Set your practice schedule";
    const step11Title = skillLevel >= 4 ? isSupporter ? "Rewards & Incentives" : "Review Your Plan" : "Review Your Learning Plan";
    const supporterTitles = ['Who is this goal for?', `What is the one clear, observable action ${isForOther ? name || 'they' : 'you'} need${isForOther && name ? 's' : ''} to establish?`, `Why does this matter${isForOther ? name ? ` to ${name}` : ' to them' : ' to you'}?`, `Before ${isForOther ? name || 'they' : 'you'} start${isForOther && name ? 's' : ''}, what is the single most critical prerequisite that is currently missing?`, 'Quick Skill Check', 'Experience Level', 'Confidence Level', 'Support Needed', `Based on your observations, which specific executive function barrier will most likely slow ${name ? `${name}'s` : 'their'} progress?`, step9Title, step10Title, step11Title, 'Review Your Plan'];
    const nonSupporterTitles = ['What do you want to do?', 'Why does this matter to you?', 'Prerequisites check', 'Quick Skill Check', 'Experience Level', 'Confidence Level', 'Support Needed', 'Which part usually feels the trickiest when you start this?', step9Title, step10Title, step11Title];
    if (actuallySupportsAnyone) {
      return supporterTitles[currentStep] || '';
    } else {
      return nonSupporterTitles[currentStep - 1] || '';
    }
  };

  // Date validation helpers
  const validateDateRange = (startDate: Date, endDate: Date | undefined, goalType: string) => {
    if (!endDate && goalType !== 'new_skill') {
      return {
        isValid: true
      }; // Open-ended habit is allowed
    }
    if (!endDate) {
      return {
        isValid: false,
        error: 'End date is required for project goals'
      };
    }

    // Check if end is after start
    if (endDate <= startDate) {
      return {
        isValid: false,
        error: 'End date must be after start date'
      };
    }

    // Check minimum duration (at least 1 day)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) {
      return {
        isValid: false,
        error: 'Goal must be at least 1 day long'
      };
    }

    // For habits, recommend at least 7 days for meaningful tracking
    if (goalType !== 'new_skill' && daysDiff < 7) {
      return {
        isValid: true,
        warning: 'Goals under 1 week may not provide enough time to build a habit'
      };
    }
    return {
      isValid: true
    };
  };
  const validateOccurrencesInDateRange = (startDate: Date, endDate: Date | undefined, selectedDays: string[] | undefined) => {
    if (!selectedDays || selectedDays.length === 0) {
      return {
        isValid: false,
        error: 'Please select at least one day'
      };
    }
    if (!endDate) {
      return {
        isValid: true
      }; // Open-ended is fine
    }
    const dayMap = {
      'sun': 0,
      'mon': 1,
      'tue': 2,
      'wed': 3,
      'thu': 4,
      'fri': 5,
      'sat': 6
    };
    const selectedDayNums = selectedDays.map(d => dayMap[d as keyof typeof dayMap]);

    // Count actual occurrences
    let occurrenceCount = 0;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= daysDiff; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      if (selectedDayNums.includes(checkDate.getDay())) {
        occurrenceCount++;
      }
    }
    if (occurrenceCount === 0) {
      const selectedDayNames = selectedDays.map(d => d.toUpperCase()).join(', ');
      return {
        isValid: false,
        error: `No ${selectedDayNames} days occur between ${format(startDate, 'MMM d')} and ${format(endDate, 'MMM d')}. Please adjust your dates or selected days.`
      };
    }

    // Warning for very few occurrences
    if (occurrenceCount < 3) {
      return {
        isValid: true,
        warning: `Only ${occurrenceCount} occurrence${occurrenceCount > 1 ? 's' : ''} scheduled. Consider extending your timeline.`,
        occurrenceCount
      };
    }
    return {
      isValid: true,
      occurrenceCount
    };
  };
  const canProceed = () => {
    // Progressive Mastery flow
    if (data.goalType === 'progressive_mastery') {
      switch (currentStep) {
        case 0:
          return data.recipient === 'self' || data.recipient === 'other' && data.supportedPersonId;
        case 1:
          return data.goalTitle.trim().length > 0 && !!data.goalType;
        case 2:
          return true;
        // Motivation OPTIONAL
        case 3:
          return data.prerequisites?.ready === true || data.prerequisites?.ready === false && !!data.prerequisites?.needs;
        // Prerequisites REQUIRED
        case 4:
          return true;
        // Skill Assessment Intro - always can proceed
        case 5:
          return !!data.pmAssessment?.q1_experience;
        // Experience REQUIRED
        case 6:
          return !!data.pmAssessment?.q2_confidence;
        // Confidence REQUIRED
        case 7:
          return !!data.pmAssessment?.q3_help_needed;
        // Help Needed REQUIRED
        case 8:
          return true;
        // Barriers OPTIONAL
        case 9:
          return !!pmSelectedHelperId;
        // Helper selection required
        case 10:
          {
            const freq = data.pmPracticePlan?.targetFrequency ?? data.pmTargetFrequency;
            return !!freq && !!data.startDate;
          }
        default:
          return false;
      }
    }

    // Regular flow
    switch (currentStep) {
      case 0:
        // Who is this for (supporters only)
        return data.recipient === 'self' || data.recipient === 'other' && data.supportedPersonId;
      case 1:
        // Goal description + type
        return data.goalTitle.trim().length > 0 && !!data.goalType;
      case 2:
        // Motivation
        return !!data.motivation?.trim();
      case 3:
        // Prerequisites
        return true;
      case 4:
        // Skill Assessment Intro - always can proceed
        return true;
      case 5:
        // Experience assessment
        return !!data.pmSkillAssessment?.q1_experience;
      case 6:
        // Confidence assessment
        return !!data.pmSkillAssessment?.q2_confidence;
      case 7:
        // Help Needed assessment
        return !!data.pmSkillAssessment?.q3_help_needed;
      case 8:
        // Challenge areas (barriers)
        return (data.challengeAreas?.length || 0) > 0;
      case 9:
        {
          const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
          if (skillLevel >= 4) {
            // High skill: habit flow - validate scheduling
            if (showSchedulingIntro) return true; // Can proceed from intro

            const hasTime = !!(data.pmPracticePlan?.startTime || data.customTime || data.timeOfDay);
            const hasFreq = !!(data.pmPracticePlan?.targetFrequency ?? data.pmTargetFrequency);
            const hasStartDate = !!data.startDate;
            console.log('Step 9 validation (habit flow):', {
              hasTime,
              hasFreq,
              hasStartDate,
              skillLevel
            });
            if (data.goalType === 'new_skill') {
              if (!hasTime || !hasStartDate || !data.projectCompletionDate) return false;
              const projectValidation = validateDateRange(data.startDate, data.projectCompletionDate, 'new_skill');
              return projectValidation.isValid;
            } else {
              return hasFreq && hasStartDate && hasTime;
            }
          } else {
            // Low skill: PM flow - validate helper selection
            return !!pmSelectedHelperId;
          }
        }
      case 10:
        {
          const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
          if (skillLevel >= 4) {
            // Habit flow: validate support context
            if (data.supportContext === 'alone') return true;
            if (!data.selectedSupporters || data.selectedSupporters.length === 0) return false;
            return true;
          } else {
            // PM flow: validate practice plan
            const freq = data.pmPracticePlan?.targetFrequency ?? data.pmTargetFrequency;
            return !!freq && !!data.startDate;
          }
        }
      case 11:
        {
          const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
          if (skillLevel >= 4) {
            return true; // Habit flow: rewards optional
          } else {
            return true; // PM flow: confirm (always can proceed)
          }
        }
      case 12:
        return true;
      // Final confirm (habit with supporters)
      default:
        return false;
    }
  };
  const handleCategorySelect = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      // If clicking the same category, either select it or collapse
      if (data.category === categoryId) {
        setExpandedCategory(null);
      } else {
        updateData({
          category: categoryId
        });
        setExpandedCategory(null);
      }
    } else {
      // Expand the category to show details
      setExpandedCategory(categoryId);
    }
  };

  /**
   * Calculate due date for a PM step based on week number
   * @param startDate - Goal start date
   * @param weekNumber - e.g., "1", "2", "2-3", "4"
   * @returns ISO date string or undefined
   */
  const calculateStepDueDate = (startDate: Date, weekNumber: string | number): string | undefined => {
    try {
      // Handle both "Week 1" format and plain number
      const weekStr = weekNumber.toString();
      const weekMatch = weekStr.match(/(\d+)(?:-(\d+))?/);
      if (!weekMatch) return undefined;
      const startWeek = parseInt(weekMatch[1], 10);
      const endWeek = weekMatch[2] ? parseInt(weekMatch[2], 10) : startWeek;

      // Set due date to end of the week range (Sunday)
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + endWeek * 7 - 1);
      return format(dueDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Failed to calculate step due date:', error);
      return undefined;
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const isProposal = isSupporter && data.recipient === 'other' && !canAssignDirectly;

      // Calculate proper due_date and duration_weeks from user's endDate
      let durationWeeks = 4; // Default fallback
      let calculatedDueDate: string | undefined;
      if (data.goalType !== 'new_skill' && data.frequency) {
        // Habit goal: use user's endDate if provided
        if (data.endDate) {
          calculatedDueDate = format(data.endDate, 'yyyy-MM-dd');
          // Calculate duration in weeks from start to end
          const daysDifference = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
          durationWeeks = Math.max(1, Math.ceil(daysDifference / 7));
        } else {
          // Fallback: 4 weeks from start
          const habitEndDate = new Date(data.startDate);
          habitEndDate.setDate(habitEndDate.getDate() + durationWeeks * 7);
          calculatedDueDate = format(habitEndDate, 'yyyy-MM-dd');
        }

        // Validate: ensure there are actual occurrences within the date range
        if (data.selectedDays && data.selectedDays.length > 0 && data.endDate) {
          const daysDiff = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff < 7) {
            const dayMap = {
              'sun': 0,
              'mon': 1,
              'tue': 2,
              'wed': 3,
              'thu': 4,
              'fri': 5,
              'sat': 6
            };
            const selectedDayNums = data.selectedDays.map(d => dayMap[d as keyof typeof dayMap]);
            let hasOccurrence = false;
            for (let i = 0; i <= daysDiff; i++) {
              const checkDate = new Date(data.startDate);
              checkDate.setDate(checkDate.getDate() + i);
              if (selectedDayNums.includes(checkDate.getDay())) {
                hasOccurrence = true;
                break;
              }
            }
            if (!hasOccurrence) {
              toast({
                title: "Invalid schedule",
                description: `No ${data.selectedDays.join(' or ')} days fall between ${format(data.startDate, 'MMM d')} and ${format(data.endDate, 'MMM d')}. Please adjust your dates.`,
                variant: "destructive"
              });
              setLoading(false);
              return;
            }
          }
        }
      } else if (data.goalType === 'new_skill') {
        // Project goal: use user-selected completion date
        calculatedDueDate = data.projectCompletionDate ? format(data.projectCompletionDate, 'yyyy-MM-dd') : undefined;
      } else {
        // Fallback to wizard's endDate if available
        calculatedDueDate = data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined;
      }
      const goalData = {
        title: data.goalTitle,
        description: buildGoalDescription(),
        domain: mapCategoryToDomain(data.category) as GoalDomain,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        due_date: calculatedDueDate,
        frequency_per_week: data.goalType === 'new_skill' ? undefined : data.frequency,
        owner_id: data.recipient === 'other' ? data.supportedPersonId : undefined
      };
      if (isProposal) {
        // Create proposal
        await goalProposalsService.createProposal({
          individual_id: data.supportedPersonId!,
          title: data.goalTitle,
          description: goalData.description,
          category: data.category,
          timeline_start: goalData.start_date,
          timeline_end: calculatedDueDate,
          frequency_per_week: data.frequency,
          rationale: `Goal type: ${data.goalType}, Challenges: ${data.challengeAreas?.map(id => challengeAreas.find(c => c.id === id)?.label).join(', ')}, Support: ${data.supportContext}`
        });
        toast({
          title: 'Proposal submitted! 📝',
          description: `Sent for review by ${data.supportedPersonName}'s admins.`
        });
      } else {
        // Create goal directly with metadata
        const {
          data: {
            user: currentUser
          }
        } = await supabase.auth.getUser();
        const finalOwnerId = data.recipient === 'other' ? data.supportedPersonId : currentUser?.id;

        // Progressive Mastery: Use PM duration and frequency from new structure
        const pmDurationWeeks = data.goalType === 'progressive_mastery' && data.pmPracticePlan?.durationWeeks ? data.pmPracticePlan.durationWeeks : durationWeeks;
        const pmDueDate = data.goalType === 'progressive_mastery' && data.pmPracticePlan?.durationWeeks ? format(addWeeks(data.startDate, data.pmPracticePlan.durationWeeks), 'yyyy-MM-dd') : calculatedDueDate;

        // ============= STEP 1: SAFETY CHECK FIRST =============
        const safetyResult = await performSafetyCheck(data);
        if (!safetyResult.safe) {
          toast({
            title: "Cannot create goal",
            description: safetyResult.errors.join('. '),
            variant: "destructive",
            duration: 10000
          });
          setLoading(false);
          return;
        }

        // ============= STEP 2: CREATE GOAL WITH status='planned' =============
        const goalDataWithMetadata = {
          title: data.goalTitle,
          description: buildGoalDescription(),
          domain: mapCategoryToDomain(data.category) as GoalDomain,
          status: 'planned' as const,
          priority: 'medium' as const,
          goal_type: (() => {
            if (data.goalType === 'progressive_mastery') return undefined; // NULL passes CHECK constraint
            if (data.goalType === 'reminder') return 'reminder';
            if (data.goalType === 'practice') return 'practice';
            if (data.goalType === 'new_skill') return 'new_skill';
            return undefined;
          })(),
          frequency_per_week: data.goalType === 'progressive_mastery' ? data.pmPracticePlan?.startingFrequency ?? data.frequency : data.goalType === 'new_skill' ? undefined : data.frequency,
          duration_weeks: pmDurationWeeks,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          due_date: data.goalType === 'progressive_mastery' ? pmDueDate : calculatedDueDate,
          owner_id: finalOwnerId,
          created_by: currentUser?.id,
          tags: data.challengeAreas || [],
          metadata: {
            generationStatus: 'queued',
            generationQueuedAt: new Date().toISOString(),
            wizardContext: {
              goalTitle: data.goalTitle,
              goalMotivation: data.goalMotivation,
              customMotivation: data.customMotivation,
              goalType: data.goalType,
              difficultyArea: data.difficultyArea,
              challengeAreas: data.challengeAreas,
              customChallenges: data.customChallenges,
              prerequisite: data.customPrerequisites,
              startDate: data.startDate,
              endDate: data.endDate,
              selectedDays: data.selectedDays,
              timeOfDay: data.timeOfDay,
              customTime: data.customTime,
              supportContext: data.supportContext,
              selectedSupporters: data.selectedSupporters,
              primarySupporterId: data.primarySupporterId,
              primarySupporterName: data.primarySupporterName,
              supportedPersonName: data.supportedPersonName,
              supportedPersonId: data.supportedPersonId,
              recipient: data.recipient,
              // PM-specific fields for Summary tab
              domain: data.category,
              frequency: data.frequency,
              pmAssessment: (() => {
                const assessment = data.pmAssessment || data.pmSkillAssessment;
                return assessment ? {
                  q1_experience: assessment.q1_experience,
                  q2_confidence: assessment.q2_confidence,
                  q3_help_needed: assessment.q3_help_needed,
                  calculatedLevel: assessment.calculatedLevel ?? assessment.calculated_level,
                  levelLabel: assessment.levelLabel ?? assessment.level_label
                } : undefined;
              })(),
              pmPracticePlan: data.pmPracticePlan ? {
                targetFrequency: data.pmPracticePlan.targetFrequency ?? data.pmTargetFrequency ?? data.frequency,
                startingFrequency: data.pmPracticePlan.startingFrequency ?? data.pmTargetFrequency ?? data.frequency,
                durationWeeks: data.pmPracticePlan.durationWeeks ?? (data.endDate && data.startDate ? Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) : null),
                smartStartAccepted: data.pmPracticePlan.smartStartAccepted ?? true,
                startTime: data.pmPracticePlan.startTime,
                sendAdvanceReminder: data.pmPracticePlan.sendAdvanceReminder ?? true
              } : undefined,
              barriers: data.barriers ? {
                priority1: data.barriers.priority1,
                priority2: data.barriers.priority2,
                details: data.barriers.details
              } : undefined,
              pmHelper: data.goalType === 'progressive_mastery' && data.pmTeachingHelper ? {
                helperId: data.pmTeachingHelper.id,
                helperName: data.pmTeachingHelper.name,
                supportTypes: data.pmTeachingHelper.relationship
              } : data.teachingHelper ? {
                helperId: data.teachingHelper.helperId || 'none',
                helperName: data.teachingHelper.helperName || 'Independent',
                supportTypes: data.teachingHelper.relationship || 'supporter'
              } : undefined
            }
          }
        };

        // Safety check already performed, proceed with goal creation
        console.log('Creating goal with data:', {
          title: goalDataWithMetadata.title,
          goal_type: goalDataWithMetadata.goal_type,
          wizardGoalType: data.goalType,
          isPM: data.goalType === 'progressive_mastery'
        });
        const createdGoal = await goalsService.createGoal(goalDataWithMetadata);

        // If Progressive Mastery, save additional metadata
        if (data.goalType === 'progressive_mastery') {
          try {
            // Validate all required PM fields using new data structure
            const assessment = data.pmSkillAssessment || data.pmAssessment;

            // Only require detailed answers if user didn't use simplified choice
            if (!assessment?.skipped) {
              if (!assessment?.q1_experience || !assessment?.q2_confidence || !assessment?.q3_help_needed) {
                throw new Error('Skill assessment is required');
              }
            } else {
              // For simplified assessments, just verify calculated level exists
              if (!assessment?.calculatedLevel) {
                throw new Error('Skill level is required');
              }
            }
            if (!data.pmPracticePlan?.targetFrequency || !data.pmPracticePlan?.startingFrequency || data.pmPracticePlan?.durationWeeks === undefined) {
              throw new Error('Practice plan is required');
            }
            console.log('Saving PM metadata for goal:', createdGoal.id);

            // Save skill assessment using new structure
            await progressiveMasteryService.saveSkillAssessment(createdGoal.id, {
              q1: assessment.q1_experience,
              q2: assessment.q2_confidence,
              q3: assessment.q3_help_needed,
              skipped: assessment.skipped || false,
              simplifiedChoice: assessment.simplifiedChoice
            });

            // Calculate level and generate Smart Start plan
            const level = assessment.calculatedLevel ?? progressiveMasteryService.calculateSkillLevel({
              q1: assessment.q1_experience,
              q2: assessment.q2_confidence,
              q3: assessment.q3_help_needed
            });
            const plan = progressiveMasteryService.suggestStartFrequency(level, data.pmPracticePlan.targetFrequency, assessment.skipped || false);

            // Save smart start plan using pmPracticePlan structure
            await progressiveMasteryService.saveSmartStartPlan(createdGoal.id, plan, data.pmPracticePlan.smartStartAccepted, data.pmPracticePlan.startingFrequency);

            // Save teaching helper if selected (using new pmHelper structure)
            if (data.pmHelper?.helperId && data.pmHelper.helperId !== 'none') {
              await progressiveMasteryService.saveTeachingHelper(createdGoal.id, data.pmHelper.helperId, data.pmHelper.helperName ?? 'Helper', 'coach' // Default relationship
              );

              // Notify teaching helper
              await notificationsService.createNotification({
                user_id: data.pmHelper.helperId,
                type: 'teaching_helper_assigned',
                title: 'New Teaching Helper Role',
                message: `You've been assigned to help with learning: ${data.goalTitle}`,
                data: {
                  goal_id: createdGoal.id
                }
              });
            }
            console.log('PM metadata saved successfully');

            // Save complete wizard context for Summary tab display
            const completeWizardContext = {
              goalTitle: data.goalTitle,
              goalType: 'progressive_mastery',
              goalTypeLabel: 'Progressive Mastery',
              category: data.category,
              frequency: data.pmPracticePlan.targetFrequency,
              startDate: data.startDate,
              endDate: data.endDate,
              selectedDays: data.selectedDays || [],
              customTime: data.customTime,
              timeOfDay: data.timeOfDay,
              goalMotivation: data.goalMotivation,
              customMotivation: data.customMotivation || data.motivation,
              barriers: data.barriers,
              prerequisites: data.prerequisites,
              pmAssessment: {
                q1_experience: assessment.q1_experience,
                q2_confidence: assessment.q2_confidence,
                q3_help_needed: assessment.q3_help_needed,
                calculatedLevel: assessment.calculatedLevel,
                levelLabel: assessment.levelLabel
              },
              pmPracticePlan: data.pmPracticePlan,
              pmHelper: data.pmHelper
            };
            await goalsService.updateMetadata(createdGoal.id, {
              wizardContext: completeWizardContext
            });
            console.log('Complete wizard context saved for Summary tab');
            console.log('✅ PM goal creation flow complete - steps will generate in background');
          } catch (pmError: any) {
            console.error('Failed to save Progressive Mastery metadata:', pmError);

            // Clean up the created goal since PM setup failed
            try {
              await goalsService.deleteGoal(createdGoal.id);
            } catch (cleanupError) {
              console.error('Failed to clean up goal after PM metadata error:', cleanupError);
            }
            toast({
              title: "Setup Failed",
              description: pmError.message || "Failed to configure Progressive Mastery settings. Please try again.",
              variant: "destructive"
            });
            setLoading(false);
            return; // Exit without proceeding
          }
        }

        // Only show this toast for habit goals (PM toasts are shown earlier in the flow)
        if (data.goalType !== 'progressive_mastery') {
          // Fetch the created steps count
          const fetchedSteps = await stepsService.getSteps(createdGoal.id);
          const stepCount = fetchedSteps?.length || 0;
          toast({
            title: 'Goal Created! 🚀',
            description: stepCount > 0 ? `Your personalized plan begins now with ${stepCount} steps!` : 'Your personalized micro-steps are being generated.',
            duration: 3000
          });
        }

        // Navigate immediately after goal creation
        onComplete({
          success: true,
          goalTitle: data.goalTitle,
          finalOwnerId,
          isSupporter: data.recipient === 'other',
          goalId: createdGoal.id
        });
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const buildGoalDescription = () => {
    const category = categories.find(c => c.id === data.category);
    const type = goalTypes.find(t => t.id === data.goalType);
    const challenges = data.challengeAreas?.map(id => challengeAreas.find(c => c.id === id)?.label).filter(Boolean);
    const support = supportContexts.find(s => s.id === data.supportContext);
    const motivation = motivations.find(m => m.id === data.goalMotivation);
    let description = data.goalTitle;
    if (motivation) description += ` - Motivated by ${motivation.label.toLowerCase()}`;
    if (type) description += ` (${type.label})`;
    if (data.difficultyArea && data.goalType === 'practice') {
      description += ` - Area of difficulty: ${data.difficultyArea}`;
    }
    if (challenges && challenges.length > 0) description += ` - Challenges: ${challenges.join(', ')}`;
    if (support) description += ` with ${support.label.toLowerCase()}`;
    if (data.frequency) description += ` ${data.frequency} times per week`;
    if (data.timeOfDay && data.timeOfDay !== 'custom') {
      const timeLabel = timesOfDay.find(t => t.id === data.timeOfDay)?.label;
      if (timeLabel) description += ` in the ${timeLabel.toLowerCase()}`;
    }
    return description;
  };
  const mapCategoryToDomain = (categoryId?: string) => {
    const mapping: Record<string, GoalDomain> = {
      'health': 'health',
      'education': 'education',
      'employment': 'employment',
      'independent_living': 'independent_living',
      'social_skills': 'social_skills',
      'postsecondary': 'postsecondary',
      'fun_recreation': 'fun_recreation'
    };
    return mapping[categoryId || ''] || 'other' as GoalDomain;
  };
  const formatDisplayTime = (hhmm?: string) => {
    if (!hhmm) return "Pick a starting time";
    const [H, M] = hhmm.split(":").map(Number);
    const period = H >= 12 ? "PM" : "AM";
    const hour12 = H % 12 || 12;
    return `${hour12}:${M.toString().padStart(2, "0")} ${period}`;
  };
  const initTimeDialogFromValue = (hhmm: string) => {
    const [H, M] = hhmm.split(":").map(Number);
    const period: "AM" | "PM" = H >= 12 ? "PM" : "AM";
    const hour12 = H % 12 || 12;
    setTempHour(hour12.toString().padStart(2, "0"));
    setTempMinute(M.toString().padStart(2, "0"));
    setTempPeriod(period);
  };
  const build24hTime = (hour12: number, minute: string, period: "AM" | "PM") => {
    let H = hour12 % 12;
    if (period === "PM") H += 12;
    return `${H.toString().padStart(2, "0")}:${minute}`;
  };
  // ============================================
  // BROWSE MODAL RENDERERS
  // ============================================

  const renderCategoriesModal = () => {
    return <div className="flex flex-col h-full">
        <div className="fixed left-0 right-0 top-0 z-40 bg-card h-16">
          <div className="flex h-16 items-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setShowBrowseModal(false)}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold flex-1">Browse Goal Ideas</h1>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pt-20 pb-4">
          <div className="grid grid-cols-1 gap-3">
            {categories.map(category => {
            return <Card key={category.id} className="cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm" onClick={() => {
              setSelectedCategoryForModal(category);
              setModalView('examples');
            }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">{category.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{category.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </ScrollArea>
      </div>;
  };
  const renderExampleGoalsModal = () => {
    if (!selectedCategoryForModal) return null;
    const exampleGoals = exampleGoalsByCategory[selectedCategoryForModal.id] || [];
    return <div className="flex flex-col h-full">
        <div className="fixed left-0 right-0 top-0 z-40 bg-card h-16">
          <div className="flex h-16 items-center gap-3 px-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => {
            setModalView('categories');
            setSelectedCategoryForModal(null);
          }}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to categories</span>
            </Button>
            <h1 className="text-2xl font-bold flex-1 flex items-center gap-2">
              <span>{selectedCategoryForModal.emoji}</span>
              {selectedCategoryForModal.title}
            </h1>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pt-20 pb-4">
          <div className="space-y-3">
            {exampleGoals.map(goal => {
            const getBadge = () => {
              switch (goal.suggestedType) {
                case 'progressive_mastery':
                  return {
                    text: '🎯 Progressive Mastery',
                    color: 'bg-purple-100 text-purple-700 border-purple-200'
                  };
                case 'reminder':
                  return {
                    text: '🔄 Habit',
                    color: 'bg-blue-100 text-blue-700 border-blue-200'
                  };
                case 'practice':
                  return {
                    text: '📈 Practice',
                    color: 'bg-green-100 text-green-700 border-green-200'
                  };
                case 'new_skill':
                  return {
                    text: '⭐ New Skill',
                    color: 'bg-amber-100 text-amber-700 border-amber-200'
                  };
                default:
                  return {
                    text: '🎯 Goal',
                    color: 'bg-gray-100 text-gray-700 border-gray-200'
                  };
              }
            };
            const badge = getBadge();
            return <Card key={goal.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01]" onClick={() => {
              updateData({
                goalTitle: goal.title,
                category: goal.categoryId,
                goalType: goal.suggestedType
              });
              setShowBrowseModal(false);
              setModalView('categories');
              setSelectedCategoryForModal(null);
            }}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>

          <div className="text-center pt-4 mt-4 border-t">
            
          </div>
        </ScrollArea>
      </div>;
  };
  const renderBrowseModal = () => {
    return <Sheet open={showBrowseModal} onOpenChange={setShowBrowseModal}>
        <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-hidden">
          {modalView === 'categories' ? renderCategoriesModal() : renderExampleGoalsModal()}
        </SheetContent>
      </Sheet>;
  };
  const renderStep0 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">{text.step0.subtitle}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Card className={cn("cursor-pointer transition-all border-2 p-6", data.recipient === 'self' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => updateData({
          recipient: 'self'
        })}>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-semibold">For myself</div>
              <div className="text-sm text-muted-foreground">Create a personal goal</div>
            </div>
            {data.recipient === 'self' && <Check className="h-5 w-5 text-primary" />}
          </div>
        </Card>
        
        <Card className={cn("cursor-pointer transition-all border-2 p-6", data.recipient === 'other' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")} onClick={() => updateData({
          recipient: 'other'
        })}>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="font-semibold">For someone I support</div>
              <div className="text-sm text-muted-foreground">Create or suggest a goal for them</div>
            </div>
            {data.recipient === 'other' && <Check className="h-5 w-5 text-primary" />}
          </div>
        </Card>
        
        {data.recipient === 'other' && <div className="space-y-3 pt-4">
            <Label>Select person:</Label>
            <div className="grid gap-2">
              {supportedPeople.map(person => <Button key={person.id} variant={data.supportedPersonId === person.id ? 'default' : 'outline'} className="justify-start" onClick={() => updateData({
              supportedPersonId: person.id,
              supportedPersonName: person.name
            })}>
                  {person.name}
                </Button>)}
            </div>
            
            {data.supportedPersonId && <div className="space-y-3 pt-4 border-t">
                <Label>Is this your idea or theirs?</Label>
                <div className="flex gap-2">
                  <Button variant={data.isMyIdea ? 'default' : 'outline'} onClick={() => updateData({
                isMyIdea: true
              })}>
                    My idea
                  </Button>
                  <Button variant={!data.isMyIdea ? 'default' : 'outline'} onClick={() => updateData({
                isMyIdea: false
              })}>
                    Their idea
                  </Button>
                </div>
              </div>}
          </div>}
      </CardContent>
    </Card>;
  };
  const renderStep1 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} questionIcon="🎯" questionText={text.step1.question} helpText={text.step1.subtitle} inputType="custom" onBack={prevStep} onContinue={nextStep} continueDisabled={!data.goalTitle?.trim() || !data.trackingMode} hideHeader hideFooter>
        <div className="space-y-8">
          {/* Goal Title Textarea */}
          <div className="space-y-2">
            <Textarea id="goal-title" placeholder="Name your new Goal" value={data.goalTitle} onChange={e => updateData({
            goalTitle: e.target.value
          })} className="text-base py-3 min-h-[48px] resize-none" rows={1} />
          </div>
          
          {/* Browse Goals Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowBrowseModal(true)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-base mb-1">Browse Goal Ideas</div>
                  <p className="text-base text-muted-foreground">
                    Explore 50+ example goals
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Tracking Mode Selection */}
          <div className="space-y-4 pt-4 pb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-left">
              What type of goal is this?
            </h1>
            
            {/* Habit Card */}
            <Card className={cn("cursor-pointer shadow-sm hover:shadow-md", data.trackingMode === 'habit' && "bg-primary/5")} onClick={() => {
            updateData({
              trackingMode: 'habit',
              goalType: 'reminder'
            });
          }}>
              <CardContent className="p-4 relative">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔁</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">
                      Habit
                    </div>
                    <p className="text-base text-muted-foreground mt-1">
                      Showing up regularly to build a stable, repeatable pattern in your day
                    </p>
                  </div>
                </div>
                {data.trackingMode === 'habit' && (
                  <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
                )}
              </CardContent>
            </Card>
            
            {/* Skill Card */}
            <Card className={cn("cursor-pointer shadow-sm hover:shadow-md", data.trackingMode === 'skill' && "bg-primary/5")} onClick={() => {
            updateData({
              trackingMode: 'skill',
              goalType: 'progressive_mastery'
            });
          }}>
              <CardContent className="p-4 relative">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">
                      Skill
                    </div>
                    <p className="text-base text-muted-foreground mt-1">
                      Focus on one skill until you're good, or achieve a concrete, visible win
                    </p>
                  </div>
                </div>
                {data.trackingMode === 'skill' && (
                  <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
                )}
              </CardContent>
            </Card>
            
          </div>
        </div>
      </QuestionScreen>;
  };
  const renderStep2 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    const name = data.recipient === 'other' ? data.supportedPersonName : 'you';
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} goalTitle={data.goalTitle} questionIcon="💭" questionText={`Why does this matter to ${name}?`} helpText="Understanding motivation helps maintain commitment when practice gets tough. Take a moment to reflect on what drives you." inputType="textarea" value={data.motivation || ''} onChange={value => updateData({
      motivation: value
    })} onBack={() => prevStep()} onContinue={() => nextStep()} required continueDisabled={!data.motivation?.trim() || data.motivation.trim().length < 10} hideHeader hideFooter />;
  };
  const renderStep3 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} goalTitle={data.goalTitle} questionIcon="✅" questionText={text.step3.question} helpText={text.step3.helperText} inputType="yesno" options={[{
      value: 'no',
      label: text.step3.options.yes.title,
      icon: '✅',
      description: text.step3.options.yes.description
    }, {
      value: 'yes',
      label: text.step3.options.no.title,
      icon: '⚠️',
      description: text.step3.options.no.description
    }]} value={data.hasPrerequisites ? 'yes' : 'no'} onChange={value => updateData({
      hasPrerequisites: value === 'yes'
    })} expandOnValue="yes" expandedContent={<div className="space-y-2">
            <Label htmlFor="prerequisite-item">{text.step3.conditionalInput.label}</Label>
            <Input id="prerequisite-item" placeholder={text.step3.conditionalInput.placeholder} value={data.customPrerequisites || ''} onChange={e => updateData({
        customPrerequisites: e.target.value
      })} autoFocus />
            <p className="text-xs text-muted-foreground">
              Focus on the single most important thing needed to begin
            </p>
          </div>} onBack={() => prevStep()} onContinue={() => nextStep()} required continueDisabled={data.hasPrerequisites && !data.customPrerequisites} hideHeader hideFooter />;
  };
  const renderStep4 = () => {
    const handleChallengeToggle = (challengeId: string) => {
      const current = data.challengeAreas || [];
      const isSelected = current.includes(challengeId);
      if (isSelected) {
        // Deselect
        const newAreas = current.filter(id => id !== challengeId);
        updateData({
          challengeAreas: newAreas,
          barriers: {
            priority1: newAreas[0],
            priority2: newAreas[1],
            context: data.barriers?.context || ''
          }
        });
      } else {
        // Select (limit to 2)
        if (current.length < 2) {
          const newAreas = [...current, challengeId];
          updateData({
            challengeAreas: newAreas,
            barriers: {
              priority1: newAreas[0],
              priority2: newAreas[1],
              context: data.barriers?.context || ''
            }
          });

          // Generate frequency suggestion when 2 barriers are selected
          if (newAreas.length === 2) {
            generateFrequencySuggestion(newAreas[0], newAreas[1]);
          }
        }
      }
    };
    const generateFrequencySuggestion = (barrier1: string, barrier2: string) => {
      const suggestions: Record<string, FrequencySuggestion> = {
        'time': {
          frequency: 2,
          rationale: "Starting small gives you time to build the habit without feeling overwhelmed."
        },
        'initiation': {
          frequency: 7,
          rationale: "Daily repetition helps overcome starting difficulty and builds momentum."
        },
        'attention': {
          frequency: 3,
          rationale: "A few days per week lets you maintain focus while building the habit gradually."
        },
        'planning': {
          frequency: 3,
          rationale: "Regular but not daily practice helps you develop structure without burnout."
        }
      };
      const suggestion = suggestions[barrier1] || {
        frequency: 3,
        rationale: "This frequency balances consistency with sustainability."
      };
      updateData({
        frequencySuggestion: suggestion
      });
      setShowFrequencySuggestion(true);
    };
    const getBarrierPrompt = (barrierId: string) => {
      const prompts: Record<string, string> = {
        'initiation': "When do you typically struggle to get started? Morning, evening, or specific situations?",
        'time': "When do you typically forget? Morning, evening, or specific situations?",
        'attention': "What typically distracts you during this activity?",
        'planning': "What makes it hard to know what to do next?"
      };
      return prompts[barrierId] || "Tell us more about this challenge";
    };
    const getBarrierPlaceholder = (barrierId: string) => {
      const placeholders: Record<string, string> = {
        'initiation': "e.g., I struggle more in the mornings when I'm tired...",
        'time': "e.g., I forget when I'm distracted by my phone...",
        'attention': "e.g., My phone notifications pull me away...",
        'planning': "e.g., I get stuck after the first step..."
      };
      return placeholders[barrierId] || "Share specific details...";
    };
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    const primaryBarrier = data.challengeAreas?.[0];
    const primaryBarrierLabel = challengeAreas.find(c => c.id === primaryBarrier)?.label;

    // Calculate level context - use whichever assessment has data
    const assessment = data.pmSkillAssessment || data.pmAssessment;
    const levelContext = assessment?.calculatedLevel ? `Starting level: ${getSkillLevelDisplay(assessment).emoji} ${getSkillLevelDisplay(assessment).label}` : undefined;
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} goalTitle={data.goalTitle} goalContext={levelContext} questionIcon="🤔" questionText={getStepTitle()} helpText="Identifying barriers helps create a personalized practice plan" inputType="custom" onBack={() => prevStep()} onContinue={() => nextStep()} hideHeader hideFooter>
        <div className="space-y-3">
          {challengeAreas.map(challenge => {
          const isSelected = data.challengeAreas?.includes(challenge.id) || false;
          const selectionOrder = data.challengeAreas?.indexOf(challenge.id);
          const priorityLabel = selectionOrder === 0 ? '1st' : selectionOrder === 1 ? '2nd' : null;
          return <Card key={challenge.id} className={cn("cursor-pointer transition-all relative shadow-md", isSelected ? "bg-primary/5 ring-2 ring-primary" : "hover:shadow-lg hover:bg-accent/50")} onClick={() => handleChallengeToggle(challenge.id)}>
                {isSelected && priorityLabel && <Badge variant={priorityLabel === '1st' ? 'destructive' : 'outline'} className="absolute top-2 right-2 text-xs">
                    {priorityLabel} Priority
                  </Badge>}
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                    <div className="text-left flex-1">
                      <div className="font-semibold">{challenge.label}</div>
                      <div className="text-sm text-muted-foreground">({challenge.description})</div>
                    </div>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>
        
        {/* Structured barrier context - shows after 2 barriers selected */}
        {data.challengeAreas?.length === 2 && primaryBarrier && <div className="space-y-2 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="barrier-context">Tell us more about "{primaryBarrierLabel}"</Label>
            <p className="text-sm text-muted-foreground">
              {getBarrierPrompt(primaryBarrier)}
            </p>
            <Textarea id="barrier-context" placeholder={getBarrierPlaceholder(primaryBarrier)} value={data.barriers?.context || ''} onChange={e => updateData({
          barriers: {
            ...data.barriers,
            priority1: data.challengeAreas![0],
            priority2: data.challengeAreas![1],
            context: e.target.value
          }
        })} className="resize-none text-lg" rows={3} />
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              Great! Being honest about challenges is the first step to overcoming them. 💪
            </p>
          </div>}
      </QuestionScreen>;
  };
  const renderStep5 = () => {
    const isProject = data.goalType === 'new_skill';
    const isHabitOrPractice = data.goalType === 'reminder' || data.goalType === 'practice';
    return <Card className="w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="pb-6 pt-0">
        {data.goalTitle && <div className="text-center pb-4 border-b mb-6">
            <h2 className="text-xl font-semibold text-foreground tracking-wide truncate">{data.goalTitle}</h2>
          </div>}
        <CardTitle className="text-3xl font-bold text-left">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground text-left text-base mt-2">
          {isProject ? "Set your project timeline and first learning session" : "Set your practice schedule"}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Section A: Recurrence Schedule - Only for Habit/Practice */}
        {isHabitOrPractice && <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <span>Recurrence Schedule</span>
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              How often will {actuallySupportsAnyone ? data.supportedPersonName || 'they' : 'you'} practice or perform this habit?
            </p>

            {/* Quick select options */}
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" className={cn("h-auto py-3 flex flex-col items-center", data.selectedDays?.length === 7 && "border-primary bg-primary/5")} onClick={() => {
              updateData({
                selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                frequency: 7
              });
            }}>
                <span className="font-semibold">Daily</span>
                <span className="text-xs text-muted-foreground">Every day</span>
              </Button>
              
              <Button type="button" variant="outline" className={cn("h-auto py-3 flex flex-col items-center", data.selectedDays?.length === 2 && data.selectedDays.includes('sat') && data.selectedDays.includes('sun') && "border-primary bg-primary/5")} onClick={() => {
              updateData({
                selectedDays: ['sat', 'sun'],
                frequency: 2
              });
            }}>
                <span className="font-semibold">Weekends</span>
                <span className="text-xs text-muted-foreground">Sat & Sun</span>
              </Button>
              
              <Button type="button" variant="outline" className={cn("h-auto py-3 flex flex-col items-center", data.selectedDays && data.selectedDays.length > 0 && data.selectedDays.length !== 7 && !(data.selectedDays.length === 2 && data.selectedDays.includes('sat') && data.selectedDays.includes('sun')) && "border-primary bg-primary/5")}>
                <span className="font-semibold">Custom</span>
                <span className="text-xs text-muted-foreground">Pick days</span>
              </Button>
            </div>
            
            {/* Individual day toggles */}
            <div className="flex gap-1 justify-between">
              {[{
              code: 'mon',
              label: 'M',
              full: 'Monday'
            }, {
              code: 'tue',
              label: 'T',
              full: 'Tuesday'
            }, {
              code: 'wed',
              label: 'W',
              full: 'Wednesday'
            }, {
              code: 'thu',
              label: 'T',
              full: 'Thursday'
            }, {
              code: 'fri',
              label: 'F',
              full: 'Friday'
            }, {
              code: 'sat',
              label: 'S',
              full: 'Saturday'
            }, {
              code: 'sun',
              label: 'S',
              full: 'Sunday'
            }].map(day => {
              const isSelected = data.selectedDays?.includes(day.code) || false;
              return <Button key={day.code} type="button" variant={isSelected ? "default" : "outline"} size="sm" className={cn("flex-1 h-12 font-semibold", isSelected && "bg-primary text-primary-foreground")} onClick={() => {
                const currentDays = data.selectedDays || [];
                const newDays = isSelected ? currentDays.filter(d => d !== day.code) : [...currentDays, day.code];
                updateData({
                  selectedDays: newDays,
                  frequency: newDays.length
                });
              }} title={day.full}>
                    {day.label}
                  </Button>;
            })}
            </div>
            
            {data.selectedDays && data.selectedDays.length > 0 && <div className="text-center p-4 bg-green-50 rounded-lg animate-in fade-in duration-300">
                <p className="text-sm text-green-700 font-medium">
                  ✓ {data.selectedDays.length} {data.selectedDays.length === 1 ? 'day' : 'days'}/week scheduled
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {data.selectedDays.length === 7 ? "Every day of the week" : data.selectedDays.length === 1 ? data.selectedDays[0].toUpperCase() : data.selectedDays.map(d => d.toUpperCase()).join(', ')}
                </p>
                {data.frequencySuggestionAccepted && <p className="text-xs text-green-600 mt-1">
                    Smart choice! Starting with {data.selectedDays.length} days builds confidence without burnout.
                  </p>}
              </div>}
          </div>}
        
        {/* Section B: Time Picker - ALWAYS REQUIRED */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <span>
              {isProject ? "First Learning Session Time" : "Start Time"}
            </span>
            <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            {isProject ? `When will ${actuallySupportsAnyone ? data.supportedPersonName || 'they' : 'you'} take the very first learning step?` : `What time will ${actuallySupportsAnyone ? data.supportedPersonName || 'they' : 'you'} start this activity?`}
          </p>
          <Button type="button" variant="outline" className={cn("w-full justify-start", !data.customTime && "text-muted-foreground")} onClick={() => {
            initTimeDialogFromValue(data.customTime || "08:00");
            setShowTimePicker(true);
          }}>
            <Clock className="h-4 w-4 mr-2" />
            {data.customTime ? formatDisplayTime(data.customTime) : "Pick a time"}
          </Button>
        </div>
        
        {/* Section C: Date Fields - Conditional Layout */}
        {isProject ?
        // PROJECT LAYOUT: Project Completion Date (required) + First Attempt Date (required)
        <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <span>Project Completion Date</span>
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                When {actuallySupportsAnyone ? `will ${data.supportedPersonName || 'they'}` : 'do you'} want to finish learning this skill?
              </p>
              <Popover open={showDatePicker && datePickerType === 'completion'} onOpenChange={open => {
              setShowDatePicker(open);
              if (open) setDatePickerType('completion');
            }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", dateValidationError && "border-destructive text-destructive")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {data.projectCompletionDate ? format(data.projectCompletionDate, 'PPP') : 'Pick completion date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data.projectCompletionDate} onSelect={date => {
                  if (date) {
                    updateData({
                      projectCompletionDate: date
                    });
                    setShowDatePicker(false);
                  }
                }} disabled={date => {
                  // Can't be today or earlier
                  if (date <= new Date()) return true;

                  // Can't be before or same as start date
                  if (date <= data.startDate) return true;
                  return false;
                }} />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <span>First Learning Session Date</span>
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                When will {actuallySupportsAnyone ? data.supportedPersonName || 'they' : 'you'} start working on this?
              </p>
              <Popover open={showDatePicker && datePickerType === 'start'} onOpenChange={open => {
              setShowDatePicker(open);
              if (open) setDatePickerType('start');
            }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", dateValidationError && "border-destructive text-destructive")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(data.startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data.startDate} onSelect={date => {
                  if (date) {
                    updateData({
                      startDate: date
                    });
                    setShowDatePicker(false);
                  }
                }} disabled={date => {
                  // Can't be in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;

                  // Can't be after or equal to completion date
                  if (data.projectCompletionDate && date >= data.projectCompletionDate) return true;
                  return false;
                }} />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 The AI will work backwards from your completion date to create a learning plan
            </div>
          </div> :
        // HABIT/PRACTICE LAYOUT: Start Date (required) + End Date (optional)
        <div className="space-y-3">
            <Label>Timeline</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  Start date
                  <span className="text-destructive">*</span>
                </Label>
                <Popover open={showDatePicker && datePickerType === 'start'} onOpenChange={open => {
                setShowDatePicker(open);
                if (open) setDatePickerType('start');
              }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", dateValidationError && "border-destructive text-destructive")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(data.startDate, 'MMM d')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={data.startDate} onSelect={date => {
                    if (date) {
                      updateData({
                        startDate: date
                      });
                      setShowDatePicker(false);
                    }
                  }} disabled={date => {
                    // Can't be in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;

                    // If end date exists, can't be after or equal to end date
                    if (data.endDate && date >= data.endDate) return true;
                    return false;
                  }} />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">End date (optional)</Label>
                <Popover open={showDatePicker && datePickerType === 'end'} onOpenChange={open => {
                setShowDatePicker(open);
                if (open) setDatePickerType('end');
              }}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", dateValidationError && "border-destructive text-destructive")}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {data.endDate ? format(data.endDate, 'MMM d') : 'Open-ended'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={data.endDate} onSelect={date => {
                    updateData({
                      endDate: date
                    });
                    setShowDatePicker(false);
                  }} disabled={date => {
                    // Must be after start date (at least 1 day later)
                    const minEndDate = new Date(data.startDate);
                    minEndDate.setDate(minEndDate.getDate() + 1);
                    if (date < minEndDate) return true;
                    return false;
                  }} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              💡 Habits are often ongoing - you can leave the end date open
            </div>

            {/* Occurrence Counter for Habit Goals */}
            {data.endDate && data.selectedDays && data.selectedDays.length > 0 && <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Scheduled Occurrences</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                const validation = validateOccurrencesInDateRange(data.startDate, data.endDate, data.selectedDays);
                return validation.occurrenceCount ? `${validation.occurrenceCount} practice session${validation.occurrenceCount > 1 ? 's' : ''} between ${format(data.startDate, 'MMM d')} and ${format(data.endDate, 'MMM d')}` : 'Calculating...';
              })()}
                </p>
              </div>}
          </div>}

        {/* Validation Messages */}
        {dateValidationError && <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{dateValidationError}</p>
          </div>}

        {dateValidationWarning && !dateValidationError && <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">{dateValidationWarning}</p>
          </div>}
        
      </CardContent>
    </Card>;
  };
  const renderStep6 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    const individualName = data.recipient === 'other' ? data.supportedPersonName || 'they' : 'you';

    // Get skill level for intelligent recommendations
    const assessment = data.pmSkillAssessment || data.pmAssessment;
    const skillLevel = assessment?.calculatedLevel || 1;
    const isHighSkill = skillLevel >= 4;

    // (auto-select handled by top-level useEffect)

    const supportOptions = [{
      value: 'none',
      label: data.recipient === 'other' ? 'Independently' : "On my own (I'll work on this independently)",
      description: isHighSkill ? "✅ Recommended - Perfect for your skill level" : data.recipient === 'other' ? `${individualName} will work on this independently` : "Work on this alone"
    }, ...userSupporters.map(supporter => ({
      value: supporter.id,
      label: supporter.name,
      avatar: supporter.profile?.avatar_url,
      description: isHighSkill ? 'Optional: Get feedback if needed' : 'Get support and guidance'
    }))];
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} goalTitle={data.goalTitle} questionIcon="👥" questionText="Who can help you with this?" helpText={isHighSkill ? "You're skilled enough to work independently, but supporters are available if you want feedback" : undefined} inputType="radio" options={supportOptions} value={data.teachingHelper?.helperId || 'none'} onChange={value => {
      if (value === 'none') {
        updateData({
          supportContext: 'alone',
          selectedSupporters: [],
          primarySupporterId: undefined,
          primarySupporterName: undefined,
          teachingHelper: {
            helperId: 'none',
            helperName: 'Independent',
            relationship: 'supporter'
          }
        });
      } else {
        const supporter = userSupporters.find(s => s.id === value);
        updateData({
          supportContext: 'with_supporters',
          selectedSupporters: [value],
          primarySupporterId: value,
          primarySupporterName: supporter?.name,
          teachingHelper: {
            helperId: value,
            helperName: supporter?.name || '',
            relationship: 'supporter'
          }
        });
      }
    }} onBack={() => prevStep()} onContinue={() => nextStep()} onSkip={() => {
      updateData({
        supportContext: 'alone',
        teachingHelper: {
          helperId: 'none',
          helperName: 'Independent',
          relationship: 'supporter'
        }
      });
      nextStep();
    }} hideHeader hideFooter />;
  };
  const renderStep7 = () => {
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    return <Card className="w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="pb-4 pt-0">
        {data.goalTitle && <div className="text-left px-4 pb-4 border-b mb-4">
            <h2 className="text-xl font-semibold">{data.goalTitle}</h2>
          </div>}
        <CardTitle className="text-2xl">🎁 Rewards (Optional)</CardTitle>
        <p className="text-muted-foreground">{text.step7.subtitle}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Card className={cn("cursor-pointer hover:shadow-md transition-all border-2", !data.assignReward ? "border-primary bg-primary/5" : "border-border")} onClick={() => updateData({
          assignReward: false
        })}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {!data.assignReward && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              <div className="text-left flex-1">
                <div className="font-semibold">No reward</div>
                <div className="text-sm text-muted-foreground">Just the satisfaction of completing it</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn("cursor-pointer hover:shadow-md transition-all border-2", data.assignReward ? "border-primary bg-primary/5" : "border-border")} onClick={() => updateData({
          assignReward: true
        })}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {data.assignReward && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
              <div className="text-left flex-1">
                <div className="font-semibold">Add reward</div>
                <div className="text-sm text-muted-foreground">Choose from Reward Bank or create new</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {data.assignReward && <div className="space-y-3 pt-4 border-t">
            <Label>Point value</Label>
            <div className="grid grid-cols-3 gap-2">
              {[{
              value: 5,
              label: 'Small',
              desc: '5 pts'
            }, {
              value: 10,
              label: 'Medium',
              desc: '10 pts'
            }, {
              value: 20,
              label: 'Large',
              desc: '20 pts'
            }].map(point => <Card key={point.value} className={cn("cursor-pointer hover:shadow-md transition-all border-2", data.pointValue === point.value ? "border-primary bg-primary/5" : "border-border")} onClick={() => updateData({
              pointValue: point.value
            })}>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {data.pointValue === point.value && <Check className="h-4 w-4 text-primary" />}
                      <div className="font-semibold text-center">{point.label}</div>
                      <div className="text-xs text-muted-foreground">{point.desc}</div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
  };

  // Progressive Mastery render functions
  const renderPMSkillName = () => {
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">What skill do you want to learn?</CardTitle>
          <p className="text-muted-foreground">
            Be specific! This will help us create the perfect learning plan.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pmSkillName">Skill Name</Label>
            <Input id="pmSkillName" value={data.pmSkillName || ''} onChange={e => updateData({
            pmSkillName: e.target.value
          })} placeholder="e.g., Making breakfast independently" className="text-base" />
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Examples:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Making scrambled eggs</p>
              <p>• Doing my own laundry</p>
              <p>• Managing my weekly schedule</p>
              <p>• Packing my school bag</p>
            </div>
          </div>

          <Button onClick={() => nextStep()} className="w-full" disabled={!data.pmSkillName || data.pmSkillName.trim().length < 3}>
            Next
          </Button>
        </CardContent>
      </Card>;
  };
  const renderPMSkillAssessmentIntro = () => {
    const recipientName = data.recipient === 'other' && data.supportedPersonName ? data.supportedPersonName : 'you';
    const isOther = data.recipient === 'other';
    const handleSimplifiedChoice = (choice: 'confident' | 'learning') => {
      const level = choice === 'confident' ? 5 : 1;
      const levelLabel = choice === 'confident' ? 'Independent' : 'Beginner';
      const assessmentData = {
        q1_experience: level,
        q2_confidence: level,
        q3_help_needed: level,
        calculatedLevel: level,
        levelLabel: levelLabel,
        skipped: true,
        simplifiedChoice: choice
      };
      updateData({
        pmSkillAssessment: assessmentData,
        pmAssessment: assessmentData // Set both for consistency
      });

      // Skip to step 8 (barriers) - bypassing detailed Q1-Q3
      setCurrentStep(8);
    };
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary" />
              </div>
            </div>

            {/* Main message */}
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">
                Let's check how good {isOther ? recipientName : 'you are'} {isOther ? 'is' : 'are'} at performing this goal independently
              </h1>
              <p className="text-muted-foreground text-lg">
                We can either do a quick 2-click assessment or ask 3 detailed questions
              </p>
            </div>

            {/* Three choice options */}
            <div className="space-y-3">
              <div onClick={() => handleSimplifiedChoice('confident')} className="w-full p-4 flex items-start gap-3 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:bg-accent/50">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-left block">I'm already confident doing this</span>
                  <p className="text-sm text-muted-foreground text-left">
                    {isOther ? 'They can' : 'I can'} do this independently without help
                  </p>
                </div>
              </div>

              <div onClick={() => handleSimplifiedChoice('learning')} className="w-full p-4 flex items-start gap-3 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:bg-accent/50">
                <GraduationCap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-left block">I'm still learning this skill</span>
                  <p className="text-sm text-muted-foreground text-left">
                    {isOther ? 'They need' : 'I need'} practice and support to improve
                  </p>
                </div>
              </div>

              <div onClick={() => setCurrentStep(5)} className="w-full p-4 flex items-start gap-3 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg hover:bg-accent/50">
                <ClipboardList className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-semibold text-left block">Let me answer detailed questions</span>
                  <p className="text-sm text-muted-foreground text-left">
                    I want to provide more specific information (3 questions)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>;
  };
  const renderHabitSchedulingIntro = () => {
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <Target className="h-10 w-10 text-green-500" />
              </div>
            </div>

            {/* Main message */}
            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">
                Let's start building the plan to crush this goal! 💪
              </h1>
              <p className="text-muted-foreground text-lg">
                You've got the skills - now let's create a schedule that works for you
              </p>
            </div>

            {/* What's next */}
            <div className="bg-green-500/5 rounded-lg p-4 text-left border border-green-500/10">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Next up:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Set your practice schedule</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Choose who's in your corner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Review and launch your goal</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>;
  };
  const renderPMSkillAssessment = () => {
    return <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <SkillAssessmentWizard goalTitle={data.pmSkillName || data.goalTitle || 'this skill'} onComplete={assessment => {
        updateData({
          pmSkillAssessment: assessment
        });
        nextStep();
      }} onBack={() => setCurrentStep(currentStep! - 1)} />
      </div>;
  };
  const renderPMTargetFrequency = () => {
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">How often would you eventually like to practice?</CardTitle>
          <p className="text-muted-foreground">Don't worry, we'll start slower and build up gradually!</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(freq => <Card key={freq} className={cn("cursor-pointer hover:shadow-md transition-all border-2", data.pmTargetFrequency === freq ? "border-primary bg-primary/5" : "border-border")} onClick={() => updateData({
            pmTargetFrequency: freq
          })}>
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{freq}</span>
                  <span className="text-xs">day{freq > 1 ? 's' : ''}/wk</span>
                </CardContent>
              </Card>)}
          </div>
        </CardContent>
      </Card>;
  };
  const renderPMTeachingHelper = () => {
    // Get skill level from the correct source based on goalType
    const assessment = data.goalType === 'progressive_mastery' ? data.pmAssessment : data.pmSkillAssessment;
    const skillLevel = assessment?.calculatedLevel || 1;

    // Determine recommended option based on skill level
    const getRecommendation = () => {
      if (!assessment) return 'helper'; // Default to helper if no assessment

      const level = assessment.calculatedLevel;
      if (level <= 2) {
        // Beginner/Novice: Strongly recommend helper
        return 'helper';
      } else if (level >= 4) {
        // Proficient/Advanced: On my own is fine
        return 'solo';
      } else {
        // Intermediate: Slight preference for helper but both are good
        return 'balanced';
      }
    };
    const recommendation = getRecommendation();
    const shouldEmphasizeHelper = recommendation === 'helper';
    const shouldEmphasizeSolo = recommendation === 'solo';
    const levelContext = assessment ? `Starting level: ${getSkillLevelDisplay(assessment).emoji} ${getSkillLevelDisplay(assessment).label}` : undefined;
    const helpText = skillLevel <= 2 ? "🎯 We strongly recommend selecting a helper to guide you" : skillLevel >= 4 ? "You're ready to practice independently! Helpers are optional for feedback." : "Choose how you'd like to approach this goal";
    return <QuestionScreen currentStep={currentStep} totalSteps={totalSteps} goalTitle={data.goalTitle} goalContext={levelContext} questionIcon="👥" questionText="Who can help you learn this skill?" helpText={helpText} inputType="custom" onBack={prevStep} onContinue={nextStep} continueDisabled={!pmSelectedHelperId && pmSelectedHelperId !== 'none'} hideHeader hideFooter>
        <div className="space-y-3">
          {/* Recommendation banner for beginners */}
          {skillLevel <= 2 && <div className="p-4 rounded-lg border-2 bg-amber-50/50 border-amber-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getSkillLevelDisplay(assessment).emoji}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">🎯 Recommended: Work with a helper</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since you're just starting out, having guidance will help you learn faster and more safely.
                  </p>
                </div>
              </div>
            </div>}
          
          {/* Conditionally render order based on skill level */}
          {skillLevel <= 2 ? <>
              {/* Helpers first for beginners */}
              {userSupporters.length > 0 ? userSupporters.map(supporter => <Card key={supporter.id} className={cn("cursor-pointer hover:shadow-md transition-all border-2", pmSelectedHelperId === supporter.id ? "border-primary bg-primary/5" : "border-border", shouldEmphasizeHelper && "ring-2 ring-primary/20")} onClick={() => setPMSelectedHelperId(supporter.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {pmSelectedHelperId === supporter.id && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={supporter.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {supporter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <div className="font-medium flex items-center gap-2">
                            👤 {supporter.name}
                            {shouldEmphasizeHelper && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {skillLevel <= 2 ? "Will guide you step-by-step" : skillLevel === 3 ? "Can help accelerate your progress" : "Optional: Get Feedback From Me"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>) : <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No helpers available yet
                  </p>
                  {skillLevel <= 2 && <p className="text-xs text-amber-600">
                      💡 Consider inviting a supporter from Settings to help you get started
                    </p>}
                </div>}
              
              {/* "On my own" last for beginners */}
              <Card className={cn("cursor-pointer hover:shadow-md transition-all border-2", pmSelectedHelperId === 'none' ? "border-primary bg-primary/5" : "border-border", shouldEmphasizeSolo && "ring-2 ring-primary/20", skillLevel <= 2 && "opacity-60 hover:opacity-100 border-amber-300")} onClick={() => setPMSelectedHelperId('none')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {pmSelectedHelperId === 'none' && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center gap-2">
                        🦸 On my own
                        {shouldEmphasizeSolo && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {skillLevel >= 4 ? "Perfect for your skill level - practice independently" : skillLevel === 3 ? "You can manage this on your own" : "⚠️ Consider starting with a helper first"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </> : <>
              {/* "On my own" first for intermediate/advanced */}
              <Card className={cn("cursor-pointer hover:shadow-md transition-all border-2", pmSelectedHelperId === 'none' ? "border-primary bg-primary/5" : "border-border", shouldEmphasizeSolo && "ring-2 ring-primary/20")} onClick={() => setPMSelectedHelperId('none')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {pmSelectedHelperId === 'none' && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                    <div className="text-left flex-1">
                      <div className="font-medium flex items-center gap-2">
                        🦸 On my own
                        {shouldEmphasizeSolo && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {skillLevel >= 4 ? "Perfect for your skill level - practice independently" : skillLevel === 3 ? "You can manage this on your own" : "I'll practice independently (may take longer)"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Helpers second */}
              {userSupporters.length > 0 && userSupporters.map(supporter => <Card key={supporter.id} className={cn("cursor-pointer hover:shadow-md transition-all border-2", pmSelectedHelperId === supporter.id ? "border-primary bg-primary/5" : "border-border", shouldEmphasizeHelper && "ring-2 ring-primary/20")} onClick={() => setPMSelectedHelperId(supporter.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {pmSelectedHelperId === supporter.id && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={supporter.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {supporter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1">
                          <div className="font-medium flex items-center gap-2">
                            👤 {supporter.name}
                            {shouldEmphasizeHelper && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {skillLevel <= 2 ? "Will guide you step-by-step" : skillLevel === 3 ? "Can help accelerate your progress" : "Optional: Get feedback from me"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
            </>}
        </div>
      </QuestionScreen>;
  };
  const renderPMDuration = () => {
    return <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">When will you practice?</CardTitle>
          <p className="text-muted-foreground">Choose your practice schedule</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Start Date - Required */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-base font-medium">
              <span>Start Date</span>
              <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left h-12">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {data.startDate ? format(data.startDate, 'PPP') : 'Pick start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={data.startDate} onSelect={date => date && updateData({
                startDate: date
              })} disabled={date => date < new Date()} />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date - Optional */}
          <div className="space-y-2">
            <Label className="text-base font-medium">End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left h-12">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {data.endDate ? format(data.endDate, 'PPP') : 'Open-ended (no end date)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={data.endDate} onSelect={date => updateData({
                endDate: date || undefined
              })} disabled={date => !data.startDate || date <= data.startDate} />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              💡 Leave open-ended if you want to practice indefinitely
            </p>
          </div>

          {/* Calculate duration in weeks if both dates selected */}
          {data.startDate && data.endDate && <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">
                Duration: {Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))} weeks
              </p>
            </div>}
        </CardContent>
      </Card>;
  };
  const renderConfirmStep = () => {
    const isProposal = isSupporter && data.recipient === 'other' && !canAssignDirectly;

    // Fix: Use current field names
    const motivationLabel = data.motivation; // Free text from PM step 2 or habit motivation
    const categoryLabel = categories.find(c => c.id === data.category)?.title;

    // Infer goal type from flow context
    const goalTypeLabel = data.goalType === 'progressive_mastery' ? 'Progressive Mastery' : 'Habit';

    // Fix: Read barriers from new structure
    const barrier1Label = data.barriers?.priority1 ? challengeAreas.find(c => c.id === data.barriers.priority1)?.label : null;
    const barrier2Label = data.barriers?.priority2 ? challengeAreas.find(c => c.id === data.barriers.priority2)?.label : null;
    const challengeLabels = [barrier1Label, barrier2Label].filter(Boolean);

    // Fix: Handle PM frequency from practice plan
    const frequencyLabel = data.pmPracticePlan ? `${data.pmPracticePlan.startingFrequency}x per week` : frequencies.find(f => f.value === data.frequency)?.label;
    const supportContextLabel = supportContexts.find(s => s.id === data.supportContext)?.label;

    // Abbreviate days for compact display
    const dayAbbreviations: Record<string, string> = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    const abbreviatedDays = data.selectedDays?.map(d => dayAbbreviations[d] || d).join(', ');

    // Truncate long text
    const truncate = (text: string | undefined, maxLen: number) => {
      if (!text) return text;
      return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    };
    const text = data.recipient === 'other' ? getSupporterFlowText(data.supportedPersonName) : INDIVIDUAL_FLOW_TEXT;
    return <>
      
      <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
        <CardHeader className="pb-4 pt-6">
          {/* Main title left-aligned */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">Commitment & Activation</h1>
            <p className="text-muted-foreground">{text.confirm.subtitle}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Goal Summary in 2-column grid */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <span>✨</span>
              <span>Goal Summary</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                  {/* Skill Assessment - Always first if exists */}
                  {data.pmAssessment && <div className="rounded-2xl bg-pink-50/50 p-4 border border-gray-200 min-h-[160px]">
                      <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                        Skill Assessment
                      </h4>
                      <div className="space-y-1.5">
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Starting Level:</span>{' '}
                          <span className="font-semibold">
                            {(() => {
                        const {
                          label,
                          emoji
                        } = getSkillLevelDisplay(data.pmAssessment);
                        return `${label} ${emoji}`;
                      })()}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Experience:</span>{' '}
                          <span className="font-medium">{getExperienceLabel(data.pmAssessment.q1_experience)}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Confidence:</span>{' '}
                          <span className="font-medium">{getConfidenceLabel(data.pmAssessment.q2_confidence)}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Help Needed:</span>{' '}
                          <span className="font-medium">{getHelpNeededLabel(data.pmAssessment.q3_help_needed)}</span>
                        </p>
                      </div>
                    </div>}

                  {/* The Goal */}
                  <div className="rounded-2xl bg-blue-50/50 p-4 border border-gray-200 min-h-[160px]">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">The Goal</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm">
                        <span className="text-muted-foreground text-xs">Goal:</span>{' '}
                        <span className="font-semibold">{data.goalTitle}</span>
                      </p>
                      {categoryLabel && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Category:</span>{' '}
                          <span className="font-medium">{categoryLabel}</span>
                        </p>}
                      {motivationLabel && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Why:</span>{' '}
                          <span className="font-medium">{truncate(motivationLabel, 40)}</span>
                        </p>}
                      {goalTypeLabel && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Type:</span>{' '}
                          <span className="font-medium">{goalTypeLabel}</span>
                        </p>}
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="rounded-2xl bg-orange-50/50 p-4 border border-gray-200 min-h-[160px]">
                    <h4 className="text-sm font-semibold text-orange-700 mb-2">Challenges</h4>
                    <div className="space-y-1.5">
                      {/* Show barriers priorities */}
                      {data.barriers?.priority1 && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">1st Priority:</span>{' '}
                          <span className="font-medium">
                            {challengeAreas.find(c => c.id === data.barriers.priority1)?.label}
                          </span>
                        </p>}
                      {data.barriers?.priority2 && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">2nd Priority:</span>{' '}
                          <span className="font-medium">
                            {challengeAreas.find(c => c.id === data.barriers.priority2)?.label}
                          </span>
                        </p>}
                      {/* Show barriers details text */}
                      {data.barriers?.details && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Details:</span>{' '}
                          <span className="font-medium">{truncate(data.barriers.details, 50)}</span>
                        </p>}
                      {/* Show prerequisites status */}
                      {data.prerequisites && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Prerequisites:</span>{' '}
                          <span className="font-medium">
                            {data.prerequisites.ready ? 'Ready to start' : 'Need some things'}
                            {!data.prerequisites.ready && data.prerequisites.needs && ` - ${truncate(data.prerequisites.needs, 30)}`}
                          </span>
                        </p>}
                    </div>
                  </div>

                  {/* When and How Often */}
                  <div className="rounded-2xl bg-emerald-50/50 p-4 border border-gray-200 min-h-[160px]">
                    <h4 className="text-sm font-semibold text-emerald-700 mb-2">When & How Often</h4>
                    <div className="space-y-1.5">
                      {data.startDate && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Starts:</span>{' '}
                          <span className="font-medium">{new Date(data.startDate).toLocaleDateString()}</span>
                        </p>}
                      {data.endDate && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Ends:</span>{' '}
                          <span className="font-medium">{new Date(data.endDate).toLocaleDateString()}</span>
                        </p>}
                      {frequencyLabel && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Frequency:</span>{' '}
                          <span className="font-medium">{frequencyLabel}</span>
                        </p>}
                      {abbreviatedDays && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Days:</span>{' '}
                          <span className="font-medium">{abbreviatedDays}</span>
                        </p>}
                      {(data.timeOfDay || data.customTime) && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Time:</span>{' '}
                          <span className="font-medium">{data.customTime ? formatDisplayTime(data.customTime) : data.timeOfDay}</span>
                        </p>}
                      {data.pmPracticePlan?.startTime && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Practice Time:</span>{' '}
                          <span className="font-medium">{formatDisplayTime(data.pmPracticePlan.startTime)}</span>
                        </p>}
                      {data.pmPracticePlan?.sendAdvanceReminder && data.pmPracticePlan?.startTime && <p className="text-sm">
                          <span className="text-muted-foreground text-xs">Reminder:</span>{' '}
                          <span className="font-medium">10 min before ({(() => {
                        const [hours, minutes] = data.pmPracticePlan.startTime.split(':');
                        const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
                        const reminderMinutes = totalMinutes >= 10 ? totalMinutes - 10 : totalMinutes + 1440 - 10;
                        const reminderHour = Math.floor(reminderMinutes / 60) % 24;
                        const reminderMin = reminderMinutes % 60;
                        const period = reminderHour >= 12 ? 'PM' : 'AM';
                        const displayHour = reminderHour % 12 || 12;
                        return `${displayHour}:${String(reminderMin).padStart(2, '0')} ${period}`;
                      })()})</span>
                        </p>}
                    </div>
                  </div>

                  {/* The Team */}
                  <div className="rounded-2xl bg-purple-50/50 p-4 border border-gray-200 min-h-[160px]">
                    <h4 className="text-sm font-semibold text-purple-700 mb-2">The Team</h4>
                    <div className="space-y-1.5">
                      {/* PM flow: show helper */}
                      {data.pmHelper && <>
                          <p className="text-sm">
                            <span className="text-muted-foreground text-xs">Learning:</span>{' '}
                            <span className="font-medium">
                              {data.pmHelper.helperId === 'none' ? 'Independently' : 'With support'}
                            </span>
                          </p>
                          {data.pmHelper.helperId !== 'none' && <p className="text-sm">
                              <span className="text-muted-foreground text-xs">Helper:</span>{' '}
                              <span className="font-medium">{data.pmHelper.helperName || 'Helper'}</span>
                            </p>}
                        </>}
                      
                      {/* Habit flow: show support context and supporters */}
                      {!data.pmHelper && <>
                          <p className="text-sm">
                            <span className="text-muted-foreground text-xs">Working:</span>{' '}
                            <span className="font-medium">
                              {data.supportContext === 'alone' ? 'Independently' : supportContextLabel || 'With support'}
                            </span>
                          </p>
                          {data.supportContext !== 'alone' && data.primarySupporterName && <p className="text-sm">
                              <span className="text-muted-foreground text-xs">Supporter:</span>{' '}
                              <span className="font-medium">
                                {data.primarySupporterName}
                              </span>
                            </p>}
                          {data.selectedSupporters && data.selectedSupporters.length > 1 && <p className="text-sm">
                              <span className="text-muted-foreground text-xs">Additional:</span>{' '}
                              <span className="font-medium">
                                {data.selectedSupporters.length - 1} 
                                {data.selectedSupporters.length - 1 === 1 ? ' supporter' : ' supporters'}
                              </span>
                            </p>}
                        </>}
                    </div>
                  </div>
                </div>
          </div>

          {/* Proposal notice */}
          {isProposal && <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 This goal will be sent as a proposal since you don't have direct assignment permissions for {data.supportedPersonName}.
              </p>
            </div>}

          {/* Call-to-Action */}
              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  Activate Plan
                </Button>
              </div>
        </CardContent>
      </Card>
    </>;
  };

  // State for interstitial screen
  const [showingResultsInterstitial, setShowingResultsInterstitial] = useState(false);
  const [interstitialData, setInterstitialData] = useState<{
    level: number;
    label: string;
  } | null>(null);
  const [showSchedulingIntro, setShowSchedulingIntro] = useState(true);

  // Auto-select independent helper for high-skill habit flow at helper step
  useEffect(() => {
    const assessment = data.pmSkillAssessment || data.pmAssessment;
    const level = assessment?.calculatedLevel || 1;
    if (data.goalType !== 'progressive_mastery' && currentStep === 10 && level >= 4 && !data.teachingHelper?.helperId) {
      updateData({
        supportContext: 'alone',
        selectedSupporters: [],
        teachingHelper: {
          helperId: 'none',
          helperName: 'Independent',
          relationship: 'supporter'
        }
      });
    }
  }, [data.goalType, currentStep, data.pmSkillAssessment?.calculatedLevel, data.pmAssessment?.calculatedLevel, data.teachingHelper?.helperId]);

  // Props for PM micro-steps
  const pmStepProps = {
    data,
    updateData,
    goNext: nextStep,
    goBack: prevStep,
    currentStep: currentStep || 0,
    totalSteps: 10,
    userSupporters,
    currentUserId: '',
    goalTitle: data.goalTitle,
    setShowingResultsInterstitial,
    interstitialData,
    showingResultsInterstitial
  };
  const renderCurrentStep = () => {
    // Progressive Mastery flow intercepts after goal type selection
    if (data.goalType === 'progressive_mastery') {
      switch (currentStep) {
        case 0:
          return renderStep0();
        // Who is this for
        case 1:
          return renderStep1();
        // Goal description + type
        case 2:
          return <PMStep2_Motivation {...pmStepProps} />;
        // Motivation
        case 3:
          return <PMStep3_Prerequisites {...pmStepProps} />;
        // Prerequisites
        case 4:
          return renderPMSkillAssessmentIntro();
        // NEW: Intro screen
        case 5:
          return <PMStep5_Experience {...pmStepProps} />;
        // Experience
        case 6:
          return <PMStep6_Confidence {...pmStepProps} />;
        // Confidence
        case 7:
          return <PMStep7_HelpNeeded {...pmStepProps} />;
        // Help Needed + Calculate Level
        case 8:
          return <PMStep4_Barriers {...pmStepProps} onSwitchToHabit={() => switchGoalType('reminder')} />;
        // Barriers
        case 9:
          return renderPMTeachingHelper();
        // Helper Selection with intelligent recommendations
        case 10:
          return <PMStep9_PracticePlan {...pmStepProps} />;
        // Practice frequency + dates
        case 11:
          return renderConfirmStep();
        // PM: Summary
        default:
          return null;
      }
    }

    // Regular flow (habit goals)
    switch (currentStep) {
      case 0:
        return renderStep0();
      // Who is this for (supporters only)
      case 1:
        return renderStep1();
      // Goal description + type
      case 2:
        return renderStep2();
      // Motivation
      case 3:
        return renderStep3();
      // Prerequisites
      case 4:
        return renderPMSkillAssessmentIntro();
      // NEW: Skill Assessment Intro
      case 5:
        return <PMStep5_Experience {...pmStepProps} />;
      // Experience assessment
      case 6:
        return <PMStep6_Confidence {...pmStepProps} />;
      // Confidence assessment
      case 7:
        return <PMStep7_HelpNeeded {...pmStepProps} />;
      // Help Needed + Results
      case 8:
        return renderStep4();
      // Challenge areas (barriers)
      case 9:
        {
          // Dynamic branching based on skill level
          const skillLevel = data.pmSkillAssessment?.calculatedLevel || 1;
          if (skillLevel >= 4) {
            // High skill: continue with habit flow - show intro first, then practice schedule
            return showSchedulingIntro ? renderHabitSchedulingIntro() : <PMStep9_PracticePlan {...pmStepProps} />;
          } else {
            // Low skill: switch to PM and show helper selection
            return renderPMTeachingHelper();
          }
        }
      case 10:
        {
          const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
          if (skillLevel >= 4) {
            // Habit flow: support context
            return renderStep6();
          } else {
            // PM flow: practice schedule
            return <PMStep9_PracticePlan {...pmStepProps} />;
          }
        }
      case 11:
        {
          const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
          if (skillLevel >= 4) {
            // Habit flow: rewards (supporters only) or confirm
            return isSupporter ? renderStep7() : renderConfirmStep();
          } else {
            // PM flow: confirm
            return renderConfirmStep();
          }
        }
      case 12:
        return renderConfirmStep();
      // Final confirm (habit flow with supporters)
      default:
        return null;
    }
  };
  // Update last step index based on goal type and skill level
  const skillLevel = (data.goalType === 'progressive_mastery' ? data.pmAssessment?.calculatedLevel : data.pmSkillAssessment?.calculatedLevel) || 1;
  const lastStepIndex = (() => {
    if (data.goalType === 'progressive_mastery') {
      return 11;
    } else {
      // Habit flow
      if (skillLevel >= 4) {
        return isSupporter ? 12 : 11;
      } else {
        return 11; // Low skill switches to PM flow
      }
    }
  })();
  const totalSteps = (() => {
    if (data.goalType === 'progressive_mastery') {
      return 12;
    } else {
      // Habit flow
      if (skillLevel >= 4) {
        return isSupporter ? 13 : 12;
      } else {
        return 12; // Low skill switches to PM flow
      }
    }
  })();
  const currentStepDisplay = isSupporter ? currentStep! + 1 : currentStep!;
  const isLastStep = currentStep === lastStepIndex;

  // Get current section information based on step and role
  const getStepSection = () => {
    // Get skill level for dynamic labeling
    const assessment = data.pmSkillAssessment || data.pmAssessment;
    const skillLevel = assessment?.calculatedLevel || 1;

    // Progressive Mastery flow
    if (data.goalType === 'progressive_mastery') {
      if (currentStep! >= 0 && currentStep! <= 3) return {
        label: 'The Goal',
        index: 1,
        total: 5
      };
      if (currentStep === 4 || currentStep === 5 || currentStep === 6 || currentStep === 7) return {
        label: 'Skill Assessment',
        index: 2,
        total: 5
      };
      if (currentStep === 8) return {
        label: 'Context & Challenges',
        index: 3,
        total: 5
      };
      if (currentStep === 9 || currentStep === 10) return {
        label: 'Support & Practice Plan',
        index: 4,
        total: 5
      };
      if (currentStep === 11) return {
        label: 'Review & Confirm',
        index: 5,
        total: 5
      };
    }
    if (actuallySupportsAnyone) {
      // Supporter flow - 5 sections (habit flow)
      if (currentStep! >= 0 && currentStep! <= 3) return {
        label: 'The Goal',
        index: 1,
        total: 5
      };
      if (currentStep === 4 || currentStep === 5 || currentStep === 6 || currentStep === 7) return {
        label: 'Skill Assessment',
        index: 2,
        total: 5
      };
      if (currentStep === 8) return {
        label: 'Challenges',
        index: 3,
        total: 5
      };
      // Step 9 is dynamic based on skill level
      if (currentStep === 9) {
        return skillLevel >= 4 ? {
          label: 'When and How Often',
          index: 4,
          total: 5
        } : {
          label: 'The Team',
          index: 4,
          total: 5
        };
      }
      if (currentStep === 10 || currentStep === 11) return {
        label: 'Commitment & Activation',
        index: 5,
        total: 5
      };
    } else {
      // Non-supporter flow - 5 sections (habit flow)
      if (currentStep! >= 1 && currentStep! <= 3) return {
        label: 'The Goal',
        index: 1,
        total: 5
      };
      if (currentStep === 4 || currentStep === 5 || currentStep === 6 || currentStep === 7) return {
        label: 'Skill Assessment',
        index: 2,
        total: 5
      };
      if (currentStep === 8) return {
        label: 'Challenges',
        index: 3,
        total: 5
      };
      // Step 9 is dynamic based on skill level
      if (currentStep === 9) {
        return skillLevel >= 4 ? {
          label: 'When and How Often',
          index: 4,
          total: 5
        } : {
          label: 'The Team',
          index: 4,
          total: 5
        };
      }
      if (currentStep === 10) return {
        label: 'Your First Steps',
        index: 5,
        total: 5
      };
      if (currentStep === 11) return {
        label: 'Commitment & Activation',
        index: 5,
        total: 5
      };
    }
    return {
      label: '',
      index: 0,
      total: 5
    };
  };
  const section = getStepSection();

  // Handle Continue button with interstitial logic for skill assessment
  const handleContinue = () => {
    // Special handling for skill assessment (step 7 in PM, step 6 in regular)
    const isSkillAssessmentComplete = data.goalType === 'progressive_mastery' && currentStep === 7 || data.goalType !== 'progressive_mastery' && currentStep === 7;
    if (isSkillAssessmentComplete) {
      // Use whichever assessment has data
      const assessment = data.pmAssessment || data.pmSkillAssessment;
      if (assessment?.q1_experience && assessment?.q2_confidence && assessment?.q3_help_needed) {
        const level = progressiveMasteryService.calculateSkillLevel({
          q1: assessment.q1_experience,
          q2: assessment.q2_confidence,
          q3: assessment.q3_help_needed
        });
        const label = progressiveMasteryService.getSkillLevelLabel(level);

        // Store calculated values for interstitial
        setInterstitialData({
          level,
          label
        });
        if (data.goalType === 'progressive_mastery') {
          updateData({
            pmAssessment: {
              ...data.pmAssessment,
              calculatedLevel: level,
              levelLabel: label
            }
          });
        } else {
          // Habit flow - keep both assessment objects in sync
          updateData({
            pmSkillAssessment: {
              ...data.pmSkillAssessment,
              calculatedLevel: level,
              levelLabel: label
            },
            pmAssessment: {
              ...data.pmAssessment,
              calculatedLevel: level,
              levelLabel: label
            }
          });
        }
        setShowingResultsInterstitial(true);
        setTimeout(() => {
          setShowingResultsInterstitial(false);
          setInterstitialData(null);
          nextStep();
        }, 3000);
        return;
      }
    }

    // Special handling for helper selection (step 9 in PM)
    if (data.goalType === 'progressive_mastery' && currentStep === 9) {
      if (pmSelectedHelperId && pmSelectedHelperId !== 'none') {
        const helper = userSupporters.find(s => s.id === pmSelectedHelperId);
        updateData({
          pmHelper: {
            helperId: pmSelectedHelperId,
            helperName: helper?.name || 'Helper'
          }
        });
      } else {
        updateData({
          pmHelper: {
            helperId: 'none',
            helperName: 'Independent'
          }
        });
      }
    }

    // Special handling for skill level branching in habit flow (step 8 → 9 transition)
    if (data.goalType !== 'progressive_mastery' && currentStep === 8) {
      const skillLevel = data.pmSkillAssessment?.calculatedLevel || 1;
      if (skillLevel <= 3) {
        // Switch to Progressive Mastery - copy skill assessment data properly
        updateData({
          goalType: 'progressive_mastery',
          pmAssessment: {
            q1_experience: data.pmSkillAssessment?.q1_experience,
            q2_confidence: data.pmSkillAssessment?.q2_confidence,
            q3_help_needed: data.pmSkillAssessment?.q3_help_needed,
            calculatedLevel: data.pmSkillAssessment?.calculatedLevel,
            levelLabel: data.pmSkillAssessment?.levelLabel
          },
          barriers: data.barriers,
          challengeAreas: data.challengeAreas
        });
      }
    }

    // Special handling for scheduling intro in habit flow (step 9)
    if (data.goalType !== 'progressive_mastery' && currentStep === 9) {
      const skillLevel = data.pmSkillAssessment?.calculatedLevel || 1;
      if (skillLevel >= 4 && showSchedulingIntro) {
        setShowSchedulingIntro(false);
        return; // Don't advance step, just hide intro
      }

      // Save helper selection for PM branch
      if (skillLevel <= 3) {
        if (pmSelectedHelperId && pmSelectedHelperId !== 'none') {
          const helper = userSupporters.find(s => s.id === pmSelectedHelperId);
          updateData({
            pmHelper: {
              helperId: pmSelectedHelperId,
              helperName: helper?.name || 'Helper'
            }
          });
        } else {
          updateData({
            pmHelper: {
              helperId: 'none',
              helperName: 'Independent'
            }
          });
        }
      }
    }
    nextStep();
  };

  // Show loading state while determining initial step
  if (currentStep === null) {
    return <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto py-6 space-y-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Header - fixed with safe area */}
        <div className="fixed left-0 right-0 z-50 bg-card/80 backdrop-blur border-b border-border px-4 pb-4 pt-4" style={{
        top: 'env(safe-area-inset-top, 0px)'
      }}>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={currentStep === (isSupporter ? 0 : 1) ? onCancel : prevStep} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{section.label}</h1>
              <p className="text-sm text-muted-foreground">
                Step {section.index} of {section.total}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{
            width: `${section.index / section.total * 100}%`
          }} />
          </div>
        </div>
        
        {/* Current Step - fills remaining space */}
        <div className="flex-1 overflow-auto px-4 pb-24" style={{
        paddingTop: '72px'
      }}>
          {renderCurrentStep()}
        </div>
        
        {/* Continue button - fixed bottom-right with safe area */}
        {!isLastStep && !showingResultsInterstitial && <div className="fixed right-4 z-50" style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'
      }}>
            <Button onClick={handleContinue} disabled={!canProceed()} className="h-12 px-8 text-lg font-semibold shadow-lg">
              Continue
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>}
        
        {/* Category Selection Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a category</DialogTitle>
            </DialogHeader>
            
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({
                length: Math.ceil(categories.length / 3)
              }, (_, i) => <CarouselItem key={i}>
                    <div className="grid grid-cols-1 gap-4 p-1">
                      {categories.slice(i * 3, (i + 1) * 3).map(category => <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect(category.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <category.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">{category.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                                <p className="text-xs text-primary mt-2">Examples: {category.examples}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </CarouselItem>)}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </DialogContent>
        </Dialog>
        
        {/* Supporter Selection Dialog */}
        <Dialog open={showSupporterDialog} onOpenChange={setShowSupporterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Your Allies</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {userSupporters.length === 0 ? <div className="text-center py-8 px-4">
                  <p className="text-muted-foreground mb-2">
                    You have no supporters yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can invite people to cheer for you in the Community tab.
                  </p>
                </div> : <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {userSupporters.map(supporter => {
                const isSelected = (data.selectedSupporters || []).includes(supporter.id);
                return <Card key={supporter.id} className={cn("cursor-pointer hover:shadow-md transition-all border-2", isSelected ? "border-primary bg-primary/5" : "border-border")} onClick={() => {
                  const currentSelection = data.selectedSupporters || [];
                  const isSelected = currentSelection.includes(supporter.id);
                  const newSelection = isSelected ? currentSelection.filter(id => id !== supporter.id) : [...currentSelection, supporter.id];

                  // Auto-select primary supporter if only one is selected
                  let primarySupporterId = data.primarySupporterId;
                  let primarySupporterName = data.primarySupporterName;
                  if (newSelection.length === 1) {
                    // Auto-set as primary if only one supporter selected
                    primarySupporterId = newSelection[0];
                    primarySupporterName = userSupporters.find(s => s.id === newSelection[0])?.name;
                  } else if (isSelected && supporter.id === data.primarySupporterId) {
                    // Clear primary if deselecting the current primary
                    primarySupporterId = undefined;
                    primarySupporterName = undefined;
                  }
                  updateData({
                    selectedSupporters: newSelection,
                    supportContext: newSelection.length > 0 ? 'with_supporters' : 'alone',
                    primarySupporterId,
                    primarySupporterName
                  });
                }}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={supporter.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {supporter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1">{supporter.name}</span>
                          </div>
                        </CardContent>
                      </Card>;
              })}
                </div>}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSupporterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSupporterDialog(false)} disabled={!data.selectedSupporters || data.selectedSupporters.length === 0}>
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Time Picker Dialog */}
        <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Pick a time</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
              <Label>Select time</Label>
              <div className="grid grid-cols-3 gap-3">
                {/* Hour */}
                <Select value={tempHour} onValueChange={setTempHour}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {[...Array(12)].map((_, i) => {
                    const h = (i + 1).toString().padStart(2, "0");
                    return <SelectItem key={h} value={h}>{h}</SelectItem>;
                  })}
                  </SelectContent>
                </Select>

                {/* Minute */}
                <Select value={tempMinute} onValueChange={setTempMinute}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {Array.from({
                    length: 12
                  }, (_, i) => (i * 5).toString().padStart(2, "0")).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* AM/PM */}
                <Select value={tempPeriod} onValueChange={(v: "AM" | "PM") => setTempPeriod(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                updateData({
                  customTime: '',
                  timeOfDay: undefined
                });
                setShowTimePicker(false);
              }}>
                  Clear
                </Button>
                <Button className="flex-1" disabled={!tempHour || !tempMinute || !tempPeriod} onClick={() => {
                const time24 = build24hTime(parseInt(tempHour, 10), tempMinute, tempPeriod);
                updateData({
                  customTime: time24,
                  timeOfDay: 'custom'
                });
                setShowTimePicker(false);
              }}>
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Browse Goals Modal */}
        {renderBrowseModal()}
      </div>
    </div>;
};