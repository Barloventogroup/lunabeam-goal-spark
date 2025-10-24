import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Eye, 
  Crown,
  User,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { PermissionsService, type Supporter } from '@/services/permissionsService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InviteSupportersCard } from '@/components/lunebeam/invite-supporters-card';
import { NotificationBadge } from '@/components/lunebeam/notification-badge';

interface SupporterWithProfile extends Supporter {
  profile?: {
    first_name: string;
    avatar_url?: string;
  };
}

interface TabTeamIndividualProps {
  onNavigateToNotifications?: () => void;
}

export const TabTeamIndividual: React.FC<TabTeamIndividualProps> = ({ onNavigateToNotifications }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supporters, setSupporters] = useState<SupporterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSupporters();
    }
  }, [user]);

  const loadSupporters = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('TabTeamIndividual: Loading supporters for individual:', user.id);
      
      // Load supporters of the current user (people who support me)
      const supportersData = await PermissionsService.getSupporters(user.id);
      console.log('TabTeamIndividual: My supporters data:', supportersData);

      // Enrich with profile data
      const supportersWithProfiles = await Promise.all(
        supportersData.map(async (supporter) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('user_id', supporter.supporter_id)
            .single();
          
          return {
            ...supporter,
            profile: profile || { first_name: 'Support Team Member' },
          };
        })
      );
      
      setSupporters(supportersWithProfiles);
    } catch (error) {
      console.error('TabTeamIndividual: Error loading supporters:', error);
      toast({
        title: "Error",
        description: "Failed to load your support team",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'supporter': return <Users className="h-3 w-3" />;
      case 'friend': return <Heart className="h-3 w-3" />;
      case 'provider': return <ShieldCheck className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'supporter': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      case 'friend': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'provider': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getPermissionDescription = (permissionLevel: string) => {
    switch (permissionLevel) {
      case 'viewer': return 'Can view your progress';
      case 'collaborator': return 'Can help with your goals';
      default: return 'Part of your support team';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4">
        <div className="max-w-md mx-auto py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-md mx-auto space-y-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4rem)' }}>
        {/* Header */}
        <div 
          className="fixed left-0 right-0 z-40 px-6 pb-4 pt-4 bg-card/80 backdrop-blur border-b border-gray-200"
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Community</h1>
            {onNavigateToNotifications && (
              <NotificationBadge onNavigateToNotifications={onNavigateToNotifications} />
            )}
          </div>
        </div>

        {/* Invite Supporters Section */}
        <InviteSupportersCard onSuccess={loadSupporters} />

        {/* Support Team List */}
        {supporters.length > 0 ? (
          <div className="space-y-3">
            {supporters.map((supporter) => (
              <Card key={supporter.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {supporter.profile?.avatar_url && (
                        <AvatarImage src={supporter.profile.avatar_url} alt={supporter.profile?.first_name || 'Supporter'} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {supporter.profile?.first_name?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {supporter.profile?.first_name || 'Support Team Member'}
                        </h3>
                        {supporter.is_admin && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRoleColor(supporter.role)}`}
                        >
                          {getRoleIcon(supporter.role)}
                          <span className="ml-1 capitalize">{supporter.role}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {getPermissionDescription(supporter.permission_level)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-2">No Support Team Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your support team will appear here when they're added to help you with your goals.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">Need Help?</h4>
                <p className="text-sm text-muted-foreground">
                  If you need to update your support team or have questions about your goals, 
                  reach out to your main support person or use the chat feature.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};