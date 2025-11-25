import { format } from 'date-fns';
import { AIService } from './aiService';

// Rate limiting for free tier Gemini API (15 RPM = 1 request per 4 seconds)
let lastApiCallTime = 0;
const MIN_CALL_INTERVAL_MS = 5000; // 5 seconds between calls to stay under 15 RPM

export interface MicroStep {
  title: string;
  description: string;
}

interface ActionableVariables {
  goalAction: string;
  goalObject: string;
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
  barriers?: {
    priority1?: string;
    priority2?: string;
    context?: string;
  };
  teachingHelper?: {
    helperId: string | 'none';
    helperName: string;
    relationship: 'parent' | 'coach' | 'friend' | 'supporter';
  };
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
  const gerundVerbs = [
    { base: 'practice', gerund: 'practicing' },
    { base: 'exercise', gerund: 'exercising' },
    { base: 'meditate', gerund: 'meditating' },
    { base: 'stretch', gerund: 'stretching' },
    { base: 'walk', gerund: 'walking' },
    { base: 'run', gerund: 'running' },
    { base: 'clean', gerund: 'cleaning' },
    { base: 'read', gerund: 'reading' },
    { base: 'write', gerund: 'writing' },
    { base: 'study', gerund: 'studying' },
    { base: 'cook', gerund: 'cooking' }
  ];

