import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
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
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur border-b border-gray-200">
        <BackButton onClick={onBack} />
        <div className="flex-1">
          <h1 className="text-xl font-bold">LunaPoints</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
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