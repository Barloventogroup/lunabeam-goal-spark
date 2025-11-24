import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface GoalSetupConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalTitle: string;
}

export const GoalSetupConfirmationModal: React.FC<GoalSetupConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  goalTitle
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Ready to make this happen?</DialogTitle>
          <DialogDescription className="text-base pt-2">
            We'll help you break <span className="font-semibold text-foreground">"{goalTitle}"</span> into 
            small, doable steps that fit your schedule. It'll take just a minute to set up.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Not now
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            Let's do it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
