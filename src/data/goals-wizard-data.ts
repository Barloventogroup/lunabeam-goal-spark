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
        explainer: "Just putting one foot in front of the other! Whether it's around the block or to the store - walking is good for both your body and mind.",
        purpose: [
          { id: "fitness", label: "Fitness/exercise", emoji: "🏋️", explainer: "Build strength and improve physical health" },
          { id: "stress", label: "Stress relief", emoji: "😌", explainer: "Walking helps calm your mind and reduce anxiety" },
          { id: "social", label: "Social connection", emoji: "🤝", explainer: "Walk with friends or meet new people" },
          { id: "transport", label: "Transportation/errand", emoji: "🛒", explainer: "Get where you need to go while being active" },
          { id: "custom", label: "Custom", emoji: "✏️", explainer: "Tell us your own reason for walking" }
        ],
        details: [
          { id: "5min-block", label: "5 min around block", emoji: "🏠", explainer: "Short walk in your neighborhood", isDefault: true },
          { id: "10min-park", label: "10 min in park", emoji: "🌳", explainer: "Walk in a nearby park or green space" },
          { id: "20min-store", label: "20 min to store", emoji: "🏪", explainer: "Walk to a nearby store or destination" }
        ],
        timing: [
          { id: "1week-2weeks", label: "1×/week for 2 weeks", emoji: "📅", explainer: "Once per week for two weeks" },
          { id: "3week-3weeks", label: "3×/week for 3 weeks", emoji: "📅", explainer: "Three times per week for three weeks", isDefault: true },
          { id: "5week-4weeks", label: "5×/week for 4 weeks", emoji: "📅", explainer: "Five times per week for four weeks" }
        ],
        supports: [
          { id: "tracker", label: "Step tracker", emoji: "📱", explainer: "Track your steps and distance" },
          { id: "reminder", label: "Reminder", emoji: "🔔", explainer: "Get notifications to remind you", isDefault: true },
          { id: "playlist", label: "Calming playlist", emoji: "🎵", explainer: "Music to accompany your walks" },
          { id: "buddy", label: "Walking buddy", emoji: "👥", explainer: "Find someone to walk with" },
          { id: "log", label: "Reflection log", emoji: "📝", explainer: "Track how walking makes you feel" }
        ],
        smartTemplate: "🚶 Walk {duration} {location}, {frequency} for {weeks}."
      },
      {
        id: "stretch",
        title: "Stretch",
        emoji: "🧘",
        explainer: "Gentle movements to help your muscles feel loose and happy. It's like giving your body a little hug!",
        purpose: [
          { id: "morning", label: "Morning wake-up", emoji: "🌅", explainer: "Start your day with gentle stretching" },
          { id: "bedtime", label: "Relax before bed", emoji: "🌙", explainer: "Unwind and relax before sleep", isDefault: true },
          { id: "exercise", label: "After exercise", emoji: "🏋️", explainer: "Cool down after physical activity" },
          { id: "tension", label: "Reduce tension", emoji: "😌", explainer: "Release muscle tightness and stress" },
          { id: "custom", label: "Custom", emoji: "✏️", explainer: "Tell us your own reason for stretching" }
        ],
        details: [
          { id: "fullbody-5min", label: "Full body, 5 min", emoji: "🧘‍♀️", explainer: "Quick stretch for your whole body", isDefault: true },
          { id: "neck-back-10min", label: "Neck/back, 10 min", emoji: "🦴", explainer: "Focus on neck and back muscles" },
          { id: "arms-10min", label: "Arms, 10 min", emoji: "💪", explainer: "Stretch your arms and shoulders" },
          { id: "legs-15min", label: "Legs, 15 min", emoji: "🦵", explainer: "Stretch your legs and hips" }
        ],
        timing: [
          { id: "morning-3week-2weeks", label: "Morning, 3×/week for 2 weeks", emoji: "🌅", explainer: "Three mornings per week for two weeks" },
          { id: "afterschool-5week-3weeks", label: "After school, 5×/week for 3 weeks", emoji: "🏫", explainer: "Five times after school for three weeks" },
          { id: "bedtime-5week-3weeks", label: "Before bed, 5×/week for 3 weeks", emoji: "🌙", explainer: "Five nights before bed for three weeks", isDefault: true },
          { id: "daily-4weeks", label: "Daily for 4 weeks", emoji: "📅", explainer: "Every day for four weeks" }
        ],
        supports: [
          { id: "video", label: "Guided video", emoji: "📱", explainer: "Follow along with stretching videos", isDefault: true },
          { id: "checklist", label: "Checklist", emoji: "✅", explainer: "Track your stretching routine" },
          { id: "reminder", label: "Reminder", emoji: "🔔", explainer: "Get notifications to stretch" },
          { id: "audio", label: "Calming audio", emoji: "🎵", explainer: "Relaxing sounds while stretching" }
        ],
        smartTemplate: "🧘 Stretch {focus} {timing} for {weeks}."
      },
      {
        id: "sleep",
        title: "Better Sleep",
        emoji: "🌙",
        explainer: "Getting consistent, quality zzz's! It's about finding a rhythm that works for you and sticking to it.",
        purpose: [
          { id: "wake-on-time", label: "Wake up on time", emoji: "⏰", explainer: "Get up when you need to without oversleeping" },
          { id: "less-tired", label: "Feel less tired", emoji: "💤", explainer: "Have more energy during the day", isDefault: true },
          { id: "focus", label: "Focus better", emoji: "📚", explainer: "Concentrate better on tasks and school" },
          { id: "calm", label: "Calm down at night", emoji: "😌", explainer: "Feel more relaxed in the evening" },
          { id: "custom", label: "Custom", emoji: "✏️", explainer: "Tell us your own reason for better sleep" }
        ],
        details: [
          { id: "10pm-7am-30min", label: "10pm-7am, screens off 30min before", emoji: "📱", explainer: "Bedtime 10pm, wake 7am, no screens 30 min before bed", isDefault: true },
          { id: "9pm-6am-60min", label: "9pm-6am, screens off 60min before", emoji: "📱", explainer: "Earlier bedtime with longer screen break" },
          { id: "11pm-8am-30min", label: "11pm-8am, screens off 30min before", emoji: "📱", explainer: "Later schedule, still consistent times" },
          { id: "custom-routine", label: "Add calming routine (read/stretch/music)", emoji: "📖", explainer: "Include relaxing activities before bed" }
        ],
        timing: [
          { id: "5nights-2weeks", label: "5 nights/week for 2 weeks", emoji: "📅", explainer: "Five nights per week for two weeks" },
          { id: "5nights-3weeks", label: "5 nights/week for 3 weeks", emoji: "📅", explainer: "Five nights per week for three weeks", isDefault: true },
          { id: "7nights-3weeks", label: "Every night for 3 weeks", emoji: "📅", explainer: "Every single night for three weeks" },
          { id: "7nights-4weeks", label: "Every night for 4 weeks", emoji: "📅", explainer: "Every single night for four weeks" }
        ],
        supports: [
          { id: "bedtime-alarm", label: "Bedtime alarm", emoji: "⏰", explainer: "Reminder when it's time to get ready for bed", isDefault: true },
          { id: "calming-activity", label: "Calming activity", emoji: "🧘", explainer: "Relaxing routine before sleep" },
          { id: "sleep-log", label: "Sleep log", emoji: "📝", explainer: "Track your sleep patterns", isDefault: true }
        ],
        smartTemplate: "🌙 Go to bed at {bedtime} and wake up at {waketime}, {frequency} for {weeks}."
      },
      {
        id: "eat-healthier",
        title: "Eat Healthier",
        emoji: "🥗",
        explainer: "Fueling your body with good stuff! Think colorful foods that make you feel energized rather than sluggish.",
        purpose: [
          { id: "energy", label: "More energy", emoji: "🍎", explainer: "Feel more energetic throughout the day", isDefault: true },
          { id: "fitness", label: "Stay fit/strong", emoji: "💪", explainer: "Support your body's strength and health" },
          { id: "stress", label: "Reduce stress (snack swaps)", emoji: "😌", explainer: "Replace stress-eating with healthier choices" },
          { id: "new-foods", label: "Try new foods", emoji: "🥦", explainer: "Explore different healthy options" },
          { id: "custom", label: "Custom", emoji: "✏️", explainer: "Tell us your own reason for eating healthier" }
        ],
        details: [
          { id: "1fruit-lunch", label: "1 fruit at lunch", emoji: "🍎", explainer: "Add one piece of fruit to your lunch", isDefault: true },
          { id: "2veggie-dinner", label: "2 veggies at dinner", emoji: "🥦", explainer: "Include two vegetables with dinner" },
          { id: "1protein-meal", label: "1 protein per meal", emoji: "🥚", explainer: "Add protein to each main meal" },
          { id: "snack-swap", label: "Healthy snack swap", emoji: "🥨", explainer: "Replace one unhealthy snack with a healthy option" }
        ],
        timing: [
          { id: "3days-2weeks", label: "3 days/week for 2 weeks", emoji: "📅", explainer: "Three days per week for two weeks" },
          { id: "5days-3weeks", label: "5 days/week for 3 weeks", emoji: "📅", explainer: "Five days per week for three weeks", isDefault: true },
          { id: "daily-3weeks", label: "Every day for 3 weeks", emoji: "📅", explainer: "Daily for three weeks" },
          { id: "daily-4weeks", label: "Every day for 4 weeks", emoji: "📅", explainer: "Daily for four weeks" }
        ],
        supports: [
          { id: "shopping-list", label: "Shopping list template", emoji: "📝", explainer: "Pre-made list of healthy foods", isDefault: true },
          { id: "food-log", label: "Food log", emoji: "📊", explainer: "Track what you eat each day" },
          { id: "snack-chart", label: "Snack swap chart", emoji: "🔄", explainer: "Visual guide for healthy snack alternatives", isDefault: true }
        ],
        smartTemplate: "🥗 Eat {focus} {frequency} for {weeks}."
      },
      {
        id: "drink-water",
        title: "Drink More Water",
        emoji: "💧",
        explainer: "H2O is your friend! Your body runs on water, so keeping it topped up helps everything work better.",
        purpose: [
          { id: "healthy", label: "Stay healthy", emoji: "💧", explainer: "Keep your body working properly", isDefault: true },
          { id: "energy", label: "More energy", emoji: "⚡", explainer: "Feel more energetic and alert" },
          { id: "focus", label: "Focus better", emoji: "🧠", explainer: "Help your brain work better" },
          { id: "replace-soda", label: "Replace soda/juice", emoji: "😌", explainer: "Substitute sugary drinks with water" },
          { id: "custom", label: "Custom", emoji: "✏️", explainer: "Tell us your own reason for drinking more water" }
        ],
        details: [
          { id: "1cup-morning", label: "1 cup in morning", emoji: "🌅", explainer: "Start your day with a glass of water", isDefault: true },
          { id: "4cups-allday", label: "4 cups all day", emoji: "📅", explainer: "Spread 4 cups throughout the day" },
          { id: "6cups-meals", label: "6 cups with meals", emoji: "🍽️", explainer: "Drink water with breakfast, lunch, and dinner" },
          { id: "8cups-scheduled", label: "8 cups on schedule", emoji: "⏰", explainer: "Drink water at set times throughout the day" },
          { id: "swap-soda", label: "Swap soda/juice with water", emoji: "🔄", explainer: "Replace one sugary drink with water each day" }
        ],
        timing: [
          { id: "daily-2weeks", label: "Daily for 2 weeks", emoji: "📅", explainer: "Every day for two weeks" },
          { id: "daily-3weeks", label: "Daily for 3 weeks", emoji: "📅", explainer: "Every day for three weeks", isDefault: true },
          { id: "daily-4weeks", label: "Daily for 4 weeks", emoji: "📅", explainer: "Every day for four weeks" }
        ],
        supports: [
          { id: "tracker", label: "Hydration tracker", emoji: "📊", explainer: "Track how much water you drink", isDefault: true },
          { id: "reminder", label: "Reminder", emoji: "🔔", explainer: "Get notifications to drink water", isDefault: true },
          { id: "bottle", label: "Water bottle with markings", emoji: "🍼", explainer: "Bottle that shows how much you've drunk" }
        ],
        smartTemplate: "💧 Drink {amount} {timing} for {weeks}."
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
        explainer: "Diving into words and stories! Whether it's a book, article, or even a really good blog post.",
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
        explainer: "It's like a friendly chat where you show off why you'd be awesome at a job. Practice makes it way less scary!",
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
        explainer: "Starting your day by tidying up your sleep space. It's surprisingly satisfying!",
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
        explainer: "Just a simple wave, smile, or quick 'hey there!' - it's all about making friendly connections.",
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
        explainer: "Checking out what's out there! Whether online, flyers, or visiting offices - it's all about exploring your options.",
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
        explainer: "Exploring what you could study or train for! From college degrees to certificates - seeing what catches your interest.",
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
        explainer: "Fun time! Whether it's video games, board games, or puzzles - whatever helps you unwind and enjoy yourself.",
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
  explainer: "No worries! We've got some super gentle starter ideas that feel totally doable."
};

