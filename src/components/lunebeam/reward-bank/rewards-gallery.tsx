import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gift } from "lucide-react";
import { Reward } from "@/services/rewardsService";
import { RedeemConfirmModal } from "./redeem-confirm-modal";
import { useRewards } from '@/hooks/useRewards';
import { useRewardPoints } from '@/hooks/useRewardPoints';

interface RewardsGalleryProps {
  onBack: () => void;
}

export const RewardsGallery: React.FC<RewardsGalleryProps> = ({ onBack }) => {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  const { data: rewards = [], isLoading: loadingRewards } = useRewards(true);
  const { data: userPoints = 0, isLoading: loadingPoints } = useRewardPoints();

  const loading = loadingRewards || loadingPoints;

  const getProgress = (cost: number) => {
    return Math.min((userPoints / cost) * 100, 100);
  };

  const canRedeem = (cost: number) => {
    return userPoints >= cost;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'big': return <Trophy className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'small': return 'text-green-600';
      case 'medium': return 'text-blue-600';
      case 'big': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      <PageHeader title="Reward Gallery" onBack={onBack} />

      <div className="px-4 pt-6 pb-6">
        {/* Points Display */}
        <div className="flex justify-end mb-6">
          <div className="bg-muted rounded-lg px-3 py-1 text-sm font-medium">
            {userPoints} points
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const progress = getProgress(reward.point_cost);
            const redeemable = canRedeem(reward.point_cost);
            const pointsNeeded = Math.max(0, reward.point_cost - userPoints);

            return (
              <Card key={reward.id} className="bg-card backdrop-blur hover:bg-card/80 transition-all duration-200 border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={getCategoryColor(reward.category)}>
                        {getCategoryIcon(reward.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {reward.image && (
                            <span className="mr-2">{reward.image}</span>
                          )}
                          {reward.name}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {reward.point_cost} pts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reward.description && (
                    <p className="text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {userPoints} / {reward.point_cost}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {redeemable ? (
                      <Button 
                        onClick={() => setSelectedReward(reward)}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Redeem Now 🎉
                      </Button>
                    ) : (
                      <div className="text-center space-y-3">
                        <Button 
                          disabled 
                          variant="outline" 
                          className="w-full opacity-50 cursor-not-allowed"
                        >
                          Need {pointsNeeded} more points
                        </Button>
                        <div className="flex items-center justify-center min-h-[2rem]">
                          <p className="text-sm text-muted-foreground font-medium">
                            Keep going! 💪
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <div className="text-foreground mb-2">No rewards available</div>
            <div className="text-muted-foreground text-sm mb-4">
              Ask your supporter to add some rewards for you to redeem!
            </div>
            <Button 
              onClick={() => {
                // Navigate back to the You tab, then to reward admin
                onBack(); 
                // Small delay to ensure navigation happens
                setTimeout(() => {
                  const rewardAdminElement = document.querySelector('[data-reward-admin]');
                  if (rewardAdminElement) {
                    (rewardAdminElement as HTMLElement).click();
                  }
                }, 100);
              }}
              variant="outline"
              className="mt-4"
            >
              Set Up Rewards
            </Button>
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      <RedeemConfirmModal
        reward={selectedReward}
        userPoints={userPoints}
        onClose={() => setSelectedReward(null)}
        onSuccess={() => setSelectedReward(null)}
      />
    </div>
  );
};