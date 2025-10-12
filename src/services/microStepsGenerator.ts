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
  selectedDays: string[];
  frequencyPerWeek: number;
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
  selectedDays?: string[];
  customTime?: string;
  hasPrerequisites?: boolean;
  customPrerequisites?: string;
  challengeAreas?: string[];
  barrierContext?: string;
  supportedPersonName?: string;
  supporterName?: string;
  goalType?: string;
}

/**
 * Infers the second barrier based on goal type and primary barrier
 * Uses neurodivergent-informed relationships between challenges
 */
function inferSecondBarrier(
  barrier1: string, 
  goalType: string, 
  category: string
): string {
  // Barrier relationships based on goal type
  const barrierInferenceMap: Record<string, Record<string, string>> = {
    'reminder': {
      'initiation': 'time',        // New habits need time management after starting
      'attention': 'planning',      // If distracted, need next-step clarity
      'time': 'attention',          // If forgetting, need focus strategies
      'planning': 'initiation'      // If unclear on steps, need activation help
    },
    'practice': {
      'initiation': 'planning',     // Practice needs clear structure after starting
      'attention': 'time',          // Focus issues pair with time tracking
      'time': 'planning',           // Remembering practice needs structure
      'planning': 'attention'       // Structured practice needs focus maintenance
    },
    'new_skill': {
      'initiation': 'planning',     // New skills need heavy planning after first step
      'attention': 'planning',      // Complex learning needs structure
      'time': 'planning',           // New skills need organized approach
      'planning': 'initiation'      // Over-planning needs activation
    }
  };

  // Category-specific overrides for edge cases
  const categoryOverrides: Record<string, Record<string, string>> = {
    'health': {
      'initiation': 'time',         // Health habits are time-sensitive
      'planning': 'time'            // Health routines need consistency
    },
    'employment': {
      'initiation': 'planning',     // Job tasks need heavy structure
      'attention': 'planning'       // Professional settings demand clarity
    },
    'postsecondary': {
      'attention': 'planning',      // Academic work needs organization
      'time': 'planning'            // College work is structure-heavy
    }
  };

  // Check category override first
  const categoryMap = categoryOverrides[category];
  if (categoryMap && categoryMap[barrier1]) {
    return categoryMap[barrier1];
  }

  // Use goal type inference
  const typeMap = barrierInferenceMap[goalType];
  if (typeMap && typeMap[barrier1]) {
    return typeMap[barrier1];
  }

  // Fallback: Use most common pairings
  const defaultFallbacks: Record<string, string> = {
    'initiation': 'planning',
    'attention': 'planning',
    'time': 'attention',
    'planning': 'initiation'
  };

  return defaultFallbacks[barrier1] || 'attention';
}

/**
 * Converts goal title into a grammatically correct action phrase
 */
function convertToActionPhrase(goalTitle: string): string {
  if (!goalTitle) return 'your goal';
  
  const lowerTitle = goalTitle.toLowerCase().trim();
  
  // Remove time qualifiers (every morning, daily, etc.)
  const withoutTime = lowerTitle
    .replace(/\s+(every\s+(morning|day|night|evening|week|afternoon))/gi, '')
    .replace(/\s+(daily|weekly|nightly)/gi, '')
    .replace(/\s+for\s+\d+\s+(minutes?|hours?|weeks?|months?)/gi, '')
    .replace(/\s+\d+x?\s*\/?\s*(per\s+)?(week|day|month)/gi, '')
    .trim();
  
  // Common action verbs that work well in gerund form (-ing)
  const gerundVerbs = ['stretch', 'walk', 'run', 'practice', 'clean', 'exercise', 'read', 'write', 'study', 'cook', 'meditate'];
  
  for (const verb of gerundVerbs) {
    if (withoutTime.startsWith(verb)) {
      // Convert to gerund (stretching, walking, etc.)
      return withoutTime.replace(new RegExp(`^${verb}`), verb + 'ing');
    }
  }
  
  // For "do X" phrases, convert to "doing X"
  if (withoutTime.startsWith('do ')) {
    return withoutTime.replace(/^do /, 'doing ');
  }
  
  // Default: return cleaned version
  return withoutTime || goalTitle.toLowerCase();
}

