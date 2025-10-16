/**
 * PM Fallback Step Generator
 * 
 * Generates a basic 6-10 step practice plan when AI generation fails.
 * Uses domain-specific templates to create a reasonable starter plan.
 */

interface PMMetadata {
  phase: 'learn' | 'practice' | 'apply' | 'master';
  weekNumber: string;
  supportLevel: 'high' | 'medium' | 'low' | 'minimal';
  difficulty: number;
}

interface FallbackStep {
  title: string;
  notes: string;
  estimatedDuration: number;
  pm_metadata: PMMetadata;
  weekIndex: number;
}

const DOMAIN_TEMPLATES: Record<string, (title: string, weeks: number) => FallbackStep[]> = {
  social_skills: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Practice 3 'hello + name' greetings with family at home",
        notes: "Start with people you know well. Say 'Hello [name], how are you?'",
        estimatedDuration: 10,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Learn 3 conversation openers",
        notes: "Practice: 'How's your day going?', 'What class do you like?', 'What did you do this weekend?'",
        estimatedDuration: 15,
        pm_metadata: { phase: 'learn', weekNumber: '1-2', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Try 2 short greetings with classmates you see often",
        notes: "Use one of your openers. Keep it short and friendly. No need for long conversation yet.",
        estimatedDuration: 15,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Ask 1 open question in lunch line or hallway",
        notes: "Pick someone who seems friendly. Ask about their day or weekend plans.",
        estimatedDuration: 10,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Join 1 club or class activity and greet one new person",
        notes: "Pick an activity you're interested in. Introduce yourself to someone new.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'apply', weekNumber: '3', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Practice 2 short chats (30-60 seconds) using: Greet → Question → Share",
        notes: "Example: 'Hi! How was your weekend?' → Listen → 'Oh cool! I went hiking.'",
        estimatedDuration: 20,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Reflect: What went well this week? Plan next week's 2 chats",
        notes: "Write down what felt good and what was challenging. Pick 2 people to talk to next week.",
        estimatedDuration: 15,
        pm_metadata: { phase: 'master', weekNumber: '4', supportLevel: 'minimal', difficulty: 2 },
        weekIndex: 4
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, Math.ceil(weeks * 1.5)));
  },
  
  independent_living: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Watch demonstration of the skill with helper",
        notes: "Have your helper show you each step. Ask questions about anything unclear.",
        estimatedDuration: 20,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Try the task with full helper support",
        notes: "Do it together step-by-step. Helper guides you through each part.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 2 },
        weekIndex: 1
      },
      {
        title: "Practice with helper nearby for questions",
        notes: "Do most steps yourself. Ask for help when stuck.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Complete task independently, show helper result",
        notes: "Do the full task on your own. Show your work to helper for feedback.",
        estimatedDuration: 40,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 3 },
        weekIndex: 2
      },
      {
        title: "Do task independently 3 times this week",
        notes: "Build consistency. Notice what gets easier each time.",
        estimatedDuration: 35,
        pm_metadata: { phase: 'apply', weekNumber: '3', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Troubleshoot: What if something goes wrong?",
        notes: "Practice handling 2 common problems. Know when to ask for help.",
        estimatedDuration: 25,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Complete task fully independently for 2 weeks",
        notes: "Maintain quality and consistency. Track your progress.",
        estimatedDuration: 35,
        pm_metadata: { phase: 'master', weekNumber: '4+', supportLevel: 'minimal', difficulty: 4 },
        weekIndex: 4
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, Math.ceil(weeks * 1.2)));
  },
  
  employment: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Explore 3 career interests online or with helper",
        notes: "Research what these jobs involve. What sounds interesting?",
        estimatedDuration: 30,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Draft basic resume with helper support",
        notes: "List your skills, education, and experience. Use a template.",
        estimatedDuration: 45,
        pm_metadata: { phase: 'learn', weekNumber: '1-2', supportLevel: 'high', difficulty: 2 },
        weekIndex: 1
      },
      {
        title: "Practice mock interview questions (5 common ones)",
        notes: "Have helper ask you: Tell me about yourself, Why this job?, Strengths?, etc.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Job shadow or informational interview with someone",
        notes: "Spend 1-2 hours learning about their job. Ask questions.",
        estimatedDuration: 90,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 3 },
        weekIndex: 2
      },
      {
        title: "Apply to 2 positions (or volunteer opportunities)",
        notes: "Submit applications with your resume. Follow up after 1 week.",
        estimatedDuration: 60,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Prepare for real interview: outfit, questions, arrival plan",
        notes: "Practice getting there on time. Prepare 3 questions to ask them.",
        estimatedDuration: 40,
        pm_metadata: { phase: 'apply', weekNumber: '4', supportLevel: 'low', difficulty: 4 },
        weekIndex: 4
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, weeks));
  },
  
  education: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Set up study space and gather materials",
        notes: "Find a quiet spot. Get notebooks, pens, computer, etc. organized.",
        estimatedDuration: 20,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Create study schedule: when, where, how long",
        notes: "Plan specific times each day. Start with 20-30 minute blocks.",
        estimatedDuration: 15,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Practice note-taking during 1 class or video",
        notes: "Write main points. Use bullet points and headings.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Complete 3 study sessions following your schedule",
        notes: "Stick to your plan. Track what you studied each time.",
        estimatedDuration: 90,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Self-quiz on material before test or assignment",
        notes: "Make flashcards or practice questions. Check your understanding.",
        estimatedDuration: 45,
        pm_metadata: { phase: 'apply', weekNumber: '3', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Complete full assignment or prepare for test independently",
        notes: "Apply what you learned. Ask for help only when truly stuck.",
        estimatedDuration: 60,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Reflect on study methods: What worked? What to improve?",
        notes: "Adjust schedule or techniques based on results.",
        estimatedDuration: 20,
        pm_metadata: { phase: 'master', weekNumber: '4', supportLevel: 'minimal', difficulty: 2 },
        weekIndex: 4
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, Math.ceil(weeks * 1.2)));
  },
  
  health: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Track current habit for 3 days (baseline)",
        notes: "Log when you do it, how long, how you feel. No changes yet.",
        estimatedDuration: 10,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Set specific goal: when, where, how much",
        notes: "Example: '20 minutes after breakfast in my room, 3 times this week'",
        estimatedDuration: 15,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Start habit 2 times this week with reminder",
        notes: "Set phone alarm. Keep it short and simple to build consistency.",
        estimatedDuration: 25,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Increase to 3 times this week, same time each day",
        notes: "Build routine. Track in calendar or app.",
        estimatedDuration: 25,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Maintain 4 times this week without reminders",
        notes: "Notice improvements in how you feel. Adjust if needed.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'apply', weekNumber: '3', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Continue for 2 weeks: track mood and energy",
        notes: "Note what helps you stick with it. What barriers come up?",
        estimatedDuration: 30,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Celebrate progress and plan to maintain long-term",
        notes: "Reflect on benefits. How will you keep this going?",
        estimatedDuration: 20,
        pm_metadata: { phase: 'master', weekNumber: '4+', supportLevel: 'minimal', difficulty: 2 },
        weekIndex: 4
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, Math.ceil(weeks * 1.2)));
  },
  
  recreation_fun: (title, weeks) => {
    const steps: FallbackStep[] = [
      {
        title: "Try the activity once to see if you like it",
        notes: "Keep it short and fun. No pressure to be perfect.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'learn', weekNumber: '1', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Learn 2-3 basics with helper or tutorial",
        notes: "Focus on getting comfortable, not mastery.",
        estimatedDuration: 30,
        pm_metadata: { phase: 'learn', weekNumber: '1-2', supportLevel: 'high', difficulty: 1 },
        weekIndex: 1
      },
      {
        title: "Practice on your own 2 times this week",
        notes: "Experiment and have fun. Notice what you enjoy most.",
        estimatedDuration: 45,
        pm_metadata: { phase: 'practice', weekNumber: '2', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Join group activity or share with friend once",
        notes: "Doing it with others adds fun. Don't worry about skill level.",
        estimatedDuration: 60,
        pm_metadata: { phase: 'practice', weekNumber: '2-3', supportLevel: 'medium', difficulty: 2 },
        weekIndex: 2
      },
      {
        title: "Set personal goal: something you want to achieve",
        notes: "Examples: Learn 1 new song, finish 1 craft project, try 3 new trails",
        estimatedDuration: 30,
        pm_metadata: { phase: 'apply', weekNumber: '3', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      },
      {
        title: "Practice regularly and track progress toward goal",
        notes: "Make it part of your routine. Enjoy the process.",
        estimatedDuration: 45,
        pm_metadata: { phase: 'apply', weekNumber: '3-4', supportLevel: 'low', difficulty: 3 },
        weekIndex: 3
      }
    ];
    
    return steps.slice(0, Math.min(steps.length, weeks));
  }
};

/**
 * Generate fallback steps for PM goals when AI generation fails
 */
export function generatePMFallbackSteps(
  goalTitle: string,
  domain: string,
  durationWeeks: number
): FallbackStep[] {
  const normalizedDomain = domain.toLowerCase().replace(/[_-]/g, '_');
  const template = DOMAIN_TEMPLATES[normalizedDomain] || DOMAIN_TEMPLATES.independent_living;
  
  const steps = template(goalTitle, durationWeeks);
  
  console.log(`[Fallback] Generated ${steps.length} steps for ${normalizedDomain} domain`);
  return steps;
}
