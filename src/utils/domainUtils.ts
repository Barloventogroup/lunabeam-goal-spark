export const getDomainDisplayName = (domain: string): string => {
  const domainMap: Record<string, string> = {
    // Legacy domain mappings (these are the current values in database)
    'school': 'Education - High School / Academic Readiness',
    'work': 'Employment', 
    'health': 'Health & Well-Being',
    'life': 'Independent Living',
    
    // New category mappings from goal-categories.tsx
    'education': 'Education - High School / Academic Readiness',
    'employment': 'Employment',
    'independent_living': 'Independent Living', 
    'social_skills': 'Social Skills',
    'postsecondary': 'Postsecondary - Learning After High School',
    'fun_recreation': 'Fun/Recreation',
    
    // Handle the default case
    'general': 'General'
  };
  
  return domainMap[domain] || 'General';
};

export const normalizeDomainForDisplay = (domain: string | undefined): string => {
  if (!domain) return 'General';
  
  const displayName = getDomainDisplayName(domain);
  // Always show a category, default to General if no mapping found
  return displayName === 'General' && domain !== 'general' ? 'General' : displayName;
};