  for (const verb of gerundVerbs) {
    if (withoutTime.startsWith(verb.base)) {
      return withoutTime.replace(new RegExp(`^${verb.base}`), verb.gerund);
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
 * Extracts the object/activity from goal title (e.g., "Practice math problems" → "math problems")
 */
function extractGoalObject(goalTitle: string): string {
  const lowerTitle = goalTitle.toLowerCase().trim();

  // Remove common leading verbs
  const withoutVerb = lowerTitle
    .replace(/^(practice|study|do|complete|work on|focus on|learn|read|write|cook|clean|exercise|meditate|stretch|walk|run)\s+/i, '')
    .trim();

  return withoutVerb || goalTitle;
}

/**
 * Translates wizard data into actionable variables for template rendering
 */
function translateToActionableVariables(data: WizardData): ActionableVariables {
  const dayOfWeek = format(data.startDate, 'EEEE');
  const startTime = data.customTime ? formatDisplayTime(data.customTime) : '8:00 AM';

  // Handle new barrier structure (priority-based) or fallback to old structure
  const barrier1 = data.barriers?.priority1 || data.challengeAreas?.[0] || null;
  const barrier2 = data.barriers?.priority2 || data.challengeAreas?.[1] || null;

  return {
    goalAction: convertToActionPhrase(data.goalTitle || 'your goal'),
    goalObject: extractGoalObject(data.goalTitle || 'your goal'),
    category: data.category || 'general',
    motivation: data.customMotivation || data.goalMotivation || 'this goal',
    startTime,
    dayOfWeek,
    selectedDays: data.selectedDays || [],
    frequencyPerWeek: data.selectedDays?.length || 7,
    hasPrerequisite: data.hasPrerequisites === true && !!data.customPrerequisites,
    prerequisiteText: data.customPrerequisites || '',
    barrier1,
    barrier2,
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

  // Reading tasks - distinguish leisure from academic
  if (lower.includes('read')) {
    const isAcademicReading = lower.includes('study') ||
      lower.includes('textbook') ||
      lower.includes('homework') ||
      lower.includes('assignment') ||
      lower.includes('chapter');

    if (isAcademicReading) {
      return `At ${startTime} on ${dayOfWeek}, open your reading materials to the right page for ${goalAction}.`;
    } else {
      return `At ${startTime} on ${dayOfWeek}, pick up the book you're currently reading for ${goalAction}.`;
    }
  }

  // Learning/study tasks
  if (lower.includes('study') || lower.includes('homework') || lower.includes('learn')) {
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

  // Reading tasks - distinguish leisure from academic
  if (lower.includes('read')) {
    const isAcademicReading = lower.includes('study') ||
      lower.includes('textbook') ||
      lower.includes('homework') ||
      lower.includes('assignment') ||
      lower.includes('chapter');

    if (isAcademicReading) {
      return `At ${startTime} on ${dayOfWeek}, help them open their reading materials to the right page for ${goalAction}.`;
    } else {
      return `At ${startTime} on ${dayOfWeek}, hand them the book they're currently reading for ${goalAction}.`;
    }
  }

  // Learning/study tasks
  if (lower.includes('study') || lower.includes('homework') || lower.includes('learn')) {
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

  // Reading - distinguish leisure from academic
  if (lower.includes('read')) {
    const isAcademicReading = lower.includes('study') ||
      lower.includes('textbook') ||
      lower.includes('homework') ||
      lower.includes('chapter');
    return isAcademicReading ? 'Open reading materials' : 'Pick up book';
  }

  if (lower.includes('study') || lower.includes('homework')) return 'Open materials';
  if (lower.includes('practice') || lower.includes('instrument')) return 'Get instrument';
  if (lower.includes('cook') || lower.includes('meal')) return 'Get ingredients';
  if (lower.includes('write') || lower.includes('journal')) return 'Open notebook';

  return 'Start preparing';
}

/**
 * Returns barrier-specific templates for Individual flow with natural language
 */
function getIndividualBarrierTemplate(barrierId: string, vars: ActionableVariables): BarrierTemplate {
  const templates: Record<string, BarrierTemplate> = {
    initiation: {
      activationStep: {
        title: `At ${vars.startTime}: ${getSmartActivationTitle(vars.goalAction)}`,
        description: getSmartActivationCue(vars.goalAction, vars.startTime, vars.dayOfWeek)
      },
      barrierStep: {
        title: `20-minute focus session`,
        description: `Set a timer for 20 minutes and work on ${vars.goalObject}. When it rings, stand up and stretch for 5 minutes - give your body a break before continuing.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}: Get materials ready`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, grab or open what you need for ${vars.goalObject} - just one simple thing to get started.`
      },
      barrierStep: {
        title: `25-minute work sprint`,
        description: `Set a 25-minute timer and dive into ${vars.goalObject}. When the timer goes off, take a 5-minute movement break - walk around, stretch, or grab water.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}: Grab planning tools`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, grab a pen and paper so you can plan out ${vars.goalObject}.`
      },
      barrierStep: {
        title: `Map out 3 mini-steps`,
        description: `Take 20 minutes to break ${vars.goalObject} into 3 smaller, doable steps. Write each one down and number them 1, 2, 3 so you have a clear path forward.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}: Start your timer`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a 20-minute timer for ${vars.goalObject}.`
      },
      barrierStep: {
        title: `Work until timer rings`,
        description: `Stay focused on ${vars.goalObject} for the full 20 minutes. When your timer goes off, take a well-deserved 5-minute break.`
      }
    },
  };

  return templates[barrierId] || templates.initiation;
}

/**
 * Returns barrier-specific templates for Supporter flow with natural language
 */
function getSupporterBarrierTemplate(barrierId: string, vars: ActionableVariables): BarrierTemplate {
  const templates: Record<string, BarrierTemplate> = {
    initiation: {
      activationStep: {
        title: `At ${vars.startTime}: Hand them what they need`,
        description: getSmartSupporterActivationCue(vars.goalAction, vars.startTime, vars.dayOfWeek)
      },
      barrierStep: {
        title: `Stay nearby during work time`,
        description: `Stick around in the same room while they work on ${vars.goalObject} for about 20 minutes. When time's up, check in and celebrate any progress they made, no matter how small.`
      }
    },
    attention: {
      activationStep: {
        title: `At ${vars.startTime}: Set up the timer`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, set a visible 25-minute timer where they can see it and say: "Let's work on ${vars.goalObject} until this rings."`
      },
      barrierStep: {
        title: `Check in when timer ends`,
        description: `When the 25-minute timer goes off, check in to see how ${vars.goalObject} went. Help them take a 5-minute movement break - maybe walk around together or get water.`
      }
    },
    planning: {
      activationStep: {
        title: `At ${vars.startTime}: Get planning materials`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, hand them paper and a pen so they can map out ${vars.goalObject}.`
      },
      barrierStep: {
        title: `Help create a simple plan`,
        description: `Sit down together for 20 minutes to break ${vars.goalObject} into 3 smaller steps. Ask questions like "What needs to happen first?" but let them make the decisions and write things down.`
      }
    },
    time: {
      activationStep: {
        title: `At ${vars.startTime}: Set the work timer`,
        description: `At ${vars.startTime} on ${vars.dayOfWeek}, help them set a 20-minute timer for working on ${vars.goalObject}.`
      },
      barrierStep: {
        title: `Celebrate when timer rings`,
        description: `Check in when the 20-minute timer goes off. Celebrate what they accomplished with ${vars.goalObject} and make sure they take a 5-minute break before continuing.`
      }
    },
  };

  return templates[barrierId] || templates.initiation;
}

/**
 * Parse keywords from barrier context for PM flow
 */
function parseBarrierKeywords(context: string): Record<string, boolean> {
  const contextLower = context.toLowerCase();
  return {
    sofa: contextLower.includes('sofa') || contextLower.includes('couch'),
    gaming: contextLower.includes('gaming') || contextLower.includes('game') || contextLower.includes('video'),
    phone: contextLower.includes('phone') || contextLower.includes('texting'),
    tv: contextLower.includes('tv') || contextLower.includes('television') || contextLower.includes('watching'),
    bed: contextLower.includes('bed') || contextLower.includes('bedroom'),
    musicStand: contextLower.includes('music stand') || contextLower.includes('equipment'),
    supplies: contextLower.includes('supplies') || contextLower.includes('materials') || contextLower.includes('tools'),
    overwhelmed: contextLower.includes('overwhelm') || contextLower.includes('too much') || contextLower.includes('stressed'),
    forget: contextLower.includes('forget') || contextLower.includes('remember') || contextLower.includes('memory'),
    procrastinate: contextLower.includes('procrastin') || contextLower.includes('put off') || contextLower.includes('delay'),
    distracted: contextLower.includes('distract') || contextLower.includes('focus') || contextLower.includes('attention'),
  };
}

/**
 * Generate barrier-specific activation steps for PM flow (individual)
 */
export function getPMBarrierTemplate(
  barrierId: string,
  context: string,
  goalTitle: string,
  skillLevel: number
): { title: string; description: string; estimatedDuration: number } {

  const keywords = parseBarrierKeywords(context);
  const goalObject = extractGoalObject(goalTitle);

  const templates: Record<string, { title: string; description: string }> = {
    initiation: keywords.sofa || keywords.bed ? {
      title: `Stand up and take one step toward practice`,
      description: `At practice time, your only job is to push off the ${keywords.sofa ? 'sofa' : 'bed'} and take one step toward where you'll practice ${goalObject}. Nothing else required yet.`
    } : keywords.gaming || keywords.tv ? {
      title: `Pause and take one step toward practice`,
      description: `At practice time, pause your ${keywords.gaming ? 'game' : 'show'} and stand up. Take one step toward where you'll practice ${goalObject}. You can come back after.`
    } : {
      title: `Touch the practice materials`,
      description: `At practice time, your only job is to touch what you need for ${goalObject}. Pick it up, put it down. That's it. The hard part is starting.`
    },

    attention: keywords.phone ? {
      title: `Put phone in another room, set 20-minute timer`,
      description: `Before starting ${goalObject}, walk your phone to another room (not just out of reach). Then set a visible 20-minute timer and focus on just one small part of practice.`
    } : keywords.distracted ? {
      title: `Set up distraction-free zone for 15 minutes`,
      description: `Clear your practice space of everything except what you need for ${goalObject}. Set a 15-minute timer. Focus on the smallest possible piece of the task.`
    } : {
      title: `Set visible 20-minute timer for focused work`,
      description: `Before starting ${goalObject}, set a timer you can see for 20 minutes. Tell yourself you only need to focus for these 20 minutes, then you can take a break.`
    },

    time: keywords.forget || keywords.musicStand || keywords.supplies ? {
      title: `Put practice materials by the door tonight`,
      description: `Tonight before bed, gather everything you need for ${goalObject} and put it by the door. Set two phone alarms: one for 10 minutes before practice, one for practice time.`
    } : {
      title: `Set two alarms: prep reminder and start time`,
      description: `Set two alarms for ${goalObject}: one 10 minutes before practice time (to gather materials), and one at practice time. Label them clearly so you know what to do.`
    },

    planning: keywords.overwhelmed ? {
      title: `Write down the tiniest first step (under 5 minutes)`,
      description: `On paper, break ${goalObject} into the smallest possible first action that takes under 5 minutes. Just do that one tiny piece. Ignore the rest for now.`
    } : {
      title: `Number paper 1-2-3, write one mini-action per number`,
      description: `Get paper and number it 1, 2, 3. For each number, write one tiny action for ${goalObject}. Each action should take less than 10 minutes. Just follow the numbers.`
    }
  };

  const template = templates[barrierId] || templates.initiation;

  return {
    ...template,
    estimatedDuration: barrierId === 'attention' ? 20 : 5
  };
}

/**
 * Generate barrier-specific supporter steps for PM flow
 */
export function getPMSupporterBarrierTemplate(
  barrierId: string,
  context: string,
  goalTitle: string,
  helperName: string
): { title: string; description: string; estimatedDuration: number } {

  const keywords = parseBarrierKeywords(context);
  const goalObject = extractGoalObject(goalTitle);

  const templates: Record<string, { title: string; description: string }> = {
    initiation: keywords.sofa || keywords.bed ? {
      title: `${helperName} helps them stand and walk to practice area`,
      description: `At practice time, ${helperName} goes to where they are, offers a hand, and walks together to the practice area for ${goalObject}. Stay nearby for the first 5 minutes.`
    } : {
      title: `${helperName} hands them materials and stays nearby`,
      description: `At practice time, ${helperName} brings the materials for ${goalObject} to them, places them within reach, and sits nearby for the first 5 minutes of practice.`
    },

    attention: keywords.phone ? {
      title: `${helperName} collects phone, sets timer, checks in at 20 min`,
      description: `${helperName} asks for their phone at practice time, puts it in another room, and sets a visible 20-minute timer. Checks in when timer rings to celebrate focus.`
    } : {
      title: `${helperName} sets up space and 20-minute timer`,
      description: `${helperName} helps clear the practice space before ${goalObject}, sets a visible 20-minute timer, and checks in halfway through to see if they need support.`
    },

    time: keywords.forget || keywords.supplies ? {
      title: `${helperName} preps materials the night before`,
      description: `The night before, ${helperName} helps gather everything needed for ${goalObject} and puts it by the door. Sets two alarms (prep + start) together.`
    } : {
      title: `${helperName} gives 10-minute and start-time reminders`,
      description: `${helperName} gives a friendly 10-minute warning before ${goalObject} practice, then a start-time check-in. Helps gather materials during the 10-minute window.`
    },

    planning: keywords.overwhelmed ? {
      title: `${helperName} breaks task into one 5-minute action`,
      description: `Together, ${helperName} and them write down just the first tiny step for ${goalObject} (under 5 minutes). ${helperName} reassures them that's all they need to do today.`
    } : {
      title: `${helperName} creates numbered 1-2-3 mini-step list together`,
      description: `${helperName} sits down with paper, numbers 1-2-3, and together they write one small action per number for ${goalObject}. ${helperName} stays nearby as they follow the list.`
    }
  };

  const template = templates[barrierId] || templates.initiation;

  return {
    ...template,
    estimatedDuration: barrierId === 'attention' ? 20 : 10
  };
}

/**
 * Generates a natural, varied goal completion step - simplified for natural language
 */
function getSmartCompletionStep(goalAction: string, goalTitle: string, flow: 'individual' | 'supporter'): MicroStep {
  const lower = goalAction.toLowerCase();
  const object = extractGoalObject(goalTitle);

  if (flow === 'supporter') {
    return {
      title: `Celebrate finishing`,
      description: `Be there as they complete ${object}. Help them mark the accomplishment - maybe snap a photo together, give a high-five, or ask them to share what they learned. Celebrate the effort!`
    };
  }

  // Individual flow - keep it simple and natural
  return {
    title: `You did it!`,
    description: `Finish up ${object}. When you're done, take a moment to mark your accomplishment - snap a photo, jot down what you learned, or just note how you feel. You earned it!`
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

    // Handle new barrier structure (priority-based) or fallback to old structure  
    const barrier1 = data.barriers?.priority1 || data.challengeAreas?.[0] || 'initiation';
    const barrier2 = data.barriers?.priority2 || data.challengeAreas?.[1] || inferSecondBarrier(
      barrier1,
      data.goalType || 'reminder',
      data.category || 'general'
    );

    // Log inference for debugging
    if (!data.barriers?.priority2 && !data.challengeAreas?.[1]) {
      console.log('[Barrier Inference]', {
        barrier1,
        inferredBarrier2: barrier2,
        goalType: data.goalType,
        category: data.category
      });
    }

    // Detect leisure reading context for AI guidance
    const goalLower = data.goalTitle.toLowerCase();
    const isReading = goalLower.includes('read');
    const timeHour = data.customTime ? parseInt(data.customTime.split(':')[0]) : null;
    const isLeisureReading = isReading && (
      goalLower.includes('before bed') ||
      goalLower.includes('for fun') ||
      goalLower.includes('relax') ||
      goalLower.includes('novel') ||
      goalLower.includes('book') ||
      (timeHour !== null && timeHour >= 20) // Evening time suggests leisure
    );

    // Build context hints for AI
    const contextHints = [];
    if (isLeisureReading) {
      contextHints.push('This is LEISURE reading (book, novel), not academic study. Use "book" not "textbook" or "study materials".');
    }

    // Get helper name for personalization
    const helperName = data.teachingHelper?.helperName || data.supporterName || '';

    // Combine barrier context from new structure or old field
    const barrierContextCombined = [
      data.barriers?.context,
      data.barrierContext,
      ...contextHints
    ].filter(Boolean).join(' ');

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
      barrierContext: barrierContextCombined,
      supportedPersonName: data.supportedPersonName || '',
      supporterName: helperName,
    };

    console.log('[generateMicroStepsSmart] Calling AI service with payload:', payload);

    // Rate limiting: ensure minimum interval between API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < MIN_CALL_INTERVAL_MS) {
      const waitTime = MIN_CALL_INTERVAL_MS - timeSinceLastCall;
      console.log(`[Rate Limit] Waiting ${Math.round(waitTime / 1000)}s before API call (free tier protection)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastApiCallTime = Date.now();

    const { microSteps, error } = await AIService.getMicroSteps(payload);
    console.log('[generateMicroStepsSmart] AI response:', { microSteps, error, stepCount: microSteps?.length });

    if (error || !microSteps || microSteps.length !== 4) {
      console.error('AI generation failed:', { error, stepCount: microSteps?.length });
      throw new Error(`AI temporarily unavailable: ${error || 'No steps generated'}`);
    }

    return microSteps;
  } catch (err) {
    console.error('Smart generation error:', err);
    throw err;
  }
}

/**
 * Parses prerequisite text into natural, flowing instructions
 */
function parsePrerequisiteIntoAction(prereqText: string, dayOfWeek: string, flow: 'individual' | 'supporter'): string {
  const lower = prereqText.toLowerCase();

  // Detect uncertainty/confusion keywords
  const uncertaintyKeywords = ['not sure', 'don\'t know', 'need to find', 'where to', 'how to', 'unsure'];
  const hasUncertainty = uncertaintyKeywords.some(kw => lower.includes(kw));

  if (flow === 'supporter') {
    if (hasUncertainty || lower.includes('find') || lower.includes('locate')) {
      return `Before ${dayOfWeek}, help them research options online or ask around. Write down 2-3 possibilities on a sticky note so they have concrete choices.`;
    }
    if (lower.includes('help') || lower.includes('someone')) {
      return `Before ${dayOfWeek}, help them identify 2 people who could assist. Write their names on a visible note.`;
    }
    if (lower.includes('material') || lower.includes('supplies')) {
      return `Before ${dayOfWeek}, gather all required materials and place them in a designated spot like their desk or the kitchen counter.`;
    }
    return `Before ${dayOfWeek}, help them get everything ready for their goal.`;
  }

  // Individual flow - generate natural research/exploration instructions
  if (hasUncertainty || lower.includes('find') || lower.includes('locate')) {
    if (lower.includes('friend') || lower.includes('people') || lower.includes('partner')) {
      return `By Wednesday, spend 15-20 minutes searching online for relevant groups or text 2 people for recommendations. Write down what you find. Then by ${dayOfWeek}, reach out to one group or person.`;
    }
    if (lower.includes('place') || lower.includes('location') || lower.includes('where')) {
      return `By Wednesday, search online for locations or ask 2 people for suggestions. Write down 2-3 options. Then by ${dayOfWeek}, pick your favorite location and save the address.`;
    }
    return `By Wednesday, spend about 20 minutes researching 3 possible options online. Make a list. Then by ${dayOfWeek}, choose your top option to try.`;
  }

  if (lower.includes('help') || lower.includes('someone')) {
    return `By Wednesday, text or talk to 2 people who might be able to help. Then by ${dayOfWeek}, follow up with whoever said yes and confirm a time.`;
  }

  if (lower.includes('material') || lower.includes('supplies') || lower.includes('book') || lower.includes('equipment')) {
    return `By Wednesday, gather all the materials you need. Then by ${dayOfWeek}, place them in one easy-to-find spot.`;
  }

  if (lower.includes('permission') || lower.includes('approval')) {
    return `By Wednesday, ask for permission. Then by ${dayOfWeek}, get final confirmation.`;
  }

  // Catch-all for other prerequisites
  return `By Wednesday, take the first step to address this: ${prereqText.slice(0, 60)}. Then by ${dayOfWeek}, double-check that you're ready.`;
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
