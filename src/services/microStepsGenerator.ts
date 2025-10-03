import { format } from 'date-fns';

export interface MicroStep {
  title: string;
  description: string;
}

interface ActionableVariables {
  goalAction: string;
  category: string;
  motivation: string;
  startTime: string;
  dayOfWeek: string;
  hasPrerequisite: boolean;
  prerequisiteText: string;
  barrier1: string | null;
  barrier2: string | null;
}

interface BarrierTemplate {
  activationStep: string;
  prepStep?: string;
}

interface WizardData {
  goalTitle: string;
  category?: string;
  goalMotivation?: string;
  customMotivation?: string;
  startDate: Date;
  customTime?: string;
  hasPrerequisites?: boolean;
  customPrerequisites?: string;
  challengeAreas?: string[];
}

/**
 * Translates wizard data into actionable variables for template rendering
 */
function translateToActionableVariables(data: WizardData): ActionableVariables {
  const dayOfWeek = format(data.startDate, 'EEEE');
  const startTime = data.customTime ? formatDisplayTime(data.customTime) : '8:00 AM';
  
  return {
    goalAction: data.goalTitle || 'your goal',
    category: data.category || 'general',
    motivation: data.customMotivation || data.goalMotivation || 'this goal',
    startTime,
    dayOfWeek,
    hasPrerequisite: data.hasPrerequisites === false && !!data.customPrerequisites,
    prerequisiteText: data.customPrerequisites || '',
    barrier1: data.challengeAreas?.[0] || null,
    barrier2: data.challengeAreas?.[1] || null,
  };
}

/**
 * Formats time string to include AM/PM
 */
