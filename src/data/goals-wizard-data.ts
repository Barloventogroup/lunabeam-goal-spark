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
  who?: GoalOption[];
  how?: GoalOption[];
  what?: GoalOption[];
  when?: GoalOption[];
  duration?: GoalOption[];
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

export const FALLBACK_OPTION: GoalOption = {
  id: "other",
  label: "Other",
  emoji: "➕",
  explainer: "Something else"
};

export const STARTER_GOALS: CategoryGoal[] = [
  {
    id: "drink-water",
    title: "Drink Water",
    emoji: "💧",
    explainer: "A simple boost for your health and energy.",
    purpose: [
      { id: "hydrate", label: "Stay hydrated", emoji: "💧", explainer: "Drink more water to feel better", isDefault: true }
    ],
    supports: [
      { id: "bottle", label: "Keep a water bottle nearby", emoji: "🍼", explainer: "Make it easy to sip", isDefault: true }
    ],
    smartTemplate: "💧 Drink water regularly from {start_date} to {due_date}."
  },
  {
    id: "make-bed",
    title: "Make Bed",
    emoji: "🛏️",
    explainer: "Start the day with a quick win.",
    purpose: [
      { id: "tidy", label: "Feel tidy", emoji: "✅", explainer: "A neat space helps you focus", isDefault: true }
    ],
    supports: [
      { id: "routine", label: "Morning routine checklist", emoji: "☀️", explainer: "Follow a simple morning routine", isDefault: true }
    ],
    smartTemplate: "🛏️ Make your bed each morning from {start_date} to {due_date}."
  },
  {
    id: "say-hi",
    title: "Say Hi",
    emoji: "👋",
    explainer: "Practice friendly connection in a low-pressure way.",
    purpose: [
      { id: "social", label: "Build social skills", emoji: "🤝", explainer: "Practice small interactions", isDefault: true }
    ],
    supports: [
      { id: "reminder", label: "Small reminder", emoji: "⏰", explainer: "Prompt yourself sometime today", isDefault: true }
    ],
    smartTemplate: "👋 Say hi to someone new from {start_date} to {due_date}."
  },
  {
    id: "listen-music",
    title: "Listen to Music",
    emoji: "🎶",
    explainer: "Use music to relax or boost your mood.",
    purpose: [
      { id: "mood", label: "Boost mood", emoji: "😊", explainer: "Feel better with music", isDefault: true }
    ],
    supports: [
      { id: "playlist", label: "Favorite playlist ready", emoji: "🎧", explainer: "Queue up songs you like", isDefault: true }
    ],
    smartTemplate: "🎶 Listen to music you enjoy from {start_date} to {due_date}."
  }
];

export interface Category {
  id: string;
  title: string;
  emoji: string;
  description: string;
  goals: CategoryGoal[];
}

