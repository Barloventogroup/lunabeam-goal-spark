import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Flame, Scissors, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import type { Step, Goal } from '@/types';
import { cn } from '@/lib/utils';

type CheckInState = 
  | 'initial'
  | 'done' 
  | 'difficulty'
  | 'not_yet'
  | 'processing'
  | 'complete';

interface OneCardCheckInProps {
  step: Step;
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (difficulty?: 'easy' | 'medium' | 'hard') => Promise<void>;
  onDefer: (action: 'split' | 'tomorrow') => Promise<void>;
  streakData?: { currentStreak: number; isStreakAtRisk: boolean };
}

export const OneCardCheckIn: React.FC<OneCardCheckInProps> = ({
  step,
  goal,
  isOpen,
  onClose,
  onComplete,
  onDefer,
  streakData
}) => {
  const [currentState, setCurrentState] = useState<CheckInState>('initial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const difficultyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Guard: Don't render if step is null
  if (!step || !goal) {
    return null;
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentState('initial');
      setIsProcessing(false);
      setCountdown(10);
    }
  }, [isOpen]);

  // Auto-dismiss difficulty prompt after 10 seconds
  useEffect(() => {
    if (currentState === 'difficulty') {
      setCountdown(10);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      difficultyTimerRef.current = setTimeout(() => {
        handleDifficultySelect(undefined);
      }, 10000);
    }
    
    return () => {
      if (difficultyTimerRef.current) {
        clearTimeout(difficultyTimerRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [currentState]);

  const handleDone = async () => {
    setCurrentState('done');
    
    // Brief success display
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Show difficulty prompt
    setCurrentState('difficulty');
  };

  const handleDifficultySelect = async (difficulty?: 'easy' | 'medium' | 'hard') => {
    if (difficultyTimerRef.current) {
      clearTimeout(difficultyTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    setIsProcessing(true);
    setCurrentState('processing');
    
    try {
      await onComplete(difficulty);
      setCurrentState('complete');
      
      // Close modal after brief display
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to complete step:', error);
      setCurrentState('initial');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotYet = () => {
    setCurrentState('not_yet');
  };

  const handleDeferAction = async (action: 'split' | 'tomorrow') => {
    setIsProcessing(true);
    try {
      await onDefer(action);
      onClose();
    } catch (error) {
      console.error('Failed to defer step:', error);
      setCurrentState('initial');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setCurrentState('initial');
  };

  const formatDueTime = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Due today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const renderInitialState = () => (
    <motion.div
      key="initial"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{goal.title}</p>
        <h2 className="text-xl font-bold text-foreground leading-tight">{step.title}</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          {step.due_date && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatDueTime(step.due_date)}
            </Badge>
          )}
          {streakData && streakData.currentStreak > 0 && (
            <Badge variant="outline" className="gap-1 bg-orange-50 border-orange-200 text-orange-700">
              <Flame className="h-3 w-3" />
              {streakData.currentStreak} day streak
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <Button
          size="lg"
          className="w-full h-14 text-base font-medium bg-green-500 hover:bg-green-600 text-white"
          onClick={handleDone}
          disabled={isProcessing}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Done!
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="w-full h-14 text-base font-medium"
          onClick={handleNotYet}
          disabled={isProcessing}
        >
          Not yet
        </Button>
      </div>
    </motion.div>
  );

  const renderDoneState = () => (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Completed!</h2>
      <p className="text-muted-foreground">
        +{step.points_awarded || 5} points
        {streakData && streakData.currentStreak > 0 && ` • ${streakData.currentStreak + 1}-day streak 🔥`}
      </p>
    </motion.div>
  );

  const renderDifficultyState = () => (
    <motion.div
      key="difficulty"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">How was it for you?</h2>
        <p className="text-sm text-muted-foreground">This helps us personalize future steps</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleDifficultySelect('easy')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Mark as easy"
        >
          <span className="text-4xl">😊</span>
          <span className="text-sm font-medium">Easy</span>
        </button>

        <button
          onClick={() => handleDifficultySelect('medium')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Mark as medium difficulty"
        >
          <span className="text-4xl">😐</span>
          <span className="text-sm font-medium">Medium</span>
        </button>

        <button
          onClick={() => handleDifficultySelect('hard')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Mark as hard"
        >
          <span className="text-4xl">😣</span>
          <span className="text-sm font-medium">Hard</span>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Auto-continuing in {countdown}s...
      </p>
    </motion.div>
  );

  const renderNotYetState = () => (
    <motion.div
      key="not_yet"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">No worries! Let's adjust:</h2>
      </div>

      <div className="space-y-3">
        <Card
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
          onClick={() => handleDeferAction('split')}
          role="button"
          tabIndex={0}
          aria-label="Split into smaller steps"
        >
          <div className="flex items-start gap-3">
            <Scissors className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">Split into smaller steps</h3>
              <p className="text-sm text-muted-foreground mt-1">Break this down further</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
          onClick={() => handleDeferAction('tomorrow')}
          role="button"
          tabIndex={0}
          aria-label="Try again tomorrow"
        >
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">Try again tomorrow</h3>
              <p className="text-sm text-muted-foreground mt-1">Reschedule for next day</p>
            </div>
          </div>
        </Card>
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={handleBack}
        disabled={isProcessing}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    </motion.div>
  );

  const renderProcessingState = () => (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12 text-center"
    >
      <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Saving...</p>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="check-in-description"
      >
        <DialogHeader className="sr-only">
          <span id="check-in-description">Step check-in</span>
        </DialogHeader>
        
        <div className="py-2" role="region" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            {currentState === 'initial' && renderInitialState()}
            {currentState === 'done' && renderDoneState()}
            {currentState === 'difficulty' && renderDifficultyState()}
            {currentState === 'not_yet' && renderNotYetState()}
            {currentState === 'processing' && renderProcessingState()}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
