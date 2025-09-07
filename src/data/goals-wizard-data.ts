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
  details?: GoalOption[];
  topic?: GoalOption[];
  amount?: GoalOption[];
  timing?: GoalOption[];
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
          { id: "transport", label: "Transportation/errand", emoji: "🛒", explainer: "Get where you need to go while being active" }
        ],
        details: [
          { id: "5min", label: "5 minutes", emoji: "⏰", explainer: "Short 5-minute walk", isDefault: true },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Moderate 10-minute walk" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "Longer 20-minute walk" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Once per week" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true },
          { id: "5week", label: "5×/week", emoji: "📅", explainer: "Five times per week" }
        ],
        supports: [
          { id: "tracker", label: "Step tracker", emoji: "📱", explainer: "Track your steps and distance" },
          { id: "reminder", label: "Reminder", emoji: "🔔", explainer: "Get notifications to remind you", isDefault: true },
          { id: "playlist", label: "Calming playlist", emoji: "🎵", explainer: "Music to accompany your walks" },
          { id: "buddy", label: "Walking buddy", emoji: "👥", explainer: "Find someone to walk with" },
          { id: "log", label: "Reflection log", emoji: "📝", explainer: "Track how walking makes you feel" }
        ],
        smartTemplate: "🚶 Walk {duration} from {start_date} to {due_date}."
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
          { id: "tension", label: "Reduce tension", emoji: "😌", explainer: "Release muscle tightness and stress" }
        ],
        details: [
          { id: "5min", label: "5 minutes", emoji: "⏰", explainer: "Quick 5-minute stretch session", isDefault: true },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Moderate 10-minute stretch session" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "Longer 20-minute stretch session" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "morning-3week", label: "Morning, 3×/week", emoji: "🌅", explainer: "Three mornings per week" },
          { id: "afterschool-5week", label: "After school, 5×/week", emoji: "🏫", explainer: "Five times after school" },
          { id: "bedtime-5week", label: "Before bed, 5×/week", emoji: "🌙", explainer: "Five nights before bed", isDefault: true },
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" }
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
          { id: "calm", label: "Calm down at night", emoji: "😌", explainer: "Feel more relaxed in the evening" }
        ],
        details: [
          { id: "10pm-7am-30min", label: "10pm-7am, screens off 30min before", emoji: "📱", explainer: "Bedtime 10pm, wake 7am, no screens 30 min before bed", isDefault: true },
          { id: "9pm-6am-60min", label: "9pm-6am, screens off 60min before", emoji: "📱", explainer: "Earlier bedtime with longer screen break" },
          { id: "11pm-8am-30min", label: "11pm-8am, screens off 30min before", emoji: "📱", explainer: "Later schedule, still consistent times" },
          { id: "custom-routine", label: "Add calming routine (read/stretch/music)", emoji: "📖", explainer: "Include relaxing activities before bed" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom sleep routine" }
        ],
        timing: [
          { id: "5nights", label: "5 nights/week", emoji: "📅", explainer: "Five nights per week", isDefault: true },
          { id: "everynight", label: "Every night", emoji: "📅", explainer: "Every single night" }
        ],
        supports: [
          { id: "bedtime-alarm", label: "Bedtime alarm", emoji: "⏰", explainer: "Reminder when it's time to get ready for bed", isDefault: true },
          { id: "calming-activity", label: "Calming activity", emoji: "🧘", explainer: "Relaxing routine before sleep" },
          { id: "sleep-log", label: "Sleep log", emoji: "📝", explainer: "Track your sleep patterns", isDefault: true }
        ],
        smartTemplate: "🌙 Go to bed at {bedtime} and wake up at {waketime} from {start_date} to {due_date}."
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
          { id: "new-foods", label: "Try new foods", emoji: "🥦", explainer: "Explore different healthy options" }
        ],
        details: [
          { id: "1fruit-lunch", label: "1 fruit at lunch", emoji: "🍎", explainer: "Add one piece of fruit to your lunch", isDefault: true },
          { id: "2veggie-dinner", label: "2 veggies at dinner", emoji: "🥦", explainer: "Include two vegetables with dinner" },
          { id: "1protein-meal", label: "1 protein per meal", emoji: "🥚", explainer: "Add protein to each main meal" },
          { id: "snack-swap", label: "Healthy snack swap", emoji: "🥨", explainer: "Replace one unhealthy snack with a healthy option" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom healthy eating approach" }
        ],
        timing: [
          { id: "3days", label: "3 days/week", emoji: "📅", explainer: "Three days per week" },
          { id: "5days", label: "5 days/week", emoji: "📅", explainer: "Five days per week", isDefault: true },
          { id: "daily", label: "Every day", emoji: "📅", explainer: "Daily" }
        ],
        supports: [
          { id: "shopping-list", label: "Shopping list template", emoji: "📝", explainer: "Pre-made list of healthy foods", isDefault: true },
          { id: "food-log", label: "Food log", emoji: "📊", explainer: "Track what you eat each day" },
          { id: "snack-chart", label: "Snack swap chart", emoji: "🔄", explainer: "Visual guide for healthy snack alternatives", isDefault: true }
        ],
        smartTemplate: "🥗 Eat {focus} from {start_date} to {due_date}."
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
          { id: "replace-soda", label: "Replace soda/juice", emoji: "😌", explainer: "Substitute sugary drinks with water" }
        ],
        details: [
          { id: "1cup-morning", label: "1 cup in morning", emoji: "🌅", explainer: "Start your day with a glass of water", isDefault: true },
          { id: "4cups-allday", label: "4 cups all day", emoji: "📅", explainer: "Spread 4 cups throughout the day" },
          { id: "6cups-meals", label: "6 cups with meals", emoji: "🍽️", explainer: "Drink water with breakfast, lunch, and dinner" },
          { id: "8cups-scheduled", label: "8 cups on schedule", emoji: "⏰", explainer: "Drink water at set times throughout the day" },
          { id: "swap-soda", label: "Swap soda/juice with water", emoji: "🔄", explainer: "Replace one sugary drink with water each day" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom hydration approach" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true }
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
        explainer: "Reading means looking at words in a book, article, or online and understanding them. You can read for learning or fun.",
        purpose: [
          { id: "learn", label: "Learn for school", emoji: "📚", explainer: "Gain knowledge for school subjects", isDefault: true },
          { id: "relax", label: "Relax/enjoy", emoji: "😌", explainer: "Enjoy reading for pleasure" },
          { id: "focus", label: "Practice focus", emoji: "🧠", explainer: "Build concentration skills" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Something else" }
        ],
        details: [
          { id: "textbook", label: "Textbook", emoji: "📚", explainer: "Read from a textbook" },
          { id: "article", label: "Article", emoji: "📰", explainer: "Read an article or blog post" },
          { id: "comic", label: "Comic", emoji: "📚", explainer: "Read a comic or graphic novel" },
          { id: "blog", label: "Blog", emoji: "💻", explainer: "Read a blog post or online content" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Something else" }
        ],
        amount: [
          { id: "5pages", label: "5 pages", emoji: "📄", explainer: "Read 5 pages" },
          { id: "10pages", label: "10 pages", emoji: "📄", explainer: "Read 10 pages" },
          { id: "15pages", label: "15 pages", emoji: "📄", explainer: "Read 15 pages" },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Read for 10 minutes" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "Read for 20 minutes" },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Read for 30 minutes" },
          { id: "15min-default", label: "15 minutes", emoji: "⏰", explainer: "Read for 15 minutes", isDefault: true }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true }
        ],
        supports: [
          { id: "log", label: "Reading log", emoji: "📝", explainer: "Track what you read", isDefault: true },
          { id: "suggestions", label: "List of suggested books/articles", emoji: "📚", explainer: "Get reading recommendations" },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Get notifications to remind you" }
        ],
        smartTemplate: "📖 Read {amount} from {start_date} to {due_date}."
      },
      {
        id: "write",
        title: "Write",
        emoji: "✍️",
        explainer: "Writing means putting your ideas into words. It could be journaling, doing homework, or writing a letter or story.",
        purpose: [
          { id: "practice", label: "Practice writing skills", emoji: "📓", explainer: "Improve your writing abilities", isDefault: true },
          { id: "express", label: "Express feelings/journal", emoji: "😌", explainer: "Write about your thoughts and feelings" },
          { id: "assignment", label: "Finish assignment", emoji: "📚", explainer: "Complete school writing tasks" }
        ],
        details: [
          { id: "journal", label: "Journal", emoji: "📔", explainer: "Write in a personal journal" },
          { id: "paragraph", label: "Paragraph", emoji: "📝", explainer: "Write a paragraph" },
          { id: "letter", label: "Letter", emoji: "✉️", explainer: "Write a letter to someone" },
          { id: "essay", label: "Essay", emoji: "📄", explainer: "Write an essay or report" },
          { id: "story", label: "Story", emoji: "📖", explainer: "Write a creative story" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Something else" }
        ],
        topic: [
          { id: "free-choice", label: "Free choice", emoji: "🆓", explainer: "Choose your own topic", isDefault: true },
          { id: "school-assignment", label: "School assignment", emoji: "📚", explainer: "Complete a school writing assignment" }
        ],
        amount: [
          { id: "2sentences", label: "2 sentences", emoji: "✏️", explainer: "Write 2 sentences", isDefault: true },
          { id: "paragraph", label: "1 paragraph", emoji: "📝", explainer: "Write one paragraph" },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Write for 10 minutes" },
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Write for 15 minutes" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "Write for 20 minutes" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true }
        ],
        supports: [
          { id: "prompts", label: "Writing prompt list", emoji: "💡", explainer: "Ideas to help you start writing", isDefault: true },
          { id: "templates", label: "Templates (letter, essay)", emoji: "📋", explainer: "Writing structure guides" },
          { id: "log", label: "Reflection log", emoji: "📝", explainer: "Track your writing progress" }
        ],
        smartTemplate: "✍️ Write {amount} from {start_date} to {due_date}."
      },
      {
        id: "plan-week",
        title: "Plan Week",
        emoji: "📅",
        explainer: "Planning means writing down tasks and activities so you don't forget. It helps you organize school, chores, and free time.",
        purpose: [
          { id: "schoolwork", label: "Stay on top of schoolwork", emoji: "🎓", explainer: "Organize school assignments and tasks", isDefault: true },
          { id: "balance", label: "Balance school, chores, fun", emoji: "🏠", explainer: "Organize all aspects of your week" },
          { id: "stress", label: "Reduce stress", emoji: "😌", explainer: "Feel more organized and less worried" }
        ],
        details: [
          { id: "3tasks", label: "3 tasks for tomorrow", emoji: "📋", explainer: "Plan just 3 things for the next day", isDefault: true },
          { id: "homework-chores", label: "Homework and chores", emoji: "📚", explainer: "Plan school and home responsibilities" },
          { id: "full-week", label: "Full week planning", emoji: "📅", explainer: "Plan the entire upcoming week" },
          { id: "15min", label: "15-20 minutes", emoji: "⏰", explainer: "Spend 15-20 minutes planning" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom planning approach" }
        ],
        timing: [
          { id: "sunday", label: "Sunday evenings", emoji: "🌅", explainer: "Plan every Sunday", isDefault: true },
          { id: "monday", label: "Monday evenings", emoji: "🌅", explainer: "Plan every Monday" }
        ],
        supports: [
          { id: "planner", label: "Printable weekly planner", emoji: "📋", explainer: "Paper planning template", isDefault: true },
          { id: "sync", label: "Calendar sync", emoji: "📱", explainer: "Connect with digital calendar" },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Get notifications to plan" }
        ],
        smartTemplate: "📅 Plan {scope} every {day} for {weeks}."
      },
      {
        id: "solve-problem",
        title: "Solve a Problem",
        emoji: "🧩",
        explainer: "Solving problems means finding an answer to a challenge. It could be math, a puzzle, or figuring out a real-life situation.",
        purpose: [
          { id: "math", label: "Practice math/logic", emoji: "📚", explainer: "Work on mathematical thinking skills", isDefault: true },
          { id: "thinking", label: "Build thinking skills", emoji: "🧠", explainer: "Develop problem-solving abilities" },
          { id: "real-life", label: "Solve real-life challenge", emoji: "🏠", explainer: "Address everyday problems" }
        ],
        details: [
          { id: "1problem", label: "1 problem", emoji: "🔢", explainer: "Solve one problem", isDefault: true },
          { id: "2problems", label: "2 problems", emoji: "🔢", explainer: "Solve two problems" },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "Work for 10 minutes" },
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Work for 15 minutes" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "Work for 20 minutes" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom problem-solving approach" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true }
        ],
        supports: [
          { id: "bank", label: "Problem set bank", emoji: "🏦", explainer: "Collection of practice problems", isDefault: true },
          { id: "apps", label: "Puzzle app suggestions", emoji: "📱", explainer: "Recommended problem-solving apps" },
          { id: "log", label: "Reflection log", emoji: "📝", explainer: "Track your problem-solving progress" }
        ],
        smartTemplate: "🧩 Solve {amount} from {start_date} to {due_date}."
      },
      {
        id: "review-notes",
        title: "Review Notes",
        emoji: "📑",
        explainer: "Reviewing notes means looking back at what you wrote in class to help remember. You can read, highlight, or use flashcards.",
        purpose: [
          { id: "test", label: "Prepare for test", emoji: "📚", explainer: "Get ready for an upcoming test", isDefault: true },
          { id: "remember", label: "Remember lessons", emoji: "🧠", explainer: "Help remember what you learned" }
        ],
        details: [
          { id: "1page", label: "1 page", emoji: "📄", explainer: "Review one page of notes", isDefault: true },
          { id: "flashcards", label: "Make flashcards", emoji: "🃏", explainer: "Create flashcards for review" },
          { id: "highlight", label: "Highlight notes", emoji: "🖍️", explainer: "Highlight important information" },
          { id: "read-aloud", label: "Read aloud", emoji: "🗣️", explainer: "Read notes out loud" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom review approach" }
        ],
        timing: [
          { id: "daily-2weeks", label: "Daily for 2 weeks", emoji: "📅", explainer: "Every day for two weeks" },
          { id: "3before-test", label: "3× before test", emoji: "📅", explainer: "Three times before the test", isDefault: true },
          { id: "daily-3weeks", label: "Daily for 3 weeks", emoji: "📅", explainer: "Every day for three weeks" }
        ],
        supports: [
          { id: "template", label: "Flashcard template", emoji: "🃏", explainer: "Template for making flashcards", isDefault: true },
          { id: "guide", label: "Highlighting guide", emoji: "🖍️", explainer: "Tips for effective highlighting" },
          { id: "reminders", label: "Review reminders", emoji: "🔔", explainer: "Get notifications to review" }
        ],
        smartTemplate: "📑 Review {method} from {start_date} to {due_date}."
      },
      {
        id: "study",
        title: "Study",
        emoji: "📚",
        explainer: "Studying means focusing on school subjects to learn and remember. You can read, review, test yourself, or study with others.",
        purpose: [
          { id: "test", label: "Prepare for test", emoji: "🎓", explainer: "Get ready for an upcoming test", isDefault: true },
          { id: "grades", label: "Improve grades", emoji: "📈", explainer: "Work to get better grades" },
          { id: "learn", label: "Learn new things", emoji: "🧠", explainer: "Explore and understand new topics" }
        ],
        details: [
          { id: "math", label: "Math", emoji: "🔢", explainer: "Study math concepts and problems", isDefault: true },
          { id: "english", label: "English", emoji: "📖", explainer: "Study English language and literature" },
          { id: "science", label: "Science", emoji: "🔬", explainer: "Study science concepts and experiments" },
          { id: "history", label: "History", emoji: "📜", explainer: "Study historical events and concepts" },
          { id: "flashcards", label: "Make flashcards", emoji: "🃏", explainer: "Create and review flashcards" },
          { id: "practice-test", label: "Practice tests", emoji: "📝", explainer: "Take practice tests or quizzes" },
          { id: "group-study", label: "Group study", emoji: "👥", explainer: "Study with classmates or friends" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom study approach" }
        ],
        timing: [
          { id: "daily-2weeks", label: "Daily for 2 weeks", emoji: "📅", explainer: "Every day for two weeks" },
          { id: "3week-3weeks", label: "3×/week for 3 weeks", emoji: "📅", explainer: "Three times per week for three weeks", isDefault: true },
          { id: "until-test", label: "Until test date", emoji: "📅", explainer: "Continue until your test" }
        ],
        supports: [
          { id: "guide", label: "Study guide template", emoji: "📋", explainer: "Template for organizing study material", isDefault: true },
          { id: "tips", label: "Subject tips", emoji: "💡", explainer: "Study tips for specific subjects" },
          { id: "reminders", label: "Study reminders", emoji: "🔔", explainer: "Get notifications to study" }
        ],
        smartTemplate: "📚 Study {subject} for {duration} from {start_date} to {due_date}."
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
        title: "Practice for Interview",
        emoji: "🎤",
        explainer: "It's like a friendly chat where you show off why you'd be awesome at a job. Practice makes it way less scary!",
        purpose: [
          { id: "confidence", label: "Build confidence", emoji: "💪", explainer: "Feel more confident in interviews", isDefault: true },
          { id: "prepare", label: "Prepare for a specific job", emoji: "🎯", explainer: "Get ready for an upcoming interview" },
          { id: "improve", label: "Improve answers", emoji: "🧠", explainer: "Practice giving better responses" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom interview goal" }
        ],
        details: [
          { id: "greeting", label: "Greeting / 1 Common Question", emoji: "👋", explainer: "Practice greeting and basic questions" },
          { id: "tell-me", label: "Tell me about yourself", emoji: "🗣️", explainer: "Practice this common question", isDefault: true },
          { id: "mock", label: "Full Mock", emoji: "🎭", explainer: "Complete practice interview" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom interview practice" }
        ],
        supports: [
          { id: "checklist", label: "Interview checklist", emoji: "✅", explainer: "Greeting → Eye contact → Smile → Answer question → Say thank you", isDefault: true },
          { id: "roleplay", label: "Practice with parent/coach", emoji: "👥", explainer: "Role-play with someone" },
          { id: "script", label: "Role-play script", emoji: "📝", explainer: "Structured practice script" },
          { id: "answers", label: "Sample answers", emoji: "💬", explainer: "Example responses to common questions" }
        ],
        smartTemplate: "🎤 Practice {focus} for {duration} from {start_date} to {due_date}."
      },
      {
        id: "resume-create",
        title: "Write Resume",
        emoji: "📄",
        explainer: "A resume is like a highlight reel of yourself - showing your best skills and experiences to potential employers.",
        purpose: [
          { id: "first-job", label: "First job", emoji: "🎓", explainer: "Creating your very first resume" },
          { id: "internship", label: "Internship/summer job", emoji: "🔄", explainer: "Resume for internship or summer work" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom resume purpose" }
        ],
        supports: [
          { id: "template", label: "Resume template", emoji: "📋", explainer: "Structured resume format", isDefault: true },
          { id: "samples", label: "Sample resumes", emoji: "📄", explainer: "Examples for retail, food service, office" },
          { id: "checklist", label: "Checklist of resume sections", emoji: "✅", explainer: "What to include in your resume" }
        ],
        smartTemplate: "📄 Complete {focus} resume by {due_date}."
      },
      {
        id: "resume-update",
        title: "Update Resume",
        emoji: "➕",
        explainer: "Keep your resume fresh by adding new skills, jobs, or experiences you've gained since your last version.",
        purpose: [
          { id: "add-job", label: "Add new job/skill", emoji: "➕", explainer: "Include recent work or skills" },
          { id: "keep-current", label: "Keep it current", emoji: "✅", explainer: "Maintain up-to-date information" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom update purpose" }
        ],
        supports: [
          { id: "checklist", label: "Resume update checklist", emoji: "✅", explainer: "What's new since last version?", isDefault: true }
        ],
        smartTemplate: "➕ Update resume with {focus} in {duration} by {deadline}."
      },
      {
        id: "thank-you",
        title: "Send Thank-You Letter",
        emoji: "💌",
        explainer: "A thank-you note shows appreciation and helps you stand out positively after an interview.",
        purpose: [
          { id: "appreciation", label: "Show appreciation", emoji: "🙏", explainer: "Express gratitude for the interview" },
          { id: "stand-out", label: "Stand out after interview", emoji: "🎯", explainer: "Make a positive impression" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom thank-you purpose" }
        ],
        details: [
          { id: "email", label: "Email", emoji: "📧", explainer: "Send electronic thank-you message", isDefault: true },
          { id: "printed", label: "Printed", emoji: "📄", explainer: "Write and mail physical letter" },
          { id: "three-parts", label: "Thank → Detail → Interest", emoji: "📝", explainer: "Thank them → Mention interview detail → Say you're excited" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom format" }
        ],
        supports: [
          { id: "template", label: "Thank-you templates", emoji: "📋", explainer: "Sample thank-you messages", isDefault: true },
          { id: "examples", label: "Example letters", emoji: "📄", explainer: "Complete thank-you letter examples" }
        ],
        smartTemplate: "💌 Send thank-you {format} {timeline} for each interview."
      },
      {
        id: "find-companies",
        title: "Find Companies",
        emoji: "🏢",
        explainer: "Research companies and organizations that might be hiring or could be good places to work.",
        purpose: [
          { id: "see-hiring", label: "See who is hiring", emoji: "🔍", explainer: "Find companies with job openings" },
          { id: "target-industry", label: "Target industry", emoji: "🎯", explainer: "Focus on specific field or type of work" },
          { id: "local-jobs", label: "Local jobs", emoji: "🏠", explainer: "Find nearby employment opportunities" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom company search purpose" }
        ],
        details: [
          { id: "job-board", label: "Job board", emoji: "💻", explainer: "Search online job websites" },
          { id: "bulletin", label: "Bulletin board", emoji: "📋", explainer: "Check physical job postings" },
          { id: "social-media", label: "Social media", emoji: "📱", explainer: "Search on social platforms" },
          { id: "ask-friend", label: "Ask friend", emoji: "👥", explainer: "Get recommendations from contacts" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom search method" }
        ],
        amount: [
          { id: "2companies", label: "2 companies", emoji: "🏢", explainer: "Research two companies", isDefault: true },
          { id: "3companies", label: "3 companies", emoji: "🏢", explainer: "Research three companies" },
          { id: "5companies", label: "5 companies", emoji: "🏢", explainer: "Research five companies" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom number" }
        ],
        supports: [
          { id: "job-links", label: "Job board links", emoji: "🔗", explainer: "Links to trusted job sites", isDefault: true },
          { id: "template", label: "Company List template", emoji: "📋", explainer: "Printable company tracking sheet" }
        ],
        smartTemplate: "🏢 Search for {amount} companies {duration} from {start_date} to {due_date}."
      },
      {
        id: "find-helpers",
        title: "Find People that Can Help",
        emoji: "🧑‍🤝‍🧑",
        explainer: "Build your network by connecting with people who can offer advice, review your materials, or help with your job search.",
        purpose: [
          { id: "advice", label: "Get advice", emoji: "🤝", explainer: "Seek guidance from experienced people" },
          { id: "job-search", label: "Help with job search", emoji: "🎯", explainer: "Get assistance finding opportunities" },
          { id: "networking", label: "Practice networking", emoji: "📚", explainer: "Build professional relationship skills" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom networking purpose" }
        ],
        details: [
          { id: "parent", label: "Parent", emoji: "👨‍👩‍👧‍👦", explainer: "Ask parent or family member for help", isDefault: true },
          { id: "teacher", label: "Teacher", emoji: "👩‍🏫", explainer: "Reach out to teacher or counselor" },
          { id: "job-coach", label: "Job coach", emoji: "💼", explainer: "Connect with employment specialist" },
          { id: "friend", label: "Friend", emoji: "👥", explainer: "Ask friend or peer for assistance" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom contact" }
        ],
        topic: [
          { id: "resume-review", label: "Resume review", emoji: "📄", explainer: "Have someone check your resume", isDefault: true },
          { id: "mock-interview", label: "Mock interview", emoji: "🎤", explainer: "Practice interview with someone" },
          { id: "job-leads", label: "Job leads", emoji: "🔍", explainer: "Get information about job openings" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom assistance" }
        ],
        supports: [
          { id: "templates", label: "Intro message templates", emoji: "💬", explainer: "Scripts for reaching out to people", isDefault: true },
          { id: "conversation", label: "Conversation starters", emoji: "🗣️", explainer: "Ideas for starting networking conversations" },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Notifications to follow up" }
        ],
        smartTemplate: "🧑‍🤝‍🧑 Ask {who} for {help} in {duration} by {timeline}."
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
        explainer: "Starting your day by tidying up your sleep space. Try making your bed just 1 time this week.",
        purpose: [
          { id: "tidy", label: "Keep room tidy", emoji: "🧹", explainer: "Keep your space organized", isDefault: true },
          { id: "calm", label: "Feel calm/organized", emoji: "😌", explainer: "Start day with accomplished feeling" },
          { id: "routine", label: "Start morning routine", emoji: "🌅", explainer: "Make it part of your daily routine" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true },
          { id: "3week", label: "3× per week", emoji: "📅", explainer: "Three times per week" },
          { id: "weekends", label: "Weekends only", emoji: "📅", explainer: "Saturdays and Sundays only" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "checklist", label: "Bed-making checklist with pictures", emoji: "✅", explainer: "Visual steps with pictures to follow", isDefault: true },
          { id: "reminder", label: "Reminder → \"Make bed after waking up\"", emoji: "🔔", explainer: "Notification to make your bed after waking up" }
        ],
        smartTemplate: "🛏️ Make my bed {timing} from {start_date} until {due_date}."
      },
      {
        id: "set-table",
        title: "Set Table",
        emoji: "🍽️",
        explainer: "Help prepare the table for family meals. Set the table once for dinner this week.",
        purpose: [
          { id: "help-family", label: "Help family", emoji: "👪", explainer: "Contribute to family meals", isDefault: true },
          { id: "responsibility", label: "Learn daily responsibility", emoji: "🎓", explainer: "Practice taking on household responsibilities" },
          { id: "meal-prep", label: "Get ready for meals", emoji: "🎉", explainer: "Prepare for enjoyable family meals" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "dinner", label: "Dinner", emoji: "🌆", explainer: "Set table for dinner", isDefault: true },
          { id: "breakfast", label: "Breakfast", emoji: "🌅", explainer: "Set table for breakfast" },
          { id: "both", label: "Both", emoji: "🍽️", explainer: "Set table for both breakfast and dinner" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom meal timing" }
        ],
        supports: [
          { id: "picture-card", label: "Table-setting picture card", emoji: "📷", explainer: "Visual guide showing proper table setting", isDefault: true },
          { id: "reminders", label: "Reminders tied to mealtimes", emoji: "🔔", explainer: "Notifications before meals" }
        ],
        smartTemplate: "🍽️ Set the {timing} table from {start_date} until {due_date}."
      },
      {
        id: "do-laundry",
        title: "Do Laundry",
        emoji: "🧺",
        explainer: "Learn to keep your clothes clean and fresh. Do laundry one time this week.",
        purpose: [
          { id: "clean-clothes", label: "Keep clothes clean", emoji: "👕", explainer: "Maintain clean wardrobe" },
          { id: "independence", label: "Learn independence", emoji: "🎓", explainer: "Develop independent living skills", isDefault: true },
          { id: "help-home", label: "Help at home", emoji: "🏠", explainer: "Contribute to household chores" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "once-week", label: "Once a week", emoji: "📅", explainer: "One load per week", isDefault: true },
          { id: "twice-week", label: "Twice a week", emoji: "📅", explainer: "Two loads per week" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "checklist", label: "Laundry steps checklist with icons", emoji: "✅", explainer: "Visual step-by-step guide with icons", isDefault: true },
          { id: "video", label: "Video demo for washer/dryer", emoji: "📱", explainer: "Video showing how to use washing machine and dryer" }
        ],
        smartTemplate: "🧺 Do 1 load of laundry {timing} from {start_date} until {due_date}."
      },
      {
        id: "cook",
        title: "Cook",
        emoji: "🍳",
        explainer: "Learn to prepare simple meals and snacks. Try making 1 simple meal this week.",
        purpose: [
          { id: "new-skill", label: "Learn new skill", emoji: "🧑‍🍳", explainer: "Develop cooking abilities" },
          { id: "healthier", label: "Eat healthier", emoji: "🥗", explainer: "Prepare nutritious meals", isDefault: true },
          { id: "help-family", label: "Help family meals", emoji: "👪", explainer: "Contribute to family cooking" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "once", label: "Once", emoji: "📅", explainer: "Once per week" },
          { id: "twice", label: "Twice", emoji: "📅", explainer: "Twice per week", isDefault: true },
          { id: "3times", label: "3× per week", emoji: "📅", explainer: "Three times per week" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" },
          { id: "10min", label: "10 minutes per session", emoji: "⏰", explainer: "10 minute cooking sessions" },
          { id: "20min", label: "20 minutes per session", emoji: "⏰", explainer: "20 minute cooking sessions" },
          { id: "30min", label: "30 minutes per session", emoji: "⏰", explainer: "30 minute cooking sessions" }
        ],
        supports: [
          { id: "visual-steps", label: "Visual cooking steps (wash, gather, cook, clean)", emoji: "👁️", explainer: "Picture guide for cooking process", isDefault: true },
          { id: "checklist", label: "Shopping checklist template", emoji: "📝", explainer: "Template for ingredient shopping" }
        ],
        smartTemplate: "🍳 Cook {timing} from {start_date} until {due_date}."
      },
      {
        id: "clean-area",
        title: "Clean Area",
        emoji: "🧹",
        explainer: "Keep your personal space tidy and organized. Clean your desk for 5 minutes this week.",
        purpose: [
          { id: "tidy", label: "Tidy room/desk", emoji: "🧼", explainer: "Keep personal space organized", isDefault: true },
          { id: "chores", label: "Help with chores", emoji: "🏠", explainer: "Contribute to household cleaning" },
          { id: "stress", label: "Reduce stress", emoji: "😌", explainer: "Feel calmer in clean environment" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true },
          { id: "weekly", label: "Weekly", emoji: "📅", explainer: "Once per week" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "10 minute cleaning sessions" },
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "15 minute cleaning sessions" },
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "20 minute cleaning sessions" }
        ],
        supports: [
          { id: "checklist", label: "Cleaning checklist with icons", emoji: "✅", explainer: "Visual cleaning steps guide", isDefault: true },
          { id: "reflection", label: "Reflection log (\"How did it feel after cleaning?\")", emoji: "📝", explainer: "Track how cleaning makes you feel" }
        ],
        smartTemplate: "🧹 Clean my area {timing} from {start_date} until {due_date}."
      },
      {
        id: "shopping-list",
        title: "Write Shopping List",
        emoji: "📝",
        explainer: "Plan what you need to buy before going shopping. Write 3 items you need this week.",
        purpose: [
          { id: "groceries", label: "Plan groceries", emoji: "🛒", explainer: "Organize grocery shopping", isDefault: true },
          { id: "household", label: "Buy household items", emoji: "🧼", explainer: "Plan for cleaning supplies and essentials" },
          { id: "supplies", label: "Plan for clothes/supplies", emoji: "👕", explainer: "Organize shopping for personal items" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        timing: [
          { id: "weekly", label: "Weekly", emoji: "📅", explainer: "Once per week", isDefault: true },
          { id: "biweekly", label: "Every 2 weeks", emoji: "📅", explainer: "Every two weeks" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "template", label: "Printable list template with checkboxes", emoji: "📋", explainer: "Pre-made shopping list template", isDefault: true },
          { id: "reminder", label: "Reminder → \"Make list before Sunday shopping\"", emoji: "🔔", explainer: "Notification to make list before shopping trip" }
        ],
        smartTemplate: "📝 Write a shopping list {timing} from {start_date} until {due_date}."
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
          { id: "school", label: "For school/work", emoji: "🏫", explainer: "Be friendly in school or work settings", isDefault: true }
        ],
        details: [
          { id: "classmate", label: "To classmate", emoji: "🎓", explainer: "Say hi to someone from school", isDefault: true },
          { id: "neighbor", label: "To neighbor", emoji: "🏘️", explainer: "Greet people in your neighborhood" },
          { id: "teacher", label: "To teacher", emoji: "👨‍🏫", explainer: "Say hi to teachers or staff" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom greeting approach" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week" }
        ],
        supports: [
          { id: "script", label: "Script card", emoji: "📝", explainer: "Simple phrases to practice", isDefault: true },
          { id: "reminders", label: "Reminders", emoji: "🔔", explainer: "Gentle reminders to say hi" }
        ],
        smartTemplate: "👋 Say hi {to} from {start_date} to {due_date}."
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
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Research for family member" }
        ],
        details: [
          { id: "apt-online", label: "Apartments online", emoji: "💻", explainer: "Look at apartment websites", isDefault: true },
          { id: "shared-sites", label: "Shared housing sites", emoji: "🏠", explainer: "Browse roommate/shared housing" },
          { id: "dorm-college", label: "Dorm at college", emoji: "🎓", explainer: "Look at college housing options" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom housing research" }
        ],
        timing: [
          { id: "30min-weekly", label: "30 min weekly", emoji: "📅", explainer: "Thirty minutes once a week", isDefault: true },
          { id: "45min-2week", label: "45 min 2×/week", emoji: "📅", explainer: "Forty-five minutes twice weekly" }
        ],
        supports: [
          { id: "checklist", label: "Housing checklist", emoji: "✅", explainer: "What to look for in housing", isDefault: true },
          { id: "sites", label: "Safe sites list", emoji: "🔗", explainer: "Trusted housing websites" }
        ],
        smartTemplate: "🔍 Browse {type} {duration} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "postsecondary",
    title: "Postsecondary",
    emoji: "🎓",
    goals: [
      {
        id: "research-programs",
        title: "Research Colleges/Programs",
        emoji: "📚",
        explainer: "Exploring what you could study or train for! Look up 1 college this week.",
        purpose: [
          { id: "explore", label: "Explore options", emoji: "🏫", explainer: "See what's available to study", isDefault: true },
          { id: "compare", label: "Compare programs", emoji: "📋", explainer: "Compare different schools and programs" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        details: [
          { id: "website", label: "Website", emoji: "💻", explainer: "Look up programs online", isDefault: true },
          { id: "book", label: "Book", emoji: "📚", explainer: "Use printed guides and catalogs" },
          { id: "counselor", label: "Counselor", emoji: "👨‍🏫", explainer: "Talk with school counselor" },
          { id: "fair", label: "College fair", emoji: "🎪", explainer: "Visit college fair or expo" }
        ],
        amount: [
          { id: "1program", label: "1 program", emoji: "🎯", explainer: "Research one program", isDefault: true },
          { id: "2programs", label: "2 programs", emoji: "🎯", explainer: "Research two programs" },
          { id: "3programs", label: "3 programs", emoji: "🎯", explainer: "Research three programs" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom number of programs" }
        ],
        timing: [
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "20 minute research sessions" },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "30 minute research sessions", isDefault: true },
          { id: "45min", label: "45 minutes", emoji: "⏰", explainer: "45 minute research sessions" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        supports: [
          { id: "resources", label: "College websites, comparison worksheet, counselor notes", emoji: "💻", explainer: "Online resources and organization tools", isDefault: true }
        ],
        smartTemplate: "📚 Spend {timing} researching {amount} from {start_date} until {due_date}."
      },
      {
        id: "application-materials",
        title: "Prepare Application Materials",
        emoji: "📝",
        explainer: "Getting your application ready for submission. Write down your name and 1 activity this week.",
        purpose: [
          { id: "apply", label: "Apply for programs", emoji: "📄", explainer: "Get ready to submit applications", isDefault: true },
          { id: "organized", label: "Stay organized", emoji: "🎯", explainer: "Keep application materials in order" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        details: [
          { id: "personal-statement", label: "Personal statement", emoji: "📝", explainer: "Write essay about yourself", isDefault: true },
          { id: "resume", label: "Resume", emoji: "📋", explainer: "List your experiences and activities" },
          { id: "transcript", label: "Transcript", emoji: "📜", explainer: "Request official school records" },
          { id: "recommendations", label: "Recommendation letters", emoji: "✉️", explainer: "Ask teachers or mentors for letters" }
        ],
        amount: [
          { id: "draft", label: "Draft", emoji: "✏️", explainer: "Create first version", isDefault: true },
          { id: "request", label: "Request", emoji: "📞", explainer: "Ask others for help or documents" },
          { id: "collect", label: "Collect", emoji: "📂", explainer: "Gather completed materials" }
        ],
        timing: [
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "30 minute work sessions" },
          { id: "45min", label: "45 minutes", emoji: "⏰", explainer: "45 minute work sessions", isDefault: true },
          { id: "60min", label: "60 minutes", emoji: "⏰", explainer: "60 minute work sessions" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        supports: [
          { id: "tools", label: "Application checklist, sample essays, transcript request guide", emoji: "✅", explainer: "Tools to help organize application process", isDefault: true }
        ],
        smartTemplate: "📝 Work on {details} for {timing} from {start_date} until {due_date}."
      },
      {
        id: "financial-aid",
        title: "Explore Financial Aid",
        emoji: "💵",
        explainer: "Learning about ways to help pay for your education. Look up 1 scholarship online this week.",
        purpose: [
          { id: "scholarships", label: "Learn about scholarships", emoji: "💰", explainer: "Find scholarship opportunities", isDefault: true },
          { id: "fafsa", label: "Prepare for FAFSA/loans", emoji: "🧾", explainer: "Understand financial aid process" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        details: [
          { id: "fafsa", label: "FAFSA", emoji: "📋", explainer: "Federal financial aid application" },
          { id: "scholarship", label: "Scholarship", emoji: "🏆", explainer: "Merit or need-based awards", isDefault: true },
          { id: "grant", label: "Grant", emoji: "💵", explainer: "Free money for education" },
          { id: "local", label: "Local program", emoji: "🏘️", explainer: "Community-based financial help" }
        ],
        amount: [
          { id: "2notes", label: "Write down 2-3 key points", emoji: "📝", explainer: "Capture important information", isDefault: true }
        ],
        timing: [
          { id: "20min", label: "20 minutes", emoji: "⏰", explainer: "20 minute research sessions", isDefault: true },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "30 minute research sessions" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        supports: [
          { id: "resources", label: "Financial aid guide, FAFSA worksheet, scholarship search sites", emoji: "📊", explainer: "Resources for financial planning", isDefault: true }
        ],
        smartTemplate: "💵 Research {details} for {timing} from {start_date} until {due_date}."
      },
      {
        id: "visit-campuses",
        title: "Visit Campuses / Programs",
        emoji: "🧑‍🤝‍🧑",
        explainer: "Seeing schools and programs in person or online. Visit 1 campus (in person or virtual) this week.",
        purpose: [
          { id: "environment", label: "See environment", emoji: "👀", explainer: "Experience the campus atmosphere", isDefault: true },
          { id: "fit", label: "Compare fit", emoji: "🎯", explainer: "See if the school feels right for you" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose" }
        ],
        details: [
          { id: "virtual", label: "Virtual", emoji: "💻", explainer: "Online campus tour", isDefault: true },
          { id: "in-person", label: "In-person", emoji: "👣", explainer: "Visit campus physically" }
        ],
        amount: [
          { id: "parent", label: "Parent", emoji: "👨‍👩‍👧‍👦", explainer: "Go with parent or guardian", isDefault: true },
          { id: "friend", label: "Friend", emoji: "👥", explainer: "Bring a friend along" },
          { id: "coach", label: "Coach", emoji: "👨‍🏫", explainer: "Go with counselor or coach" },
          { id: "alone", label: "Alone", emoji: "🚶", explainer: "Visit by yourself" }
        ],
        timing: [
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "1 hour campus visits", isDefault: true },
          { id: "2hours", label: "2 hours", emoji: "⏰", explainer: "2 hour campus visits" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        supports: [
          { id: "guide", label: "Campus tour guide, checklist of questions, parent/coach reminder", emoji: "🗺️", explainer: "Support for campus visits", isDefault: true }
        ],
        smartTemplate: "🧑‍🤝‍🧑 Visit campus {details} for {timing} from {start_date} until {due_date}."
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
          { id: "focus", label: "Improve focus", emoji: "🎯", explainer: "Practice concentration" }
        ],
        details: [
          { id: "10min-board", label: "10 min board game", emoji: "🎲", explainer: "Short board game session", isDefault: true },
          { id: "20min-video", label: "20 min video game", emoji: "🎮", explainer: "Video game session" },
          { id: "30min-puzzle", label: "30 min puzzle", emoji: "🧩", explainer: "Work on a jigsaw or word puzzle" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom game activity" }
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
        smartTemplate: "🎮 Play {type} from {start_date} to {due_date}."
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
      { id: "1-glass-morning", label: "1 glass in the morning", emoji: "🌅", explainer: "One glass when you wake up", isDefault: true },
      { id: "other", label: "Other", emoji: "➕", explainer: "Custom water drinking approach" }
    ],
    timing: [
      { id: "daily", label: "Daily", emoji: "📅", explainer: "Every morning", isDefault: true }
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
      { id: "simple-tidy", label: "Simple tidy", emoji: "✨", explainer: "Just pull covers and fluff pillows", isDefault: true },
      { id: "other", label: "Other", emoji: "➕", explainer: "Custom bed making style" }
    ],
    timing: [
      { id: "daily", label: "Daily", emoji: "📅", explainer: "Every morning", isDefault: true }
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
      { id: "one-person", label: "To 1 person", emoji: "👤", explainer: "Say hi to one person each day", isDefault: true },
      { id: "other", label: "Other", emoji: "➕", explainer: "Custom greeting approach" }
    ],
    timing: [
      { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true }
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
      { id: "favorite-song", label: "1 favorite song", emoji: "🎵", explainer: "Listen to a song you love", isDefault: true },
      { id: "other", label: "Other", emoji: "➕", explainer: "Custom music listening approach" }
    ],
    timing: [
      { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day", isDefault: true }
    ],
    supports: [
      { id: "playlist", label: "Mood playlist", emoji: "🎧", explainer: "Create a playlist of uplifting songs", isDefault: true }
    ],
    smartTemplate: "🎶 Listen to {music} {timing} for {duration}."
  }
];