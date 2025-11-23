import type { EfPillarId, EfContext } from '@/ef/efModel';

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  pillarIds: EfPillarId[];
  contexts: EfContext[];
  timeframe: 'short_term' | 'mid_term' | 'long_term';
  category: 'school' | 'work' | 'home' | 'social' | 'general';
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // GETTING_STARTED_FINISHING templates
  {
    id: 'gsf-1',
    title: 'Start homework within 15 minutes of planned time using a timer',
    description: 'Build the habit of starting on time by setting a 10-minute warning before your planned homework time.',
    pillarIds: ['GETTING_STARTED_FINISHING'],
    contexts: ['SCHOOL', 'HOME'],
    timeframe: 'short_term',
    category: 'school'
  },
  {
    id: 'gsf-2',
    title: 'Begin one small task each morning before checking phone',
    description: 'Start your day with momentum by completing one quick task (make bed, brush teeth, etc.) before screens.',
    pillarIds: ['GETTING_STARTED_FINISHING'],
    contexts: ['HOME'],
    timeframe: 'short_term',
    category: 'home'
  },
  {
    id: 'gsf-3',
    title: 'Complete one neglected task each week',
    description: 'Pick one thing that has been sitting on your list and just do it—no overthinking.',
    pillarIds: ['GETTING_STARTED_FINISHING'],
    contexts: ['HOME', 'SCHOOL'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'gsf-4',
    title: 'Start bedtime routine by 9pm three nights per week',
    description: 'Build better sleep habits by beginning your wind-down routine at a consistent time.',
    pillarIds: ['GETTING_STARTED_FINISHING'],
    contexts: ['HOME'],
    timeframe: 'mid_term',
    category: 'home'
  },

  // PLANNING_ORGANIZATION_TIME templates
  {
    id: 'pot-1',
    title: 'Every Sunday, plan three small tasks for each weekday',
    description: 'Spend 15 minutes mapping out your week so you know what to focus on each day.',
    pillarIds: ['PLANNING_ORGANIZATION_TIME'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'pot-2',
    title: 'Use a planner or app to track one assignment at a time',
    description: 'Start simple—just track your biggest or nearest-due assignment to build the habit.',
    pillarIds: ['PLANNING_ORGANIZATION_TIME'],
    contexts: ['SCHOOL'],
    timeframe: 'short_term',
    category: 'school'
  },
  {
    id: 'pot-3',
    title: 'Set a 5-minute timer before tasks to estimate how long they will take',
    description: 'Practice time awareness by guessing how long something will take, then checking your estimate.',
    pillarIds: ['PLANNING_ORGANIZATION_TIME'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'pot-4',
    title: 'Organize backpack and materials every evening after school',
    description: 'Create a 5-minute routine to pack up for tomorrow so mornings are smoother.',
    pillarIds: ['PLANNING_ORGANIZATION_TIME'],
    contexts: ['SCHOOL', 'HOME'],
    timeframe: 'short_term',
    category: 'school'
  },

  // FOCUS_WORKING_MEMORY templates
  {
    id: 'fwm-1',
    title: 'Work for 20 minutes with a timer, then take a 5-minute break',
    description: 'Use the Pomodoro technique to stay focused without burning out.',
    pillarIds: ['FOCUS_WORKING_MEMORY'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'fwm-2',
    title: 'Use a checklist to track steps while working on multi-step tasks',
    description: 'Write down each step as you go so you do not lose track of what is next.',
    pillarIds: ['FOCUS_WORKING_MEMORY'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'fwm-3',
    title: 'Practice one focus technique daily',
    description: 'Try noise-canceling headphones, a quiet space, or a do not disturb sign for 15 minutes.',
    pillarIds: ['FOCUS_WORKING_MEMORY'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'fwm-4',
    title: 'Keep a working notes page to jot down thoughts during tasks',
    description: 'When random thoughts pop up, write them down so you can focus without forgetting them.',
    pillarIds: ['FOCUS_WORKING_MEMORY'],
    contexts: ['SCHOOL', 'WORK'],
    timeframe: 'short_term',
    category: 'general'
  },

  // EMOTIONS_STRESS_OVERWHELM templates
  {
    id: 'es-1',
    title: 'Try one calming strategy when feeling frustrated',
    description: 'Pick your go-to move: deep breaths, short walk, drink of water, or stretch.',
    pillarIds: ['EMOTIONS_STRESS_OVERWHELM'],
    contexts: ['SCHOOL', 'WORK', 'HOME', 'SOCIAL'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'es-2',
    title: 'Rate stress levels before and after schoolwork to notice patterns',
    description: 'Use a simple 1-5 scale to track when stress is highest and what helps.',
    pillarIds: ['EMOTIONS_STRESS_OVERWHELM'],
    contexts: ['SCHOOL', 'HOME'],
    timeframe: 'mid_term',
    category: 'school'
  },
  {
    id: 'es-3',
    title: 'Take a 10-minute break when feeling overwhelmed, then return to task',
    description: 'Build the skill of recognizing when you need a reset and actually taking it.',
    pillarIds: ['EMOTIONS_STRESS_OVERWHELM'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'es-4',
    title: 'Share one challenge with a supporter each week',
    description: 'Practice asking for help or just talking through what is hard.',
    pillarIds: ['EMOTIONS_STRESS_OVERWHELM', 'SELF_ADVOCACY_INDEPENDENCE'],
    contexts: ['SCHOOL', 'HOME', 'SOCIAL'],
    timeframe: 'mid_term',
    category: 'social'
  },

  // FLEXIBILITY_CHANGE templates
  {
    id: 'fc-1',
    title: 'When plans change, list two ways to adjust and pick one',
    description: 'Practice flexibility by brainstorming quick backup plans when things do not go as expected.',
    pillarIds: ['FLEXIBILITY_CHANGE'],
    contexts: ['SCHOOL', 'WORK', 'HOME', 'SOCIAL'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'fc-2',
    title: 'Practice switching between two short tasks with a timer',
    description: 'Build mental flexibility by alternating between tasks every 10 minutes.',
    pillarIds: ['FLEXIBILITY_CHANGE'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'fc-3',
    title: 'Each week, try one small change to routine',
    description: 'Get comfortable with change by mixing up one thing: route to school, breakfast choice, etc.',
    pillarIds: ['FLEXIBILITY_CHANGE'],
    contexts: ['HOME', 'SOCIAL'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'fc-4',
    title: 'Keep a backup plan for common disruptions',
    description: 'Write down what to do if the bus is late, an activity is canceled, etc.',
    pillarIds: ['FLEXIBILITY_CHANGE', 'PLANNING_ORGANIZATION_TIME'],
    contexts: ['SCHOOL', 'SOCIAL'],
    timeframe: 'mid_term',
    category: 'general'
  },

  // SELF_ADVOCACY_INDEPENDENCE templates
  {
    id: 'sai-1',
    title: 'Ask for help once per week when stuck on a task',
    description: 'Build the skill of recognizing when you are stuck and reaching out before frustration builds.',
    pillarIds: ['SELF_ADVOCACY_INDEPENDENCE'],
    contexts: ['SCHOOL', 'WORK', 'HOME'],
    timeframe: 'short_term',
    category: 'general'
  },
  {
    id: 'sai-2',
    title: 'Identify one accommodation needed and request it',
    description: 'Practice self-advocacy by asking for what helps you succeed (quiet space, extra time, etc.).',
    pillarIds: ['SELF_ADVOCACY_INDEPENDENCE'],
    contexts: ['SCHOOL', 'WORK'],
    timeframe: 'mid_term',
    category: 'school'
  },
  {
    id: 'sai-3',
    title: 'Check in with myself daily: what went well, what needs support',
    description: 'Spend 2 minutes reflecting on your day to build self-awareness.',
    pillarIds: ['SELF_ADVOCACY_INDEPENDENCE'],
    contexts: ['HOME'],
    timeframe: 'mid_term',
    category: 'general'
  },
  {
    id: 'sai-4',
    title: 'Practice saying I need help with in three different situations',
    description: 'Role-play or practice asking for support in low-stakes moments.',
    pillarIds: ['SELF_ADVOCACY_INDEPENDENCE'],
    contexts: ['SCHOOL', 'WORK', 'SOCIAL'],
    timeframe: 'short_term',
    category: 'social'
  }
];

// Helper functions
export const getTemplatesByPillars = (pillarIds: string[]): GoalTemplate[] => {
  if (pillarIds.length === 0) return GOAL_TEMPLATES;
  
  return GOAL_TEMPLATES.filter(template =>
    template.pillarIds.some(pillar => pillarIds.includes(pillar))
  );
};

export const getOtherTemplates = (pillarIds: string[]): GoalTemplate[] => {
  if (pillarIds.length === 0) return [];
  
  return GOAL_TEMPLATES.filter(template =>
    !template.pillarIds.some(pillar => pillarIds.includes(pillar))
  );
};

export const getTemplateById = (id: string): GoalTemplate | undefined => {
  return GOAL_TEMPLATES.find(template => template.id === id);
};

export const TIMEFRAME_OPTIONS = [
  { value: 'short_term', label: 'This week', duration: '1 week' },
  { value: 'mid_term', label: 'Next 2-4 weeks', duration: '2-4 weeks' },
  { value: 'long_term', label: 'Next 1-3 months', duration: '1-3 months' }
] as const;