function formatDisplayTime(time: string): string {
  if (!time) return '8:00 AM';
  
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Returns barrier-specific templates for Individual flow
 */
function getIndividualBarrierTemplate(
  barrierId: string,
  vars: ActionableVariables
): BarrierTemplate {
  switch (barrierId) {
    case 'initiation':
      return {
        activationStep: `At ${vars.startTime} on ${vars.dayOfWeek}, your only job is to touch the item needed for ${vars.goalAction} for 15 seconds (e.g., put on your headphones or open the laptop).`,
        prepStep: `Right now, find the single object you need for this task (e.g., your charging cable) and put it on the table.`
      };
    
    case 'time':
      return {
        activationStep: `Set a recurring alarm on your phone for 5 minutes BEFORE ${vars.startTime}. Name the alarm: "SHIFT NOW."`,
        prepStep: `Right now, put a sticky note on the last thing you usually look at before the start time (e.g., your lunch plate, your phone charger).`
      };
    
    case 'attention':
      return {
        activationStep: `Set a timer for 25 minutes. Your goal is only to focus for that time. Do not look at anything else until the timer rings.`,
        prepStep: `When the timer rings, you must stand up and stretch or walk away for 5 minutes. This is mandatory movement!`
      };
    
    case 'planning':
      return {
        activationStep: `Your first action is only to write down the next three things you need to do for ${vars.goalAction} (e.g., 1. Open notebook, 2. Read prompt, 3. Get water). Stop there!`,
        prepStep: `Before you finish your goal time, spend 2 minutes deciding what your first step will be for the next time you do this goal.`
      };
    
    default:
      // Fallback to focus template
      return {
        activationStep: `Set a timer for 25 minutes. Your goal is only to focus for that time. When it rings, stand up and move away for 5 minutes.`,
        prepStep: undefined
      };
  }
}

/**
 * Returns barrier-specific templates for Supporter flow
 */
function getSupporterBarrierTemplate(
  barrierId: string,
  vars: ActionableVariables
): BarrierTemplate {
  switch (barrierId) {
    case 'initiation':
      return {
        activationStep: `T-Zero Action: At ${vars.startTime}, their goal is only to establish physical contact with the required tool (e.g., open the book, press the play button).`,
        prepStep: `Environmental Cue: Your task: Ensure the primary tool is on the work surface before ${vars.startTime} to eliminate the 'find-it' barrier.`
      };
    
    case 'time':
      return {
        activationStep: `Reminder Action: At ${vars.startTime}, immediately set a visual timer (sand or digital) for 20 minutes to externalize the passage of time.`,
        prepStep: `Pre-Cue Setup: Your task: Create a physical, visual cue (e.g., a colored piece of paper or a specific hat) and place it in their line of sight one hour before ${vars.startTime}.`
      };
    
    case 'attention':
      return {
        activationStep: `Chunking Action: Their task: Complete one small, defined subsection of ${vars.goalAction} (e.g., only the introduction, only problems 1-5) then stop.`,
        prepStep: `Mandatory Movement: Your task: Ensure they stand up and perform 5 jumping jacks/stretches when the 25-minute timer rings (or when you check in).`
      };
    
    case 'planning':
      return {
        activationStep: `Start with the List: Their task: Begin by creating the 3-step sequence list on a whiteboard, not by starting the work itself.`,
        prepStep: `Stop and Plan: Your task: Interrupt the work 5 minutes before the end time to coach them on planning the very first step for the next session.`
      };
    
    default:
      // Fallback to focus template
      return {
        activationStep: `Their task: Complete one small, defined subsection of ${vars.goalAction}, then take a mandatory 5-minute movement break.`,
        prepStep: undefined
      };
  }
}

/**
 * Main generation function: produces exactly 3 micro-steps following the hierarchy
 */
export function generateMicroSteps(
  data: WizardData,
  flow: 'individual' | 'supporter'
): MicroStep[] {
  const vars = translateToActionableVariables(data);
  const steps: MicroStep[] = [];
  
  // SLOT 1: Prerequisite (Highest Priority)
  if (vars.hasPrerequisite && vars.prerequisiteText) {
    steps.push({
      title: `Before ${vars.dayOfWeek}, prepare what you need`,
      description: vars.prerequisiteText
    });
  }
  
  // SLOT 2: Primary Barrier (Barrier 1)
  if (vars.barrier1) {
    const template = flow === 'supporter' 
      ? getSupporterBarrierTemplate(vars.barrier1, vars)
      : getIndividualBarrierTemplate(vars.barrier1, vars);
    
    steps.push({
      title: getBarrierTitle(vars.barrier1, 'primary'),
      description: template.activationStep
    });
    
    // If we used a prep step and no prerequisite was filled, use it
    if (template.prepStep && steps.length === 1) {
      steps.unshift({
        title: getBarrierTitle(vars.barrier1, 'prep'),
        description: template.prepStep
      });
    }
  }
  
  // SLOT 3: Secondary Barrier (Barrier 2) or Focus fallback
  const barrier2 = vars.barrier2 || 'attention'; // Default to Focus if only one barrier selected
  const template = flow === 'supporter'
    ? getSupporterBarrierTemplate(barrier2, vars)
    : getIndividualBarrierTemplate(barrier2, vars);
  
  steps.push({
    title: getBarrierTitle(barrier2, 'secondary'),
    description: template.activationStep
  });
  
  // Ensure we have exactly 3 steps
  while (steps.length < 3) {
    steps.push({
      title: 'Track your progress',
      description: `After each session, mark this step complete to build momentum and earn points.`
    });
  }
  
  return steps.slice(0, 3); // Return exactly 3 steps
}

/**
 * Helper to generate contextual titles for barrier-based steps
 */
function getBarrierTitle(barrierId: string, context: 'primary' | 'secondary' | 'prep'): string {
  const titles: Record<string, Record<string, string>> = {
    initiation: {
      primary: 'The Start Cue',
      secondary: 'Start Action',
      prep: 'Set up your environment'
    },
    time: {
      primary: 'Set your time anchor',
      secondary: 'Time reminder',
      prep: 'Create visual cues'
    },
    attention: {
      primary: 'Focus with movement breaks',
      secondary: 'Maintain focus',
      prep: 'Prepare for focus time'
    },
    planning: {
      primary: 'Break it into steps',
      secondary: 'Plan your approach',
      prep: 'Create your sequence'
    }
  };
  
  return titles[barrierId]?.[context] || 'Complete this step';
}
