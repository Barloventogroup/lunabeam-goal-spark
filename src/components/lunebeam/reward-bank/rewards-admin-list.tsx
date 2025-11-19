import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Archive, ArchiveRestore, Gift } from "lucide-react";
import { rewardsService, Reward } from "@/services/rewardsService";
import { RewardFormModal } from "./reward-form-modal";
import { toast } from "sonner";

interface RewardsAdminListProps {
  onBack: () => void;
}

export const RewardsAdminList: React.FC<RewardsAdminListProps> = React.memo(({ onBack }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const loadRewards = async () => {
    const TIMEOUT_MS = 7000;

    try {
      setLoading(true);
      console.log('[RewardsAdminList] Loading rewards...');

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Rewards load timeout')), TIMEOUT_MS)
      );

      const data = await Promise.race([
        rewardsService.getRewards({ ownerOnly: true }),
        timeoutPromise,
      ]);

      setRewards(data as Reward[]);
      console.log('[RewardsAdminList] Loaded', (data as Reward[]).length, 'rewards');
    } catch (error) {
      console.error('[RewardsAdminList] Failed to load rewards:', error);
      toast.error('Failed to load rewards. Please try again in a moment.');
    } finally {
      setLoading(false);
      console.log('[RewardsAdminList] Finished loading');
    }
  };

  useEffect(() => {
    console.log('[RewardsAdminList] Mounting, loading rewards');
    loadRewards();
  }, []);

  const handleToggleActive = async (reward: Reward) => {
    // Optimistic update
    setRewards(prev => prev.map(r => 
      r.id === reward.id ? { ...r, is_active: !r.is_active } : r
    ));

    try {
      await rewardsService.toggleRewardActive(reward.id, !reward.is_active);
      toast.success(reward.is_active ? 'Reward archived' : 'Reward restored');
    } catch (error) {
      // Revert on error
      setRewards(prev => prev.map(r => 
        r.id === reward.id ? { ...r, is_active: reward.is_active } : r
      ));
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
      <div className="min-h-[100dvh] bg-gradient-soft">
        <PageHeader title="Reward Bank" onBack={onBack} />
        <div className="px-4 pt-safe-header pb-safe-nav space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-soft">
      <PageHeader 
        title="Reward Bank" 
        onBack={onBack}
        right={
          <Button 
            onClick={() => setShowForm(true)}
            size="sm"
            className="h-8 px-3 text-sm bg-primary hover:bg-primary/90"
          >
            Add Reward
          </Button>
        }
      />

      <div className="px-4 pt-safe-header pb-safe-nav space-y-3">
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
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <div className="text-foreground mb-2">No rewards yet</div>
            <div className="text-muted-foreground text-sm">
              Use the "+ Add Reward" button above to create your first reward!
            </div>
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
});