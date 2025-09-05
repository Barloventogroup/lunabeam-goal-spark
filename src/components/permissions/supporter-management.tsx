import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Settings, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { PermissionsService, type Supporter, type PermissionLevel, type UserRole } from '@/services/permissionsService';
import { useAuth } from '@/components/auth/auth-provider';

interface SupporterManagementProps {
  individualId: string;
}

export function SupporterManagement({ individualId }: SupporterManagementProps) {
  const { user } = useAuth();
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'supporter' as UserRole,
    permission_level: 'viewer' as PermissionLevel,
    message: ''
  });

  useEffect(() => {
    loadSupporters();
  }, [individualId]);

  const loadSupporters = async () => {
    try {
      const data = await PermissionsService.getSupporters(individualId);
      setSupporters(data);
    } catch (error) {
      console.error('Failed to load supporters:', error);
      toast({
        title: "Error",
        description: "Failed to load supporters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSupporter = async () => {
    if (!user) return;

    try {
      await PermissionsService.createSupporterInvite({
        individual_id: individualId,
        inviter_id: user.id,
        invitee_email: inviteForm.email,
        invitee_name: inviteForm.name,
        role: inviteForm.role,
        permission_level: inviteForm.permission_level,
        specific_goals: [],
        message: inviteForm.message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

      toast({
        title: "Invite Sent",
        description: `Invitation sent to ${inviteForm.email}`
      });

      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        name: '',
        role: 'supporter',
        permission_level: 'viewer',
        message: ''
      });
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePermissions = async (supporterId: string, permission_level: PermissionLevel) => {
    try {
      await PermissionsService.updateSupporterPermissions(supporterId, { permission_level });
      await loadSupporters();
      
      toast({
        title: "Permissions Updated",
        description: "Supporter permissions have been updated"
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

  const handleRemoveSupporter = async (supporterId: string) => {
    try {
      await PermissionsService.removeSupporter(supporterId);
      await loadSupporters();
      
      toast({
        title: "Supporter Removed",
        description: "Supporter has been removed"
      });
    } catch (error) {
      console.error('Failed to remove supporter:', error);
      toast({
        title: "Error",
        description: "Failed to remove supporter",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'supporter': return 'bg-blue-100 text-blue-800';
      case 'friend': return 'bg-green-100 text-green-800';
      case 'provider': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionColor = (level: PermissionLevel) => {
    switch (level) {
      case 'viewer': return 'bg-gray-100 text-gray-800';
      case 'collaborator': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supporters & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Supporters & Permissions</CardTitle>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Invite Supporter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Supporter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="supporter@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Supporter Name"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteForm.role} onValueChange={(value: UserRole) => setInviteForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supporter">Supporter (Family/Coach)</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="provider">Provider/Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="permission">Permission Level</Label>
                <Select value={inviteForm.permission_level} onValueChange={(value: PermissionLevel) => setInviteForm(prev => ({ ...prev, permission_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Can only see goals and progress</SelectItem>
                    <SelectItem value="collaborator">Collaborator - Can suggest/edit steps and mark progress</SelectItem>
                    <SelectItem value="admin">Admin - Full access to create/edit/delete goals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Input
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Personal invitation message..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteSupporter} disabled={!inviteForm.email}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {supporters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No supporters yet</p>
            <p className="text-sm">Invite family, friends, or coaches to support your goals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {supporters.map((supporter) => (
              <div key={supporter.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getRoleColor(supporter.role)}>
                      {supporter.role}
                    </Badge>
                    <Badge className={getPermissionColor(supporter.permission_level)}>
                      {supporter.permission_level}
                    </Badge>
                    {supporter.is_provisioner && (
                      <Badge variant="outline" className="border-yellow-200 text-yellow-800">
                        Provisioner
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(supporter.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={supporter.permission_level}
                    onValueChange={(value: PermissionLevel) => handleUpdatePermissions(supporter.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSupporter(supporter.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}