// Starter goals for "I'm not sure" fallback
export const STARTER_GOALS: CategoryGoal[] = [
  {
    id: "drink-water",
    title: "Drink Water",
    emoji: "💧",
    explainer: "Start your day by drinking a glass of water. It's simple and healthy!",
    purpose: [
      { id: "hydration", label: "Stay hydrated", emoji: "💧", explainer: "Keep your body healthy", isDefault: true }
    ],
    details: [
      { id: "1-glass-morning", label: "1 glass in the morning", emoji: "🌅", explainer: "One glass when you wake up", isDefault: true }
    ],
    timing: [
      { id: "daily-1week", label: "Daily for 1 week", emoji: "📅", explainer: "Every morning for one week", isDefault: true }
    ],
    supports: [
      { id: "reminder", label: "Morning reminder", emoji: "🔔", explainer: "Get a reminder to drink water", isDefault: true }
    ],
    smartTemplate: "💧 Drink {amount} {timing} for {duration}."
  },
  {
    id: "make-bed",
    title: "Make Bed",
    emoji: "🛏️",
    explainer: "Start your day by making your bed. It takes 2 minutes and feels great!",
    purpose: [
      { id: "routine", label: "Morning routine", emoji: "🌅", explainer: "Start your day with accomplishment", isDefault: true }
    ],
    details: [
      { id: "simple-tidy", label: "Simple tidy", emoji: "✨", explainer: "Just pull covers and fluff pillows", isDefault: true }
    ],
    timing: [
      { id: "daily-1week", label: "Daily for 1 week", emoji: "📅", explainer: "Every morning for one week", isDefault: true }
    ],
    supports: [
      { id: "reminder", label: "Morning reminder", emoji: "🔔", explainer: "Get a reminder to make your bed", isDefault: true }
    ],
    smartTemplate: "🛏️ Make bed {style} {timing} for {duration}."
  },
  {
    id: "say-hi",
    title: "Say Hi",
    emoji: "👋",
    explainer: "Greet someone new or someone you haven't talked to in a while. Small connections matter!",
    purpose: [
      { id: "connection", label: "Social connection", emoji: "🤝", explainer: "Build relationships with others", isDefault: true }
    ],
    details: [
      { id: "one-person", label: "To 1 person", emoji: "👤", explainer: "Say hi to one person each day", isDefault: true }
    ],
    timing: [
      { id: "daily-1week", label: "Daily for 1 week", emoji: "📅", explainer: "Every day for one week", isDefault: true }
    ],
    supports: [
      { id: "log", label: "Connection log", emoji: "📝", explainer: "Track the people you greet", isDefault: true }
    ],
    smartTemplate: "👋 Say hi {target} {timing} for {duration}."
  },
  {
    id: "listen-music",
    title: "Listen to Music",
    emoji: "🎶",
    explainer: "Take 5 minutes to listen to your favorite song. Music can boost your mood instantly!",
    purpose: [
      { id: "mood", label: "Boost mood", emoji: "😊", explainer: "Feel happier and more energized", isDefault: true }
    ],
    details: [
      { id: "favorite-song", label: "1 favorite song", emoji: "🎵", explainer: "Listen to a song you love", isDefault: true }
    ],
    timing: [
      { id: "daily-1week", label: "Daily for 1 week", emoji: "📅", explainer: "Every day for one week", isDefault: true }
    ],
    supports: [
      { id: "playlist", label: "Mood playlist", emoji: "🎧", explainer: "Create a playlist of uplifting songs", isDefault: true }
    ],
    smartTemplate: "🎶 Listen to {music} {timing} for {duration}."
  }
];