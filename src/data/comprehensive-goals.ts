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
  outputs?: string[];
}

export interface CategoryGoals {
  [key: string]: GoalFlow[];
}

export const COMPREHENSIVE_GOAL_FLOWS: CategoryGoals = {
  "Health": [
    {
      "goal": "Walk",
      "options": ["10 minutes", "20 minutes", "30 minutes", "Custom"],
      "follow_ups": ["Days per week"]
    },
    {
      "goal": "Eat healthier",
      "options": ["Eat 1 fruit daily", "Swap soda for water", "Add 1 veggie to lunch", "Custom"],
      "outputs": ["Shopping list", "Recipe ideas"]
    },
    {
      "goal": "Better sleep",
      "options": ["Set bedtime", "Limit screens", "Add calming routine", "Custom"],
      "custom_inputs": ["Bedtime", "Wake time", "Target hours"],
      "outputs": ["Sleep hygiene tips", "Sleep log"]
    },
    {
      "goal": "Drink more water",
      "options": ["4 cups/day", "6 cups/day", "8 cups/day", "Custom"],
      "follow_ups": ["Start date", "End date"],
      "outputs": ["Water reminders", "Hydration tracker"]
    },
    {
      "goal": "Stretch",
      "options": ["Morning", "Before bed", "After exercise", "Custom"],
      "custom_inputs": ["Duration (minutes)"],
      "outputs": ["Stretch routine video"]
    }
  ],

  "Education": [
    {
      "goal": "Read something",
      "options": ["Book", "Article/blog", "Magazine", "Comic/graphic novel", "Custom"],
      "custom_inputs": ["Title", "Topic", "Source"],
      "follow_ups": ["How much?", "Frequency"],
      "outputs": ["Reading log", "Suggested reading list"]
    },
    {
      "goal": "Write something",
      "options": ["Journal", "Poem", "Essay", "Letter", "Text/email", "Custom"],
      "custom_inputs": ["Topic", "Recipient"],
      "outputs": ["Writing template", "Starter prompt"]
    },
    {
      "goal": "Plan week",
      "options": ["Paper planner", "Digital calendar", "Visual schedule", "Custom"],
      "custom_inputs": ["List of activities"],
      "outputs": ["Weekly plan (printable or digital)"]
    },
    {
      "goal": "Solve a problem",
      "options": ["Math", "Logic puzzle", "Real-life", "Custom"],
      "custom_inputs": ["Problem description"],
      "outputs": ["Strategy hints", "Practice resource"]
    },
    {
      "goal": "Review notes",
      "options": ["Highlight", "Flashcards", "Rewrite", "Custom"],
      "outputs": ["Auto-generated flashcard set"]
    },
    {
      "goal": "Study",
      "options": ["15 minutes", "30 minutes", "45 minutes", "Custom"],
      "custom_inputs": ["Subject/topic"],
      "outputs": ["Study guide template"]
    }
  ],

  "Employment": [
    {
      "goal": "Practice for interview",
      "options": ["Mock interview", "Custom questions"],
      "custom_inputs": ["Target job/role"],
      "outputs": ["Interview Q&A set", "Feedback log"]
    },
    {
      "goal": "Create resume",
      "custom_inputs": ["Education", "Work history", "Skills"],
      "outputs": ["Resume draft (Word/PDF)"]
    },
    {
      "goal": "Update resume",
      "custom_inputs": ["New jobs/skills"],
      "outputs": ["Revised resume version"]
    },
    {
      "goal": "Send thank-you letter",
      "options": ["Email", "Printed"],
      "custom_inputs": ["Interviewer name", "Job applied for"],
      "outputs": ["Thank-you template"]
    },
    {
      "goal": "Find companies",
      "custom_inputs": ["Industry/role"],
      "outputs": ["List of top companies hiring for selected jobs"]
    },
    {
      "goal": "Find people that can help",
      "options": ["Mentor", "Job coach", "Voc rehab", "Custom"],
      "outputs": ["Networking checklist", "Resource links"]
    }
  ],

  "Independent Living": [
    {
      "goal": "Make bed",
      "options": ["Daily", "Custom schedule"],
      "outputs": ["Step checklist"]
    },
    {
      "goal": "Set table",
      "options": ["Breakfast", "Lunch", "Dinner"],
      "outputs": ["Table setting checklist"]
    },
    {
      "goal": "Do laundry",
      "options": ["Sort colors", "Wash", "Dry", "Fold", "Custom"],
      "outputs": ["Laundry steps guide"]
    },
    {
      "goal": "Cook",
      "options": ["Snack", "Breakfast", "Dinner", "Custom"],
      "custom_inputs": ["Recipe choice"],
      "outputs": ["Recipe card", "Shopping list"]
    },
    {
      "goal": "Clean area",
      "options": ["Desk", "Room", "Kitchen", "Custom"],
      "outputs": ["Cleaning checklist"]
    },
    {
      "goal": "Write shopping list",
      "options": ["Food", "Toiletries", "Clothes", "Custom"],
      "custom_inputs": ["Custom items"],
      "outputs": ["Printable list"]
    }
  ],

  "Social Skills": [
    {
      "goal": "Say hi",
      "options": ["Family", "Friend", "Teacher", "Store clerk", "Custom"],
      "outputs": ["Greeting script"]
    },
    {
      "goal": "Eye contact (3s)",
      "options": ["Roleplay", "Real-world"],
      "outputs": ["Progress tracker"]
    },
    {
      "goal": "Text 'how are you?'",
      "custom_inputs": ["Recipient name"],
      "outputs": ["Pre-filled message draft"]
    },
    {
      "goal": "Handshake/fist bump",
      "options": ["Handshake", "Fist bump"],
      "outputs": ["Video demo"]
    },
    {
      "goal": "Compliment",
      "options": ["Appearance", "Skill", "Effort", "Custom"],
      "outputs": ["Compliment starters"]
    }
  ],

  "Housing": [
    {
      "goal": "Browse housing options",
      "options": ["Apartment", "Shared house", "Dorm", "Custom"],
      "outputs": ["Housing search checklist", "Links"]
    },
    {
      "goal": "List wants/needs",
      "options": ["Near bus", "Safe area", "Private room", "Custom"],
      "custom_inputs": ["Custom needs"],
      "outputs": ["Prioritized housing list"]
    },
    {
      "goal": "Call housing office",
      "outputs": ["Phone script"]
    },
    {
      "goal": "Read funding info",
      "outputs": ["Summary of subsidies/programs"]
    },
    {
      "goal": "Gather 1 doc",
      "options": ["ID", "Income proof", "Reference", "Custom"],
      "outputs": ["Document checklist"]
    },
    {
      "goal": "Explore area",
      "options": ["Check safety", "Visit stores", "Check transport"],
      "outputs": ["Local resource map"]
    }
  ],

  "Postsecondary": [
    {
      "goal": "Look for programs",
      "options": ["4-yr college", "2-yr college", "Trade school", "Certificate"],
      "custom_inputs": ["Field of interest"],
      "outputs": ["List of programs in chosen field"]
    },
    {
      "goal": "Visit disability office site",
      "outputs": ["Checklist of questions to ask"]
    },
    {
      "goal": "Plan campus visit",
      "options": ["Tour", "Meet counselor", "Check dorms"],
      "outputs": ["Visit checklist"]
    },
    {
      "goal": "Review supports",
      "options": ["Tutoring", "Peer mentor", "Housing help", "Custom"],
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