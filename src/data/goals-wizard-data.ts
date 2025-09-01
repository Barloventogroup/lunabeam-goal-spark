export interface GoalOption {
  id: string;
  label: string;
  emoji: string;
  explainer: string;
  isDefault?: boolean;
}

export interface GoalStep {
  id: string;
  title: string;
  emoji: string;
  options: GoalOption[];
  explainer: string;
  fallbackOption: GoalOption;
}

export interface CategoryGoal {
  id: string;
  title: string;
  emoji: string;
  purpose: GoalOption[];
  details: GoalOption[];
  timing: GoalOption[];
  supports: GoalOption[];
  smartTemplate: string;
  explainer: string;
}

export interface Category {
  id: string;
  title: string;
  emoji: string;
  goals: CategoryGoal[];
}

export const GOALS_WIZARD_DATA: Category[] = [
  {
    id: "health",
    title: "Health",
    emoji: "🌱",
    goals: [
      {
        id: "walk",
        title: "Walk",
        emoji: "🚶",
        explainer: "Walking means moving at a steady pace… helps body and mind.",
        purpose: [
          { id: "fitness", label: "For fitness", emoji: "💪", explainer: "Build strength and improve physical health" },
          { id: "stress", label: "Reduce stress", emoji: "😌", explainer: "Walking helps calm your mind and reduce anxiety" },
          { id: "social", label: "Be social", emoji: "👥", explainer: "Walk with friends or meet new people" },
          { id: "transport", label: "Transportation", emoji: "🚶‍♀️", explainer: "Get where you need to go" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason for walking" }
        ],
        details: [
          { id: "5min-block", label: "5 min around block", emoji: "🏠", explainer: "Short walk in your neighborhood", isDefault: true },
          { id: "10min-park", label: "10 min in park", emoji: "🌳", explainer: "Walk in a nearby park or green space" },
          { id: "20min-store", label: "20 min to store", emoji: "🏪", explainer: "Walk to a nearby store or destination" }
        ],
        timing: [
          { id: "1week-2weeks", label: "1×/week for 2 weeks", emoji: "📅", explainer: "Once per week for two weeks", isDefault: true },
          { id: "3week-3weeks", label: "3×/week for 3 weeks", emoji: "📅", explainer: "Three times per week for three weeks" },
          { id: "5week-4weeks", label: "5×/week for 4 weeks", emoji: "📅", explainer: "Five times per week for four weeks" }
        ],
        supports: [
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Get notifications to remind you", isDefault: true },
          { id: "checklist", label: "Checklist", emoji: "✅", explainer: "Track your progress with a checklist", isDefault: true },
          { id: "buddy", label: "Walking buddy", emoji: "👥", explainer: "Find someone to walk with" },
          { id: "playlist", label: "Music playlist", emoji: "🎵", explainer: "Create or use a walking playlist" }
        ],
        smartTemplate: "🚶 Walk {duration} {location}, {frequency} for {weeks} (to {purpose})."
      },
      {
        id: "stretch",
        title: "Stretch",
        emoji: "🧘",
        explainer: "Stretching means moving muscles gently to feel flexible and relaxed.",
        purpose: [
          { id: "morning", label: "Morning routine", emoji: "🌅", explainer: "Start your day with gentle stretching" },
          { id: "bedtime", label: "Before bedtime", emoji: "🌙", explainer: "Relax before sleep with stretching", isDefault: true },
          { id: "exercise", label: "After exercise", emoji: "🏃‍♀️", explainer: "Cool down after physical activity" },
          { id: "relax", label: "To relax", emoji: "😌", explainer: "Use stretching to reduce tension" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason for stretching" }
        ],
        details: [
          { id: "5min-fullbody", label: "5 min full body", emoji: "🧘‍♀️", explainer: "Quick stretch for your whole body", isDefault: true },
          { id: "10min-arms", label: "10 min arms", emoji: "💪", explainer: "Focus on stretching your arms and shoulders" },
          { id: "15min-legs", label: "15 min legs", emoji: "🦵", explainer: "Stretch your legs and hips" }
        ],
        timing: [
          { id: "3week-2weeks", label: "3×/week for 2 weeks", emoji: "📅", explainer: "Three times per week for two weeks" },
          { id: "5week-3weeks", label: "5×/week for 3 weeks", emoji: "📅", explainer: "Five times per week for three weeks", isDefault: true },
          { id: "7week-4weeks", label: "7×/week for 4 weeks", emoji: "📅", explainer: "Every day for four weeks" }
        ],
        supports: [
          { id: "video", label: "Guided video", emoji: "📱", explainer: "Follow along with stretching videos" },
          { id: "reminder", label: "Reminder", emoji: "🔔", explainer: "Get notifications to remind you", isDefault: true },
          { id: "checklist", label: "Checklist", emoji: "✅", explainer: "Track your progress", isDefault: true }
        ],
        smartTemplate: "🧘 Stretch {duration} {focus}, {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "education",
    title: "Education", 
    emoji: "📘",
    goals: [
      {
        id: "read",
        title: "Read Something",
        emoji: "📖",
        explainer: "Reading means looking at words in a book, article, or online.",
        purpose: [
          { id: "learn", label: "To learn", emoji: "🧠", explainer: "Gain new knowledge and information", isDefault: true },
          { id: "relax", label: "To relax", emoji: "😌", explainer: "Enjoy reading for pleasure" },
          { id: "focus", label: "Improve focus", emoji: "🎯", explainer: "Practice concentration skills" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason for reading" }
        ],
        details: [
          { id: "1page", label: "1 page", emoji: "📄", explainer: "Read just one page", isDefault: true },
          { id: "5pages", label: "5 pages", emoji: "📄", explainer: "Read five pages" },
          { id: "5min", label: "5 minutes", emoji: "⏰", explainer: "Read for five minutes" },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Read for ten minutes" }
        ],
        timing: [
          { id: "daily-2weeks", label: "Daily for 2 weeks", emoji: "📅", explainer: "Every day for two weeks" },
          { id: "3week-3weeks", label: "3×/week for 3 weeks", emoji: "📅", explainer: "Three times per week for three weeks", isDefault: true },
          { id: "5week-4weeks", label: "5×/week for 4 weeks", emoji: "📅", explainer: "Five times per week for four weeks" }
        ],
        supports: [
          { id: "log", label: "Reading log", emoji: "📝", explainer: "Track what you read", isDefault: true },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Get notifications to remind you" }
        ],
        smartTemplate: "📖 Read {amount} {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "employment",
    title: "Employment",
    emoji: "💼", 
    goals: [
      {
        id: "interview",
        title: "Practice Interview",
        emoji: "🎤",
        explainer: "An interview is a conversation to see if you fit a job.",
        purpose: [
          { id: "confidence", label: "Build confidence", emoji: "💪", explainer: "Feel more confident in interviews", isDefault: true },
          { id: "prepare", label: "Prepare for interview", emoji: "📋", explainer: "Get ready for an upcoming interview" },
          { id: "improve", label: "Improve answers", emoji: "💬", explainer: "Practice giving better responses" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "greeting", label: "Practice greeting", emoji: "👋", explainer: "How to introduce yourself" },
          { id: "tell-me", label: "Tell me about yourself", emoji: "🗣️", explainer: "Practice this common question", isDefault: true },
          { id: "mock", label: "Full mock interview", emoji: "🎭", explainer: "Complete practice interview" }
        ],
        timing: [
          { id: "10min-weekly-2weeks", label: "10 min weekly for 2 weeks", emoji: "📅", explainer: "Ten minutes once a week for two weeks", isDefault: true },
          { id: "15min-2week-3weeks", label: "15 min 2×/week for 3 weeks", emoji: "📅", explainer: "Fifteen minutes twice weekly for three weeks" }
        ],
        supports: [
          { id: "checklist", label: "Interview checklist", emoji: "✅", explainer: "Tips and reminders", isDefault: true },
          { id: "roleplay", label: "Role play partner", emoji: "👥", explainer: "Practice with someone else" },
          { id: "answers", label: "Sample answers", emoji: "💬", explainer: "Example responses to common questions" }
        ],
        smartTemplate: "🎤 Practice '{focus}' {duration}, {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "independent-living",
    title: "Independent Living",
    emoji: "🏠",
    goals: [
      {
        id: "make-bed",
        title: "Make Bed", 
        emoji: "🛏️",
        explainer: "Making bed = straighten sheets, blanket, pillows.",
        purpose: [
          { id: "tidy", label: "Tidy room", emoji: "🧹", explainer: "Keep your space organized", isDefault: true },
          { id: "calm", label: "Feel calm", emoji: "😌", explainer: "Start day with accomplished feeling" },
          { id: "routine", label: "Morning routine", emoji: "🌅", explainer: "Make it part of your daily routine" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "blanket", label: "Just blanket", emoji: "🛏️", explainer: "Simply pull up the blanket", isDefault: true },
          { id: "sheets-blanket", label: "Sheets + blanket", emoji: "🛏️", explainer: "Straighten sheets and blanket" },
          { id: "full", label: "Full bed making", emoji: "🛏️", explainer: "Sheets, blanket, and pillows" }
        ],
        timing: [
          { id: "daily-3weeks", label: "Daily for 3 weeks", emoji: "📅", explainer: "Every day for three weeks", isDefault: true },
          { id: "3week-2weeks", label: "3×/week for 2 weeks", emoji: "📅", explainer: "Three times per week for two weeks" },
          { id: "weekends-4weeks", label: "Weekends for 4 weeks", emoji: "📅", explainer: "Saturdays and Sundays for four weeks" }
        ],
        supports: [
          { id: "checklist", label: "Step checklist", emoji: "✅", explainer: "Visual steps to follow", isDefault: true },
          { id: "reminder", label: "Morning reminder", emoji: "🔔", explainer: "Notification to make your bed" }
        ],
        smartTemplate: "🛏️ Make bed {level} {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "social-skills",
    title: "Social Skills",
    emoji: "🗣️",
    goals: [
      {
        id: "say-hi",
        title: "Say Hi",
        emoji: "👋",
        explainer: "Saying hi = greeting by wave, smile, or words.",
        purpose: [
          { id: "friends", label: "Make friends", emoji: "👥", explainer: "Connect with new people" },
          { id: "practice", label: "Practice skill", emoji: "🎯", explainer: "Get better at social interactions" },
          { id: "school", label: "For school/work", emoji: "🏫", explainer: "Be friendly in school or work settings", isDefault: true },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "classmate", label: "To classmate", emoji: "🎓", explainer: "Say hi to someone from school", isDefault: true },
          { id: "neighbor", label: "To neighbor", emoji: "🏘️", explainer: "Greet people in your neighborhood" },
          { id: "teacher", label: "To teacher", emoji: "👨‍🏫", explainer: "Say hi to teachers or staff" }
        ],
        timing: [
          { id: "daily-2weeks", label: "Daily for 2 weeks", emoji: "📅", explainer: "Every day for two weeks", isDefault: true },
          { id: "3week-3weeks", label: "3×/week for 3 weeks", emoji: "📅", explainer: "Three times per week for three weeks" }
        ],
        supports: [
          { id: "script", label: "Script card", emoji: "📝", explainer: "Simple phrases to practice", isDefault: true },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Gentle reminders to say hi" }
        ],
        smartTemplate: "👋 Say hi {to} {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "housing",
    title: "Housing",
    emoji: "🏡",
    goals: [
      {
        id: "browse",
        title: "Browse Options",
        emoji: "🔍",
        explainer: "Browsing = looking at apartments/dorms online, flyers, or offices.",
        purpose: [
          { id: "move", label: "Planning to move", emoji: "📦", explainer: "Looking for a new place to live" },
          { id: "learn", label: "Learn about housing", emoji: "📚", explainer: "Understand housing options", isDefault: true },
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Research for family member" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "apt-online", label: "Apartments online", emoji: "💻", explainer: "Look at apartment websites", isDefault: true },
          { id: "shared-sites", label: "Shared housing sites", emoji: "🏠", explainer: "Browse roommate/shared housing" },
          { id: "dorm-college", label: "Dorm at college", emoji: "🎓", explainer: "Look at college housing options" }
        ],
        timing: [
          { id: "30min-weekly-3weeks", label: "30 min weekly for 3 weeks", emoji: "📅", explainer: "Thirty minutes once a week for three weeks", isDefault: true },
          { id: "45min-2week-4weeks", label: "45 min 2×/week for 4 weeks", emoji: "📅", explainer: "Forty-five minutes twice weekly for four weeks" }
        ],
        supports: [
          { id: "checklist", label: "Housing checklist", emoji: "✅", explainer: "What to look for in housing", isDefault: true },
          { id: "sites", label: "Safe sites list", emoji: "🔗", explainer: "Trusted housing websites" }
        ],
        smartTemplate: "🔍 Browse {type} {duration} {frequency} for {weeks}."
      }
    ]
  },
  {
    id: "postsecondary",
    title: "Postsecondary",
    emoji: "🎓",
    goals: [
      {
        id: "programs",
        title: "Look for Programs",
        emoji: "🔍",
        explainer: "Program = course of study at college, training center, certificate.",
        purpose: [
          { id: "college", label: "For college", emoji: "🎓", explainer: "Research college programs", isDefault: true },
          { id: "training", label: "For training", emoji: "🛠️", explainer: "Look at vocational training" },
          { id: "parent", label: "Parent request", emoji: "👨‍👩‍👧‍👦", explainer: "Researching for family" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "2yr-sites", label: "2-year college sites", emoji: "🏫", explainer: "Community college websites", isDefault: true },
          { id: "4yr-sites", label: "4-year college sites", emoji: "🏛️", explainer: "University websites" },
          { id: "cert-centers", label: "Certificate centers", emoji: "📜", explainer: "Professional certification programs" }
        ],
        timing: [
          { id: "30min-weekly-3weeks", label: "30 min weekly for 3 weeks", emoji: "📅", explainer: "Thirty minutes once a week for three weeks", isDefault: true },
          { id: "45min-2week-4weeks", label: "45 min 2×/week for 4 weeks", emoji: "📅", explainer: "Forty-five minutes twice weekly for four weeks" }
        ],
        supports: [
          { id: "worksheet", label: "Research worksheet", emoji: "📝", explainer: "Template to organize your research", isDefault: true },
          { id: "directory", label: "Program directory", emoji: "📚", explainer: "List of programs to explore" }
        ],
        smartTemplate: "🔍 Research {type} {duration} weekly for {weeks}."
      }
    ]
  },
  {
    id: "fun",
    title: "Fun / Recreation",
    emoji: "🎉",
    goals: [
      {
        id: "play-game",
        title: "Play Game",
        emoji: "🎮",
        explainer: "Games can be video, board, or puzzles.",
        purpose: [
          { id: "relax", label: "To relax", emoji: "😌", explainer: "Unwind and have fun", isDefault: true },
          { id: "socialize", label: "Be social", emoji: "👥", explainer: "Play games with others" },
          { id: "focus", label: "Improve focus", emoji: "🎯", explainer: "Practice concentration" },
          { id: "custom", label: "Other reason", emoji: "✨", explainer: "Tell us your own reason" }
        ],
        details: [
          { id: "10min-board", label: "10 min board game", emoji: "🎲", explainer: "Short board game session", isDefault: true },
          { id: "20min-video", label: "20 min video game", emoji: "🎮", explainer: "Video game session" },
          { id: "30min-puzzle", label: "30 min puzzle", emoji: "🧩", explainer: "Work on a jigsaw or word puzzle" }
        ],
        timing: [
          { id: "weekly-3weeks", label: "Weekly for 3 weeks", emoji: "📅", explainer: "Once a week for three weeks", isDefault: true },
          { id: "3week-2weeks", label: "3×/week for 2 weeks", emoji: "📅", explainer: "Three times per week for two weeks" }
        ],
        supports: [
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Reminders for game time", isDefault: true },
          { id: "buddy", label: "Game buddy", emoji: "👥", explainer: "Someone to play with" },
          { id: "log", label: "Game log", emoji: "📝", explainer: "Track games you play", isDefault: true }
        ],
        smartTemplate: "🎮 Play {type} {frequency} for {weeks}."
      }
    ]
  }
];

// Fallback option for "I don't know"
export const FALLBACK_OPTION: GoalOption = {
  id: "unsure",
  label: "I'm not sure",
  emoji: "🤔",
  explainer: "We'll help you choose something small and easy to start with."
};