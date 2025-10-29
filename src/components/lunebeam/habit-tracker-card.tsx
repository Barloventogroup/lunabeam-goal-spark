import { useState } from "react";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StreakBanner } from "./streak-banner";
// import { CompletionCelebration } from "./completion-celebration";
import { SkipReasonModal } from "./skip-reason-modal";
import { useToast } from "@/hooks/use-toast";
import type { Step, Goal, SkipReason } from "@/types";

interface HabitTrackerCardProps {
  step: Step;
  goal: Goal;
  currentStreak: number;
  longestStreak: number;
  isStreakAtRisk: boolean;
  onMarkComplete: () => Promise<{ pointsAwarded: number; newStreak: number }>;
  onSkip: (reason: SkipReason, customNote?: string) => Promise<void>;
}

const cleanStepTitle = (title: string): string => {
  return title.replace(/^(Complete|Do|Finish|Start|Practice)\s+/i, '');
};

export const HabitTrackerCard: React.FC<HabitTrackerCardProps> = ({
  step,
  goal,
  currentStreak,
  longestStreak,
  isStreakAtRisk,
  onMarkComplete,
  onSkip
}) => {
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  // const [showCelebration, setShowCelebration] = useState(false);
  // const [celebrationData, setCelebrationData] = useState({ points: 0, streak: 0 });
  const { toast } = useToast();
  
  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await onMarkComplete();
      
      // Show toast notification instead of celebration modal
      toast({
        title: "Step completed! 🎉",
        description: `Great job! +${result.pointsAwarded} points${result.newStreak > 1 ? ` • ${result.newStreak}-day streak! 🔥` : ''}`,
      });
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error",
        description: "Failed to complete step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };
  
  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Streak Banner */}
        {currentStreak > 0 && (
          <StreakBanner 
            streak={currentStreak} 
            atRisk={isStreakAtRisk}
            milestone={
              currentStreak >= 30 ? 'platinum' :
              currentStreak >= 14 ? 'gold' :
              currentStreak >= 7 ? 'silver' :
              currentStreak >= 3 ? 'bronze' :
              undefined
            }
          />
        )}
        
        {/* Large Complete Button */}
        <CardContent className="p-6">
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full h-48 text-2xl font-bold relative group"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)',
            }}
          >
            {isCompleting ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-16 w-16 group-hover:scale-110 transition-transform" />
                <span>Mark Complete</span>
                <span className="text-sm font-normal opacity-90">
                  Tap to complete today's session
                </span>
              </div>
            )}
          </Button>
          
          {/* Step Details */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {cleanStepTitle(step.title)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Goal: {goal.title}
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground mt-1">
                Personal best: {longestStreak} days
              </p>
            )}
          </div>
          
          {/* Skip Option */}
          <Button
            variant="ghost"
            onClick={() => setShowSkipModal(true)}
            className="w-full mt-4 text-muted-foreground hover:text-foreground"
          >
            Skip Today <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
      
      {/* Celebration Overlay - Temporarily disabled */}
      {/* {showCelebration && (
        <CompletionCelebration
          streakCount={celebrationData.streak}
          pointsAwarded={celebrationData.points}
          onComplete={() => setShowCelebration(false)}
        />
      )} */}
      
      {/* Skip Modal */}
      <SkipReasonModal
        isOpen={showSkipModal}
        stepTitle={cleanStepTitle(step.title)}
        onClose={() => setShowSkipModal(false)}
        onConfirm={onSkip}
      />
    </>
  );
};
