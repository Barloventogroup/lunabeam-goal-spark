import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Award, Gift, Settings, Inbox, ChevronRight } from 'lucide-react';
interface RewardsHubProps {
  onBack: () => void;
  onNavigateToRewards: () => void;
  onNavigateToRewardBank: () => void;
  onNavigateToManageRewards: () => void;
  onNavigateToRedemptionInbox: () => void;
  showAdminFeatures?: boolean;
}
export const RewardsHub: React.FC<RewardsHubProps> = ({
  onBack,
  onNavigateToRewards,
  onNavigateToRewardBank,
  onNavigateToManageRewards,
  onNavigateToRedemptionInbox,
  showAdminFeatures = true
}) => {
  return <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      {/* Header */}
      <div className="fixed left-0 right-0 top-safe z-40 px-4 pb-4 pt-4 bg-card">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} />
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Rewards */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToRewards}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">LunaPoints</div>
                  <div className="text-sm text-muted-foreground">View your points</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Reward Bank */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToRewardBank}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">Reward Bank</div>
                  <div className="text-sm text-muted-foreground">Redeem your points</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Manage Rewards - Admin Only */}
        {showAdminFeatures && <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToManageRewards}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Manage Rewards</div>
                    <div className="text-sm text-muted-foreground">Supporter controls</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>}

        {/* Redemption Inbox - Admin Only */}
        {showAdminFeatures && <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToRedemptionInbox}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Inbox className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Redemption Inbox</div>
                    <div className="text-sm text-muted-foreground">Approve redemptions</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>}
      </div>
    </div>;
};