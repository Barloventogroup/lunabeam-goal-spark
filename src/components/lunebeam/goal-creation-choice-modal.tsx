import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Target } from 'lucide-react';

interface GoalCreationChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSelectQuickGoal: () => void;
  onSelectAdvancedGoal: () => void;
  hasEfData: boolean;
}

export function GoalCreationChoiceModal({
  open,
  onClose,
  onSelectQuickGoal,
  onSelectAdvancedGoal,
  hasEfData
}: GoalCreationChoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>How do you want to create this goal?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick Goal Option */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary"
            onClick={onSelectQuickGoal}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 text-left space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Quick Goal</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hasEfData 
                      ? "Pick from suggested goals based on what you've told us feels hard. Takes ~2 minutes."
                      : "Run a quick skills scan first (8 questions), then pick a goal. Takes ~5 minutes."
                    }
                  </p>
                  <Button className="w-full mt-3">
                    Choose Quick Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Goal Option */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary"
            onClick={onSelectAdvancedGoal}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
                <div className="flex-1 text-left space-y-2">
                  <h3 className="font-semibold text-lg">Advanced Goal</h3>
                  <p className="text-sm text-muted-foreground">
                    Build a custom goal from scratch with full options and support. Takes ~5 minutes.
                  </p>
                  <Button variant="outline" className="w-full mt-3">
                    Choose Advanced Goal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
