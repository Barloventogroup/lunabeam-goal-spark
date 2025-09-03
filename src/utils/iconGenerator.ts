export const generateLunaLetterIcon = (size: number = 24): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Set canvas size
  canvas.width = size;
  canvas.height = size;
  
  // Create circular background with gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#22c55e'); // Green
  gradient.addColorStop(1, '#3b82f6'); // Blue
  
  // Draw circular background
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Use a clean, modern font - make it slightly larger for single letter
  const fontSize = Math.floor(size * 0.5);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  
  // Draw "L" text
  ctx.fillText('L', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
};

// Generate different sizes for the letter L icon
export const getLunaLetterIcon = (size: number = 24): string => {
  return generateLunaLetterIcon(size);
};