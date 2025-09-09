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
  
  return cleanTitle;
};