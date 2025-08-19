import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'supportive' | 'encouraging';
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  progress, 
  size = 'md', 
  color = 'primary',
  children 
}) => {
  const sizeMap = {
    sm: { width: 60, strokeWidth: 4 },
    md: { width: 80, strokeWidth: 6 },
    lg: { width: 120, strokeWidth: 8 }
  };

  const colorMap = {
    primary: 'hsl(var(--primary))',
    supportive: 'hsl(var(--supportive))',
    encouraging: 'hsl(var(--encouraging))'
  };

  const selected = sizeMap[size as keyof typeof sizeMap] ?? sizeMap.md;
  const { width, strokeWidth } = selected;
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          stroke={colorMap[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export { ProgressRing };