export const generateLunaIcon = (size: number = 24): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Set canvas size
  canvas.width = size;
  canvas.height = size;
  
  // Draw circular background with specified color
  ctx.fillStyle = '#E8F0F3'; // Light gray-blue color
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add white letter "L"
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Use a clean, modern font - make it bold for better visibility
  const fontSize = Math.floor(size * 0.5);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  
  // Draw "L" text
  ctx.fillText('L', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
};

// Generate Luna icon for any size
export const getLunaIcon = (size: number = 24): string => {
  return generateLunaIcon(size);
};