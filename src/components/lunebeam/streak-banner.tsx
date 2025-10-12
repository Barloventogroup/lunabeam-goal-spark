import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StreakMilestone } from "@/types";

interface StreakBannerProps {
  streak: number;
  atRisk: boolean;
  milestone?: StreakMilestone;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({
  streak,
  atRisk,
  milestone
}) => {
  const getMilestoneGradient = () => {
    if (milestone === 'platinum') return 'from-purple-500 to-pink-500';
    if (milestone === 'gold') return 'from-yellow-400 to-orange-500';
    if (milestone === 'silver') return 'from-gray-300 to-gray-500';
    if (milestone === 'bronze') return 'from-amber-600 to-amber-800';
    return 'from-primary to-primary/80';
  };
  
  return (
    <div className={`
      bg-gradient-to-r ${getMilestoneGradient()}
      text-primary-foreground px-4 py-3 flex items-center justify-between rounded-t-lg
      ${atRisk ? 'animate-pulse' : ''}
    `}>
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 animate-bounce" />
        <span className="font-bold text-lg">
          {streak}-Day Streak!
        </span>
      </div>
      
      {atRisk ? (
        <Badge variant="destructive" className="animate-pulse">
          ⚠️ At Risk
        </Badge>
      ) : (
        <span className="text-sm opacity-90">
          Keep it going! 💪
        </span>
      )}
    </div>
  );
};
