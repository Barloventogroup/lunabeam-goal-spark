import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  Share2,
  QrCode
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FamilyInviteModal } from '../lunebeam/family-invite-modal';

export const TabTeam: React.FC = () => {
  const { familyCircles, loadFamilyCircles } = useStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadFamilyCircles();
  }, [loadFamilyCircles]);

  const primaryCircle = familyCircles[0]; // For MVP, focus on first circle

  const mockMembers = [
    { id: '1', name: 'You', role: 'Admin', avatar: '👤', isOwner: true },
    { id: '2', name: 'Mom', role: 'Parent Guide', avatar: '👩', isOwner: false },
    { id: '3', name: 'Sarah (Coach)', role: 'Coach', avatar: '👩‍🏫', isOwner: false },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'Edit': return <Edit3 className="h-4 w-4 text-green-500" />;
      case 'Comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'View': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'Parent Guide': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Coach': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'Cheerleader': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
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
          {/* Family Circle Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Circle Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                  </div>
                  {!member.isOwner && (
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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

          {/* Permissions Guide */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Permission Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Crown className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="font-medium">Admin</div>
                  <div className="text-muted-foreground">Full access, invite/remove members</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Edit3 className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">Parent Guide</div>
                  <div className="text-muted-foreground">Can edit goals and add comments</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">Coach</div>
                  <div className="text-muted-foreground">Can comment and provide guidance</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">Cheerleader</div>
                  <div className="text-muted-foreground">Can view progress and celebrate wins</div>
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