// Utility function to clean step titles
export const cleanStepTitle = (title: string): string => {
  if (!title) return '';
  
  // Remove "Day X:" prefix
  let cleanTitle = title.replace(/^Day\s+\d+:\s*/i, '');
  
  // Remove ":<goal name>" suffix (anything after the last colon)
  const lastColonIndex = cleanTitle.lastIndexOf(':');
  if (lastColonIndex > 0) {
    cleanTitle = cleanTitle.substring(0, lastColonIndex).trim();
  }
  
  // Convert to sentence case: first letter uppercase, rest lowercase
  if (cleanTitle.length > 0) {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1).toLowerCase();
  }
  
  return cleanTitle;
};