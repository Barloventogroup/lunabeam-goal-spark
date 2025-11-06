import { cn } from '@/lib/utils';

interface MiniProgressBarProps {
  completed: number;
  planned: number;
  className?: string;
}

export function MiniProgressBar({ completed, planned, className }: MiniProgressBarProps) {
  const percentage = planned > 0 ? (completed / planned) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {completed}/{planned}
      </span>
    </div>
  );
}
