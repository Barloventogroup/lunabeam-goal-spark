import type { Goal, Step, StepMetadata } from '@/types';

// Simple rules-based step generation for common goals
export const stepsGenerator = {
  async generateSteps(goal: Goal): Promise<Step[]> {
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
        explainer: "Open your calendar and choose any day next week.",
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
        explainer: "Use the clinic link or call; confirm time and location.",
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
        explainer: "Add date, address, and a 1-hour reminder.",
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
        explainer: "Jot 3 things you want to talk about.",
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
        explainer: "ID, payment method, and any forms.",
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
        explainer: "Look up their background and approach to feel more prepared.",
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
        explainer: "Check how to get there and how long it takes.",
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
        explainer: "Add a phone reminder to leave 15 minutes early.",
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
        explainer: "Find a quiet spot with good lighting and minimal distractions.",
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
        explainer: "Block out specific times for studying each subject.",
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
        explainer: "Collect textbooks, notes, pens, and any tech you need.",
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
        explainer: "Go through course requirements and upcoming deadlines.",
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
        explainer: "Add phone alerts for each study session.",
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
        explainer: "Connect with a classmate for accountability and help.",
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
        explainer: "Plan what to do if you fall behind schedule.",
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
        explainer: "Pick a consistent time that works with your schedule.",
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
        explainer: "Start with 3-4 basic exercises you can do consistently.",
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
        explainer: "Lay out comfortable clothes and shoes the night before.",
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
        explainer: "Set up a simple way to record your workouts.",
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
        explainer: "Schedule rest days between intense workouts.",
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
        explainer: "Create an energizing playlist to keep you motivated.",
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
        explainer: "Plan small treats for completing each week.",
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
      explainer: "List the main parts of this goal in simple steps.",
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
      explainer: "Pick the easiest thing you can do today to get started.",
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
      explainer: "Do that first step - even 2 minutes counts!",
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
      explainer: "Look back at what you've accomplished so far.",
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
      explainer: "Think about what comes next to keep momentum going.",
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
      explainer: "Tell someone about your goal or ask for help.",
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
      explainer: "Take a moment to appreciate your progress.",
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