/**
 * Translates wizard data into actionable variables for template rendering
 */
function translateToActionableVariables(data: WizardData): ActionableVariables {
  const dayOfWeek = format(data.startDate, 'EEEE');
  const startTime = data.customTime ? formatDisplayTime(data.customTime) : '8:00 AM';
  
  return {
    goalAction: convertToActionPhrase(data.goalTitle || 'your goal'),
    category: data.category || 'general',
    motivation: data.customMotivation || data.goalMotivation || 'this goal',
    startTime,
    dayOfWeek,
    selectedDays: data.selectedDays || [],
    frequencyPerWeek: data.selectedDays?.length || 7,
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
 * Generates context-aware activation cues for Individual flow
 */
function getSmartActivationCue(goalAction: string, startTime: string, dayOfWeek: string): string {
  const lower = goalAction.toLowerCase();
  
  // Cleaning/organizing tasks
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('organize')) {
    return `At ${startTime} on ${dayOfWeek}, clear one surface (desk or nightstand) and place one item where it belongs for ${goalAction}.`;
  }
  
  // Physical/exercise tasks
  if (lower.includes('exercise') || lower.includes('walk') || lower.includes('run') || lower.includes('workout')) {
    return `At ${startTime} on ${dayOfWeek}, put on your shoes and lace them up for ${goalAction}.`;
  }
  
  // Creative tasks
  if (lower.includes('draw') || lower.includes('write') || lower.includes('practice') || lower.includes('paint')) {
    return `At ${startTime} on ${dayOfWeek}, open your materials and place them in front of you for ${goalAction}.`;
  }
  
  // Learning/study tasks
  if (lower.includes('study') || lower.includes('homework') || lower.includes('read') || lower.includes('learn')) {
    return `At ${startTime} on ${dayOfWeek}, open your textbook or laptop to the right page or app for ${goalAction}.`;
  }
  
  // Default: generic but sensible
  return `At ${startTime} on ${dayOfWeek}, prepare one thing you need to begin ${goalAction}.`;
}

/**
 * Generates context-aware activation cues for Supporter flow
 */
function getSmartSupporterActivationCue(goalAction: string, startTime: string, dayOfWeek: string): string {
  const lower = goalAction.toLowerCase();
  
  // Cleaning/organizing tasks
  if (lower.includes('clean') || lower.includes('tidy') || lower.includes('organize')) {
    return `At ${startTime} on ${dayOfWeek}, help them clear one surface and place one item where it belongs for ${goalAction}.`;
  }
  
  // Physical/exercise tasks
  if (lower.includes('exercise') || lower.includes('walk') || lower.includes('run') || lower.includes('workout')) {
    return `At ${startTime} on ${dayOfWeek}, hand them their shoes and encourage them to put them on for ${goalAction}.`;
  }
  
  // Creative tasks
  if (lower.includes('draw') || lower.includes('write') || lower.includes('practice') || lower.includes('paint')) {
    return `At ${startTime} on ${dayOfWeek}, place their materials in front of them for ${goalAction}.`;
  }
  
  // Learning/study tasks
  if (lower.includes('study') || lower.includes('homework') || lower.includes('read') || lower.includes('learn')) {
    return `At ${startTime} on ${dayOfWeek}, help them open their textbook or laptop to the right page or app for ${goalAction}.`;
  }
  
  // Default: generic but sensible
  return `At ${startTime} on ${dayOfWeek}, hand them the first thing they need for ${goalAction}.`;
}

/**
 * Helper function to generate smart activation titles based on goal context
 */
function getSmartActivationTitle(goalAction: string): string {
  const lower = goalAction.toLowerCase();
  
  if (lower.includes('water') || lower.includes('drink')) return 'Grab water bottle';
  if (lower.includes('exercise') || lower.includes('walk') || lower.includes('run')) return 'Put on shoes';
  if (lower.includes('clean') || lower.includes('tidy')) return 'Clear one surface';
  if (lower.includes('study') || lower.includes('read') || lower.includes('homework')) return 'Open materials';
  if (lower.includes('practice') || lower.includes('instrument')) return 'Get instrument';
  if (lower.includes('cook') || lower.includes('meal')) return 'Get ingredients';
  if (lower.includes('write') || lower.includes('journal')) return 'Open notebook';
  
  return 'Start preparing';
}

/**
 * Returns barrier-specific templates for Individual flow
 */
function getIndividualBarrierTemplate(barrierId: string, vars: ActionableVariables): BarrierTemplate {
  const templates: Record<string, BarrierTemplate> = {
    initiation: {
      activationStep: {
        title: `At ${vars.startTime}: ${getSmartActivationTitle(vars.goalAction)}`,
        description: getSmartActivationCue(vars.goalAction, vars.startTime, vars.dayOfWeek)
      },
      barrierStep: {
        title: `Focus for 20 min on ${vars.goalAction}`,
        description: `Set a timer for 20 minutes and focus on ${vars.goalAction}. When the timer rings, stand up and stretch for 5 minutes before continuing.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}: Prepare materials for ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, open or grab one specific thing for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `25-min focus timer for ${vars.goalAction}`,
        description: `Set a 25-minute timer and work on ${vars.goalAction}. When it rings, stand up and take a 5-minute movement break before continuing.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}: Grab pen to plan ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, grab a pen and paper to plan ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Break ${vars.goalAction} into 3 steps`,
        description: `Spend 20 minutes writing down 3 smaller steps for ${vars.goalAction}. Number them 1, 2, 3 and write what you'll do for each one.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}: Set timer for ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a timer for 20 minutes for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Work on ${vars.goalAction} until timer rings`,
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
        title: `At ${vars.startTime}: Hand materials for ${vars.goalAction}`,
        description: getSmartSupporterActivationCue(vars.goalAction, vars.startTime, vars.dayOfWeek)
      },
      barrierStep: {
        title: `Stay nearby for ${vars.goalAction} (20 min)`,
        description: `Remain in the same room while they work on ${vars.goalAction} for 20 minutes. After 20 minutes, check in and celebrate any progress they made.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}: Start timer for ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a visible 25-minute timer and say: "Work on ${vars.goalAction} until this rings."`
      },
      barrierStep: {
        title: `Check in after ${vars.goalAction} session`,
        description: `When the 25-minute timer rings, check in with them about ${vars.goalAction}. Make sure they take a 5-minute movement break before continuing.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}: Provide materials to plan ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, hand them paper and pen to plan ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Help break down ${vars.goalAction} into steps`,
        description: `Sit with them for 20 minutes to help write and number 3 smaller steps for ${vars.goalAction}. Ask guiding questions like "What needs to happen first?" but let them decide.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}: Set timer for ${vars.goalAction}`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, help them set a 20-minute timer for ${vars.goalAction}.`
      },
      barrierStep: {
        title: `Monitor ${vars.goalAction} and celebrate progress`,
        description: `Check in when the timer rings after 20 minutes of ${vars.goalAction}. Celebrate what they completed and help them take a 5-minute break before the next work session.`
      }
    },
  };

  return templates[barrierId] || templates.initiation;
}

/**
 * Generates a goal completion step (SLOT 4)
 */
function getSmartCompletionStep(goalAction: string, goalTitle: string, flow: 'individual' | 'supporter'): MicroStep {
  const lower = goalAction.toLowerCase();
  
  // For supporter flow
  if (flow === 'supporter') {
    if (lower.includes('cook') || lower.includes('meal') || lower.includes('recipe')) {
      return {
        title: `Complete: Cook ${goalAction}`,
        description: `Support them in cooking ${goalAction}. Help check they've completed all steps and celebrate when the meal is done.`
      };
    }
    
    if (lower.includes('write') || lower.includes('essay') || lower.includes('paper')) {
      return {
        title: `Complete: Finish ${goalAction}`,
        description: `Check in as they complete ${goalAction}. Celebrate when the final version is saved.`
      };
    }
    
    if (lower.includes('clean') || lower.includes('organize') || lower.includes('tidy')) {
      return {
        title: `Complete: ${goalAction}`,
        description: `Check that they finish ${goalAction}. Take a before and after photo together to see the progress.`
      };
    }
    
    if (lower.includes('exercise') || lower.includes('workout') || lower.includes('run')) {
      return {
        title: `Complete: ${goalAction} session`,
        description: `Support them in completing ${goalAction}. Help them log their activity when finished.`
      };
    }
    
    return {
      title: `Complete: ${goalAction}`,
      description: `Support them in finishing ${goalAction}. Celebrate together when it's done!`
    };
  }
  
  // For individual flow
  if (lower.includes('cook') || lower.includes('meal') || lower.includes('recipe')) {
    return {
      title: `Complete: Cook ${goalAction}`,
      description: `Actually cook ${goalAction}. When finished, take a photo of your completed dish to mark your accomplishment.`
    };
  }
  
  if (lower.includes('write') || lower.includes('essay') || lower.includes('paper')) {
    return {
      title: `Complete: Finish ${goalAction}`,
      description: `Complete ${goalAction}. Save the final version and note down what you accomplished.`
    };
  }
  
  if (lower.includes('clean') || lower.includes('organize') || lower.includes('tidy')) {
    return {
      title: `Complete: ${goalAction}`,
      description: `Finish ${goalAction}. Take a before and after photo to see your progress.`
    };
  }
  
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('run')) {
    return {
      title: `Complete: ${goalAction} session`,
      description: `Complete ${goalAction}. Log your activity (time, distance, reps, etc.) when done.`
    };
  }
  
  // Default pattern
  return {
    title: `Complete: ${goalAction}`,
    description: `Actually complete ${goalAction}. Make a note or take a photo when finished to mark your accomplishment.`
  };
}

