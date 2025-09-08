import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { Zap, Trophy, Target } from 'lucide-react';

interface PointsDisplayProps {
  compact?: boolean;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ compact = false }) => {
  const { pointsSummary, loadPoints } = useStore();

  useEffect(() => {
    // Load points when component mounts
    loadPoints();
    
    // Set up periodic refresh to catch new point awards
    const interval = setInterval(() => {
      loadPoints();
    }, 10000); // Refresh every 10 seconds
    
    // Listen for immediate points updates
    const handlePointsUpdated = () => {
      console.log('Points updated event received, refreshing...');
      loadPoints();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('pointsUpdated', handlePointsUpdated);
    };
  }, [loadPoints]);

  if (!pointsSummary) {
    return (
      <Card className={compact ? "w-full" : ""}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }


  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">LunaPoints</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {pointsSummary.totalPoints}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Total LunaPoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {pointsSummary.totalPoints}
          </div>
        </CardContent>
      </Card>

      {pointsSummary.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              LunaPoints by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pointsSummary.categoryBreakdown
              .sort((a, b) => b.points - a.points)
              .map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.emoji}</span>
                    <span className="font-medium">{category.displayName}</span>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {category.points}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PointsDisplay;