import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Scissors, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Fireworks } from '@/components/ui/fireworks';
import { checkInService } from '@/services/checkInService';
import { cn } from '@/lib/utils';
import type { Step, Goal } from '@/types';

interface MissedStepItem {
  step: Step;
  goal: Goal;
  dueDate: Date;
}

interface EveningCatchUpCardProps {
  userId: string;
  onAllComplete?: () => void;
  onDismiss?: () => void;
}

type RowState = 'idle' | 'completing' | 'completed' | 'expanded';

export const EveningCatchUpCard: React.FC<EveningCatchUpCardProps> = ({
  userId,
  onAllComplete,
  onDismiss
}) => {
  const [missedSteps, setMissedSteps] = useState<MissedStepItem[]>([]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const { toast } = useToast();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load missed steps on mount
  useEffect(() => {
    const loadMissedSteps = async () => {
      try {
        setFetchError(null);
        const steps = await checkInService.getMissedSteps(userId);
        setMissedSteps(steps);
        
        // Initialize all rows as idle
        const initialStates: Record<string, RowState> = {};
        steps.forEach(item => {
          initialStates[item.step.id] = 'idle';
        });
        setRowStates(initialStates);
      } catch (error) {
        console.error('Failed to load missed steps:', error);
        setFetchError("Couldn't load missed steps");
      }
    };

    loadMissedSteps();
  }, [userId]);

  const handleDismiss = () => {
    // Store dismissal for tonight
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dismissed_catch_up_date', today);
    onDismiss?.();
  };

  const toggleExpand = (stepId: string) => {
    setRowStates(prev => ({
      ...prev,
      [stepId]: prev[stepId] === 'expanded' ? 'idle' : 'expanded'
    }));
  };

  const handleDone = async (stepId: string, index: number) => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Changes will sync when online",
        variant: "destructive"
      });
      return;
    }

    setRowStates(prev => ({ ...prev, [stepId]: 'completing' }));

    try {
      // Create check-in via API
      await checkInService.createExpressCheckIn(stepId, 'catch_up');

      // Animate out
      setTimeout(() => {
        setRowStates(prev => ({ ...prev, [stepId]: 'completed' }));
        setMissedSteps(prev => {
          const newSteps = prev.filter(item => item.step.id !== stepId);
          
          // Check if all done
          if (newSteps.length === 0) {
            setShowConfetti(true);
            setTimeout(() => {
              onAllComplete?.();
              handleDismiss();
            }, 1000);
          }
          
          return newSteps;
        });
      }, 300);
    } catch (error) {
      console.error('Failed to complete step:', error);
      setRowStates(prev => ({ ...prev, [stepId]: 'idle' }));
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllDone = () => {
    setConfirmDialog({
      open: true,
      title: `Log all ${missedSteps.length} steps as complete?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsProcessing(true);

        try {
          let totalPoints = 0;

          // Complete all steps with staggered animation
          await Promise.all(
            missedSteps.map(async (item, index) => {
              await new Promise(resolve => setTimeout(resolve, index * 100));

              setRowStates(prev => ({ ...prev, [item.step.id]: 'completing' }));

              const result = await checkInService.createExpressCheckIn(item.step.id, 'catch_up');
              totalPoints += result.points;

              setTimeout(() => {
                setRowStates(prev => ({ ...prev, [item.step.id]: 'completed' }));
              }, 200);
            })
          );

          // Show success toast
          toast({
            title: "All caught up! 🎉",
            description: `+${totalPoints} pts total`,
          });

          // Clear missed steps and show confetti
          setMissedSteps([]);
          setShowConfetti(true);

          setTimeout(() => {
            onAllComplete?.();
            handleDismiss();
          }, 1000);
        } catch (error) {
          console.error('Bulk completion failed:', error);
          toast({
            title: "Error",
            description: "Some steps couldn't be completed. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleTomorrow = async (stepId: string) => {
    setIsProcessing(true);

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('steps')
        .update({ due_date: tomorrow.toISOString().split('T')[0] })
        .eq('id', stepId);

      // Remove from missed steps
      setMissedSteps(prev => prev.filter(item => item.step.id !== stepId));

      toast({
        title: "Step rescheduled",
        description: "We'll remind you tomorrow"
      });
    } catch (error) {
      console.error('Failed to reschedule:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipAll = () => {
    setConfirmDialog({
      open: true,
      title: "Hide without logging?",
      description: "You can manually re-open this from the menu.",
      onConfirm: async () => {
        setConfirmDialog(null);
        
        // Hide for tonight
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('dismissed_catch_up_date', today);

        // Log dismissal (just to console for now)
        console.log('Catch-up card dismissed:', { userId, steps_count: missedSteps.length });

        onDismiss?.();
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  // Show error state
  if (fetchError) {
    return (
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-muted-foreground">{fetchError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no missed steps
  if (missedSteps.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="sticky top-[60px] z-30 mb-6"
      >
        <Card className="bg-purple-50 border-purple-200 rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <div>
                <CardTitle className="text-lg">Quick check-in</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {missedSteps.length} steps from today
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              aria-label="Dismiss catch-up card"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-2">
            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                <p className="text-sm text-yellow-800">
                  Offline - changes will sync when online
                </p>
              </div>
            )}

            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {missedSteps.length === 0 && "All steps completed"}
              {isProcessing && "Completing steps..."}
              {`${missedSteps.length} steps remaining`}
            </div>

            <AnimatePresence>
              {missedSteps.map((item, index) => (
                <motion.div
                  key={item.step.id}
                  initial={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{
                    opacity: 0,
                    x: -100,
                    height: 0,
                    transition: { duration: 0.3 }
                  }}
                  className="border-b last:border-b-0 pb-2"
                >
                  <div
                    id={`step-row-${item.step.id}`}
                    className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded py-2"
                  >
                    {/* Checkbox icon */}
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        rowStates[item.step.id] === 'completed'
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      )}
                    >
                      {rowStates[item.step.id] === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>

                    {/* Step title */}
                    <span className="flex-1 text-sm truncate">
                      {item.step.title}
                    </span>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-sm bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleDone(item.step.id, index)}
                        disabled={rowStates[item.step.id] === 'completing' || !isOnline}
                        aria-label={`Complete ${item.step.title}`}
                      >
                        {rowStates[item.step.id] === 'completing' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>✓ Done</>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-sm"
                        onClick={() => toggleExpand(item.step.id)}
                        aria-label={`Expand options for ${item.step.title}`}
                        aria-expanded={rowStates[item.step.id] === 'expanded'}
                      >
                        Not yet ▼
                      </Button>
                    </div>
                  </div>

                  {/* Expanded accordion content */}
                  <Collapsible open={rowStates[item.step.id] === 'expanded'}>
                    <CollapsibleContent className="pt-3 pl-8">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTomorrow(item.step.id)}
                          disabled={isProcessing || !isOnline}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Tomorrow
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={handleMarkAllDone}
              disabled={isProcessing || !isOnline}
            >
              Mark all done
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkipAll}
              disabled={isProcessing}
            >
              Skip all
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Confetti celebration */}
      {showConfetti && (
        <Fireworks
          isVisible={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Confirmation dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && confirmDialog.onCancel()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              {confirmDialog.description && (
                <AlertDialogDescription>
                  {confirmDialog.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={confirmDialog.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDialog.onConfirm}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
