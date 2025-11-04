import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Flame, Scissors, Calendar, ArrowLeft, Loader2, Pause } from 'lucide-react';
import type { Step, Goal } from '@/types';
import { cn } from '@/lib/utils';
import { checkInService } from '@/services/checkInService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type CheckInState = 
  | 'initial'
  | 'completing'
  | 'success' 
  | 'difficulty'
  | 'deferral_actions'
  | 'ai_split'
  | 'reschedule';

interface ExpressCheckInCardProps {
  step: Step;
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  mode?: 'express' | 'modal';
  streakData?: { currentStreak: number; isStreakAtRisk: boolean };
}

export const ExpressCheckInCard: React.FC<ExpressCheckInCardProps> = ({
  step,
  goal,
  isOpen,
  onClose,
  onComplete,
  mode = 'express',
  streakData
}) => {
  const { toast } = useToast();
  const [currentState, setCurrentState] = useState<CheckInState>('initial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  const difficultyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

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
    console.log('[ExpressCheckIn] Done button clicked:', step.id, mode);
    setCurrentState('completing');
    
    try {
      // Create check-in via API
      const result = await checkInService.createExpressCheckIn(step.id, mode);
      setCheckInId(result.id);
      setPointsEarned(result.points);
      
      // Show success message
      setCurrentState('success');
      
      // Wait 2 seconds before showing difficulty prompt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show difficulty prompt
      setCurrentState('difficulty');
    } catch (error: any) {
      console.error('Failed to complete step:', error);
      
      // Queue for offline sync if network error
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        await queueOfflineCheckIn(step.id);
        toast({
          title: "Queued for later",
          description: "We'll sync this when you're back online",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to mark step complete. Please try again.",
          variant: "destructive"
        });
        setCurrentState('initial');
      }
    }
  };

  // Offline queue management
  const queueOfflineCheckIn = async (stepId: string) => {
    const queue = JSON.parse(localStorage.getItem('offline_checkins') || '[]');
    queue.push({
      stepId,
      timestamp: Date.now(),
      mode,
    });
    localStorage.setItem('offline_checkins', JSON.stringify(queue));
  };

  // Sync offline check-ins when coming back online
  useEffect(() => {
    const syncOfflineCheckIns = async () => {
      if (!navigator.onLine) return;
      
      const queue = JSON.parse(localStorage.getItem('offline_checkins') || '[]');
      if (queue.length === 0) return;
      
      for (const item of queue) {
        try {
          await checkInService.createExpressCheckIn(item.stepId, item.mode);
        } catch (error) {
          console.error('Failed to sync check-in:', error);
        }
      }
      
      localStorage.removeItem('offline_checkins');
      toast({
        title: "Synced!",
        description: `${queue.length} check-ins synced`,
      });
    };
    
    window.addEventListener('online', syncOfflineCheckIns);
    return () => window.removeEventListener('online', syncOfflineCheckIns);
  }, [mode, toast]);

  const handleDifficultySelect = async (difficulty?: 'easy' | 'medium' | 'hard') => {
    if (difficultyTimerRef.current) {
      clearTimeout(difficultyTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    try {
      // Update difficulty rating if provided
      if (difficulty && checkInId) {
        await checkInService.updateCheckInDifficulty(checkInId, difficulty);
      }
      
      // Call parent completion handler
      onComplete();
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to update difficulty:', error);
      // Still complete - difficulty is optional
      onComplete();
      setTimeout(() => onClose(), 500);
    }
  };

  const handleNotYet = () => {
    setCurrentState('deferral_actions');
  };

  const handleDeferAction = async (action: 'split' | 'tomorrow') => {
    setIsProcessing(true);
    
    if (action === 'split') {
      setCurrentState('ai_split');
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-substeps-from-split', {
          body: {
            stepId: step.id,
            goalContext: goal.title,
            userMessage: 'User requested to break this step down into smaller pieces'
          }
        });

        if (error) throw error;

        toast({
          title: "Step split successfully!",
          description: `Created ${data.substeps.length} smaller substeps`,
        });
        
        onComplete(); // Refresh parent data
        onClose();
      } catch (error) {
        console.error('Failed to split step:', error);
        toast({
          title: "Error",
          description: "Failed to break down step. Please try again.",
          variant: "destructive"
        });
        setCurrentState('deferral_actions');
      }
    } else if (action === 'tomorrow') {
      console.log('[ExpressCheckIn] Tomorrow action triggered:', step.id);
      setCurrentState('reschedule');
      
      try {
        const result = await checkInService.rescheduleToTomorrow(step.id);
        
        toast({
          title: "Step rescheduled",
          description: result.confirmation_message
        });
        
        onComplete();
        onClose();
      } catch (error) {
        console.error('Failed to reschedule:', error);
        toast({
          title: "Error",
          description: "Failed to reschedule. Please try again.",
          variant: "destructive"
        });
        setCurrentState('deferral_actions');
      }
    }
    
    setIsProcessing(false);
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

  // Adaptive button labels based on step status
  const getPrimaryButtonLabel = () => {
    if (step.status === 'not_started') {
      return (
        <>
          <CheckCircle className="h-5 w-5 mr-2" />
          Done
        </>
      );
    }
    // status === 'in_progress' (in progress)
    return (
      <>
        <CheckCircle className="h-5 w-5 mr-2" />
        Finished!
      </>
    );
  };

  const getSecondaryButtonLabel = () => {
    if (step.status === 'not_started') {
      return "Not yet";
    }
    // status === 'in_progress' (in progress)
    return (
      <>
        <Pause className="h-4 w-4 mr-2" />
        Pause for now
      </>
    );
  };

  // Enhanced animations
  const buttonVariants = {
    tap: { scale: 0.98 },
    hover: { scale: 1.02 }
  };

  const successVariants = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring' as const, 
        stiffness: 200, 
        damping: 15 
      }
    }
  };

  const renderInitialState = () => (
    <motion.div
      key="initial"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Ready to check in on your step
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">{goal.title}</p>
        <h2 className="text-xl font-semibold text-foreground leading-tight">{step.title}</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          {step.due_date && (
            <Badge variant="outline" className="gap-1 text-base text-indigo-600 bg-indigo-50">
              <Clock className="h-3 w-3" />
              {formatDueTime(step.due_date)}
            </Badge>
          )}
          {streakData && streakData.currentStreak > 0 && (
            <Badge variant="outline" className="gap-1 bg-orange-50 text-orange-700">
              <Flame className="h-3 w-3" />
              {streakData.currentStreak} day streak
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <motion.div
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
        >
          <Button
            size="lg"
            className="w-full h-14 text-base font-medium bg-green-500 hover:bg-green-600 active:scale-95 active:bg-green-700 text-white rounded-xl transition-transform touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDone();
            }}
            disabled={isProcessing}
            aria-label={step.status === 'not_started' ? "Mark step as complete" : "Mark step as finished"}
            style={{ touchAction: 'manipulation' }}
          >
            {getPrimaryButtonLabel()}
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileTap="tap"
          whileHover="hover"
        >
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-14 text-base font-medium bg-gray-400 hover:bg-gray-500 active:scale-95 text-white rounded-xl transition-transform touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleNotYet();
            }}
            disabled={isProcessing}
            aria-label="Pause or defer this step"
            style={{ touchAction: 'manipulation' }}
          >
            {getSecondaryButtonLabel()}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderSuccessState = () => (
    <motion.div
      key="success"
      variants={successVariants}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="py-12 text-center"
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Step marked complete, {pointsEarned} points awarded
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Completed!</h2>
      <p className="text-muted-foreground">
        +{pointsEarned} points
        {streakData && streakData.currentStreak > 0 && ` • ${streakData.currentStreak + 1}-day streak 🔥`}
      </p>
    </motion.div>
  );

  const renderDifficultyState = () => (
    <motion.div
      key="difficulty"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-6"
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        Please rate the difficulty of this step
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">How was it for you?</h2>
        <p className="text-sm text-muted-foreground">This helps us personalize future steps</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleDifficultySelect('easy')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Rate as easy - I completed this without difficulty"
          role="button"
          tabIndex={0}
        >
          <span className="text-4xl" role="img" aria-label="Happy face">😊</span>
          <span className="text-sm font-medium">Easy</span>
        </button>

        <button
          onClick={() => handleDifficultySelect('medium')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Rate as medium difficulty - It was moderately challenging"
          role="button"
          tabIndex={0}
        >
          <span className="text-4xl" role="img" aria-label="Neutral face">😐</span>
          <span className="text-sm font-medium">Medium</span>
        </button>

        <button
          onClick={() => handleDifficultySelect('hard')}
          disabled={isProcessing}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            "hover:border-primary hover:bg-accent",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Rate as hard - This was very challenging for me"
          role="button"
          tabIndex={0}
        >
          <span className="text-4xl" role="img" aria-label="Struggling face">😣</span>
          <span className="text-sm font-medium">Hard</span>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Auto-continuing in {countdown}s...
      </p>
    </motion.div>
  );

  const renderDeferralActionsState = () => (
    <motion.div
      key="deferral_actions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">No worries! Let's adjust:</h2>
      </div>

      <div className="space-y-3">
        <Card
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary rounded-xl"
          onClick={() => handleDeferAction('split')}
          role="button"
          tabIndex={0}
          aria-label="Break into smaller steps"
        >
          <div className="flex items-start gap-3">
            <Scissors className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">Break it down</h3>
              <p className="text-sm text-muted-foreground mt-1">Break this down into smaller pieces</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary rounded-xl"
          onClick={() => handleDeferAction('tomorrow')}
          role="button"
          tabIndex={0}
          aria-label="Try again tomorrow"
        >
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground">Try tomorrow</h3>
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
            {currentState === 'completing' && renderProcessingState()}
            {currentState === 'success' && renderSuccessState()}
            {currentState === 'difficulty' && renderDifficultyState()}
            {currentState === 'deferral_actions' && renderDeferralActionsState()}
            {(currentState === 'ai_split' || currentState === 'reschedule') && renderProcessingState()}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
