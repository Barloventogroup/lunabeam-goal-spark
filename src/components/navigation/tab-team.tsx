import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  Share2,
  QrCode,
  Shield,
  Heart,
  Briefcase,
  Loader2
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/auth-provider';
import { FamilyInviteModal } from '../lunebeam/family-invite-modal';
import { SupporterManagement } from '../permissions/supporter-management';
import { PermissionsService, type Supporter, type PermissionLevel } from '@/services/permissionsService';
import { useToast } from '@/hooks/use-toast';

export const TabTeam: React.FC = () => {
  const { familyCircles, loadFamilyCircles } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyCircles();
    if (user) {
      loadSupporters();
    }
  }, [loadFamilyCircles, user]);

  const loadSupporters = async () => {
    if (!user) return;
    
    try {
      const data = await PermissionsService.getSupporters(user.id);
      setSupporters(data);
    } catch (error) {
      console.error('Failed to load supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const primaryCircle = familyCircles[0]; // For MVP, focus on first circle

  // Create team members list including current user and supporters
  const teamMembers = [
    {
      id: user?.id || 'current-user',
      name: 'You',
      role: 'admin' as const,
      permission_level: 'admin' as const,
      isOwner: true,
      avatar: '👤',
      is_provisioner: false
    },
    ...supporters.map(supporter => ({
      id: supporter.id,
      name: `Team Member`, // In a real app, you'd get this from profiles
      role: supporter.role,
      permission_level: supporter.permission_level,
      isOwner: false,
      avatar: getAvatarForRole(supporter.role),
      is_provisioner: supporter.is_provisioner || false
    }))
  ];

  // Helper functions for roles and permissions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'supporter': return <Heart className="h-4 w-4 text-red-500" />;
      case 'provider': return <Briefcase className="h-4 w-4 text-purple-500" />;
      case 'friend': return <Users className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'collaborator': return <Edit3 className="h-4 w-4 text-green-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'supporter': return 'Supporter';
      case 'provider': return 'Provider';
      case 'friend': return 'Friend';
      default: return 'Team Member';
    }
  };

  const getPermissionDisplayName = (permission: string) => {
    switch (permission) {
      case 'admin': return 'Admin';
      case 'collaborator': return 'Collaborator';
      case 'viewer': return 'Viewer';
      default: return 'Viewer';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'supporter': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'provider': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'friend': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'collaborator': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'viewer': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getAvatarForRole = (role: string) => {
    switch (role) {
      case 'supporter': return '❤️';
      case 'provider': return '👩‍⚕️';
      case 'friend': return '👋';
      default: return '👤';
    }
  };

  const handleUpdatePermissions = async (supporterId: string, permission_level: PermissionLevel) => {
    try {
      await PermissionsService.updateSupporterPermissions(supporterId, { permission_level });
      await loadSupporters();
      
      toast({
        title: "Permissions Updated",
        description: "Team member permissions have been updated"
      });
    } catch (error) {
      console.error('Failed to update permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="p-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Team</h1>
              <p className="text-sm text-muted-foreground">
                {primaryCircle ? primaryCircle.name : 'Family Circle'}
              </p>
            </div>
            <Button 
              onClick={() => setShowInviteModal(true)}
              size="sm"
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading team members...</span>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                  <p className="text-sm">Invite family, friends, or coaches to join your team</p>
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{member.name}</span>
                        {member.isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
                        {member.is_provisioner && (
                          <Badge variant="outline" className="border-yellow-200 text-yellow-800 text-xs">
                            Provisioner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {getRoleIcon(member.role)}
                          {getRoleDisplayName(member.role)}
                        </Badge>
                        <Badge variant="outline" className={getPermissionColor(member.permission_level)}>
                          {getPermissionIcon(member.permission_level)}
                          {getPermissionDisplayName(member.permission_level)}
                        </Badge>
                      </div>
                    </div>
                    {!member.isOwner && (
                      <Select
                        value={member.permission_level}
                        onValueChange={(value: PermissionLevel) => handleUpdatePermissions(member.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="collaborator">Collaborator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Invites & Join Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share & Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowInviteModal(true)}
                variant="outline" 
                className="w-full justify-start gap-3"
              >
                <UserPlus className="h-4 w-4" />
                Send Invitation Link
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
              >
                <QrCode className="h-4 w-4" />
                Show QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Team Management */}
          {user && (
            <SupporterManagement individualId={user.id} />
          )}

          {/* Permission Guide */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Roles & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Permission Levels</h4>
                <div className="flex items-center gap-3">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="font-medium">Admin</div>
                    <div className="text-muted-foreground">Full access, invite/remove members, manage all goals</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Edit3 className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">Collaborator</div>
                    <div className="text-muted-foreground">Can edit goals, add steps, and mark progress</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-muted-foreground">Can view goals and progress only</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-border/60">
                <h4 className="font-medium text-muted-foreground">Team Roles</h4>
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="font-medium">Supporter</div>
                    <div className="text-muted-foreground">Family member, coach, or mentor</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Friend</div>
                    <div className="text-muted-foreground">Peer support and accountability partner</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">Provider</div>
                    <div className="text-muted-foreground">Professional service provider or therapist</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && primaryCircle && (
        <FamilyInviteModal circle={primaryCircle} />
      )}
    </>
  );
};