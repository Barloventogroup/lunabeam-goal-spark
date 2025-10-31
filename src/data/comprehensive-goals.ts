// Comprehensive Goal Flow Data Structure
export interface GoalOption {
  id: string;
  text: string;
}

export interface GoalFlow {
  goal: string;
  options?: string[];
  custom_inputs?: string[];
  follow_ups?: string[];
  required_inputs?: string[];
  outputs?: string[];
  explainer?: string;
  details?: Record<string, any>;
}

export interface CategoryGoals {
  [key: string]: GoalFlow[];
}

export const COMPREHENSIVE_GOAL_FLOWS: CategoryGoals = {
  "Health & Well Being": [
    {
      "goal": "Walk",
      "options": ["10 minutes", "20 minutes", "30 minutes", "Custom"],
      "required_inputs": ["Days per week", "Duration", "End date"]
    },
    {
      "goal": "Stretch",
      "options": ["Morning", "Before bed", "After exercise", "Custom"],
      "required_inputs": ["Duration (minutes)", "Frequency", "End date"],
      "outputs": ["Stretch routine video"]
    },
    {
      "goal": "Better Sleep",
      "options": ["Set bedtime", "Limit screens", "Add calming routine", "Custom"],
      "required_inputs": ["Bedtime", "Wake time", "Target hours", "End date"],
      "outputs": ["Sleep hygiene tips", "Sleep log"]
    },
    {
      "goal": "Eat Healthier",
      "options": ["Eat 1 fruit daily", "Swap soda for water", "Add 1 veggie to lunch", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Shopping list", "Recipe ideas"]
    },
    {
      "goal": "Drink More Water",
      "options": ["4 cups/day", "6 cups/day", "8 cups/day", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Water reminders", "Hydration tracker"]
    }
  ],

  "Education - Academic Readiness": [
    {
      "goal": "Read Something",
      "options": ["Learn for school", "Relax/enjoy", "Practice focus"],
      "custom_inputs": ["What to read", "Amount"],
      "required_inputs": ["Format", "Amount", "Frequency", "Duration", "End date"],
      "outputs": ["Reading log", "List of suggested books/articles", "Reading reminders"],
      "explainer": "Reading means looking at words in a book, article, or online and understanding them. You can read for learning or fun."
    },
    {
      "goal": "Write Something", 
      "options": ["Practice writing skills", "Express feelings/journal", "Finish assignment", "Custom"],
      "custom_inputs": ["Topic", "Format type"],
      "required_inputs": ["Format", "Topic choice", "Duration", "Frequency", "End date"],
      "outputs": ["Writing prompt list", "Templates (letter, essay)", "Reflection log"],
      "explainer": "Writing means putting your ideas into words. It could be journaling, doing homework, or writing a letter or story."
    },
    {
      "goal": "Plan Week",
      "options": ["Stay on top of schoolwork", "Balance school, chores, fun", "Reduce stress", "Custom"],
      "custom_inputs": ["Planning tool preference", "Activities to include"],
      "required_inputs": ["Tool", "Items to plan", "Frequency", "Duration", "End date"],
      "outputs": ["Printable weekly planner", "Calendar sync", "Planning reminders"],
      "explainer": "Planning means writing down tasks and activities so you don't forget. It helps you organize school, chores, and free time."
    },
    {
      "goal": "Solve a Problem",
      "options": ["Practice math/logic", "Build thinking skills", "Solve real-life challenge", "Custom"],
      "custom_inputs": ["Problem type", "Specific problem"],
      "required_inputs": ["Type", "Amount", "Duration", "Frequency", "End date"],
      "outputs": ["Problem set bank", "Puzzle app suggestions", "Reflection log"],
      "explainer": "Solving problems means finding an answer to a challenge. It could be math, a puzzle, or figuring out a real-life situation."
    },
    {
      "goal": "Review Notes",
      "options": ["Prepare for test", "Remember lessons", "Custom"],
      "custom_inputs": ["Subject", "Review method"],
      "required_inputs": ["Method", "Duration", "Frequency", "End date"],
      "outputs": ["Flashcard template", "Highlighting guide", "Review reminders"],
      "explainer": "Reviewing notes means looking back at what you wrote in class to help remember. You can read, highlight, or use flashcards."
    },
    {
      "goal": "Study",
      "options": ["Prepare for test", "Improve grades", "Learn new things", "Custom"],
      "custom_inputs": ["Subject/topic", "Study method"],
      "required_inputs": ["Subject", "Method", "Duration", "Frequency", "End date"],
      "outputs": ["Study guide template", "Subject tips", "Study reminders"],
      "explainer": "Studying means focusing on school subjects to learn and remember. You can read, review, test yourself, or study with others."
    }
  ],

  "Employment": [
    {
      "goal": "Practice for Interview",
      "options": ["Mock interview", "Custom questions"],
      "custom_inputs": ["Target job/role"],
      "required_inputs": ["Frequency", "Duration per session", "End date"],
      "outputs": ["Interview Q&A set", "Feedback log"]
    },
    {
      "goal": "Create Resume",
      "custom_inputs": ["Education", "Work history", "Skills"],
      "required_inputs": ["End date"],
      "outputs": ["Resume draft (Word/PDF)"]
    },
    {
      "goal": "Update Resume",
      "custom_inputs": ["New jobs/skills"],
      "required_inputs": ["End date"],
      "outputs": ["Revised resume version"]
    },
    {
      "goal": "Send Thank-You Letter",
      "options": ["Email", "Printed"],
      "custom_inputs": ["Interviewer name", "Job applied for"],
      "required_inputs": ["End date"],
      "outputs": ["Thank-you template"]
    },
    {
      "goal": "Find Companies",
      "custom_inputs": ["Industry/role"],
      "required_inputs": ["End date"],
      "outputs": ["List of top companies hiring for selected jobs"]
    },
    {
      "goal": "Find People that Can Help",
      "options": ["Mentor", "Job coach", "Voc rehab", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Networking checklist", "Resource links"]
    }
  ],

  "Independent Living": [
    {
      "goal": "Make Bed",
      "options": ["Daily", "Custom schedule"],
      "required_inputs": ["End date"],
      "outputs": ["Step checklist"]
    },
    {
      "goal": "Set Table",
      "options": ["Breakfast", "Lunch", "Dinner"],
      "required_inputs": ["End date"],
      "outputs": ["Table setting checklist"]
    },
    {
      "goal": "Do Laundry",
      "options": ["Sort colors", "Wash", "Dry", "Fold", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Laundry steps guide"]
    },
    {
      "goal": "Cook",
      "options": ["Snack", "Breakfast", "Dinner", "Custom"],
      "custom_inputs": ["Recipe choice"],
      "required_inputs": ["Frequency", "End date"],
      "outputs": ["Recipe card", "Shopping list"]
    },
    {
      "goal": "Clean Area",
      "options": ["Desk", "Room", "Kitchen", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Cleaning checklist"]
    },
    {
      "goal": "Write Shopping List",
      "options": ["Food", "Toiletries", "Clothes", "Custom"],
      "custom_inputs": ["Custom items"],
      "required_inputs": ["End date"],
      "outputs": ["Printable list"]
    }
  ],

  "Social / Self-Advocacy": [
    {
      "goal": "Say Hi",
      "options": ["Family", "Friend", "Teacher", "Store clerk", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Greeting script"]
    },
    {
      "goal": "Eye Contact (3 Seconds)",
      "options": ["Roleplay", "Real-world"],
      "required_inputs": ["Frequency", "Duration per session", "End date"],
      "outputs": ["Progress tracker"]
    },
    {
      "goal": "Text \"How are you?\"",
      "custom_inputs": ["Recipient name"],
      "required_inputs": ["End date"],
      "outputs": ["Pre-filled message draft"]
    },
    {
      "goal": "Handshake / Fist Pump",
      "options": ["Handshake", "Fist bump"],
      "required_inputs": ["End date"],
      "outputs": ["Video demo"]
    },
    {
      "goal": "Give a Compliment",
      "options": ["Appearance", "Skill", "Effort", "Custom"],
      "required_inputs": ["Frequency", "End date"],
      "outputs": ["Compliment starters"]
    }
  ],

  "Postsecondary - Learning After High School": [
    {
      "goal": "Research Colleges/Programs",
      "options": ["4-yr college", "2-yr college", "Trade school", "Certificate"],
      "custom_inputs": ["Field of interest"],
      "required_inputs": ["End date"],
      "outputs": ["List of programs in chosen field"]
    },
    {
      "goal": "Prepare Application Materials",
      "options": ["Transcripts", "Essays", "Letters of recommendation", "Custom"],
      "custom_inputs": ["Application type"],
      "required_inputs": ["End date"],
      "outputs": ["Application checklist"]
    },
    {
      "goal": "Explore Financial Aid",
      "options": ["FAFSA", "Scholarships", "Grants", "Work-study"],
      "required_inputs": ["End date"],
      "outputs": ["Financial aid guide", "Application deadlines"]
    },
    {
      "goal": "Visit Campuses / Programs",
      "options": ["Tour", "Meet counselor", "Check dorms", "Attend classes"],
      "required_inputs": ["End date"],
      "outputs": ["Visit checklist"]
    },
    {
      "goal": "Look for Programs",
      "options": ["4-yr college", "2-yr college", "Trade school", "Certificate"],
      "custom_inputs": ["Field of interest"],
      "required_inputs": ["End date"],
      "outputs": ["List of programs in chosen field"]
    },
    {
      "goal": "Visit Disability Office Website",
      "required_inputs": ["End date"],
      "outputs": ["Checklist of questions to ask"]
    },
    {
      "goal": "Plan Campus Visit",
      "options": ["Tour", "Meet counselor", "Check dorms"],
      "required_inputs": ["End date"],
      "outputs": ["Visit checklist"]
    },
    {
      "goal": "Review Supports",
      "options": ["Tutoring", "Peer mentor", "Housing help", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Support plan summary"]
    }
  ],

  "Fun / Recreation": [
    {
      "goal": "Play a Sport/Game",
      "options": ["Basketball", "Soccer", "Board game", "Video game", "Custom"],
      "required_inputs": ["Frequency", "End date"],
      "outputs": ["Activity tracker"]
    },
    {
      "goal": "Do an Art or Craft",
      "options": ["Drawing", "Painting", "Crafting", "Digital art", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Project ideas", "Supply list"]
    },
    {
      "goal": "Listen to or Play Music",
      "options": ["Listen to music", "Play instrument", "Sing", "Create playlist"],
      "required_inputs": ["End date"],
      "outputs": ["Music suggestions", "Practice log"]
    },
    {
      "goal": "Read or Watch Something Fun",
      "options": ["Fiction book", "Comics", "Movies", "TV shows", "YouTube"],
      "required_inputs": ["End date"],
      "outputs": ["Recommendation list"]
    },
    {
      "goal": "Do a Fun Activity with Friends",
      "options": ["Hang out", "Go somewhere", "Play together", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Activity ideas"]
    },
    {
      "goal": "Play a Game",
      "options": ["Board game", "Card game", "Video game", "Sports game", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Game suggestions"]
    },
    {
      "goal": "Make Art",
      "options": ["Drawing", "Painting", "Sculpture", "Digital art", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Art project ideas", "Tutorial links"]
    },
    {
      "goal": "Watch a Movie or Show",
      "options": ["Movie", "TV series", "Documentary", "YouTube", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Viewing recommendations"]
    },
    {
      "goal": "Build Something",
      "options": ["LEGO", "Model", "Craft project", "Code project", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Building instructions", "Project ideas"]
    },
    {
      "goal": "Do a Sport",
      "options": ["Basketball", "Soccer", "Running", "Swimming", "Custom"],
      "required_inputs": ["Frequency", "End date"],
      "outputs": ["Exercise tracker"]
    },
    {
      "goal": "Take a Photo or Video",
      "options": ["Nature", "People", "Art", "Memories", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Photography tips", "Editing suggestions"]
    }
  ]
};

// Helper function to get goals for a category
export const getGoalsForCategory = (category: string): GoalFlow[] => {
  const categoryKey = Object.keys(COMPREHENSIVE_GOAL_FLOWS).find(
    key => key.toLowerCase().replace(/\s+/g, '_') === category.toLowerCase().replace(/\s+/g, '_')
  );
  return categoryKey ? COMPREHENSIVE_GOAL_FLOWS[categoryKey] : [];
};

// Helper function to normalize category names
export const normalizeCategoryName = (category: string): string => {
  const mapping: Record<string, string> = {
    'health': 'Health & Well Being',
    'education': 'Education - Academic Readiness',
    'employment': 'Employment',
    'independent_living': 'Independent Living',
    'social_skills': 'Social / Self-Advocacy',
    'postsecondary': 'Postsecondary - Learning After High School',
    'fun_recreation': 'Fun / Recreation'
  };
  return mapping[category] || category;
};