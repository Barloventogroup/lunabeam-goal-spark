import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { 
  Award, 
  Gift,
  Settings,
  Inbox,
  ChevronRight
} from 'lucide-react';

interface RewardsHubProps {
  onBack: () => void;
  onNavigateToRewards: () => void;
  onNavigateToRewardBank: () => void;
  onNavigateToManageRewards: () => void;
  onNavigateToRedemptionInbox: () => void;
}

export const RewardsHub: React.FC<RewardsHubProps> = ({
  onBack,
  onNavigateToRewards,
  onNavigateToRewardBank,
  onNavigateToManageRewards,
  onNavigateToRedemptionInbox
}) => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur border-b border-gray-200">
        <BackButton onClick={onBack} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Manage your rewards and redemptions</p>
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
                  <div className="font-medium">Rewards</div>
                  <div className="text-sm text-muted-foreground">View your badges and points</div>
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

        {/* Manage Rewards */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToManageRewards}>
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
        </Card>

        {/* Redemption Inbox */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNavigateToRedemptionInbox}>
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
        </Card>
      </div>
    </div>
  );
};