export const GOALS_WIZARD_DATA: Category[] = [
  {
    id: "education",
    title: "Education - Academic Readiness",
    emoji: "📘",
    description: "Learning new things and growing your brain power - no matter how small the step",
    goals: [
      {
        id: "read",
        title: "Read Something",
        emoji: "📖",
        explainer: "Jump into a book, article, or anything that catches your eye! Reading is a superpower - it helps your brain grow and takes you places.",
        purpose: [
          { id: "learning", label: "Learn something new", emoji: "🧠", explainer: "Discover new information or ideas", isDefault: true },
          { id: "class", label: "For class/school", emoji: "🎓", explainer: "Complete an assignment or study for school" },
          { id: "fun", label: "For fun", emoji: "😊", explainer: "Enjoy reading for pleasure" },
          { id: "work", label: "For work", emoji: "💼", explainer: "Read work-related materials" }
        ],
        topic: [
          { id: "fiction", label: "Fiction book", emoji: "📚", explainer: "Read a story book", isDefault: true },
          { id: "nonfiction", label: "Non-fiction", emoji: "📖", explainer: "Read factual/educational material" },
          { id: "article", label: "Article/blog", emoji: "📄", explainer: "Read an article or blog post" },
          { id: "textbook", label: "Textbook chapter", emoji: "📝", explainer: "Study academic material" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Choose your own reading material" }
        ],
        amount: [
          { id: "1page", label: "1 page", emoji: "📄", explainer: "Read just one page", isDefault: true },
          { id: "5pages", label: "5 pages", emoji: "📑", explainer: "Read five pages" },
          { id: "10pages", label: "10 pages", emoji: "📖", explainer: "Read ten pages" },
          { id: "1chapter", label: "1 chapter", emoji: "📚", explainer: "Read one complete chapter" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom amount" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Once per week" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true },
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" }
        ],
        supports: [
          { id: "quiet", label: "Quiet space", emoji: "🤫", explainer: "Find a peaceful reading spot", isDefault: true },
          { id: "timer", label: "Reading timer", emoji: "⏰", explainer: "Set a timer for focused reading" },
          { id: "bookmark", label: "Bookmark/notepad", emoji: "🔖", explainer: "Keep track of progress and notes" },
          { id: "buddy", label: "Reading buddy", emoji: "👥", explainer: "Read with a friend or family member" }
        ],
        smartTemplate: "📖 Read {amount} of {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "write",
        title: "Write",
        emoji: "✍️",
        explainer: "Put pen to paper (or fingers to keyboard) and let your thoughts flow! Writing helps organize your ideas and express yourself.",
        purpose: [
          { id: "school", label: "School assignment", emoji: "🎓", explainer: "Complete homework or class project" },
          { id: "expression", label: "Express myself", emoji: "💭", explainer: "Share thoughts, feelings, or creativity", isDefault: true },
          { id: "goals", label: "Plan/organize", emoji: "📝", explainer: "Write plans, lists, or organize thoughts" },
          { id: "story", label: "Creative writing", emoji: "✨", explainer: "Write stories, poems, or fiction" }
        ],
        topic: [
          { id: "journal", label: "Journal entry", emoji: "📔", explainer: "Write about your day or feelings", isDefault: true },
          { id: "essay", label: "Essay/paragraph", emoji: "📄", explainer: "Write a structured piece" },
          { id: "story", label: "Short story", emoji: "📖", explainer: "Create a fictional narrative" },
          { id: "letter", label: "Letter/email", emoji: "✉️", explainer: "Write to someone" },
          { id: "list", label: "List/plan", emoji: "📝", explainer: "Organize thoughts or tasks" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Choose your own writing topic" }
        ],
        amount: [
          { id: "1sentence", label: "1 sentence", emoji: "✏️", explainer: "Write just one sentence", isDefault: true },
          { id: "1paragraph", label: "1 paragraph", emoji: "📝", explainer: "Write one complete paragraph" },
          { id: "1page", label: "1 page", emoji: "📄", explainer: "Write one full page" },
          { id: "3paragraphs", label: "3 paragraphs", emoji: "📑", explainer: "Write three paragraphs" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom amount" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Once per week" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week", isDefault: true },
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Every day" }
        ],
        supports: [
          { id: "prompt", label: "Writing prompts", emoji: "💡", explainer: "Ideas to get you started", isDefault: true },
          { id: "quiet", label: "Quiet space", emoji: "🤫", explainer: "Find a peaceful writing spot" },
          { id: "timer", label: "Writing timer", emoji: "⏰", explainer: "Set focused writing time" },
          { id: "feedback", label: "Feedback buddy", emoji: "👥", explainer: "Someone to read and respond" }
        ],
        smartTemplate: "✍️ Write {amount} about {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "plan-week",
        title: "Plan Week", 
        emoji: "📅",
        explainer: "Take a few minutes to think ahead! Planning your week helps you feel prepared and confident about what's coming up.",
        purpose: [
          { id: "organized", label: "Stay organized", emoji: "📋", explainer: "Keep track of tasks and appointments", isDefault: true },
          { id: "stress", label: "Reduce stress", emoji: "😌", explainer: "Feel more prepared and less anxious" },
          { id: "goals", label: "Work toward goals", emoji: "🎯", explainer: "Plan time for important activities" }
        ],
        topic: [
          { id: "school", label: "School schedule", emoji: "🎓", explainer: "Plan classes, homework, and projects", isDefault: true },
          { id: "personal", label: "Personal activities", emoji: "🏠", explainer: "Plan free time and personal tasks" },
          { id: "work", label: "Work schedule", emoji: "💼", explainer: "Plan work tasks and meetings" },
          { id: "all", label: "Everything", emoji: "📊", explainer: "Plan all aspects of your week" }
        ],
        timing: [
          { id: "sunday", label: "Sunday evening", emoji: "🌅", explainer: "Plan at the start of each week", isDefault: true },
          { id: "friday", label: "Friday afternoon", emoji: "🌆", explainer: "Plan for the upcoming week" },
          { id: "other", label: "Other time", emoji: "⏰", explainer: "Choose your own planning time" }
        ],
        supports: [
          { id: "planner", label: "Weekly planner", emoji: "📝", explainer: "Use a physical or digital planner", isDefault: true },
          { id: "calendar", label: "Calendar app", emoji: "📱", explainer: "Use your phone or computer calendar" },
          { id: "checklist", label: "Planning checklist", emoji: "✅", explainer: "Step-by-step planning guide" }
        ],
        smartTemplate: "📅 Plan {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "solve-problem",
        title: "Solve a Problem",
        emoji: "🧩",
        explainer: "Tackle something that's been bugging you! Whether big or small, working through problems step by step builds your confidence.",
        purpose: [
          { id: "academic", label: "Academic challenge", emoji: "🎓", explainer: "Work on a school-related problem" },
          { id: "personal", label: "Personal issue", emoji: "🤔", explainer: "Address a personal challenge", isDefault: true },
          { id: "creative", label: "Creative challenge", emoji: "🎨", explainer: "Solve a creative or artistic problem" },
          { id: "technical", label: "Technical issue", emoji: "⚙️", explainer: "Fix or figure out something technical" }
        ],
        topic: [
          { id: "homework", label: "Homework problem", emoji: "📚", explainer: "Work on a specific school assignment" },
          { id: "relationship", label: "Social situation", emoji: "👥", explainer: "Navigate a relationship or social issue" },
          { id: "organization", label: "Organization challenge", emoji: "📋", explainer: "Organize space, time, or tasks" },
          { id: "decision", label: "Decision to make", emoji: "🤷", explainer: "Work through a choice you need to make", isDefault: true },
          { id: "other", label: "Other", emoji: "➕", explainer: "Any other problem you want to tackle" }
        ],
        timing: [
          { id: "1session", label: "1 session this week", emoji: "📅", explainer: "Work on it once this week", isDefault: true },
          { id: "2sessions", label: "2 sessions this week", emoji: "📅", explainer: "Work on it twice this week" },
          { id: "daily", label: "A little daily", emoji: "📅", explainer: "Spend a few minutes each day" }
        ],
        supports: [
          { id: "steps", label: "Step-by-step guide", emoji: "📋", explainer: "Break the problem into smaller steps", isDefault: true },
          { id: "mentor", label: "Talk to someone", emoji: "👨‍🏫", explainer: "Get advice from a trusted person" },
          { id: "research", label: "Research resources", emoji: "🔍", explainer: "Look up information to help solve it" }
        ],
        smartTemplate: "🧩 Work on {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "review-notes",
        title: "Review Notes",
        emoji: "📝",
        explainer: "Go back through your notes and make sure the important stuff sticks! Reviewing helps move information from short-term to long-term memory.",
        purpose: [
          { id: "exam", label: "Study for exam", emoji: "📊", explainer: "Prepare for an upcoming test" },
          { id: "reinforce", label: "Reinforce learning", emoji: "🧠", explainer: "Help information stick in your memory", isDefault: true },
          { id: "clarify", label: "Clarify concepts", emoji: "💡", explainer: "Better understand confusing topics" }
        ],
        topic: [
          { id: "class", label: "Class notes", emoji: "🎓", explainer: "Review notes from specific classes", isDefault: true },
          { id: "textbook", label: "Textbook notes", emoji: "📚", explainer: "Review notes from reading" },
          { id: "meeting", label: "Meeting notes", emoji: "💼", explainer: "Review notes from work/group meetings" },
          { id: "research", label: "Research notes", emoji: "🔍", explainer: "Review notes from projects or research" }
        ],
        timing: [
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Review notes twice per week", isDefault: true },
          { id: "daily", label: "Daily review", emoji: "📅", explainer: "Quick daily review" },
          { id: "before-class", label: "Before each class", emoji: "⏰", explainer: "Review before attending class" }
        ],
        supports: [
          { id: "highlights", label: "Highlighting system", emoji: "🖍️", explainer: "Color-code important information", isDefault: true },
          { id: "summaries", label: "Write summaries", emoji: "📋", explainer: "Summarize key points" },
          { id: "flashcards", label: "Make flashcards", emoji: "🗂️", explainer: "Create cards for important facts" }
        ],
        smartTemplate: "📝 Review {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "study",
        title: "Study",
        emoji: "📚",
        explainer: "Focused time to really dive deep into your learning! Whether it's for school, work, or personal growth - studying builds your knowledge and skills.",
        purpose: [
          { id: "exam", label: "Prepare for exam", emoji: "📊", explainer: "Study for an upcoming test", isDefault: true },
          { id: "assignment", label: "Complete assignment", emoji: "📝", explainer: "Work on homework or projects" },
          { id: "skill", label: "Learn new skill", emoji: "🎯", explainer: "Develop a new ability" },
          { id: "interest", label: "Personal interest", emoji: "💡", explainer: "Explore something you're curious about" }
        ],
        topic: [
          { id: "math", label: "Math", emoji: "🔢", explainer: "Study mathematics concepts" },
          { id: "science", label: "Science", emoji: "🔬", explainer: "Study scientific subjects" },
          { id: "language", label: "Language/English", emoji: "📖", explainer: "Study language arts or literature" },
          { id: "history", label: "History/Social Studies", emoji: "🏛️", explainer: "Study historical or social topics" },
          { id: "skill", label: "Life skill", emoji: "🛠️", explainer: "Study practical life skills", isDefault: true },
          { id: "other", label: "Other subject", emoji: "➕", explainer: "Any other subject you want to study" }
        ],
        amount: [
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Short, focused study session", isDefault: true },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Medium study session" },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Longer study session" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom study duration" }
        ],
        timing: [
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Study three times per week", isDefault: true },
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Study every day" },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Study twice per week" }
        ],
        supports: [
          { id: "schedule", label: "Study schedule", emoji: "📅", explainer: "Plan when and what to study", isDefault: true },
          { id: "space", label: "Quiet study space", emoji: "🤫", explainer: "Find a distraction-free area" },
          { id: "tools", label: "Study tools", emoji: "🛠️", explainer: "Flashcards, highlighters, notes" },
          { id: "breaks", label: "Break reminders", emoji: "☕", explainer: "Take breaks to stay focused" }
        ],
        smartTemplate: "📚 Study {subject} for {duration} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "employment",
    title: "Employment",
    emoji: "💼",
    description: "Building work skills and confidence - one small step toward your future",
    goals: [
      {
        id: "interview",
        title: "Practice for Interview",
        emoji: "🎤",
        explainer: "Get ready to shine! Practice makes perfect, and every bit of prep helps you feel more confident walking into that interview.",
        purpose: [
          { id: "job", label: "Job interview", emoji: "💼", explainer: "Prepare for employment interview", isDefault: true },
          { id: "school", label: "School interview", emoji: "🎓", explainer: "Prepare for college or program interview" },
          { id: "skill", label: "Build confidence", emoji: "💪", explainer: "Improve interview skills in general" }
        ],
        topic: [
          { id: "questions", label: "Practice questions", emoji: "❓", explainer: "Work on common interview questions", isDefault: true },
          { id: "handshake", label: "Handshake/greeting", emoji: "🤝", explainer: "Practice professional greetings" },
          { id: "answers", label: "Prepare answers", emoji: "💭", explainer: "Think through responses to likely questions" },
          { id: "outfit", label: "Choose outfit", emoji: "👔", explainer: "Plan what to wear" }
        ],
        timing: [
          { id: "once", label: "Once this week", emoji: "📅", explainer: "One practice session", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Two practice sessions per week" },
          { id: "daily", label: "Daily until interview", emoji: "📅", explainer: "Practice every day leading up" }
        ],
        supports: [
          { id: "mirror", label: "Practice with mirror", emoji: "🪞", explainer: "See yourself while practicing", isDefault: true },
          { id: "person", label: "Practice with person", emoji: "👥", explainer: "Role-play with friend or family" },
          { id: "questions", label: "Question list", emoji: "📝", explainer: "Common interview questions to practice" }
        ],
        smartTemplate: "🎤 Practice {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "write-resume",
        title: "Write Resume",
        emoji: "📄",
        explainer: "Tell your story on paper! Your resume is like a highlight reel of all the great things you've done and can do.",
        purpose: [
          { id: "first", label: "Create first resume", emoji: "✨", explainer: "Write your very first resume", isDefault: true },
          { id: "job", label: "Apply for specific job", emoji: "🎯", explainer: "Target a particular position" },
          { id: "practice", label: "Practice writing", emoji: "✍️", explainer: "Build resume writing skills" }
        ],
        timing: [
          { id: "week", label: "Complete in 1 week", emoji: "📅", explainer: "Finish resume within a week", isDefault: true },
          { id: "weekend", label: "This weekend", emoji: "🌟", explainer: "Work on it over the weekend" },
          { id: "session", label: "One session", emoji: "⏰", explainer: "Complete in one sitting" }
        ],
        supports: [
          { id: "template", label: "Resume template", emoji: "📝", explainer: "Use a pre-made format", isDefault: true },
          { id: "examples", label: "Example resumes", emoji: "👀", explainer: "See how others write theirs" },
          { id: "help", label: "Get feedback", emoji: "👥", explainer: "Have someone review your draft" }
        ],
        smartTemplate: "📄 Write resume from {start_date} to {due_date}."
      },
      {
        id: "update-resume", 
        title: "Update Resume",
        emoji: "✏️",
        explainer: "Keep your resume fresh! Add new experiences, skills, or achievements to show how awesome you're becoming.",
        purpose: [
          { id: "experience", label: "Add new experience", emoji: "⭐", explainer: "Include recent work or activities", isDefault: true },
          { id: "skills", label: "Add new skills", emoji: "🎯", explainer: "Include newly learned abilities" },
          { id: "target", label: "Target new job", emoji: "🎪", explainer: "Customize for specific opportunity" }
        ],
        timing: [
          { id: "hour", label: "1 hour this week", emoji: "⏰", explainer: "Spend an hour updating", isDefault: true },
          { id: "weekend", label: "This weekend", emoji: "🌟", explainer: "Update over the weekend" }
        ],
        supports: [
          { id: "checklist", label: "Update checklist", emoji: "✅", explainer: "What to review and update", isDefault: true },
          { id: "feedback", label: "Get feedback", emoji: "👥", explainer: "Have someone review changes" }
        ],
        smartTemplate: "✏️ Update resume {timing} from {start_date} to {due_date}."
      },
      {
        id: "thank-you",
        title: "Send Thank-You Letter",
        emoji: "💌",
        explainer: "Show your appreciation! A thank-you note after an interview or meeting shows you're thoughtful and professional.",
        purpose: [
          { id: "interview", label: "After interview", emoji: "🎤", explainer: "Thank interviewer for their time", isDefault: true },
          { id: "meeting", label: "After meeting", emoji: "🤝", explainer: "Thank someone for meeting with you" },
          { id: "help", label: "For someone's help", emoji: "🙏", explainer: "Thank someone who helped with job search" }
        ],
        topic: [
          { id: "email", label: "Email", emoji: "📧", explainer: "Send digital thank-you message", isDefault: true },
          { id: "card", label: "Handwritten card", emoji: "✍️", explainer: "Write and mail a thank-you card" },
          { id: "note", label: "LinkedIn message", emoji: "💼", explainer: "Send professional network message" }
        ],
        timing: [
          { id: "24hours", label: "Within 24 hours", emoji: "⚡", explainer: "Send soon after meeting", isDefault: true },
          { id: "week", label: "Within a week", emoji: "📅", explainer: "Send within one week" }
        ],
        supports: [
          { id: "template", label: "Thank-you templates", emoji: "📝", explainer: "Examples of what to write", isDefault: true },
          { id: "tips", label: "Writing tips", emoji: "💡", explainer: "How to make it personal and professional" }
        ],
        smartTemplate: "💌 Send {type} thank-you {timing} from {start_date} to {due_date}."
      },
      {
        id: "find-companies",
        title: "Find Companies",
        emoji: "🔍",
        explainer: "Explore what's out there! Research companies you might want to work for - it's like window shopping for your future!",
        purpose: [
          { id: "job-search", label: "Job searching", emoji: "💼", explainer: "Look for potential employers", isDefault: true },
          { id: "research", label: "Career research", emoji: "🔬", explainer: "Learn about different industries" },
          { id: "networking", label: "Networking prep", emoji: "🤝", explainer: "Research before reaching out" }
        ],
        topic: [
          { id: "local", label: "Local companies", emoji: "🏢", explainer: "Companies in your area", isDefault: true },
          { id: "industry", label: "Specific industry", emoji: "🏭", explainer: "Companies in field you're interested in" },
          { id: "size", label: "Company size", emoji: "📊", explainer: "Small, medium, or large companies" },
          { id: "values", label: "Companies with your values", emoji: "💎", explainer: "Companies that match what you care about" }
        ],
        timing: [
          { id: "30min", label: "30 min this week", emoji: "⏰", explainer: "Spend 30 minutes researching", isDefault: true },
          { id: "hour", label: "1 hour this week", emoji: "⏰", explainer: "Spend an hour researching" },
          { id: "daily", label: "15 min daily", emoji: "📅", explainer: "Research a little each day" }
        ],
        supports: [
          { id: "websites", label: "Company websites", emoji: "🌐", explainer: "Visit official company sites", isDefault: true },
          { id: "job-boards", label: "Job search sites", emoji: "📋", explainer: "Use Indeed, LinkedIn, etc." },
          { id: "notebook", label: "Research notebook", emoji: "📝", explainer: "Keep track of interesting companies" }
        ],
        smartTemplate: "🔍 Research {topic} for {timing} from {start_date} to {due_date}."
      },
      {
        id: "find-people",
        title: "Find People that Can Help",
        emoji: "👥",
        explainer: "Build your network! Connect with people who can offer advice, information, or support in your career journey.",
        purpose: [
          { id: "mentorship", label: "Find a mentor", emoji: "👨‍🏫", explainer: "Someone to guide and advise you", isDefault: true },
          { id: "information", label: "Get career info", emoji: "ℹ️", explainer: "Learn about jobs or industries" },
          { id: "referrals", label: "Job referrals", emoji: "🤝", explainer: "Find people who might recommend you" },
          { id: "support", label: "Career support", emoji: "💪", explainer: "Build a supportive professional network" }
        ],
        topic: [
          { id: "linkedin", label: "LinkedIn connections", emoji: "💼", explainer: "Connect with professionals online", isDefault: true },
          { id: "family", label: "Family/friends", emoji: "👨‍👩‍👧‍👦", explainer: "Ask people you know for help" },
          { id: "school", label: "School contacts", emoji: "🎓", explainer: "Teachers, counselors, alumni" },
          { id: "community", label: "Community groups", emoji: "🏘️", explainer: "Local organizations or clubs" }
        ],
        timing: [
          { id: "1week", label: "1 person this week", emoji: "📅", explainer: "Connect with one person", isDefault: true },
          { id: "2week", label: "2 people this week", emoji: "📅", explainer: "Reach out to two people" },
          { id: "monthly", label: "1 person monthly", emoji: "📅", explainer: "One new connection per month" }
        ],
        supports: [
          { id: "script", label: "Message templates", emoji: "📝", explainer: "Examples of what to say", isDefault: true },
          { id: "list", label: "Contact list", emoji: "📋", explainer: "Keep track of who you've contacted" },
          { id: "goals", label: "Networking goals", emoji: "🎯", explainer: "Clear plan for what you want to achieve" }
        ],
        smartTemplate: "👥 Connect with {topic} {timing} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "fun",
    title: "Fun / Recreation",
    emoji: "🎉",
    description: "Enjoying life and having fun - because happiness matters too",
    goals: [
      {
        id: "play-sport-game",
        title: "Play a Sport/Game",
        emoji: "⚽",
        explainer: "Get your game on! Whether it's shooting hoops, playing cards, or any activity that gets you moving and having fun.",
        purpose: [
          { id: "exercise", label: "Get exercise", emoji: "💪", explainer: "Stay active and healthy" },
          { id: "fun", label: "Have fun", emoji: "😄", explainer: "Enjoy yourself and relax", isDefault: true },
          { id: "social", label: "Spend time with others", emoji: "👥", explainer: "Connect with friends or family" },
          { id: "skill", label: "Learn/practice skill", emoji: "🎯", explainer: "Improve at a sport or game" }
        ],
        topic: [
          { id: "basketball", label: "Basketball", emoji: "🏀", explainer: "Shoot hoops or play a game" },
          { id: "soccer", label: "Soccer/Football", emoji: "⚽", explainer: "Kick the ball around" },
          { id: "board-game", label: "Board game", emoji: "🎲", explainer: "Play cards, chess, or other table games", isDefault: true },
          { id: "video-game", label: "Video game", emoji: "🎮", explainer: "Play console or computer games" },
          { id: "frisbee", label: "Frisbee/catch", emoji: "🥏", explainer: "Throw and catch with others" },
          { id: "other", label: "Other sport/game", emoji: "🎪", explainer: "Any other sport or game you enjoy" }
        ],
        amount: [
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Quick game session", isDefault: true },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Half-hour of play" },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Full hour of activity" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Twice per week", isDefault: true },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week" },
          { id: "weekend", label: "Weekends", emoji: "🌟", explainer: "Play on weekends" }
        ],
        supports: [
          { id: "equipment", label: "Get equipment", emoji: "🏀", explainer: "Make sure you have what you need" },
          { id: "partner", label: "Find playing partner", emoji: "👥", explainer: "Someone to play with", isDefault: true },
          { id: "location", label: "Find good location", emoji: "📍", explainer: "Safe, fun place to play" },
          { id: "rules", label: "Learn rules", emoji: "📚", explainer: "Understand how to play" }
        ],
        smartTemplate: "⚽ Play {sport} for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "art-craft",
        title: "Do an Art or Craft",
        emoji: "🎨",
        explainer: "Get creative and make something awesome! Art and crafts are great ways to express yourself and create something you can be proud of.",
        purpose: [
          { id: "creative", label: "Express creativity", emoji: "✨", explainer: "Let your artistic side shine", isDefault: true },
          { id: "relax", label: "Relax and unwind", emoji: "😌", explainer: "Enjoy peaceful, calming activity" },
          { id: "gift", label: "Make a gift", emoji: "🎁", explainer: "Create something for someone special" },
          { id: "decorate", label: "Decorate space", emoji: "🏠", explainer: "Make something for your room or home" }
        ],
        topic: [
          { id: "drawing", label: "Drawing/sketching", emoji: "✏️", explainer: "Use pencils, pens, or markers" },
          { id: "painting", label: "Painting", emoji: "🖌️", explainer: "Use watercolors, acrylics, or other paints" },
          { id: "collage", label: "Collage/scrapbook", emoji: "📷", explainer: "Cut and paste images or memories" },
          { id: "jewelry", label: "Jewelry making", emoji: "📿", explainer: "Make bracelets, necklaces, or rings", isDefault: true },
          { id: "pottery", label: "Clay/pottery", emoji: "🏺", explainer: "Shape and create with clay" },
          { id: "other", label: "Other craft", emoji: "🎪", explainer: "Any other art or craft project" }
        ],
        amount: [
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Half hour of creative time", isDefault: true },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Full hour of crafting" },
          { id: "project", label: "Complete small project", emoji: "✅", explainer: "Finish one small creation" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom amount" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Once per week", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Twice per week" },
          { id: "weekend", label: "Weekends", emoji: "🌟", explainer: "Creative time on weekends" }
        ],
        supports: [
          { id: "supplies", label: "Get art supplies", emoji: "🖍️", explainer: "Make sure you have materials", isDefault: true },
          { id: "space", label: "Set up workspace", emoji: "🛠️", explainer: "Create a good area for crafting" },
          { id: "inspiration", label: "Find inspiration", emoji: "💡", explainer: "Look for ideas online or in books" },
          { id: "share", label: "Share your work", emoji: "📸", explainer: "Show others what you create" }
        ],
        smartTemplate: "🎨 Do {craft} for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "music",
        title: "Listen to or Play Music",
        emoji: "🎵",
        explainer: "Fill your world with music! Whether you're jamming to your favorite songs or making your own music, it's great for your mood and soul.",
        purpose: [
          { id: "enjoyment", label: "Pure enjoyment", emoji: "😊", explainer: "Just because music makes you happy", isDefault: true },
          { id: "relaxation", label: "Relax and destress", emoji: "😌", explainer: "Use music to calm down" },
          { id: "learning", label: "Learn to play", emoji: "🎹", explainer: "Develop musical skills" },
          { id: "social", label: "Share with others", emoji: "👥", explainer: "Enjoy music with friends or family" }
        ],
        topic: [
          { id: "favorite", label: "Favorite songs/artists", emoji: "⭐", explainer: "Listen to music you already love", isDefault: true },
          { id: "new", label: "Explore new music", emoji: "🔍", explainer: "Discover different genres or artists" },
          { id: "instrument", label: "Play an instrument", emoji: "🎸", explainer: "Practice guitar, piano, etc." },
          { id: "sing", label: "Singing", emoji: "🎤", explainer: "Sing along or practice vocals" },
          { id: "create", label: "Make music", emoji: "🎼", explainer: "Write songs or create beats" }
        ],
        amount: [
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Quick music session", isDefault: true },
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Half hour with music" },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Full hour of musical time" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Music every day", isDefault: true },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week" },
          { id: "evening", label: "Evening routine", emoji: "🌙", explainer: "Music as part of evening wind-down" }
        ],
        supports: [
          { id: "playlists", label: "Create playlists", emoji: "📱", explainer: "Organize your favorite music" },
          { id: "headphones", label: "Good headphones", emoji: "🎧", explainer: "Quality listening experience", isDefault: true },
          { id: "streaming", label: "Music streaming app", emoji: "📱", explainer: "Access to wide variety of music" },
          { id: "lessons", label: "Music lessons/tutorials", emoji: "📚", explainer: "Learn to play or improve skills" }
        ],
        smartTemplate: "🎵 {activity} {music} for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "read-watch-fun",
        title: "Read or Watch Something Fun",
        emoji: "🍿",
        explainer: "Treat yourself to some entertainment! Whether it's a good book, funny videos, or your favorite show - it's important to enjoy yourself.",
        purpose: [
          { id: "entertainment", label: "Pure entertainment", emoji: "😄", explainer: "Just for fun and enjoyment", isDefault: true },
          { id: "relaxation", label: "Relax and unwind", emoji: "😌", explainer: "Chill out after a busy day" },
          { id: "escape", label: "Mental break", emoji: "🌈", explainer: "Take a break from stress or routine" },
          { id: "social", label: "Social activity", emoji: "👥", explainer: "Watch or discuss with others" }
        ],
        topic: [
          { id: "comedy", label: "Comedy", emoji: "😂", explainer: "Funny movies, shows, or books" },
          { id: "adventure", label: "Adventure/action", emoji: "🏃", explainer: "Exciting stories and adventures" },
          { id: "mystery", label: "Mystery/thriller", emoji: "🔍", explainer: "Suspenseful stories that keep you guessing" },
          { id: "romance", label: "Romance", emoji: "💕", explainer: "Love stories and romantic content" },
          { id: "fantasy", label: "Fantasy/sci-fi", emoji: "🚀", explainer: "Magical or futuristic stories", isDefault: true },
          { id: "other", label: "Other genre", emoji: "🎪", explainer: "Any other type of entertainment" }
        ],
        amount: [
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Half hour of entertainment", isDefault: true },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Full hour of fun content" },
          { id: "episode", label: "1-2 episodes", emoji: "📺", explainer: "Watch a couple episodes" },
          { id: "chapter", label: "Few chapters", emoji: "📖", explainer: "Read several chapters" }
        ],
        timing: [
          { id: "evening", label: "Evening routine", emoji: "🌙", explainer: "End your day with entertainment" },
          { id: "weekend", label: "Weekend treat", emoji: "🌟", explainer: "Special weekend entertainment", isDefault: true },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week" }
        ],
        supports: [
          { id: "streaming", label: "Streaming services", emoji: "📱", explainer: "Netflix, YouTube, etc.", isDefault: true },
          { id: "library", label: "Library books/movies", emoji: "📚", explainer: "Free entertainment from library" },
          { id: "comfy", label: "Comfy setup", emoji: "🛋️", explainer: "Cozy spot for enjoying content" },
          { id: "snacks", label: "Favorite snacks", emoji: "🍿", explainer: "Treats to enjoy while watching/reading" }
        ],
        smartTemplate: "🍿 Enjoy {genre} content for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "fun-with-friends",
        title: "Do a Fun Activity with Friends",
        emoji: "🎉",
        explainer: "Hang out and have a blast! Spending quality time with friends doing things you all enjoy is great for your happiness and relationships.",
        purpose: [
          { id: "friendship", label: "Strengthen friendships", emoji: "💕", explainer: "Build closer relationships", isDefault: true },
          { id: "fun", label: "Have fun together", emoji: "😄", explainer: "Enjoy each other's company" },
          { id: "stress", label: "Reduce stress", emoji: "😌", explainer: "Relax and laugh with friends" },
          { id: "memories", label: "Make memories", emoji: "📸", explainer: "Create experiences to remember" }
        ],
        topic: [
          { id: "games", label: "Play games", emoji: "🎮", explainer: "Video games, board games, sports" },
          { id: "movie", label: "Watch movies/shows", emoji: "🎬", explainer: "Have a movie night together" },
          { id: "outdoor", label: "Outdoor activities", emoji: "🌳", explainer: "Go to park, beach, hiking, etc." },
          { id: "food", label: "Food activities", emoji: "🍕", explainer: "Cook together, try restaurants, picnic", isDefault: true },
          { id: "creative", label: "Creative projects", emoji: "🎨", explainer: "Art, crafts, music together" },
          { id: "other", label: "Other activity", emoji: "🎪", explainer: "Any other fun group activity" }
        ],
        timing: [
          { id: "weekend", label: "Weekend hangout", emoji: "🌟", explainer: "Spend time on weekends", isDefault: true },
          { id: "after-school", label: "After school/work", emoji: "🏫", explainer: "Meet up after daily responsibilities" },
          { id: "1week", label: "Once a week", emoji: "📅", explainer: "Regular weekly friend time" }
        ],
        supports: [
          { id: "planning", label: "Plan activities together", emoji: "📝", explainer: "Decide what to do as a group", isDefault: true },
          { id: "budget", label: "Budget-friendly options", emoji: "💰", explainer: "Find affordable or free activities" },
          { id: "scheduling", label: "Coordinate schedules", emoji: "📅", explainer: "Find times that work for everyone" },
          { id: "backup", label: "Backup plans", emoji: "🔄", explainer: "Have alternatives if first plan doesn't work" }
        ],
        smartTemplate: "🎉 Do {activity} with friends {timing} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "health",
    title: "Health & Well-Being",
    emoji: "🌱",
    description: "Taking care of your body and mind - the good stuff that makes you feel awesome",
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
          { id: "flexibility", label: "Improve flexibility", emoji: "🤸", explainer: "Help your body move more easily" },
          { id: "pain", label: "Reduce aches/pain", emoji: "💆", explainer: "Ease tension and soreness", isDefault: true },
          { id: "relaxation", label: "Relaxation", emoji: "😌", explainer: "Help your mind and body relax" },
          { id: "morning", label: "Wake up gently", emoji: "🌅", explainer: "Start your day feeling good" }
        ],
        details: [
          { id: "5min", label: "5 minutes", emoji: "⏰", explainer: "Quick gentle stretches", isDefault: true },
          { id: "10min", label: "10 minutes", emoji: "⏰", explainer: "More thorough stretching session" },
          { id: "15min", label: "15 minutes", emoji: "⏰", explainer: "Extended stretching routine" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "morning", label: "Every morning", emoji: "🌅", explainer: "Start each day with stretches", isDefault: true },
          { id: "evening", label: "Every evening", emoji: "🌙", explainer: "End each day with stretches" },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three times per week" }
        ],
        supports: [
          { id: "video", label: "Stretching videos", emoji: "📹", explainer: "Follow along with guided routines", isDefault: true },
          { id: "mat", label: "Yoga mat", emoji: "🧘", explainer: "Comfortable surface for stretching" },
          { id: "reminder", label: "Daily reminder", emoji: "🔔", explainer: "Don't forget to stretch" },
          { id: "music", label: "Relaxing music", emoji: "🎵", explainer: "Calm music to stretch to" }
        ],
        smartTemplate: "🧘 Stretch for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "sleep",
        title: "Better Sleep",
        emoji: "😴",
        explainer: "Getting good rest so you wake up feeling awesome! Good sleep helps everything else in your life work better.",
        purpose: [
          { id: "energy", label: "More energy", emoji: "⚡", explainer: "Wake up feeling more energized", isDefault: true },
          { id: "mood", label: "Better mood", emoji: "😊", explainer: "Feel happier and more positive" },
          { id: "focus", label: "Better focus", emoji: "🎯", explainer: "Think more clearly during the day" },
          { id: "health", label: "Overall health", emoji: "💪", explainer: "Support your body's natural healing" }
        ],
        details: [
          { id: "bedtime", label: "Regular bedtime", emoji: "🕘", explainer: "Go to bed at the same time", isDefault: true },
          { id: "routine", label: "Bedtime routine", emoji: "📚", explainer: "Do calming activities before bed" },
          { id: "environment", label: "Better sleep space", emoji: "🛏️", explainer: "Make bedroom more comfortable" },
          { id: "screen", label: "Less screen time", emoji: "📱", explainer: "Reduce phone/TV before bed" }
        ],
        timing: [
          { id: "nightly", label: "Every night", emoji: "🌙", explainer: "Work on sleep every night", isDefault: true },
          { id: "weeknight", label: "Weeknights", emoji: "📅", explainer: "Focus on school/work nights" },
          { id: "gradual", label: "Gradually improve", emoji: "📈", explainer: "Small changes over time" }
        ],
        supports: [
          { id: "schedule", label: "Sleep schedule", emoji: "⏰", explainer: "Plan when to sleep and wake", isDefault: true },
          { id: "routine", label: "Relaxing routine", emoji: "🛀", explainer: "Calming activities before bed" },
          { id: "environment", label: "Sleep-friendly room", emoji: "🏠", explainer: "Dark, cool, quiet space" },
          { id: "tracker", label: "Sleep tracker", emoji: "📱", explainer: "Monitor your sleep patterns" }
        ],
        smartTemplate: "😴 Work on {focus} {timing} from {start_date} to {due_date}."
      },
      {
        id: "eat-healthy",
        title: "Eat Healthier", 
        emoji: "🥗",
        explainer: "Fuel your body with good stuff! Small changes in what you eat can make a big difference in how you feel.",
        purpose: [
          { id: "energy", label: "More energy", emoji: "⚡", explainer: "Feel more energized throughout the day", isDefault: true },
          { id: "health", label: "Better health", emoji: "💪", explainer: "Support your overall wellbeing" },
          { id: "mood", label: "Better mood", emoji: "😊", explainer: "Food affects how you feel" },
          { id: "habit", label: "Build good habits", emoji: "🎯", explainer: "Develop lasting healthy eating patterns" }
        ],
        details: [
          { id: "fruit", label: "Eat more fruit", emoji: "🍎", explainer: "Add fruits to meals or snacks", isDefault: true },
          { id: "veggies", label: "Eat more vegetables", emoji: "🥕", explainer: "Include vegetables in your meals" },
          { id: "water", label: "Drink more water", emoji: "💧", explainer: "Replace sugary drinks with water" },
          { id: "breakfast", label: "Eat good breakfast", emoji: "🍳", explainer: "Start your day with nutritious food" },
          { id: "snacks", label: "Healthier snacks", emoji: "🥜", explainer: "Choose better options between meals" }
        ],
        timing: [
          { id: "daily", label: "Every day", emoji: "📅", explainer: "Make healthy choices daily", isDefault: true },
          { id: "meal", label: "One meal per day", emoji: "🍽️", explainer: "Focus on making one meal healthier" },
          { id: "gradual", label: "Gradually increase", emoji: "📈", explainer: "Slowly add more healthy foods" }
        ],
        supports: [
          { id: "meal-plan", label: "Simple meal ideas", emoji: "📝", explainer: "Easy healthy meal suggestions", isDefault: true },
          { id: "shopping", label: "Healthy shopping list", emoji: "🛒", explainer: "What to buy at the store" },
          { id: "prep", label: "Meal prep tips", emoji: "🥘", explainer: "Prepare healthy food ahead of time" },
          { id: "reminder", label: "Healthy choice reminders", emoji: "🔔", explainer: "Prompts to make good decisions" }
        ],
        smartTemplate: "🥗 {focus} {timing} from {start_date} to {due_date}."
      },
      {
        id: "drink-water",
        title: "Drink More Water",
        emoji: "💧",
        explainer: "Keep your body happy and hydrated! Water helps everything in your body work better, and it's the simplest healthy change you can make.",
        purpose: [
          { id: "hydration", label: "Stay hydrated", emoji: "💦", explainer: "Keep your body functioning well", isDefault: true },
          { id: "energy", label: "More energy", emoji: "⚡", explainer: "Proper hydration boosts energy" },
          { id: "skin", label: "Better skin", emoji: "✨", explainer: "Water helps your skin look healthy" },
          { id: "focus", label: "Better focus", emoji: "🧠", explainer: "Hydration helps brain function" }
        ],
        details: [
          { id: "glasses", label: "6-8 glasses daily", emoji: "🥤", explainer: "Aim for 6-8 glasses throughout the day", isDefault: true },
          { id: "morning", label: "Glass when waking", emoji: "🌅", explainer: "Start your day with water" },
          { id: "meals", label: "Water with meals", emoji: "🍽️", explainer: "Drink water instead of other beverages" },
          { id: "bottle", label: "Carry water bottle", emoji: "🍼", explainer: "Keep water with you throughout the day" }
        ],
        timing: [
          { id: "daily", label: "Every day", emoji: "📅", explainer: "Drink more water each day", isDefault: true },
          { id: "hourly", label: "Every hour", emoji: "⏰", explainer: "Sip water regularly throughout the day" },
          { id: "meals", label: "With every meal", emoji: "🍽️", explainer: "Always have water during meals" }
        ],
        supports: [
          { id: "bottle", label: "Water bottle", emoji: "🍼", explainer: "Keep a bottle with you", isDefault: true },
          { id: "tracker", label: "Water tracker app", emoji: "📱", explainer: "Track how much you drink" },
          { id: "reminder", label: "Drinking reminders", emoji: "🔔", explainer: "Get reminded to drink water" },
          { id: "flavor", label: "Add natural flavor", emoji: "🍋", explainer: "Lemon, cucumber, or fruit for taste" }
        ],
        smartTemplate: "💧 {focus} {timing} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "independent-living",
    title: "Independent Living",
    emoji: "🏠",
    description: "Everyday life stuff that makes you feel more independent and capable",
    goals: [
      {
        id: "make-bed",
        title: "Make Bed", 
        emoji: "🛏️",
        explainer: "Starting your day by tidying up your sleep space. Try making your bed just 1 time this week.",
        purpose: [
          { id: "routine", label: "Build morning routine", emoji: "🌅", explainer: "Start your day with a positive habit", isDefault: true },
          { id: "tidy", label: "Keep room tidy", emoji: "✨", explainer: "Make your space feel organized" },
          { id: "pride", label: "Feel accomplished", emoji: "😊", explainer: "Start the day with a small win" }
        ],
        
        timing: [
          { id: "morning", label: "Every morning", emoji: "🌅", explainer: "Make it part of getting up", isDefault: true },
          { id: "3week", label: "3×/week", emoji: "📅", explainer: "Three mornings per week" },
          { id: "weekday", label: "Weekdays only", emoji: "📚", explainer: "School/work mornings" }
        ],
        supports: [
          { id: "reminder", label: "Morning reminder", emoji: "📱", explainer: "Get a gentle reminder", isDefault: true },
          { id: "routine", label: "Morning routine list", emoji: "📝", explainer: "Include bed-making in your routine" }
        ],
        smartTemplate: "🛏️ {focus} {timing} from {start_date} to {due_date}."
      },
      {
        id: "set-table",
        title: "Set Table",
        emoji: "🍽️", 
        explainer: "Getting the table ready for meals - it's like preparing a special space for eating together!",
        purpose: [
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Contribute to family meal preparation", isDefault: true },
          { id: "responsibility", label: "Take responsibility", emoji: "🎯", explainer: "Have your own important job" },
          { id: "routine", label: "Build routine", emoji: "🔄", explainer: "Make it part of meal time" }
        ],
        details: [
          { id: "plates", label: "Just plates/napkins", emoji: "🍽️", explainer: "Set out plates and napkins", isDefault: true },
          { id: "utensils", label: "Plates + utensils", emoji: "🍴", explainer: "Include forks, knives, spoons" },
          { id: "full", label: "Full table setting", emoji: "🍽️", explainer: "Plates, utensils, cups, napkins" }
        ],
        timing: [
          { id: "dinner", label: "Before dinner", emoji: "🌆", explainer: "Set table for evening meal", isDefault: true },
          { id: "lunch", label: "Before lunch", emoji: "☀️", explainer: "Set table for midday meal" },
          { id: "all-meals", label: "Before each meal", emoji: "🍽️", explainer: "Set table for all meals" }
        ],
        supports: [
          { id: "checklist", label: "Table setting guide", emoji: "📝", explainer: "What goes where on the table", isDefault: true },
          { id: "timer", label: "Meal time reminder", emoji: "⏰", explainer: "Know when to set the table" }
        ],
        smartTemplate: "🍽️ Set table {details} {timing} from {start_date} to {due_date}."
      },
      {
        id: "laundry",
        title: "Do Laundry",
        emoji: "👕",
        explainer: "Keeping your clothes clean and fresh! Even small steps like sorting or moving clothes to the dryer help a lot.",
        purpose: [
          { id: "clean-clothes", label: "Have clean clothes", emoji: "✨", explainer: "Keep your wardrobe fresh and ready", isDefault: true },
          { id: "independence", label: "Be more independent", emoji: "💪", explainer: "Take care of your own needs" },
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Contribute to household tasks" }
        ],
        details: [
          { id: "sort", label: "Sort dirty clothes", emoji: "👔", explainer: "Separate lights, darks, colors", isDefault: true },
          { id: "load", label: "Load washing machine", emoji: "🌀", explainer: "Put clothes in washer" },
          { id: "transfer", label: "Move to dryer", emoji: "🔥", explainer: "Transfer from washer to dryer" },
          { id: "fold", label: "Fold clean clothes", emoji: "📚", explainer: "Fold and put away clothes" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "One laundry task per week", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Two laundry tasks per week" },
          { id: "when-needed", label: "When needed", emoji: "⏰", explainer: "Do laundry when clothes get dirty" }
        ],
        supports: [
          { id: "instructions", label: "Simple instructions", emoji: "📝", explainer: "Step-by-step laundry guide", isDefault: true },
          { id: "sorting", label: "Sorting system", emoji: "🗂️", explainer: "Easy way to separate clothes" },
          { id: "timer", label: "Laundry timer", emoji: "⏰", explainer: "Remember when cycles are done" }
        ],
        smartTemplate: "👕 {task} {timing} from {start_date} to {due_date}."
      },
      {
        id: "cook", 
        title: "Cook",
        emoji: "🍳",
        explainer: "Making something delicious! Even simple cooking like making a sandwich or heating something up counts as taking care of yourself.",
        purpose: [
          { id: "eat-well", label: "Eat better", emoji: "🥗", explainer: "Prepare nutritious meals for yourself", isDefault: true },
          { id: "independence", label: "Be more independent", emoji: "💪", explainer: "Take care of your own food needs" },
          { id: "help", label: "Help with family meals", emoji: "👨‍👩‍👧‍👦", explainer: "Contribute to cooking for others" },
          { id: "skill", label: "Learn cooking skills", emoji: "🎯", explainer: "Develop useful life skills" }
        ],
        details: [
          { id: "sandwich", label: "Make sandwich", emoji: "🥪", explainer: "Simple sandwich or wrap", isDefault: true },
          { id: "reheat", label: "Reheat food safely", emoji: "🔥", explainer: "Use microwave or stove to warm food" },
          { id: "simple", label: "Simple recipe", emoji: "📝", explainer: "Follow easy cooking instructions" },
          { id: "help", label: "Help prepare meal", emoji: "👥", explainer: "Assist with family cooking" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Cook something once per week", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Cook twice per week" },
          { id: "daily", label: "Help daily", emoji: "📅", explainer: "Help with cooking every day" }
        ],
        supports: [
          { id: "recipes", label: "Simple recipes", emoji: "📝", explainer: "Easy recipes to follow", isDefault: true },
          { id: "safety", label: "Kitchen safety tips", emoji: "⚠️", explainer: "How to cook safely" },
          { id: "tools", label: "Basic cooking tools", emoji: "🔪", explainer: "What you need to cook with" }
        ],
        smartTemplate: "🍳 {task} {timing} from {start_date} to {due_date}."
      },
      {
        id: "clean",
        title: "Clean Area",
        emoji: "🧹",
        explainer: "Keeping your space tidy and organized! Even cleaning one small area makes a big difference in how your space feels.",
        purpose: [
          { id: "organized", label: "Stay organized", emoji: "📋", explainer: "Keep your living space in order", isDefault: true },
          { id: "comfortable", label: "Comfortable space", emoji: "😌", explainer: "Make your area pleasant to be in" },
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Contribute to household cleanliness" },
          { id: "responsibility", label: "Take responsibility", emoji: "🎯", explainer: "Take care of your own space" }
        ],
        details: [
          { id: "desk", label: "Clean desk/table", emoji: "🗃️", explainer: "Organize your work or study area", isDefault: true },
          { id: "room", label: "Tidy bedroom", emoji: "🛏️", explainer: "Pick up clothes, organize belongings" },
          { id: "bathroom", label: "Wipe bathroom counter", emoji: "🚿", explainer: "Clean sink and counter area" },
          { id: "kitchen", label: "Clean kitchen area", emoji: "🍽️", explainer: "Wipe counters, put things away" }
        ],
        timing: [
          { id: "daily", label: "A little daily", emoji: "📅", explainer: "Clean something small each day", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Clean twice per week" },
          { id: "weekend", label: "Weekend cleaning", emoji: "🌟", explainer: "Do cleaning on weekends" }
        ],
        supports: [
          { id: "checklist", label: "Cleaning checklist", emoji: "✅", explainer: "What to clean in each area", isDefault: true },
          { id: "supplies", label: "Cleaning supplies", emoji: "🧽", explainer: "Have the right tools for cleaning" },
          { id: "music", label: "Cleaning playlist", emoji: "🎵", explainer: "Make cleaning more fun with music" }
        ],
        smartTemplate: "🧹 Clean {area} {timing} from {start_date} to {due_date}."
      },
      {
        id: "shopping-list",
        title: "Write Shopping List",
        emoji: "📝",
        explainer: "Planning what you need before you go shopping! Making a list helps you remember everything and makes shopping easier.",
        purpose: [
          { id: "organized", label: "Stay organized", emoji: "📋", explainer: "Be prepared before shopping", isDefault: true },
          { id: "help", label: "Help family", emoji: "👨‍👩‍👧‍👦", explainer: "Contribute to household planning" },
          { id: "independence", label: "Shop independently", emoji: "💪", explainer: "Be able to shop on your own" },
          { id: "budget", label: "Stick to budget", emoji: "💰", explainer: "Only buy what you planned" }
        ],
        details: [
          { id: "groceries", label: "Grocery list", emoji: "🛒", explainer: "List food and household items", isDefault: true },
          { id: "personal", label: "Personal items", emoji: "🧴", explainer: "List toiletries and personal needs" },
          { id: "school", label: "School supplies", emoji: "📚", explainer: "List items needed for school" },
          { id: "clothes", label: "Clothing needs", emoji: "👕", explainer: "List clothing items needed" }
        ],
        timing: [
          { id: "before", label: "Before shopping", emoji: "🛒", explainer: "Make list before each shopping trip", isDefault: true },
          { id: "weekly", label: "Weekly", emoji: "📅", explainer: "Make a list once per week" },
          { id: "monthly", label: "Monthly", emoji: "📅", explainer: "Plan monthly shopping needs" }
        ],
        supports: [
          { id: "template", label: "List template", emoji: "📝", explainer: "Format for organizing your list", isDefault: true },
          { id: "app", label: "Shopping list app", emoji: "📱", explainer: "Digital tool for making lists" },
          { id: "categories", label: "Organize by category", emoji: "🗂️", explainer: "Group similar items together" }
        ],
        smartTemplate: "📝 Write a shopping list {timing} from {start_date} until {due_date}."
      }
    ]
  },
  {
    id: "postsecondary",
    title: "Postsecondary - Learning After School",
    emoji: "🎓",
    description: "Checking out what's next after high school - colleges, trades, certificates, whatever interests you",
    goals: [
      {
        id: "research-programs",
        title: "Research Colleges/Programs",
        emoji: "📚",
        explainer: "Exploring what's out there for your future! Whether it's college, trade school, or certificate programs - discover what excites you.",
        purpose: [
          { id: "explore", label: "Explore options", emoji: "🔍", explainer: "See what different programs offer", isDefault: true },
          { id: "decide", label: "Help decide path", emoji: "🎯", explainer: "Figure out what you want to pursue" },
          { id: "prepare", label: "Prepare for applications", emoji: "📝", explainer: "Get ready to apply somewhere" },
          { id: "learn", label: "Learn about requirements", emoji: "📋", explainer: "Understand what you need to get in" }
        ],
        topic: [
          { id: "community", label: "Community colleges", emoji: "🏫", explainer: "2-year colleges in your area", isDefault: true },
          { id: "university", label: "4-year universities", emoji: "🎓", explainer: "Bachelor's degree programs" },
          { id: "trade", label: "Trade/technical schools", emoji: "🔧", explainer: "Hands-on skill training programs" },
          { id: "certificate", label: "Certificate programs", emoji: "📜", explainer: "Short-term specialized training" },
          { id: "online", label: "Online programs", emoji: "💻", explainer: "Distance learning options" }
        ],
        amount: [
          { id: "30min", label: "30 minutes", emoji: "⏰", explainer: "Half hour of research", isDefault: true },
          { id: "1hour", label: "1 hour", emoji: "⏰", explainer: "Full hour of exploration" },
          { id: "2programs", label: "2-3 programs", emoji: "📚", explainer: "Look at a few specific programs" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom research time" }
        ],
        timing: [
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Research once per week", isDefault: true },
          { id: "2week", label: "2×/week", emoji: "📅", explainer: "Research twice per week" },
          { id: "weekend", label: "Weekend sessions", emoji: "🌟", explainer: "Research on weekends" }
        ],
        supports: [
          { id: "websites", label: "College websites", emoji: "🌐", explainer: "Official program information", isDefault: true },
          { id: "counselor", label: "Guidance counselor", emoji: "👨‍🏫", explainer: "Get advice from school counselor" },
          { id: "notebook", label: "Research notebook", emoji: "📝", explainer: "Keep track of what you find" },
          { id: "virtual", label: "Virtual tours", emoji: "📹", explainer: "Online campus and program tours" }
        ],
        smartTemplate: "📚 Research {type} for {duration} {timing} from {start_date} to {due_date}."
      },
      {
        id: "application-materials",
        title: "Prepare Application Materials",
        emoji: "📄",
        explainer: "Getting your application materials ready! This includes things like transcripts, essays, and other documents you might need.",
        purpose: [
          { id: "apply", label: "Apply to programs", emoji: "🎯", explainer: "Get ready to submit applications", isDefault: true },
          { id: "organize", label: "Get organized", emoji: "📋", explainer: "Have everything ready ahead of time" },
          { id: "deadlines", label: "Meet deadlines", emoji: "⏰", explainer: "Be prepared before deadlines" },
          { id: "strong", label: "Create strong application", emoji: "⭐", explainer: "Put your best foot forward" }
        ],
        topic: [
          { id: "essay", label: "Personal essay", emoji: "✍️", explainer: "Write about yourself and goals", isDefault: true },
          { id: "transcripts", label: "Request transcripts", emoji: "📋", explainer: "Get official school records" },
          { id: "recommendations", label: "Ask for recommendations", emoji: "👥", explainer: "Request letters from teachers/mentors" },
          { id: "portfolio", label: "Create portfolio", emoji: "🎨", explainer: "Showcase your work and skills" },
          { id: "forms", label: "Fill out forms", emoji: "📝", explainer: "Complete application forms" }
        ],
        timing: [
          { id: "early", label: "Start early", emoji: "🌅", explainer: "Begin well before deadlines", isDefault: true },
          { id: "1week", label: "1 task/week", emoji: "📅", explainer: "Work on one thing per week" },
          { id: "2week", label: "2 tasks/week", emoji: "📅", explainer: "Complete two tasks per week" }
        ],
        supports: [
          { id: "checklist", label: "Application checklist", emoji: "✅", explainer: "Track what you need to complete", isDefault: true },
          { id: "help", label: "Get help with essays", emoji: "👨‍🏫", explainer: "Work with teacher or counselor" },
          { id: "calendar", label: "Deadline calendar", emoji: "📅", explainer: "Track important dates" },
          { id: "examples", label: "See examples", emoji: "👀", explainer: "Look at sample essays and applications" }
        ],
        smartTemplate: "📄 Work on {material} {timing} from {start_date} to {due_date}."
      },
      {
        id: "financial-aid",
        title: "Explore Financial Aid",
        emoji: "💰",
        explainer: "Learning about ways to help pay for education! There are lots of options like grants, scholarships, and financial aid.",
        purpose: [
          { id: "afford", label: "Make education affordable", emoji: "💰", explainer: "Find ways to pay for school", isDefault: true },
          { id: "understand", label: "Understand options", emoji: "🧠", explainer: "Learn what financial aid is available" },
          { id: "qualify", label: "See what you qualify for", emoji: "✅", explainer: "Find aid you're eligible to receive" },
          { id: "plan", label: "Plan financially", emoji: "📊", explainer: "Create a plan for paying for education" }
        ],
        topic: [
          { id: "fafsa", label: "FAFSA application", emoji: "📝", explainer: "Federal financial aid application", isDefault: true },
          { id: "scholarships", label: "Scholarship search", emoji: "🏆", explainer: "Find scholarships you can apply for" },
          { id: "grants", label: "Grant opportunities", emoji: "🎁", explainer: "Free money that doesn't need to be repaid" },
          { id: "work-study", label: "Work-study programs", emoji: "💼", explainer: "Part-time jobs for students" },
          { id: "state", label: "State aid programs", emoji: "🏛️", explainer: "Financial aid from your state" }
        ],
        timing: [
          { id: "early", label: "Start early", emoji: "🌅", explainer: "Begin researching as soon as possible", isDefault: true },
          { id: "1week", label: "1×/week", emoji: "📅", explainer: "Work on financial aid once per week" },
          { id: "deadline", label: "Before deadlines", emoji: "⏰", explainer: "Complete before application deadlines" }
        ],
        supports: [
          { id: "counselor", label: "Financial aid counselor", emoji: "👨‍💼", explainer: "Get help from school financial aid office", isDefault: true },
          { id: "websites", label: "Financial aid websites", emoji: "🌐", explainer: "Use official government and school resources" },
          { id: "calculator", label: "Cost calculator", emoji: "🧮", explainer: "Estimate costs and aid amounts" },
          { id: "family", label: "Family planning session", emoji: "👨‍👩‍👧‍👦", explainer: "Discuss finances with family" }
        ],
        smartTemplate: "💰 Explore {topic} {timing} from {start_date} to {due_date}."
      },
      {
        id: "visit-programs",
        title: "Visit Campuses / Programs",
        emoji: "🏫",
        explainer: "Check out schools and programs in person (or virtually)! Visiting helps you get a real feel for what a place is like.",
        purpose: [
          { id: "experience", label: "Get real experience", emoji: "👀", explainer: "See what the place is actually like", isDefault: true },
          { id: "decide", label: "Help make decision", emoji: "🎯", explainer: "Figure out if it's right for you" },
          { id: "questions", label: "Ask questions", emoji: "❓", explainer: "Get answers to things you're wondering about" },
          { id: "comfort", label: "Feel more comfortable", emoji: "😌", explainer: "Become familiar with the environment" }
        ],
        topic: [
          { id: "campus-tour", label: "Campus tour", emoji: "🚶", explainer: "Walk around and see the facilities", isDefault: true },
          { id: "virtual", label: "Virtual tour", emoji: "💻", explainer: "Online campus exploration" },
          { id: "info-session", label: "Information session", emoji: "📢", explainer: "Attend presentation about the program" },
          { id: "classes", label: "Sit in on classes", emoji: "🎓", explainer: "Experience what classes are like" },
          { id: "students", label: "Talk to current students", emoji: "👥", explainer: "Get student perspectives" }
        ],
        timing: [
          { id: "1month", label: "1 visit/month", emoji: "📅", explainer: "Visit one place per month", isDefault: true },
          { id: "2month", label: "2 visits/month", emoji: "📅", explainer: "Visit two places per month" },
          { id: "spring", label: "During spring", emoji: "🌸", explainer: "Visit when schools are in session" }
        ],
        supports: [
          { id: "schedule", label: "Schedule visits", emoji: "📅", explainer: "Plan and book tour appointments", isDefault: true },
          { id: "questions", label: "Prepare questions", emoji: "❓", explainer: "List what you want to know" },
          { id: "transportation", label: "Plan transportation", emoji: "🚗", explainer: "Figure out how to get there" },
          { id: "notes", label: "Take notes", emoji: "📝", explainer: "Remember what you liked/didn't like" }
        ],
        smartTemplate: "🏫 {activity} {timing} from {start_date} to {due_date}."
      }
    ]
  },
  {
    id: "social-skills",
    title: "Social Skills",
    emoji: "🗣️",
    description: "Connecting with people in your own comfortable way - even tiny interactions count",
    goals: [
      {
        id: "say-hi",
        title: "Say Hi",
        emoji: "👋",
        explainer: "The magic word that opens doors to friendships! Just a simple 'hi' can make someone's day and yours too.",
        purpose: [
          { id: "friends", label: "🤝 Make friends", emoji: "🤝", explainer: "Connect with people and build relationships", isDefault: true },
          { id: "practice", label: "🎓 Practice social skill", emoji: "🎓", explainer: "Build confidence in social situations" },
          { id: "work", label: "🏢 Use at work/school", emoji: "🏢", explainer: "Improve professional and academic interactions" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose for greeting people" }
        ],
        who: [
          { id: "friend", label: "Friend", emoji: "👤", explainer: "Greet someone you already know" },
          { id: "classmate", label: "Classmate", emoji: "🎓", explainer: "Say hi to someone from school", isDefault: true },
          { id: "neighbor", label: "Neighbor", emoji: "🏠", explainer: "Greet people in your neighborhood" },
          { id: "teacher", label: "Teacher", emoji: "👨‍🏫", explainer: "Greet instructors or authority figures" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Anyone else you want to greet" }
        ],
        how: [
          { id: "smile-wave-hi", label: "Smile + Wave + Say \"Hi.\"", emoji: "😊", explainer: "Complete friendly greeting", isDefault: true },
          { id: "just-hi", label: "Just say \"Hi\"", emoji: "👋", explainer: "Simple verbal greeting" },
          { id: "wave", label: "Just wave", emoji: "👋", explainer: "Non-verbal greeting" },
          { id: "other", label: "Other way", emoji: "➕", explainer: "Your own greeting style" }
        ],
        timing: [
          { id: "once", label: "Once", emoji: "1️⃣", explainer: "Greet someone once during the time period" },
          { id: "daily", label: "Daily", emoji: "📅", explainer: "Say hi to someone every day", isDefault: true },
          { id: "3week", label: "3× per week", emoji: "📅", explainer: "Greet people three times per week" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "script", label: "Social script card (\"Hi, how are you?\")", emoji: "📝", explainer: "Written reminder of what to say", isDefault: true },
          { id: "reminder", label: "Reminder before school", emoji: "🔔", explainer: "Prompt to remember to greet people" },
          { id: "practice", label: "Practice with family", emoji: "👨‍👩‍👧‍👦", explainer: "Role-play greetings at home" },
          { id: "reflection", label: "Reflection log", emoji: "📔", explainer: "Track how greetings go" }
        ],
        smartTemplate: "Say hi to 1 {who} every {timing}, from {start_date} until {due_date}."
      },
      {
        id: "eye-contact",
        title: "Eye Contact (3 Seconds)",
        emoji: "👀",
        explainer: "Looking someone in the eyes shows you're paying attention and care about what they're saying. Just 3 seconds makes a big difference!",
        purpose: [
          { id: "interest", label: "🧑‍🤝‍🧑 Show interest", emoji: "🧑‍🤝‍🧑", explainer: "Demonstrate that you care about the conversation", isDefault: true },
          { id: "interview", label: "🎓 Practice for interviews", emoji: "🎓", explainer: "Build skills for job or school interviews" },
          { id: "confidence", label: "😌 Build confidence", emoji: "😌", explainer: "Increase self-assurance in social situations" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose for practicing eye contact" }
        ],
        who: [
          { id: "mirror", label: "Mirror", emoji: "🪞", explainer: "Practice looking at yourself", isDefault: true },
          { id: "parent", label: "Parent", emoji: "👨‍👩‍👧‍👦", explainer: "Practice with a trusted family member" },
          { id: "friend", label: "Friend", emoji: "👤", explainer: "Practice with someone you know well" },
          { id: "teacher", label: "Teacher", emoji: "👨‍🏫", explainer: "Make eye contact during class" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Practice with someone else" }
        ],
        duration: [
          { id: "3sec", label: "3 seconds", emoji: "⏱️", explainer: "Look for about 3 seconds", isDefault: true },
          { id: "5sec", label: "5 seconds", emoji: "⏱️", explainer: "Hold eye contact for 5 seconds" },
          { id: "natural", label: "Natural length", emoji: "👁️", explainer: "As long as feels comfortable" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom duration" }
        ],
        timing: [
          { id: "once", label: "Once", emoji: "1️⃣", explainer: "Practice once during the time period" },
          { id: "twice", label: "Twice per day", emoji: "2️⃣", explainer: "Practice twice each day", isDefault: true },
          { id: "conversation", label: "During conversations", emoji: "💬", explainer: "Practice when talking with people" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom timing" }
        ],
        supports: [
          { id: "mirror", label: "Practice with mirror or supportive partner", emoji: "🪞", explainer: "Safe environment to practice", isDefault: true },
          { id: "log", label: "Reflection log (\"How did it feel?\")", emoji: "📔", explainer: "Track your progress and feelings" },
          { id: "reminder", label: "Gentle reminders", emoji: "🔔", explainer: "Prompts to remember to make eye contact" },
          { id: "breathing", label: "Calming breathing", emoji: "🫁", explainer: "Stay relaxed while practicing" }
        ],
        smartTemplate: "Practice {duration} eye contact with a {who} {timing}, from {start_date} until {due_date}."
      },
      {
        id: "text-how-are-you",
        title: "Text \"How are you?\"",
        emoji: "📱",
        explainer: "A simple text message that shows you care! It's an easy way to stay connected with people and let them know you're thinking of them.",
        purpose: [
          { id: "connected", label: "🤝 Stay connected", emoji: "🤝", explainer: "Maintain relationships with people you care about", isDefault: true },
          { id: "check", label: "🧑‍🤝‍🧑 Check on a friend", emoji: "🧑‍🤝‍🧑", explainer: "See how someone is doing" },
          { id: "practice", label: "🎓 Practice communication", emoji: "🎓", explainer: "Build your communication skills" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose for texting" }
        ],
        who: [
          { id: "friend", label: "Friend", emoji: "👤", explainer: "Text a friend you want to stay in touch with", isDefault: true },
          { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦", explainer: "Check in with a family member" },
          { id: "classmate", label: "Classmate", emoji: "🎓", explainer: "Reach out to someone from school" },
          { id: "teacher", label: "Teacher", emoji: "👨‍🏫", explainer: "Send appropriate message to instructor" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Text someone else important to you" }
        ],
        when: [
          { id: "after-school", label: "After school", emoji: "🏫", explainer: "Send message in the afternoon", isDefault: true },
          { id: "evening", label: "Evening", emoji: "🌙", explainer: "Text during evening hours" },
          { id: "weekend", label: "Weekend", emoji: "🌟", explainer: "Reach out during weekend" },
          { id: "other", label: "Other time", emoji: "⏰", explainer: "Choose your own timing" }
        ],
        timing: [
          { id: "once", label: "Once", emoji: "1️⃣", explainer: "Send one text during the time period" },
          { id: "twice", label: "Twice", emoji: "2️⃣", explainer: "Send two texts during the time period" },
          { id: "3week", label: "3× per week", emoji: "📅", explainer: "Text someone three times per week", isDefault: true },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "templates", label: "Message templates", emoji: "📝", explainer: "Examples of what to text", isDefault: true },
          { id: "starters", label: "Conversation starter list", emoji: "💬", explainer: "Ideas for starting conversations" },
          { id: "responses", label: "Response ideas", emoji: "💡", explainer: "How to reply to their messages" },
          { id: "timing", label: "Good timing reminders", emoji: "⏰", explainer: "When it's appropriate to text" }
        ],
        smartTemplate: "Text 'How are you?' to 1 {who} every {when}, {timing}, from {start_date} until {due_date}."
      },
      {
        id: "handshake-fist-pump",
        title: "Handshake / Fist Pump",
        emoji: "🤝",
        explainer: "A friendly way to greet people that shows respect and friendliness! Practice makes it feel natural and confident.",
        purpose: [
          { id: "interviews", label: "👔 Job interviews", emoji: "👔", explainer: "Professional greeting for work situations", isDefault: true },
          { id: "friends", label: "🤝 Greeting friends", emoji: "🤝", explainer: "Casual way to say hello to people you know" },
          { id: "confidence", label: "😌 Build confidence", emoji: "😌", explainer: "Feel more self-assured in social situations" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose for practicing greetings" }
        ],
        who: [
          { id: "parent", label: "Parent", emoji: "👨‍👩‍👧‍👦", explainer: "Practice with a family member" },
          { id: "friend", label: "Friend", emoji: "👤", explainer: "Practice with someone you know", isDefault: true },
          { id: "coach", label: "Coach", emoji: "🏃‍♂️", explainer: "Practice with a coach or mentor" },
          { id: "teacher", label: "Teacher", emoji: "👨‍🏫", explainer: "Practice with an instructor" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Practice with someone else" }
        ],
        how: [
          { id: "full", label: "Look person in the eye → Smile → Handshake or fist pump → Say \"Hi\"", emoji: "😊", explainer: "Complete professional greeting", isDefault: true },
          { id: "fist-only", label: "Fist pump only", emoji: "👊", explainer: "Simple fist bump greeting" },
          { id: "handshake-only", label: "Handshake only", emoji: "🤝", explainer: "Traditional handshake" },
          { id: "other", label: "Other way", emoji: "➕", explainer: "Your own greeting style" }
        ],
        timing: [
          { id: "1session", label: "Practice 1", emoji: "1️⃣", explainer: "One practice attempt per session" },
          { id: "2session", label: "Practice 2", emoji: "2️⃣", explainer: "Two practice attempts per session" },
          { id: "3session", label: "Practice 3 times per session", emoji: "3️⃣", explainer: "Three practice attempts per session", isDefault: true },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom number of practice attempts" }
        ],
        supports: [
          { id: "guide", label: "Step-by-step guide with images", emoji: "📸", explainer: "Visual instructions for proper technique", isDefault: true },
          { id: "practice", label: "Practice with parent/friend", emoji: "👥", explainer: "Safe environment to learn" },
          { id: "feedback", label: "Gentle feedback", emoji: "💬", explainer: "Tips for improvement" },
          { id: "confidence", label: "Confidence building", emoji: "💪", explainer: "Encouragement and positive reinforcement" }
        ],
        smartTemplate: "Practice handshake with a {who} {timing} each session, twice a week, from {start_date} until {due_date}."
      },
      {
        id: "give-compliment",
        title: "Give a Compliment",
        emoji: "😊",
        explainer: "Saying something nice to make someone else feel good! Compliments spread happiness and help build friendships.",
        purpose: [
          { id: "friends", label: "🤝 Make friends", emoji: "🤝", explainer: "Connect with people through kindness", isDefault: true },
          { id: "connections", label: "🧑‍🤝‍🧑 Build connections", emoji: "🧑‍🤝‍🧑", explainer: "Strengthen relationships with others" },
          { id: "kindness", label: "💕 Spread kindness", emoji: "💕", explainer: "Make the world a little brighter" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom purpose for giving compliments" }
        ],
        who: [
          { id: "friend", label: "Friend", emoji: "👤", explainer: "Compliment someone you already know" },
          { id: "classmate", label: "Classmate", emoji: "🎓", explainer: "Say something nice to someone from school", isDefault: true },
          { id: "teacher", label: "Teacher", emoji: "👨‍🏫", explainer: "Appreciate an instructor" },
          { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦", explainer: "Compliment a family member" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Compliment someone else" }
        ],
        what: [
          { id: "clothes", label: "Clothes", emoji: "👕", explainer: "\"I like your shirt!\" or similar", isDefault: true },
          { id: "effort", label: "Effort", emoji: "💪", explainer: "\"You worked really hard on that!\"" },
          { id: "skill", label: "Skill", emoji: "🎯", explainer: "\"You're really good at that!\"" },
          { id: "personality", label: "Personality", emoji: "😊", explainer: "\"You're so kind!\" or \"You're funny!\"" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Compliment something else" }
        ],
        timing: [
          { id: "1day", label: "1 compliment per day", emoji: "📅", explainer: "Give one compliment each day" },
          { id: "2week", label: "2× per week", emoji: "📅", explainer: "Give compliments twice per week", isDefault: true },
          { id: "3week", label: "3× per week", emoji: "📅", explainer: "Give compliments three times per week" },
          { id: "other", label: "Other", emoji: "➕", explainer: "Custom frequency" }
        ],
        supports: [
          { id: "list", label: "Compliment starter list", emoji: "📝", explainer: "Ideas for what to say", isDefault: true },
          { id: "log", label: "Reflection log (\"How did they react?\")", emoji: "📔", explainer: "Track how compliments are received" },
          { id: "practice", label: "Practice with family", emoji: "👨‍👩‍👧‍👦", explainer: "Try giving compliments at home first" },
          { id: "timing", label: "Good timing tips", emoji: "⏰", explainer: "When it's appropriate to give compliments" }
        ],
        smartTemplate: "Give 1 compliment to a {who} {timing}, from {start_date} until {due_date}."
      }
    ]
  }
];