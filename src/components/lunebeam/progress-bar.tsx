import React from 'react';
import { Progress } from '@/components/ui/progress';
import type { GoalProgress } from '@/types';

interface ProgressBarProps {
  progress: GoalProgress;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  showText = true,
  size = 'md',
  onClick
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { height: 'h-1', text: 'text-xs' };
      case 'lg':
        return { height: 'h-4', text: 'text-base' };
      default:
        return { height: 'h-2', text: 'text-sm' };
    }
  };

  const { height, text } = getSizeClasses();

  return (
    <div className={`space-y-1 ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {showText && (
        <div className={`flex justify-between items-center ${text}`}>
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {progress.done}/{progress.actionable} done • {progress.percent}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-muted rounded-full ${height}`}>
        <div 
          className={`bg-primary ${height} rounded-full transition-all duration-300`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      
      {progress.actionable === 0 && showText && (
        <p className="text-xs text-muted-foreground">
          Steps coming up.
        </p>
      )}
    </div>
  );
};