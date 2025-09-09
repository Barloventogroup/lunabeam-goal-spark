export const getDomainDisplayName = (domain: string): string => {
  const domainMap: Record<string, string> = {
    // Legacy domain mappings
    'school': 'Education - High School / Academic Readiness',
    'work': 'Employment',
    'health': 'Health & Well-Being', 
    'life': 'Independent Living',
    
    // New category mappings from goal-categories.tsx
    'education': 'Education - High School / Academic Readiness',
    'employment': 'Employment',
    'independent_living': 'Independent Living',
    'social_skills': 'Social Skills',
    'postsecondary': 'Postsecondary - Learning After High School'
  };
  
  return domainMap[domain] || '';
};

export const normalizeDomainForDisplay = (domain: string | undefined): string => {
  if (!domain) return '';
  
  const displayName = getDomainDisplayName(domain);
  // Don't show 'other' or empty domains
  return domain === 'other' ? '' : displayName;
};