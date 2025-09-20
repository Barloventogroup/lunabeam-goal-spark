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
import { stepsService } from '@/services/goalsService';
import type { Step, Goal } from '@/types';

interface StepEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  step: Step;
  goal: Goal;
  onStepUpdate?: (updatedStep: Step) => void;
}

export const StepEditModal: React.FC<StepEditModalProps> = ({
  isOpen,
  onOpenChange,
  step,
  goal,
  onStepUpdate
}) => {
  const [title, setTitle] = useState(step.title);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    step.due_date ? new Date(step.due_date) : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a step title.",
        variant: "destructive",
      });
      return;
    }

    // Validate due date against goal's due date
    if (dueDate && goal.due_date) {
      const goalDueDate = new Date(goal.due_date);
      if (dueDate > goalDueDate) {
        toast({
          title: "Invalid due date",
          description: `Step due date cannot be after goal due date (${format(goalDueDate, 'PPP')}).`,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate due date is not in the past (unless step is already overdue)
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today && (!step.due_date || new Date(step.due_date) >= today)) {
        toast({
          title: "Invalid due date",
          description: "Step due date cannot be in the past.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await stepsService.updateStep(step.id, {
        title: title.trim(),
        due_date: dueDate ? dueDate.toISOString() : null,
      });

      toast({
        description: "Step updated successfully!"
      });

      // Create updated step object for callback
      const updatedStep: Step = {
        ...step,
        title: title.trim(),
        due_date: dueDate ? dueDate.toISOString() : null,
      };

      onStepUpdate?.(updatedStep);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update step:', error);
      toast({
        title: "Failed to update step",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setTitle(step.title);
    setDueDate(step.due_date ? new Date(step.due_date) : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Step</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your step's name and due date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-foreground">
              Step Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter step name"
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
              <PopoverContent className="w-auto p-0 bg-background border-border pointer-events-auto" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(date) => {
                    // Disable past dates (unless step is already overdue)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    
                    const isPastDate = checkDate < today && (!step.due_date || new Date(step.due_date) >= today);
                    
                    // Disable dates after goal due date
                    const isAfterGoalDueDate = goal.due_date && checkDate > new Date(goal.due_date);
                    
                    return isPastDate || !!isAfterGoalDueDate;
                  }}
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