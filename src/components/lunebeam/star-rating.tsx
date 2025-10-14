import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  labels?: string[];
  readonly?: boolean;
  className?: string;
}

const defaultLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const sizeConfig = {
  sm: { star: 20, gap: 'gap-1', text: 'text-xs' },
  md: { star: 28, gap: 'gap-2', text: 'text-sm' },
  lg: { star: 36, gap: 'gap-3', text: 'text-base' },
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'md',
  showLabels = false,
  labels = defaultLabels,
  readonly = false,
  className,
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const config = sizeConfig[size];
  const displayValue = hoverValue || value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readonly || !onChange) return;

    if (e.key === 'ArrowLeft' && value > 1) {
      e.preventDefault();
      onChange(value - 1);
    } else if (e.key === 'ArrowRight' && value < 5) {
      e.preventDefault();
      onChange(value + 1);
    } else if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      onChange(parseInt(e.key));
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn('flex items-center', config.gap)}
        role="radiogroup"
        aria-label="Star rating"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value}
        aria-valuetext={labels[value - 1]}
        aria-readonly={readonly}
        onMouseLeave={() => !readonly && setHoverValue(0)}
        onKeyDown={handleKeyDown}
        tabIndex={readonly ? -1 : 0}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              disabled={readonly}
              className={cn(
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-1',
                !readonly && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default opacity-70'
              )}
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-checked={star === value}
              role="radio"
            >
              <Star
                size={config.star}
                className={cn(
                  'transition-all',
                  isFilled 
                    ? 'fill-encouraging text-encouraging drop-shadow-sm' 
                    : 'fill-none text-muted stroke-2'
                )}
              />
            </button>
          );
        })}
      </div>

      {showLabels && value >= 1 && value <= 5 && (
        <div className="text-center">
          <Label className={cn(config.text, 'text-muted-foreground')}>
            {labels[value - 1]}
          </Label>
        </div>
      )}
    </div>
  );
};
