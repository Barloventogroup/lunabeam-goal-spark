import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Archive, ArchiveRestore } from "lucide-react";
import { rewardsService, Reward } from "@/services/rewardsService";
import { RewardFormModal } from "./reward-form-modal";
import { toast } from "sonner";

interface RewardsAdminListProps {
  onBack: () => void;
}

export const RewardsAdminList: React.FC<RewardsAdminListProps> = ({ onBack }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const data = await rewardsService.getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Failed to load rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleToggleActive = async (reward: Reward) => {
    try {
      await rewardsService.toggleRewardActive(reward.id, !reward.is_active);
      toast.success(reward.is_active ? 'Reward archived' : 'Reward restored');
      loadRewards();
    } catch (error) {
      console.error('Failed to toggle reward:', error);
      toast.error('Failed to update reward');
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'small': return 'secondary';
      case 'medium': return 'default';
      case 'big': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'small': return 'Small Treat';
      case 'medium': return 'Medium Reward';
      case 'big': return 'Big Reward';
      default: return category;
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
      <PageHeader 
        title="Reward Bank" 
        onBack={onBack}
        right={
          <Button 
            onClick={() => setShowForm(true)}
            size="sm"
            className="h-8 px-3 text-sm bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </Button>
        }
      />

      <div className="px-4 pt-6 pb-6">
        {/* Rewards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id} className={`bg-card backdrop-blur border-border ${!reward.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {reward.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getCategoryBadgeVariant(reward.category)}>
                        {getCategoryLabel(reward.category)}
                      </Badge>
                      <span className="text-lg font-bold text-primary">
                        {reward.point_cost} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReward(reward);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(reward)}
                    >
                      {reward.is_active ? (
                        <Archive className="w-4 h-4" />
                      ) : (
                        <ArchiveRestore className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reward.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {reward.description}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Status: {reward.is_active ? 'Active' : 'Archived'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-foreground mb-4">No rewards created yet</div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Reward
            </Button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <RewardFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingReward(null);
        }}
        reward={editingReward}
        onSuccess={() => {
          loadRewards();
          setShowForm(false);
          setEditingReward(null);
        }}
      />
    </div>
  );
};