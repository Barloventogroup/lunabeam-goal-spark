import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gift } from "lucide-react";
import { rewardsService, Reward } from "@/services/rewardsService";
import { pointsService } from "@/services/pointsService";
import { RedeemConfirmModal } from "./redeem-confirm-modal";
import { toast } from "sonner";

interface RewardsGalleryProps {
  onBack: () => void;
}

export const RewardsGallery: React.FC<RewardsGalleryProps> = ({ onBack }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rewardsData, pointsData] = await Promise.all([
        rewardsService.getRewards(true), // Only active rewards
        pointsService.getPointsSummary()
      ]);
      setRewards(rewardsData);
      setUserPoints(pointsData.totalPoints);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Reward Gallery</h1>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <span className="text-white font-medium">{userPoints} points</span>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const progress = getProgress(reward.point_cost);
            const redeemable = canRedeem(reward.point_cost);
            const pointsNeeded = Math.max(0, reward.point_cost - userPoints);

            return (
              <Card key={reward.id} className="bg-white/95 backdrop-blur hover:bg-white transition-all duration-200">
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
                      <div className="text-center">
                        <Button 
                          disabled 
                          variant="outline" 
                          className="w-full opacity-50 cursor-not-allowed"
                        >
                          Need {pointsNeeded} more points
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Keep going! 💪
                        </p>
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
            <Gift className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <div className="text-white/80 mb-2">No rewards available</div>
            <div className="text-white/60 text-sm">
              Ask your supporter to add some rewards for you to redeem!
            </div>
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      <RedeemConfirmModal
        reward={selectedReward}
        userPoints={userPoints}
        onClose={() => setSelectedReward(null)}
        onSuccess={() => {
          loadData();
          setSelectedReward(null);
        }}
      />
    </div>
  );
};