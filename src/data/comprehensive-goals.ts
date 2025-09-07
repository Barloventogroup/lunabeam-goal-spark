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
  "Health": [
    {
      "goal": "Walk",
      "options": ["10 minutes", "20 minutes", "30 minutes", "Custom"],
      "required_inputs": ["Days per week", "Duration", "End date"]
    },
    {
      "goal": "Eat healthier",
      "options": ["Eat 1 fruit daily", "Swap soda for water", "Add 1 veggie to lunch", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Shopping list", "Recipe ideas"]
    },
    {
      "goal": "Better sleep",
      "options": ["Set bedtime", "Limit screens", "Add calming routine", "Custom"],
      "required_inputs": ["Bedtime", "Wake time", "Target hours", "End date"],
      "outputs": ["Sleep hygiene tips", "Sleep log"]
    },
    {
      "goal": "Drink more water",
      "options": ["4 cups/day", "6 cups/day", "8 cups/day", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Water reminders", "Hydration tracker"]
    },
    {
      "goal": "Stretch",
      "options": ["Morning", "Before bed", "After exercise", "Custom"],
      "required_inputs": ["Duration (minutes)", "Frequency", "End date"],
      "outputs": ["Stretch routine video"]
    }
  ],

  "Education": [
    {
      "goal": "Read something",
      "options": ["Learn for school", "Relax/enjoy", "Practice focus", "Custom"],
      "custom_inputs": ["What to read", "Amount (pages/minutes)"],
      "required_inputs": ["Format", "Amount", "Frequency", "Duration", "End date"],
      "outputs": ["Reading log", "List of suggested books/articles", "Reading reminders"],
      "explainer": "Reading means looking at words in a book, article, or online and understanding them. You can read for learning or fun.",
      "details": {
        "format_options": ["Textbook", "Article", "Comic", "Blog", "Custom"],
        "amount_options": ["1 page", "5 pages", "10 pages", "5 minutes", "10 minutes", "15 minutes"],
        "frequency_options": ["Daily", "3× per week"],
        "duration_options": ["2 weeks", "3 weeks", "4 weeks"],
        "default_suggestion": "Read 1 page today"
      }
    },
    {
      "goal": "Write something", 
      "options": ["Practice writing skills", "Express feelings/journal", "Finish assignment", "Custom"],
      "custom_inputs": ["Topic", "Format type"],
      "required_inputs": ["Format", "Topic choice", "Duration", "Frequency", "End date"],
      "outputs": ["Writing prompt list", "Templates (letter, essay)", "Reflection log"],
      "explainer": "Writing means putting your ideas into words. It could be journaling, doing homework, or writing a letter or story.",
      "details": {
        "format_options": ["Journal", "Paragraph", "Letter", "Essay", "Story"],
        "topic_options": ["Free choice", "School assignment"],
        "duration_options": ["10 minutes", "15 minutes", "20 minutes"],
        "frequency_options": ["Daily", "3× per week"],
        "weeks_options": ["2 weeks", "3 weeks", "4 weeks"],
        "default_suggestion": "Write 2 sentences today"
      }
    },
    {
      "goal": "Plan week",
      "options": ["Stay on top of schoolwork", "Balance school, chores, fun", "Reduce stress", "Custom"],
      "custom_inputs": ["Planning tool preference", "Activities to include"],
      "required_inputs": ["Tool", "Items to plan", "Frequency", "Duration", "End date"],
      "outputs": ["Printable weekly planner", "Calendar sync", "Planning reminders"],
      "explainer": "Planning means writing down tasks and activities so you don't forget. It helps you organize school, chores, and free time.",
      "details": {
        "tool_options": ["Paper planner", "Digital calendar"],
        "items_options": ["Homework, chores, 1 fun activity"],
        "frequency_options": ["Sunday evening", "Monday evening"],
        "duration_options": ["15-20 minutes"],
        "weeks_options": ["2 weeks", "3 weeks", "4 weeks"],
        "default_suggestion": "Write 3 tasks for tomorrow"
      }
    },
    {
      "goal": "Solve a problem",
      "options": ["Practice math/logic", "Build thinking skills", "Solve real-life challenge", "Custom"],
      "custom_inputs": ["Problem type", "Specific problem"],
      "required_inputs": ["Type", "Amount", "Duration", "Frequency", "End date"],
      "outputs": ["Problem set bank", "Puzzle app suggestions", "Reflection log"],
      "explainer": "Solving problems means finding an answer to a challenge. It could be math, a puzzle, or figuring out a real-life situation.",
      "details": {
        "type_options": ["Math", "Puzzle", "Real-life"],
        "amount_options": ["1 problem", "2 problems"],
        "duration_options": ["10 minutes", "15 minutes", "20 minutes"],
        "frequency_options": ["Daily", "3× per week"],
        "weeks_options": ["2 weeks", "3 weeks", "4 weeks"],
        "default_suggestion": "Solve 1 problem today"
      }
    },
    {
      "goal": "Review notes",
      "options": ["Prepare for test", "Remember lessons", "Custom"],
      "custom_inputs": ["Subject", "Review method"],
      "required_inputs": ["Method", "Duration", "Frequency", "End date"],
      "outputs": ["Flashcard template", "Highlighting guide", "Review reminders"],
      "explainer": "Reviewing notes means looking back at what you wrote in class to help remember. You can read, highlight, or use flashcards.",
      "details": {
        "method_options": ["Flashcards", "Rewriting", "Highlighting"],
        "duration_options": ["15 minutes", "20 minutes"],
        "frequency_options": ["Daily", "3× before test"],
        "weeks_options": ["2 weeks", "3 weeks"],
        "default_suggestion": "Review 1 page tonight"
      }
    },
    {
      "goal": "Study",
      "options": ["Prepare for test", "Improve grades", "Learn new things", "Custom"],
      "custom_inputs": ["Subject/topic", "Study method"],
      "required_inputs": ["Subject", "Method", "Duration", "Frequency", "End date"],
      "outputs": ["Study guide template", "Subject tips", "Study reminders"],
      "explainer": "Studying means focusing on school subjects to learn and remember. You can read, review, test yourself, or study with others.",
      "details": {
        "subject_options": ["Math", "English", "Science", "Custom"],
        "method_options": ["Flashcards", "Practice test", "Group study"],
        "duration_options": ["15 minutes", "30 minutes", "45 minutes"],
        "frequency_options": ["Daily", "3× per week"],
        "duration_period_options": ["2 weeks", "3 weeks", "Until test date"],
        "default_suggestion": "Study 10 minutes today"
      }
    }
  ],

  "Employment": [
    {
      "goal": "Practice for interview",
      "options": ["Mock interview", "Custom questions"],
      "custom_inputs": ["Target job/role"],
      "required_inputs": ["Frequency", "Duration per session", "End date"],
      "outputs": ["Interview Q&A set", "Feedback log"]
    },
    {
      "goal": "Create resume",
      "custom_inputs": ["Education", "Work history", "Skills"],
      "required_inputs": ["End date"],
      "outputs": ["Resume draft (Word/PDF)"]
    },
    {
      "goal": "Update resume",
      "custom_inputs": ["New jobs/skills"],
      "required_inputs": ["End date"],
      "outputs": ["Revised resume version"]
    },
    {
      "goal": "Send thank-you letter",
      "options": ["Email", "Printed"],
      "custom_inputs": ["Interviewer name", "Job applied for"],
      "required_inputs": ["End date"],
      "outputs": ["Thank-you template"]
    },
    {
      "goal": "Find companies",
      "custom_inputs": ["Industry/role"],
      "required_inputs": ["End date"],
      "outputs": ["List of top companies hiring for selected jobs"]
    },
    {
      "goal": "Find people that can help",
      "options": ["Mentor", "Job coach", "Voc rehab", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Networking checklist", "Resource links"]
    }
  ],

  "Independent Living": [
    {
      "goal": "Make bed",
      "options": ["Daily", "Custom schedule"],
      "required_inputs": ["End date"],
      "outputs": ["Step checklist"]
    },
    {
      "goal": "Set table",
      "options": ["Breakfast", "Lunch", "Dinner"],
      "required_inputs": ["End date"],
      "outputs": ["Table setting checklist"]
    },
    {
      "goal": "Do laundry",
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
      "goal": "Clean area",
      "options": ["Desk", "Room", "Kitchen", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Cleaning checklist"]
    },
    {
      "goal": "Write shopping list",
      "options": ["Food", "Toiletries", "Clothes", "Custom"],
      "custom_inputs": ["Custom items"],
      "required_inputs": ["End date"],
      "outputs": ["Printable list"]
    }
  ],

  "Social Skills": [
    {
      "goal": "Say hi",
      "options": ["Family", "Friend", "Teacher", "Store clerk", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Greeting script"]
    },
    {
      "goal": "Eye contact (3s)",
      "options": ["Roleplay", "Real-world"],
      "required_inputs": ["Frequency", "Duration per session", "End date"],
      "outputs": ["Progress tracker"]
    },
    {
      "goal": "Text 'how are you?'",
      "custom_inputs": ["Recipient name"],
      "required_inputs": ["End date"],
      "outputs": ["Pre-filled message draft"]
    },
    {
      "goal": "Handshake/fist bump",
      "options": ["Handshake", "Fist bump"],
      "required_inputs": ["End date"],
      "outputs": ["Video demo"]
    },
    {
      "goal": "Compliment",
      "options": ["Appearance", "Skill", "Effort", "Custom"],
      "required_inputs": ["Frequency", "End date"],
      "outputs": ["Compliment starters"]
    }
  ],

  "Housing": [
    {
      "goal": "Browse housing options",
      "options": ["Apartment", "Shared house", "Dorm", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Housing search checklist", "Links"]
    },
    {
      "goal": "List wants/needs",
      "options": ["Near bus", "Safe area", "Private room", "Custom"],
      "custom_inputs": ["Custom needs"],
      "required_inputs": ["End date"],
      "outputs": ["Prioritized housing list"]
    },
    {
      "goal": "Call housing office",
      "required_inputs": ["End date"],
      "outputs": ["Phone script"]
    },
    {
      "goal": "Read funding info",
      "required_inputs": ["End date"],
      "outputs": ["Summary of subsidies/programs"]
    },
    {
      "goal": "Gather 1 doc",
      "options": ["ID", "Income proof", "Reference", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Document checklist"]
    },
    {
      "goal": "Explore area",
      "options": ["Check safety", "Visit stores", "Check transport"],
      "required_inputs": ["End date"],
      "outputs": ["Local resource map"]
    }
  ],

  "Postsecondary": [
    {
      "goal": "Look for programs",
      "options": ["4-yr college", "2-yr college", "Trade school", "Certificate"],
      "custom_inputs": ["Field of interest"],
      "required_inputs": ["End date"],
      "outputs": ["List of programs in chosen field"]
    },
    {
      "goal": "Visit disability office site",
      "required_inputs": ["End date"],
      "outputs": ["Checklist of questions to ask"]
    },
    {
      "goal": "Plan campus visit",
      "options": ["Tour", "Meet counselor", "Check dorms"],
      "required_inputs": ["End date"],
      "outputs": ["Visit checklist"]
    },
    {
      "goal": "Review supports",
      "options": ["Tutoring", "Peer mentor", "Housing help", "Custom"],
      "required_inputs": ["End date"],
      "outputs": ["Support plan summary"]
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
    'health': 'Health',
    'education': 'Education', 
    'employment': 'Employment',
    'independent_living': 'Independent Living',
    'social_skills': 'Social Skills',
    'housing': 'Housing',
    'postsecondary': 'Postsecondary'
  };
  return mapping[category] || category;
};