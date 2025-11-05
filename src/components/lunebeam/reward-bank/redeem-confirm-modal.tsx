import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, AlertTriangle } from "lucide-react";
import { Reward } from "@/services/rewardsService";
import { useRequestRedemption } from '@/hooks/useRedemptions';

interface RedeemConfirmModalProps {
  reward: Reward | null;
  userPoints: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const RedeemConfirmModal: React.FC<RedeemConfirmModalProps> = ({
  reward,
  userPoints,
  onClose,
  onSuccess
}) => {
  const requestRedemption = useRequestRedemption();

  if (!reward) return null;

  const handleRedeem = async () => {
    await requestRedemption.mutateAsync(reward.id);
    onSuccess();
  };

  const canRedeem = userPoints >= reward.point_cost;

  return (
    <Dialog open={!!reward} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Redeem Reward
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reward Info */}
          <div className="text-center">
            <div className="text-2xl mb-2">{reward.image || '🎁'}</div>
            <h3 className="text-lg font-semibold text-foreground">{reward.name}</h3>
            {reward.description && (
              <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
            )}
          </div>

          {/* Cost & Balance */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">{reward.point_cost} points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your balance:</span>
              <span className="font-medium">{userPoints} points</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">After redemption:</span>
              <span className={`font-medium ${userPoints - reward.point_cost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {userPoints - reward.point_cost} points
              </span>
            </div>
          </div>

          {/* Warning if insufficient points */}
          {!canRedeem && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                You need {reward.point_cost - userPoints} more points to redeem this reward.
              </span>
            </div>
          )}

          {/* Note about approval */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              After requesting, your supporter will review and approve your redemption. 
              Points will be deducted only after approval.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRedeem}
              disabled={!canRedeem || requestRedemption.isPending}
              className="flex-1"
            >
              {requestRedemption.isPending ? 'Requesting...' : `Redeem for ${reward.point_cost} pts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};