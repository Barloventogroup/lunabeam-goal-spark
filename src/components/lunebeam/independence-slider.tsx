import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface IndependenceLevel {
  icon: string;
  label: string;
  description: string;
}

interface IndependenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  labels?: IndependenceLevel[];
  readonly?: boolean;
  className?: string;
}

const defaultLevels: IndependenceLevel[] = [
  {
    icon: '🤝',
    label: 'Full Support',
    description: 'Needed lots of help to complete this',
  },
  {
    icon: '👋',
    label: 'Some Support',
    description: 'Needed reminders or guidance along the way',
  },
  {
    icon: '🚶',
    label: 'Minimal Support',
    description: 'Mostly did it on my own with a little help',
  },
  {
    icon: '🏃',
    label: 'Independent',
    description: 'Did it completely by myself',
  },
  {
    icon: '⭐',
    label: 'Teaching Others',
    description: 'Could teach someone else how to do this',
  },
];

export const IndependenceSlider: React.FC<IndependenceSliderProps> = ({
  value,
  onChange,
  labels = defaultLevels,
  readonly = false,
  className,
}) => {
  const currentLevel = labels[value - 1];

  const handleSliderChange = (values: number[]) => {
    if (!readonly) {
      onChange(values[0]);
    }
  };

  const handleButtonClick = (level: number) => {
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
      className={cn('space-y-4', className)}
      role="group"
      aria-label="Independence level"
    >
      {/* Visual Slider */}
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={1}
          max={5}
          step={1}
          disabled={readonly}
          className="cursor-pointer"
          aria-label="Independence slider"
        />
      </div>

      {/* Icon Buttons Grid */}
      <div 
        className="grid grid-cols-5 gap-3"
        role="radiogroup"
        aria-label="Independence level buttons"
        aria-readonly={readonly}
      >
        {labels.map((level, index) => {
          const levelValue = index + 1;
          const isSelected = value === levelValue;

          return (
            <Button
              key={levelValue}
              type="button"
              size="icon"
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleButtonClick(levelValue)}
              onKeyDown={(e) => handleKeyDown(e, levelValue)}
              disabled={readonly}
              className={cn(
                'h-14 w-14 text-3xl transition-all flex-col gap-1 p-2',
                isSelected && 'shadow-glow',
                !readonly && 'hover:scale-105',
                readonly && 'opacity-70 cursor-not-allowed'
              )}
              aria-label={`${level.label}: ${level.description}`}
              aria-checked={isSelected}
              role="radio"
              tabIndex={isSelected ? 0 : -1}
            >
              <span>{level.icon}</span>
            </Button>
          );
        })}
      </div>

      {/* Current Selection Card */}
      {currentLevel && (
        <Card className="p-4 bg-card-soft transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.icon}</span>
              <Label className="font-semibold text-foreground">
                {currentLevel.label}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentLevel.description}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
