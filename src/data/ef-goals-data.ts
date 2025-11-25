
export interface ExampleGoal {
    id: string;
    title: string;
    description: string;
    suggestedType: 'reminder' | 'progressive_mastery' | 'practice' | 'new_skill';
    categoryId: string;
    efTags: string[];
}

export const efGoals: ExampleGoal[] = [
    // --- HEALTH & WELL BEING ---
    // Initiation
    { id: 'h-init-1', title: 'Start a daily walking routine', description: 'Build a consistent habit of walking for health and energy.', suggestedType: 'reminder', categoryId: 'health', efTags: ['initiation'] },
    { id: 'h-init-2', title: 'Begin a hydration habit', description: 'Develop the routine of drinking enough water throughout the day.', suggestedType: 'reminder', categoryId: 'health', efTags: ['initiation'] },
    { id: 'h-init-3', title: 'Start a movement break routine', description: 'Create a habit of regular movement throughout the day.', suggestedType: 'reminder', categoryId: 'health', efTags: ['initiation'] },
    // Planning/Org
    { id: 'h-plan-1', title: 'Plan and prep healthy meals', description: 'Organize weekly meal planning and preparation.', suggestedType: 'progressive_mastery', categoryId: 'health', efTags: ['planning_organization'] },
    { id: 'h-plan-2', title: 'Create a consistent workout schedule', description: 'Establish and maintain a regular exercise routine.', suggestedType: 'reminder', categoryId: 'health', efTags: ['planning_organization'] },
    { id: 'h-plan-3', title: 'Manage health appointments', description: 'Keep track of and attend necessary medical check-ups.', suggestedType: 'new_skill', categoryId: 'health', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'h-att-1', title: 'Monitor daily water intake', description: 'Stay aware of hydration throughout the day.', suggestedType: 'reminder', categoryId: 'health', efTags: ['attention_memory'] },
    { id: 'h-att-2', title: 'Practice mindful eating', description: 'Develop awareness and focus during meals.', suggestedType: 'practice', categoryId: 'health', efTags: ['attention_memory'] },
    { id: 'h-att-3', title: 'Maintain medication routine', description: 'Remember and take medications as prescribed.', suggestedType: 'reminder', categoryId: 'health', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'h-emo-1', title: 'Practice deep breathing', description: 'Use breathing techniques to manage stress and anxiety.', suggestedType: 'practice', categoryId: 'health', efTags: ['emotional_regulation'] },
    { id: 'h-emo-2', title: 'Journal feelings after workout', description: 'Reflect on the emotional benefits of exercise.', suggestedType: 'practice', categoryId: 'health', efTags: ['emotional_regulation'] },
    { id: 'h-emo-3', title: 'Build positive self-image', description: 'Develop a healthier relationship with your body.', suggestedType: 'reminder', categoryId: 'health', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'h-flex-1', title: 'Expand food variety', description: 'Try new healthy foods to diversify your diet.', suggestedType: 'new_skill', categoryId: 'health', efTags: ['flexibility'] },
    { id: 'h-flex-2', title: 'Vary workout activities', description: 'Mix different types of exercise into your routine.', suggestedType: 'practice', categoryId: 'health', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'h-adv-1', title: 'Ask for fitness support', description: 'Request help or guidance when exercising.', suggestedType: 'practice', categoryId: 'health', efTags: ['self_advocacy'] },
    { id: 'h-adv-2', title: 'Communicate health concerns', description: 'Clearly express symptoms and needs to healthcare providers.', suggestedType: 'progressive_mastery', categoryId: 'health', efTags: ['self_advocacy'] },

    // --- EDUCATION ---
    // Initiation
    { id: 'ed-init-1', title: 'Read assigned book for class', description: 'Complete the reading assignment for English class.', suggestedType: 'reminder', categoryId: 'education', efTags: ['initiation'] },
    { id: 'ed-init-2', title: 'Start homework assignments', description: 'Begin working on daily homework without delay.', suggestedType: 'reminder', categoryId: 'education', efTags: ['initiation'] },
    { id: 'ed-init-3', title: 'Check and respond to school emails', description: 'Stay on top of school communications.', suggestedType: 'reminder', categoryId: 'education', efTags: ['initiation'] },
    // Planning/Org
    { id: 'ed-plan-1', title: 'Maintain homework planner', description: 'Track all assignments and due dates consistently.', suggestedType: 'reminder', categoryId: 'education', efTags: ['planning_organization'] },
    { id: 'ed-plan-2', title: 'Complete long-term project', description: 'Break down and finish a multi-week assignment.', suggestedType: 'progressive_mastery', categoryId: 'education', efTags: ['planning_organization'] },
    { id: 'ed-plan-3', title: 'Organize school materials', description: 'Keep backpack, binder, and supplies in order.', suggestedType: 'reminder', categoryId: 'education', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'ed-att-1', title: 'Build focused study habit', description: 'Develop ability to study without distractions.', suggestedType: 'practice', categoryId: 'education', efTags: ['attention_memory'] },
    { id: 'ed-att-2', title: 'Master key vocabulary', description: 'Learn and retain important terms for class.', suggestedType: 'practice', categoryId: 'education', efTags: ['attention_memory'] },
    { id: 'ed-att-3', title: 'Improve reading comprehension', description: 'Actively engage with and understand texts.', suggestedType: 'practice', categoryId: 'education', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'ed-emo-1', title: 'Manage homework frustration', description: 'Stay calm when schoolwork feels difficult.', suggestedType: 'practice', categoryId: 'education', efTags: ['emotional_regulation'] },
    { id: 'ed-emo-2', title: 'Ask for academic help', description: 'Seek support without feeling embarrassed.', suggestedType: 'progressive_mastery', categoryId: 'education', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'ed-flex-1', title: 'Adapt study strategies', description: 'Try different approaches when one isn\'t working.', suggestedType: 'practice', categoryId: 'education', efTags: ['flexibility'] },
    { id: 'ed-flex-2', title: 'Switch between subjects', description: 'Move between different topics when stuck.', suggestedType: 'new_skill', categoryId: 'education', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'ed-adv-1', title: 'Communicate with teachers', description: 'Reach out to teachers with questions or concerns.', suggestedType: 'new_skill', categoryId: 'education', efTags: ['self_advocacy'] },
    { id: 'ed-adv-2', title: 'Request accommodations', description: 'Ask for needed supports in the classroom.', suggestedType: 'progressive_mastery', categoryId: 'education', efTags: ['self_advocacy'] },

    // --- EMPLOYMENT ---
    // Initiation
    { id: 'emp-init-1', title: 'Begin job search', description: 'Start actively looking for employment opportunities.', suggestedType: 'reminder', categoryId: 'employment', efTags: ['initiation'] },
    { id: 'emp-init-2', title: 'Apply to job postings', description: 'Submit applications to positions of interest.', suggestedType: 'reminder', categoryId: 'employment', efTags: ['initiation'] },
    // Planning/Org
    { id: 'emp-plan-1', title: 'Update professional resume', description: 'Keep resume current with latest experience and skills.', suggestedType: 'reminder', categoryId: 'employment', efTags: ['planning_organization'] },
    { id: 'emp-plan-2', title: 'Build job application materials', description: 'Create complete set of application documents.', suggestedType: 'practice', categoryId: 'employment', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'emp-att-1', title: 'Review and polish resume', description: 'Carefully check all application materials for errors.', suggestedType: 'practice', categoryId: 'employment', efTags: ['attention_memory'] },
    { id: 'emp-att-2', title: 'Stay engaged in meetings', description: 'Maintain focus during work discussions.', suggestedType: 'practice', categoryId: 'employment', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'emp-emo-1', title: 'Manage interview anxiety', description: 'Stay calm and confident during job interviews.', suggestedType: 'practice', categoryId: 'employment', efTags: ['emotional_regulation'] },
    { id: 'emp-emo-2', title: 'Handle workplace feedback', description: 'Receive constructive criticism professionally.', suggestedType: 'progressive_mastery', categoryId: 'employment', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'emp-flex-1', title: 'Take on new responsibilities', description: 'Adapt to changing job duties.', suggestedType: 'new_skill', categoryId: 'employment', efTags: ['flexibility'] },
    { id: 'emp-flex-2', title: 'Adjust to schedule changes', description: 'Handle shifts in work hours or routines.', suggestedType: 'practice', categoryId: 'employment', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'emp-adv-1', title: 'Clarify job expectations', description: 'Ask questions to understand your role clearly.', suggestedType: 'practice', categoryId: 'employment', efTags: ['self_advocacy'] },
    { id: 'emp-adv-2', title: 'Negotiate employment terms', description: 'Discuss pay, hours, or conditions with employer.', suggestedType: 'progressive_mastery', categoryId: 'employment', efTags: ['self_advocacy'] },

    // --- INDEPENDENT LIVING ---
    // Initiation
    { id: 'il-init-1', title: 'Establish dish-washing routine', description: 'Build the habit of cleaning dishes regularly.', suggestedType: 'reminder', categoryId: 'independent_living', efTags: ['initiation'] },
    { id: 'il-init-2', title: 'Maintain trash removal habit', description: 'Consistently take out garbage when needed.', suggestedType: 'reminder', categoryId: 'independent_living', efTags: ['initiation'] },
    // Planning/Org
    { id: 'il-plan-1', title: 'Plan weekly grocery shopping', description: 'Organize shopping list and store visits.', suggestedType: 'reminder', categoryId: 'independent_living', efTags: ['planning_organization'] },
    { id: 'il-plan-2', title: 'Manage laundry routine', description: 'Keep clothes clean and organized.', suggestedType: 'practice', categoryId: 'independent_living', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'il-att-1', title: 'Remember kitchen safety', description: 'Check appliances and locks before leaving.', suggestedType: 'reminder', categoryId: 'independent_living', efTags: ['attention_memory'] },
    { id: 'il-att-2', title: 'Keep track of personal items', description: 'Remember where keys, wallet, and phone are.', suggestedType: 'reminder', categoryId: 'independent_living', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'il-emo-1', title: 'Make chores enjoyable', description: 'Find ways to reduce stress during household tasks.', suggestedType: 'practice', categoryId: 'independent_living', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'il-flex-1', title: 'Cook with available ingredients', description: 'Adapt recipes based on what you have.', suggestedType: 'new_skill', categoryId: 'independent_living', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'il-adv-1', title: 'Report home maintenance issues', description: 'Contact landlord or service providers about problems.', suggestedType: 'new_skill', categoryId: 'independent_living', efTags: ['self_advocacy'] },

    // --- SOCIAL SKILLS ---
    // Initiation
    { id: 'soc-init-1', title: 'Reach out to friends', description: 'Initiate contact with people you care about.', suggestedType: 'reminder', categoryId: 'social_skills', efTags: ['initiation'] },
    { id: 'soc-init-2', title: 'Start conversations', description: 'Practice initiating social interactions.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['initiation'] },
    // Planning/Org
    { id: 'soc-plan-1', title: 'Organize social activities', description: 'Plan and coordinate time with friends.', suggestedType: 'progressive_mastery', categoryId: 'social_skills', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'soc-att-1', title: 'Practice active listening', description: 'Focus fully on what others are saying.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['attention_memory'] },
    { id: 'soc-att-2', title: 'Remember people\'s names', description: 'Improve recall of names in social settings.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'soc-emo-1', title: 'Manage social overwhelm', description: 'Recognize and respond to feeling overstimulated.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['emotional_regulation'] },
    { id: 'soc-emo-2', title: 'Express feelings appropriately', description: 'Communicate emotions in healthy ways.', suggestedType: 'progressive_mastery', categoryId: 'social_skills', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'soc-flex-1', title: 'Compromise in group decisions', description: 'Be flexible when making plans with others.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'soc-adv-1', title: 'Set social boundaries', description: 'Politely decline when you need personal time.', suggestedType: 'practice', categoryId: 'social_skills', efTags: ['self_advocacy'] },
    { id: 'soc-adv-2', title: 'Share your perspective', description: 'Speak up and contribute your ideas.', suggestedType: 'progressive_mastery', categoryId: 'social_skills', efTags: ['self_advocacy'] },

    // --- POSTSECONDARY ---
    // Initiation
    { id: 'ps-init-1', title: 'Research college programs', description: 'Explore postsecondary education options.', suggestedType: 'reminder', categoryId: 'postsecondary', efTags: ['initiation'] },
    // Planning/Org
    { id: 'ps-plan-1', title: 'Track application deadlines', description: 'Keep organized calendar of important dates.', suggestedType: 'reminder', categoryId: 'postsecondary', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'ps-att-1', title: 'Review program requirements', description: 'Understand what each school or program needs.', suggestedType: 'practice', categoryId: 'postsecondary', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'ps-emo-1', title: 'Manage application stress', description: 'Stay calm during the college application process.', suggestedType: 'practice', categoryId: 'postsecondary', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'ps-flex-1', title: 'Explore multiple pathways', description: 'Consider different educational and career options.', suggestedType: 'new_skill', categoryId: 'postsecondary', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'ps-adv-1', title: 'Connect with disability services', description: 'Learn about and request needed accommodations.', suggestedType: 'new_skill', categoryId: 'postsecondary', efTags: ['self_advocacy'] },

    // --- FUN / RECREATION ---
    // Initiation
    { id: 'fun-init-1', title: 'Start a creative hobby', description: 'Begin engaging in art or creative activities.', suggestedType: 'reminder', categoryId: 'fun_recreation', efTags: ['initiation'] },
    { id: 'fun-init-2', title: 'Build a music habit', description: 'Regularly listen to or play music.', suggestedType: 'reminder', categoryId: 'fun_recreation', efTags: ['initiation'] },
    // Planning/Org
    { id: 'fun-plan-1', title: 'Organize game nights', description: 'Plan regular social gaming with friends.', suggestedType: 'progressive_mastery', categoryId: 'fun_recreation', efTags: ['planning_organization'] },
    // Attention/Memory
    { id: 'fun-att-1', title: 'Learn new game rules', description: 'Master the rules of board or video games.', suggestedType: 'new_skill', categoryId: 'fun_recreation', efTags: ['attention_memory'] },
    // Emotional Reg
    { id: 'fun-emo-1', title: 'Practice good sportsmanship', description: 'Handle winning and losing gracefully.', suggestedType: 'practice', categoryId: 'fun_recreation', efTags: ['emotional_regulation'] },
    // Flexibility
    { id: 'fun-flex-1', title: 'Try new activities', description: 'Explore hobbies outside your comfort zone.', suggestedType: 'new_skill', categoryId: 'fun_recreation', efTags: ['flexibility'] },
    // Self-Advocacy
    { id: 'fun-adv-1', title: 'Express entertainment preferences', description: 'Share what activities you enjoy.', suggestedType: 'practice', categoryId: 'fun_recreation', efTags: ['self_advocacy'] }
];
