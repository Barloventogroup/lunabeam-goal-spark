import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Coins } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getDomainDisplayName } from '@/utils/domainUtils';
import { PointsDisplay } from './points-display';

interface RewardsScreenProps {
  onBack: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onBack }) => {
  const { goals, pointsSummary, loadGoals, loadPoints } = useStore();

  useEffect(() => {
    loadGoals();
    loadPoints();
  }, [loadGoals, loadPoints]);

  const totalPoints = pointsSummary?.totalPoints || 0;

  return (
    <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      <PageHeader title="LunaPoints" onBack={onBack} />

      <div className="px-4 pt-6 pb-6 space-y-6">
        <p className="text-sm text-muted-foreground">Track your earned points and progress</p>
        {/* Overview Stats */}
        <Card className="text-center">
          <CardContent className="p-6">
            <Coins className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">LunaPoints Available</div>
          </CardContent>
        </Card>

        {/* Points Details */}
        <PointsDisplay />
      </div>
    </div>
  );
};