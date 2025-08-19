import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Star, Award, Coins, Crown } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface RewardsScreenProps {
  onBack: () => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onBack }) => {
  const { badges, loadBadges } = useStore();

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const mockPoints = 247;
  const recentBadges = badges.slice(0, 6);

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'gold': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'silver': return <Star className="h-6 w-6 text-gray-400" />;
      default: return <Award className="h-6 w-6 text-bronze-500" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'gold': return 'bg-yellow-500/10 border-yellow-200';
      case 'silver': return 'bg-gray-400/10 border-gray-200';
      default: return 'bg-orange-500/10 border-orange-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Your achievements and progress</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Points Summary */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Coins className="h-8 w-8" />
            </div>
            <div className="text-3xl font-bold mb-2">{mockPoints}</div>
            <div className="text-primary-foreground/80">Total Points Earned</div>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              <div>
                <div className="font-semibold">{badges.length}</div>
                <div className="text-primary-foreground/80">Badges</div>
              </div>
              <div>
                <div className="font-semibold">3</div>
                <div className="text-primary-foreground/80">Goals Done</div>
              </div>
              <div>
                <div className="font-semibold">12</div>
                <div className="text-primary-foreground/80">Steps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBadges.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No badges yet</h3>
                <p className="text-sm text-muted-foreground">
                  Complete goals and check-ins to earn your first badge!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recentBadges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`p-4 rounded-lg border-2 ${getBadgeColor(badge.type)}`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3">
                        {getBadgeIcon(badge.type)}
                      </div>
                      <h4 className="font-medium text-sm mb-1">{badge.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {badge.type.charAt(0).toUpperCase() + badge.type.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Achievement Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium">Goal Master</div>
                  <div className="text-sm text-muted-foreground">Complete 5 goals</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">3/5</div>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-3/5 h-2 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Consistent Checker</div>
                  <div className="text-sm text-muted-foreground">Check in 7 days in a row</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">4/7</div>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-4/7 h-2 bg-primary rounded-full" style={{ width: '57%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Team Player</div>
                  <div className="text-sm text-muted-foreground">Invite 3 family members</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">2/3</div>
                <div className="w-16 h-2 bg-muted rounded-full">
                  <div className="w-2/3 h-2 bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};