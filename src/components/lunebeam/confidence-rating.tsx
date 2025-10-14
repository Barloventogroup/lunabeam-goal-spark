import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ConfidenceRatingProps {
  value: number;
  onChange: (value: number) => void;
  showLabel?: boolean;
  readonly?: boolean;
  className?: string;
}

const confidenceLevels = [
  { emoji: '😰', label: 'Very stuck / Overwhelmed' },
  { emoji: '😟', label: 'Struggling / Unsure' },
  { emoji: '😐', label: 'Making progress / Okay' },
  { emoji: '😊', label: 'Going well / Confident' },
  { emoji: '😄', label: 'Crushing it / Excited' },
];

export const ConfidenceRating: React.FC<ConfidenceRatingProps> = ({
  value,
  onChange,
  showLabel = true,
  readonly = false,
  className,
}) => {
  const handleSelect = (level: number) => {
    if (!readonly) {
      onChange(level);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, level: number) => {
    if (readonly) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(level);
    } else if (e.key === 'ArrowLeft' && level > 1) {
      e.preventDefault();
      onChange(level - 1);
    } else if (e.key === 'ArrowRight' && level < 5) {
      e.preventDefault();
      onChange(level + 1);
    }
  };

  return (
    <div 
      className={cn('space-y-3', className)}
      role="radiogroup"
      aria-label="Confidence rating"
      aria-readonly={readonly}
    >
      <div className="grid grid-cols-5 gap-3">
        {confidenceLevels.map((level, index) => {
          const levelValue = index + 1;
          const isSelected = value === levelValue;
          
          return (
            <Button
              key={levelValue}
              type="button"
              size="icon"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleSelect(levelValue)}
              onKeyDown={(e) => handleKeyDown(e, levelValue)}
              disabled={readonly}
              className={cn(
                'h-14 w-14 text-4xl transition-all',
                isSelected && 'scale-110 shadow-glow',
                !readonly && 'hover:scale-110',
                readonly && 'opacity-70 cursor-not-allowed'
              )}
              aria-label={level.label}
              aria-checked={isSelected}
              role="radio"
              tabIndex={isSelected ? 0 : -1}
            >
              {level.emoji}
            </Button>
          );
        })}
      </div>
      
      {showLabel && value >= 1 && value <= 5 && (
        <div className="text-center">
          <Label className="text-sm text-muted-foreground">
            {confidenceLevels[value - 1].label}
          </Label>
        </div>
      )}
    </div>
  );
};
