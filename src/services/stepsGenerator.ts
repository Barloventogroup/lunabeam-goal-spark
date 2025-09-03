import type { Goal, Step, StepMetadata } from '@/types';

// Simple rules-based step generation for common goals
export const stepsGenerator = {
  async generateSteps(goal: Goal): Promise<Step[]> {
    // 1) Try to generate milestone steps from SMART-like description
    const milestone = generateMilestoneSteps(goal);
    if (milestone.length > 0) {
      return milestone;
    }

    // 2) Fallback to rules-based base steps
    const baseSteps = getBaseStepsForGoal(goal);
    
    return baseSteps.map((stepData, index) => ({
      id: `step_${Date.now()}_${index}`,
      goal_id: goal.id,
      ...stepData,
      order_index: index,
      status: 'todo' as const,
      type: 'action' as const,
      hidden: false,
      blocked: false,
      aiGenerated: true,
      dependency_step_ids: [],
      notes: stepData.explainer,
      explainer: stepData.explainer,
      due_date: undefined,
      points: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
};

function generateMilestoneSteps(goal: Goal): Step[] {
  const desc = (goal.description || '').toLowerCase();
  const title = goal.title || '';

  // Detect patterns like "20 minutes, 2×/week for 2 weeks"
  const freqMatch = desc.match(/(\d+)\s*[×x]\s*\/\s*week/);
  const durMatch = desc.match(/for\s+(\d+)\s+weeks?/);
  const minsMatch = desc.match(/(\d+)\s*min/);

  if (!freqMatch || !durMatch) return [];

  const frequency = Math.max(1, parseInt(freqMatch[1], 10));
  const weeks = Math.max(1, parseInt(durMatch[1], 10));
  const minutes = minsMatch ? parseInt(minsMatch[1], 10) : undefined;
  const totalSessions = frequency * weeks;

  // Start from goal.start_date if available, otherwise today
  const start = goal.start_date ? new Date(goal.start_date) : new Date();
  const steps: Step[] = [];

  // Distribute sessions evenly through each week
  const daySpacing = 7 / frequency; // e.g., 3.5 days for 2x/week

  for (let i = 0; i < totalSessions; i++) {
    const weekIndex = Math.floor(i / frequency); // 0-based
    const sessionIndex = i % frequency; // 0..frequency-1

    const dayOffset = Math.round(weekIndex * 7 + (sessionIndex + 1) * daySpacing);
    const due = new Date(start);
    due.setDate(due.getDate() + dayOffset);

    const labelMinutes = minutes ? `${minutes} min` : '';
    const stepTitle = `Week ${weekIndex + 1}, Session ${sessionIndex + 1}: ${title}${labelMinutes ? ` · ${labelMinutes}` : ''}`;

    steps.push({
      id: `ms_${goal.id}_${i}_${Date.now()}`,
      goal_id: goal.id,
      title: stepTitle,
      explainer: `Complete a ${labelMinutes || 'scheduled'} session for your goal.`,
      notes: undefined,
      order_index: i,
      estimated_effort_min: minutes,
      due_date: due.toISOString().slice(0, 10),
      status: 'todo',
      type: 'action',
      is_required: true,
      hidden: false,
      blocked: false,
      isBlocking: false,
      points: undefined,
      dependency_step_ids: [],
      precursors: [],
      dependencies: [],
      supportingLinks: [],
      aiGenerated: true,
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return steps;
}


interface BaseStepData {
  title: string;
  explainer: string;
  isBlocking: boolean;
  precursors: string[];
  dependencies: string[];
  estimated_effort_min: number;
  is_required: boolean;
  supportingLinks: string[];
  userFeedback: {
    tooBig: false;
    confusing: false;
    notRelevant: false;
    needsMoreSteps: false;
  };
  metadata: StepMetadata;
}

function getBaseStepsForGoal(goal: Goal): BaseStepData[] {
  const domain = goal.domain?.toLowerCase() || '';
  const title = goal.title.toLowerCase();
  
  // Counseling/therapy goals
  if (title.includes('counseling') || title.includes('therapy') || title.includes('therapist')) {
    return [
      {
        title: "Pick a session date",
        explainer: "Open your calendar and choose any day next week. Why: Having a specific date creates commitment and makes the appointment feel real, reducing the chance you'll postpone it indefinitely.",
        isBlocking: true,
        precursors: [],
        dependencies: ["book_appointment"],
        estimated_effort_min: 3,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 5 }
      },
      {
        title: "Book the appointment",
        explainer: "Use the clinic link or call; confirm time and location. Why: Actually booking secures your spot and creates accountability - you've made a real commitment that's harder to back out of.",
        isBlocking: true,
        precursors: ["pick_date"],
        dependencies: ["add_calendar", "pack_basics"],
        estimated_effort_min: 5,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 5 }
      },
      {
        title: "Add it to your calendar",
        explainer: "Add date, address, and a 1-hour reminder. Why: Calendar reminders prevent you from accidentally scheduling over it or forgetting, and having the address ready reduces last-minute stress.",
        isBlocking: false,
        precursors: ["book_appointment"],
        dependencies: [],
        estimated_effort_min: 2,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Prep 3 topics",
        explainer: "Jot 3 things you want to talk about. Why: Preparing topics helps you make the most of your limited session time and reduces the anxiety of not knowing what to say.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 4,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
      },
      {
        title: "Pack basics",
        explainer: "ID, payment method, and any forms. Why: Having everything ready prevents delays or having to reschedule because you forgot something essential.",
        isBlocking: false,
        precursors: ["book_appointment"],
        dependencies: [],
        estimated_effort_min: 3,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Research your therapist",
        explainer: "Look up their background and approach to feel more prepared. Why: Understanding their style helps set realistic expectations and can reduce first-session anxiety by making them feel less like a stranger.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 6,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 2 }
      },
      {
        title: "Plan your route",
        explainer: "Check how to get there and how long it takes. Why: Knowing your route prevents being late and arriving stressed, which could negatively impact your first session.",
        isBlocking: false,
        precursors: ["book_appointment"],
        dependencies: [],
        estimated_effort_min: 4,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 2 }
      },
      {
        title: "Set arrival reminder",
        explainer: "Add a phone reminder to leave 15 minutes early. Why: Extra time buffer accounts for unexpected delays and helps you arrive calm rather than rushed and anxious.",
        isBlocking: false,
        precursors: ["add_calendar"],
        dependencies: [],
        estimated_effort_min: 2,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      }
    ];
  }
  
  // School/study goals
  if (domain === 'school' || title.includes('study') || title.includes('homework') || title.includes('assignment')) {
    return [
      {
        title: "Set up study space",
        explainer: "Find a quiet spot with good lighting and minimal distractions. Why: A dedicated study environment signals to your brain it's time to focus and helps build consistent study habits.",
        isBlocking: false,
        precursors: [],
        dependencies: ["create_schedule"],
        estimated_effort_min: 5,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 4 }
      },
      {
        title: "Create study schedule",
        explainer: "Block out specific times for studying each subject. Why: Scheduled study sessions become automatic habits and prevent important subjects from getting neglected when life gets busy.",
        isBlocking: true,
        precursors: ["set_up_space"],
        dependencies: ["gather_materials"],
        estimated_effort_min: 10,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 5 }
      },
      {
        title: "Gather materials",
        explainer: "Collect textbooks, notes, pens, and any tech you need. Why: Having everything ready eliminates friction and excuses that could derail your study sessions.",
        isBlocking: false,
        precursors: ["create_schedule"],
        dependencies: [],
        estimated_effort_min: 3,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Review syllabus",
        explainer: "Go through course requirements and upcoming deadlines. Why: Understanding what's expected helps you prioritize your study time and avoid last-minute panic about assignments you forgot.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 8,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
      },
      {
        title: "Set study reminders",
        explainer: "Add phone alerts for each study session. Why: Reminders help you stick to your schedule even when you're tired or distracted by other activities.",
        isBlocking: false,
        precursors: ["create_schedule"],
        dependencies: [],
        estimated_effort_min: 3,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Find study buddy",
        explainer: "Connect with a classmate for accountability and help. Why: Study partners provide motivation, help explain difficult concepts, and make you less likely to skip study sessions.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 10,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 3, scoreImpact: 3 }
      },
      {
        title: "Create backup plan",
        explainer: "Plan what to do if you fall behind schedule. Why: Having a recovery strategy prevents one missed session from derailing your entire study plan.",
        isBlocking: false,
        precursors: ["create_schedule"],
        dependencies: [],
        estimated_effort_min: 5,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 2 }
      }
    ];
  }
  
  // Exercise/health goals
  if (domain === 'health' || title.includes('exercise') || title.includes('workout') || title.includes('gym')) {
    return [
      {
        title: "Choose workout time",
        explainer: "Pick a consistent time that works with your schedule. Why: Consistent timing helps exercise become an automatic habit rather than something you have to decide about daily.",
        isBlocking: true,
        precursors: [],
        dependencies: ["plan_routine"],
        estimated_effort_min: 3,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 4 }
      },
      {
        title: "Plan simple routine",
        explainer: "Start with 3-4 basic exercises you can do consistently. Why: Simple routines are easier to stick with long-term, and consistency matters more than complexity when building fitness habits.",
        isBlocking: true,
        precursors: ["choose_time"],
        dependencies: ["get_ready"],
        estimated_effort_min: 8,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 5 }
      },
      {
        title: "Get workout clothes ready",
        explainer: "Lay out comfortable clothes and shoes the night before. Why: Removing barriers like searching for workout clothes makes it easier to follow through when motivation is low.",
        isBlocking: false,
        precursors: ["plan_routine"],
        dependencies: [],
        estimated_effort_min: 2,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Track progress",
        explainer: "Set up a simple way to record your workouts. Why: Seeing your progress over time provides motivation and helps you notice improvements you might otherwise miss.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 5,
        is_required: true,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
      },
      {
        title: "Plan recovery days",
        explainer: "Schedule rest days between intense workouts. Why: Rest days prevent injury and burnout while allowing your muscles to recover and grow stronger.",
        isBlocking: false,
        precursors: ["plan_routine"],
        dependencies: [],
        estimated_effort_min: 3,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
      },
      {
        title: "Find workout music",
        explainer: "Create an energizing playlist to keep you motivated. Why: Music boosts energy and makes workouts more enjoyable, helping you exercise longer and look forward to the next session.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 8,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 2 }
      },
      {
        title: "Set mini rewards",
        explainer: "Plan small treats for completing each week. Why: Rewards create positive associations with exercise and give you something to look forward to beyond just the workout itself.",
        isBlocking: false,
        precursors: [],
        dependencies: [],
        estimated_effort_min: 4,
        is_required: false,
        supportingLinks: [],
        userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
        metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 3 }
      }
    ];
  }
  
  // Default generic steps
  return [
    {
      title: "Break it down",
      explainer: "List the main parts of this goal in simple steps. Why: Complex goals feel overwhelming, but breaking them into smaller pieces makes progress feel achievable and helps you see a clear path forward.",
      isBlocking: false,
      precursors: [],
      dependencies: ["plan_first_step"],
      estimated_effort_min: 5,
      is_required: true,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
    },
    {
      title: "Plan first step",
      explainer: "Pick the easiest thing you can do today to get started. Why: Starting with something easy builds momentum and confidence, making it more likely you'll continue with harder steps later.",
      isBlocking: true,
      precursors: ["break_down"],
      dependencies: ["take_action"],
      estimated_effort_min: 3,
      is_required: true,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 5 }
    },
    {
      title: "Take first action",
      explainer: "Do that first step - even 2 minutes counts! Why: Taking action, however small, breaks the inertia of planning and proves to yourself that progress is possible.",
      isBlocking: false,
      precursors: ["plan_first_step"],
      dependencies: [],
      estimated_effort_min: 5,
      is_required: true,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
    },
    {
      title: "Check your progress",
      explainer: "Look back at what you've accomplished so far. Why: Acknowledging progress boosts motivation and helps you see that your efforts are working, even when the goal still feels far away.",
      isBlocking: false,
      precursors: ["take_action"],
      dependencies: [],
      estimated_effort_min: 3,
      is_required: true,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 3 }
    },
    {
      title: "Plan next steps",
      explainer: "Think about what comes next to keep momentum going. Why: Having a clear next action prevents the momentum from your current progress from fizzling out due to uncertainty.",
      isBlocking: false,
      precursors: ["take_action"],
      dependencies: [],
      estimated_effort_min: 6,
      is_required: false,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 2, scoreImpact: 4 }
    },
    {
      title: "Get support",
      explainer: "Tell someone about your goal or ask for help. Why: Sharing your goals creates accountability and opens up opportunities for advice, encouragement, and practical assistance.",
      isBlocking: false,
      precursors: [],
      dependencies: [],
      estimated_effort_min: 8,
      is_required: false,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 3, scoreImpact: 3 }
    },
    {
      title: "Celebrate wins",
      explainer: "Take a moment to appreciate your progress. Why: Celebrating creates positive associations with working toward goals and reinforces the behaviors that led to success.",
      isBlocking: false,
      precursors: ["check_progress"],
      dependencies: [],
      estimated_effort_min: 2,
      is_required: false,
      supportingLinks: [],
      userFeedback: { tooBig: false, confusing: false, notRelevant: false, needsMoreSteps: false },
      metadata: { version: 1, source: 'rules', scoreEase: 1, scoreImpact: 2 }
    }
  ];
}