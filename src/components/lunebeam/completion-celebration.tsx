import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Fireworks } from "@/components/ui/fireworks";
import successCheckAnimation from "@/assets/success-check-animation.json";
import trophyAnimation from "@/assets/trophy-animation.json";

interface CompletionCelebrationProps {
  streakCount: number;
  pointsAwarded: number;
  onComplete: () => void;
}

const getStreakMessage = (streak: number): string => {
  if (streak >= 30) return "30 DAYS! You're LEGENDARY! 🏆✨";
  if (streak >= 14) return "Two weeks! You're building real habits! 🚀";
  if (streak >= 7) return "One week strong! 💪 Keep it up!";
  if (streak >= 3) return "You're on fire! 🔥 3-day streak!";
  return "Great start! 🌱";
};

const getMotivationalMessage = (streak: number): string => {
  if (streak >= 30) return "This is incredible dedication! You're unstoppable!";
  if (streak >= 14) return "Your consistency is inspiring. Keep going!";
  if (streak >= 7) return "You're making it a habit. Amazing work!";
  if (streak >= 3) return "Momentum is building. You've got this!";
  return "Every journey begins with a single step.";
};

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  streakCount,
  pointsAwarded,
  onComplete
}) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  
  useEffect(() => {
    // Immediate success check animation
    const fireworksTimer = setTimeout(() => {
      if (streakCount >= 7) setShowFireworks(true);
      if (streakCount >= 14) setShowTrophy(true);
    }, 300);
    
    // Auto-dismiss after celebration
    const dismissTimer = setTimeout(onComplete, 3000);
    
    return () => {
      clearTimeout(fireworksTimer);
      clearTimeout(dismissTimer);
    };
  }, [streakCount, onComplete]);
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      {/* Success Check Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Lottie
          animationData={successCheckAnimation}
          loop={false}
          style={{ width: 200, height: 200 }}
        />
      </div>
      
      {/* Fireworks (7+ days) */}
      {showFireworks && <Fireworks isVisible={true} />}
      
      {/* Trophy Animation (14+ days) */}
      {showTrophy && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lottie
            animationData={trophyAnimation}
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </div>
      )}
      
      {/* Messages */}
      <div className="absolute bottom-20 left-0 right-0 text-center px-4 pointer-events-none">
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
          {getStreakMessage(streakCount)}
        </h2>
        <p className="text-white/90 text-lg mb-4 drop-shadow">
          {getMotivationalMessage(streakCount)}
        </p>
        <div className="text-2xl font-bold text-yellow-300 drop-shadow-lg">
          🎉 +{pointsAwarded} points!
        </div>
      </div>
    </div>
  );
};
