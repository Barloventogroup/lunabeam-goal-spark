import { format } from 'date-fns';
import { AIService } from './aiService';

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
  activationStep: MicroStep;
  barrierStep: MicroStep;
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
    hasPrerequisite: data.hasPrerequisites === true && !!data.customPrerequisites,
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
function getIndividualBarrierTemplate(barrierId: string, vars: ActionableVariables): BarrierTemplate {
  const templates: Record<string, BarrierTemplate> = {
    initiation: {
      activationStep: {
        title: `At ${vars.startTime}, start`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, open or touch the first thing you need for ${vars.goalAction} (app, book, or materials).`
      },
      barrierStep: {
        title: `Work for 20 minutes`,
        description: `Set a timer for 20 minutes and focus on ${vars.goalAction}. When the timer rings, stand up and stretch for 5 minutes before continuing.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}, open materials`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, open or grab one specific thing for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Use a focus timer`,
        description: `Set a 25-minute timer and work on ${vars.goalAction}. When it rings, stand up and take a 5-minute movement break before continuing.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}, grab pen and paper`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, grab a pen and paper to plan ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Break it into 3 steps`,
        description: `Spend 20 minutes writing down 3 smaller steps for ${vars.goalAction}. Number them 1, 2, 3 and write what you'll do for each one.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}, set a timer`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a timer for 20 minutes for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Work until the timer rings`,
        description: `Focus on ${vars.goalAction} for 20 minutes until your timer rings. When it does, take a mandatory 5-minute break.`
      }
    },
  };

  return templates[barrierId] || templates.initiation;
}

/**
 * Returns barrier-specific templates for Supporter flow
 */
function getSupporterBarrierTemplate(barrierId: string, vars: ActionableVariables): BarrierTemplate {
  const templates: Record<string, BarrierTemplate> = {
    initiation: {
      activationStep: {
        title: `At ${vars.startTime}, hand them materials`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, hand them the first thing they need for ${vars.goalAction} (laptop, textbook, or materials).`
      },
      barrierStep: {
        title: `Stay nearby for 20 minutes`,
        description: `Remain in the same room while they work on ${vars.goalAction} for 20 minutes. After 20 minutes, check in and celebrate any progress they made.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}, start the timer`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a visible 25-minute timer and say: "Work on ${vars.goalAction} until this rings."`
      },
      barrierStep: {
        title: `Check in when timer rings`,
        description: `When the 25-minute timer rings, check in with them about ${vars.goalAction}. Make sure they take a 5-minute movement break before continuing.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}, provide materials`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, hand them paper and pen to plan ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Help organize the steps`,
        description: `Sit with them for 20 minutes to help write and number 3 smaller steps for ${vars.goalAction}. Ask guiding questions like "What needs to happen first?" but let them decide.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}, set the timer together`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, help them set a 20-minute timer for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Monitor and celebrate`,
        description: `Check in when the timer rings after 20 minutes of ${vars.goalAction}. Celebrate what they completed and help them take a 5-minute break before the next work session.`
      }
    },
  };

  return templates[barrierId] || templates.initiation;
}

/**
 * Smart generation: attempts AI, falls back to theory-aligned templates
 */
export async function generateMicroStepsSmart(
  data: WizardData,
  flow: 'individual' | 'supporter'
): Promise<MicroStep[]> {
  try {
    const payload = {
      flow,
      goalTitle: data.goalTitle,
      category: data.category || 'general',
      motivation: data.customMotivation || data.goalMotivation || '',
      startDayOfWeek: format(data.startDate, 'EEEE'),
      startTime: formatDisplayTime(data.customTime || '08:00'),
      startDateTime: data.startDate.toISOString(),
      hasPrerequisite: data.hasPrerequisites === true && !!data.customPrerequisites,
      prerequisiteText: data.customPrerequisites || '',
      barrier1: data.challengeAreas?.[0] || 'initiation',
      barrier2: data.challengeAreas?.[1] || 'attention',
    };

    const { microSteps, error, useFallback } = await AIService.getMicroSteps(payload);
    
    if (error || useFallback || !microSteps || microSteps.length !== 3) {
      console.warn('AI generation failed, using theory-aligned fallback');
      return generateMicroStepsFallback(data, flow);
    }
    
    return microSteps;
  } catch (err) {
    console.error('Smart generation error:', err);
    return generateMicroStepsFallback(data, flow);
  }
}

