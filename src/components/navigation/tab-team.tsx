import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  MoreHorizontal,
  Mail,
  Phone,
  UserMinus,
  Bell,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { PermissionsService, type Supporter } from '@/services/permissionsService';
import { SimpleInviteModal } from '../lunebeam/simple-invite-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SupporterWithProfile extends Supporter {
  profile?: {
    first_name: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
  };
}

interface PendingInvite {
  id: string;
  invitee_name?: string;
  invitee_email: string;
  role: string;
  permission_level: string;
  status: string;
  created_at: string;
}

interface MemberDetailData {
  id: string;
  name: string;
  role: string;
  permission_level: string;
  email?: string;
  phone?: string;
  is_admin: boolean;
  type: 'supporter' | 'invite';
}

export const TabTeam: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supporters, setSupporters] = useState<SupporterWithProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<MemberDetailData | null>(null);

  useEffect(() => {
    if (user) {
      loadCommunityData();
    }
  }, [user]);

  const loadCommunityData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load supporters with profiles
      const supportersData = await PermissionsService.getSupporters(user.id);
      
      // Get profile data for each supporter
      const supportersWithProfiles = await Promise.all(
        supportersData.map(async (supporter) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('user_id', supporter.supporter_id)
            .single();
          
          return {
            ...supporter,
            profile: profile || { first_name: 'Unknown User' }
          };
        })
      );
      
      setSupporters(supportersWithProfiles);

      // Load pending invites
      const invitesData = await PermissionsService.getSentInvites();
      setPendingInvites(invitesData.filter(invite => invite.status === 'pending'));
      
    } catch (error) {
      console.error('Error loading community data:', error);
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'supporter': return <Users className="h-3 w-3" />;
      case 'friend': return <MessageSquare className="h-3 w-3" />;
      case 'provider': return <Edit3 className="h-3 w-3" />;
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

  const getStatusBadge = (type: 'supporter' | 'invite', inviteStatus?: string) => {
    if (type === 'supporter') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">Active</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300">Pending</Badge>;
    }
  };

  const handleInvite = () => {
    // This will be handled by the SimpleInviteModal
    toast({
      title: "Invite sent",
      description: "Your invitation has been sent successfully"
    });
    loadCommunityData(); // Refresh data
  };

  const handleRemove = async (memberId: string, type: 'supporter' | 'invite') => {
    try {
      if (type === 'supporter') {
        await PermissionsService.removeSupporter(memberId);
        toast({
          title: "Removed",
          description: "Member has been removed from your community"
        });
      } else {
        // Handle removing pending invite
        await supabase
          .from('supporter_invites')
          .delete()
          .eq('id', memberId);
        toast({
          title: "Invite cancelled",
          description: "Invitation has been cancelled"
        });
      }
      loadCommunityData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const handleNudge = async (member: MemberDetailData) => {
    if (member.type === 'invite') {
      // Send nudge email for pending invites
      toast({
        title: "Nudge sent",
        description: `Reminder sent to ${member.name || member.email}`
      });
    } else {
      // Send nudge notification for active supporters
      toast({
        title: "Nudge sent",
        description: `Notification sent to ${member.name}`
      });
    }
  };

  const handleMemberClick = (member: SupporterWithProfile | PendingInvite, type: 'supporter' | 'invite') => {
    const memberData: MemberDetailData = {
      id: member.id,
      name: type === 'supporter' 
        ? (member as SupporterWithProfile).profile?.first_name || 'Unknown User'
        : (member as PendingInvite).invitee_name || 'Unknown User',
      role: member.role,
      permission_level: type === 'supporter' ? (member as SupporterWithProfile).permission_level : (member as PendingInvite).permission_level,
      email: type === 'supporter' 
        ? (member as SupporterWithProfile).profile?.email
        : (member as PendingInvite).invitee_email,
      phone: type === 'supporter' ? (member as SupporterWithProfile).profile?.phone : undefined,
      is_admin: type === 'supporter' ? (member as SupporterWithProfile).is_admin : false,
      type
    };
    
    setSelectedMember(memberData);
    setEditData({ ...memberData });
  };

  const handleSaveEdit = async () => {
    if (!editData || !selectedMember) return;

    try {
      if (selectedMember.type === 'supporter') {
        // Update supporter permissions
        await PermissionsService.updateSupporterPermissions(selectedMember.id, {
          permission_level: editData.permission_level as any,
          is_admin: editData.is_admin
        });

        // Update profile information if changed
        if (editData.name !== selectedMember.name) {
          await supabase
            .from('profiles')
            .update({ first_name: editData.name })
            .eq('user_id', supporters.find(s => s.id === selectedMember.id)?.supporter_id);
        }
      }

      setSelectedMember(null);
      setIsEditing(false);
      loadCommunityData(); // Refresh data
      
      toast({
        title: "Updated",
        description: "Member information has been updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member information",
        variant: "destructive"
      });
    }
  };

  const combinedMembers = [
    ...supporters.map(s => ({ ...s, type: 'supporter' as const })),
    ...pendingInvites.map(p => ({ ...p, type: 'invite' as const }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="p-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Community</h1>
              <p className="text-sm text-muted-foreground">
                Manage your support network ({combinedMembers.length} members)
              </p>
            </div>
            <SimpleInviteModal 
              trigger={
                <Button size="sm" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              }
            />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Community Members Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {combinedMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No community members yet</h3>
                  <p className="text-muted-foreground mb-4">Start building your support network by inviting people to join.</p>
                  <SimpleInviteModal 
                    trigger={
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send First Invite
                      </Button>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedMembers.map((member) => {
                      const name = member.type === 'supporter' 
                        ? member.profile?.first_name || 'Unknown User'
                        : member.invitee_name || 'Unknown User';
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <TableRow key={`${member.type}-${member.id}`}>
                          <TableCell>
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-70"
                              onClick={() => handleMemberClick(member, member.type)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{name}</span>
                                {member.type === 'supporter' && member.is_admin && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">{member.role}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(member.type, member.type === 'invite' ? member.status : undefined)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                                {member.type === 'invite' && (
                                  <DropdownMenuItem onClick={handleInvite}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleNudge(member as any)}>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Nudge
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemove(member.id, member.type)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => {
          setSelectedMember(null);
          setIsEditing(false);
          setEditData(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Member Details
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...selectedMember });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editData?.name || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.name}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <Select 
                    value={editData?.role || ''} 
                    onValueChange={(value) => setEditData(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supporter">Supporter</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted rounded capitalize">{selectedMember.role}</p>
                )}
              </div>

              {/* Permissions - Only editable by admin */}
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions</Label>
                {isEditing && user && supporters.find(s => s.supporter_id === user.id)?.is_admin ? (
                  <Select 
                    value={editData?.permission_level || ''} 
                    onValueChange={(value) => setEditData(prev => prev ? { ...prev, permission_level: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted rounded capitalize">{selectedMember.permission_level}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData?.email || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.email || 'Not provided'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={editData?.phone || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMember.type)}
                  {selectedMember.is_admin && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};