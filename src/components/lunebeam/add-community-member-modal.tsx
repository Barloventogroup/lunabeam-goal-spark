import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PermissionsService } from '@/services/permissionsService';
import { useAuth } from '@/components/auth/auth-provider';

interface AddCommunityMemberModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  individualId?: string; // The person who needs support
}

export const AddCommunityMemberModal: React.FC<AddCommunityMemberModalProps> = ({ 
  trigger, 
  onSuccess,
  individualId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'supporter',
    permission_level: 'viewer',
    email: '',
    phone: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'supporter',
      permission_level: 'viewer',
      email: '',
      phone: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim() || !formData.email.trim()) return;

    // Determine who needs support - use prop or current user as fallback
    const targetIndividualId = individualId || user.id;
    
    setLoading(true);
    try {
      // Use PermissionsService which handles approval workflow
      const inviteResult = await PermissionsService.createSupporterInvite({
        individual_id: targetIndividualId, // The person who needs support
        inviter_id: user.id, // The person sending the invitation
        invitee_name: formData.name.trim(),
        invitee_email: formData.email.trim(),
        role: formData.role as any,
        permission_level: formData.permission_level as any,
        specific_goals: [],
        message: `${formData.name} has been invited to join your support network.`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });

      // Check if it's a request or direct invitation based on status
      const isRequest = inviteResult.status === 'pending_admin_approval';
      
      if (isRequest) {
        toast({
          title: "Request Sent for Approval",
          description: `Your request to add ${formData.name} has been sent to an admin for approval.`
        });
      } else {
        // For direct invitations, also send email
        const inviteLink = `${window.location.origin}/invitations/${inviteResult.invite_token}`;
        
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            type: 'supporter',
            inviteeName: formData.name,
            inviteeEmail: formData.email,
            inviterName: user?.user_metadata?.first_name || 'Your friend',
            inviteLink: inviteLink,
            message: `${formData.name} has been invited to join your support network.`
          }
        });

        toast({
          title: "Invitation Sent",
          description: `Invitation sent to ${formData.name} successfully.`
        });
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Community Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select 
              value={formData.permission_level} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, permission_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="collaborator">Collaborator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};