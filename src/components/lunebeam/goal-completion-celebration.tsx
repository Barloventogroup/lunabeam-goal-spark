import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fireworks } from '@/components/ui/fireworks';
import Lottie from 'lottie-react';
import trophyAnimation from '@/assets/trophy-animation.json';

interface GoalCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  goalTitle: string;
}

export const GoalCompletionCelebration: React.FC<GoalCompletionCelebrationProps> = ({
  isOpen,
  onClose,
  goalTitle
}) => {
  const [showFireworks, setShowFireworks] = useState(true);

  const handleClose = () => {
    setShowFireworks(false);
    onClose();
  };

  return (
    <>
      <Fireworks 
        isVisible={isOpen && showFireworks} 
        onComplete={() => setShowFireworks(false)} 
      />
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md text-center bg-card border border-border">
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <Lottie 
                animationData={trophyAnimation} 
                loop={false}
                style={{ width: 200, height: 200 }}
              />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                Congrats you completed your goal!
              </h2>
              
              <div className="text-base text-muted-foreground px-4">
                <strong className="text-foreground">"{goalTitle}"</strong>
              </div>
              
              <p className="text-base text-foreground">
                You proved to yourself you can do it. What's your next move?
              </p>
            </div>
            
            <Button 
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Awesome! 🎉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};