/**
 * Fallback generation: theory-aligned templates
 */
export function generateMicroStepsFallback(
  data: WizardData,
  flow: 'individual' | 'supporter'
): MicroStep[] {
  const vars = translateToActionableVariables(data);
  const steps: MicroStep[] = [];
  const primaryBarrier = vars.barrier1 || 'initiation';
  const secondaryBarrier = vars.barrier2 || 'attention';
  
  // SLOT 1: Prerequisite or Environmental Setup
  if (vars.hasPrerequisite && vars.prerequisiteText) {
    const prereqAction = parsePrerequisiteIntoAction(vars.prerequisiteText, vars.dayOfWeek, flow);
    steps.push({
      title: flow === 'supporter' ? 'Environmental prep' : `Get ready by ${vars.dayOfWeek}`,
      description: prereqAction
    });
  }
  
  // SLOT 2: T-Zero Activation Cue (ALWAYS references START_TIME)
  const activationTemplate = flow === 'supporter' 
    ? getSupporterBarrierTemplate(primaryBarrier, vars)
    : getIndividualBarrierTemplate(primaryBarrier, vars);
  
  steps.push(activationTemplate.activationStep);
  
  // SLOT 3: Primary Barrier Action
  const barrierTemplate = flow === 'supporter'
    ? getSupporterBarrierTemplate(secondaryBarrier, vars)
    : getIndividualBarrierTemplate(secondaryBarrier, vars);
  
  steps.push(barrierTemplate.barrierStep);
  
  return steps.slice(0, 3);
}

/**
 * Parses prerequisite text into 1-2 concrete actions
 */
function parsePrerequisiteIntoAction(prereqText: string, dayOfWeek: string, flow: 'individual' | 'supporter'): string {
  const lower = prereqText.toLowerCase();
  
  // Detect uncertainty/confusion keywords
  const uncertaintyKeywords = ['not sure', 'don\'t know', 'need to find', 'where to', 'how to', 'unsure'];
  const hasUncertainty = uncertaintyKeywords.some(kw => lower.includes(kw));
  
  if (flow === 'supporter') {
    if (hasUncertainty || lower.includes('find') || lower.includes('locate')) {
      return `Before ${dayOfWeek}, help them research options. Write down 2-3 possibilities on a sticky note.`;
    }
    if (lower.includes('help') || lower.includes('someone')) {
      return `Before ${dayOfWeek}, help them identify 2 potential helpers. Place their names on a visible note.`;
    }
    if (lower.includes('material') || lower.includes('supplies')) {
      return `Before ${dayOfWeek}, place all required materials in a designated spot (desk, table, counter).`;
    }
    return `Before ${dayOfWeek}, help set up their environment for the goal.`;
  }
  
  // Individual flow - detect uncertainty and generate research/exploration steps
  if (hasUncertainty || lower.includes('find') || lower.includes('locate')) {
    // Generate research/exploration steps for uncertain prerequisites
    if (lower.includes('friend') || lower.includes('people') || lower.includes('partner')) {
      return `Action 1: By Wednesday, search online for relevant groups or ask 2 people for recommendations. Action 2: By ${dayOfWeek}, contact one group or person.`;
    }
    if (lower.includes('place') || lower.includes('location') || lower.includes('where')) {
      return `Action 1: By Wednesday, search for locations online or ask 2 people for suggestions. Action 2: By ${dayOfWeek}, pick one location to visit.`;
    }
    return `Action 1: By Wednesday, research 3 possible options online. Action 2: By ${dayOfWeek}, choose one option to try.`;
  }
  
  if (lower.includes('help') || lower.includes('someone')) {
    return `Action 1: By Wednesday, text or ask 2 people who could help. Action 2: By ${dayOfWeek}, confirm one helper.`;
  }
  
  if (lower.includes('material') || lower.includes('supplies') || lower.includes('book') || lower.includes('equipment')) {
    return `Action 1: By Wednesday, find all materials needed. Action 2: By ${dayOfWeek}, place them in one spot.`;
  }
  
  if (lower.includes('permission') || lower.includes('approval')) {
    return `Action 1: By Wednesday, ask for permission. Action 2: By ${dayOfWeek}, get confirmation.`;
  }
  
  // Catch-all for other prerequisites - focus on obtaining/preparing
  return `Action 1: By Wednesday, take the first step to address: "${prereqText.slice(0, 60)}". Action 2: By ${dayOfWeek}, verify you're ready.`;
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