/**
 * Smart generation: attempts AI, falls back to theory-aligned templates
 */
export async function generateMicroStepsSmart(
  data: WizardData,
  flow: 'individual' | 'supporter'
): Promise<MicroStep[]> {
  try {
    // Detect if prerequisite is concrete (single item) or uncertain
    const prereqText = data.customPrerequisites || '';
    const uncertaintyKeywords = ['not sure', 'don\'t know', 'need to find', 'where to', 'how to', 'unsure', 'no idea'];
    const prerequisiteIsConcrete = prereqText.length > 0 && 
                                   prereqText.length < 50 && // Short = likely concrete
                                   !uncertaintyKeywords.some(kw => prereqText.toLowerCase().includes(kw));
    
    const barrier1 = data.challengeAreas?.[0] || 'initiation';
    const barrier2 = data.challengeAreas?.[1] || inferSecondBarrier(
      barrier1,
      data.goalType || 'reminder',
      data.category || 'general'
    );

    // Log inference for debugging
    if (!data.challengeAreas?.[1]) {
      console.log('[Barrier Inference]', {
        barrier1,
        inferredBarrier2: barrier2,
        goalType: data.goalType,
        category: data.category
      });
    }

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
      prerequisiteIsConcrete,
      barrier1,
      barrier2,
      barrierContext: data.barrierContext || '',
      supportedPersonName: data.supportedPersonName || '',
      supporterName: data.supporterName || '',
    };

    console.log('[generateMicroStepsSmart] Calling AI service with payload:', payload);
    const { microSteps, error, useFallback } = await AIService.getMicroSteps(payload);
    console.log('[generateMicroStepsSmart] AI response:', { microSteps, error, useFallback, stepCount: microSteps?.length });
    
    if (error || useFallback || !microSteps || microSteps.length !== 4) {
      console.warn('AI generation failed, using theory-aligned fallback. Reason:', { error, useFallback, stepCount: microSteps?.length });
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
  
  // SLOT 4: Goal Completion Action (NEW!)
  const completionStep = getSmartCompletionStep(vars.goalAction, data.goalTitle, flow);
  steps.push(completionStep);
  
  return steps.slice(0, 4);
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
