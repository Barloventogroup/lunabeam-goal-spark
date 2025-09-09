import React, { useState } from 'react';
import { Calendar, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { goalsService } from '@/services/goalsService';
import type { Goal } from '@/types';

interface GoalEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  onGoalUpdate?: (updatedGoal: Goal) => void;
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onOpenChange,
  goal,
  onGoalUpdate
}) => {
  const [title, setTitle] = useState(goal.title);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    goal.due_date ? new Date(goal.due_date) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a goal title.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedGoal = await goalsService.updateGoal(goal.id, {
        title: title.trim(),
        due_date: dueDate ? dueDate.toISOString() : null,
      });

      toast({
        description: "Goal updated successfully!"
      });

      // Pass the complete updated goal object to parent
      onGoalUpdate?.(updatedGoal);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast({
        title: "Failed to update goal",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setTitle(goal.title);
    setDueDate(goal.due_date ? new Date(goal.due_date) : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Goal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your goal's name and due date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-foreground">
              Goal Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter goal name"
              className="bg-background border-border text-foreground"
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-foreground">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background border-border",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                {dueDate && (
                  <div className="p-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDueDate(undefined)}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};