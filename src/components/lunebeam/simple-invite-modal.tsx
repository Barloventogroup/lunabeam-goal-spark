import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SimpleInviteModalProps {
  trigger?: React.ReactNode;
}

export function SimpleInviteModal({ trigger }: SimpleInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [role, setRole] = useState('friend');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSendInvite = async () => {
    if (!inviteeEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the invitation",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const siteUrl = window.location.origin;
      const inviteLink = `${siteUrl}/auth?invited=true`;
      
      const { data: currentUser } = await supabase.auth.getUser();
      const inviterName = currentUser?.user?.user_metadata?.full_name || 'Someone';

      await supabase.functions.invoke('send-invitation-email', {
        body: {
          type: 'supporter',
          inviteeName: inviteeName || 'Friend',
          inviteeEmail: inviteeEmail,
          inviterName,
          message: message || undefined,
          inviteLink,
          roleName: role
        }
      });

      toast({
        title: "Invitation sent!",
        description: `Email invitation sent to ${inviteeEmail}`,
      });

      // Reset form
      setInviteeName('');
      setInviteeEmail('');
      setRole('friend');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Failed to send invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start gap-3">
            <Mail className="h-4 w-4" />
            Send Invitation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invitation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              placeholder="Friend's name"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="coach">Coach/Mentor</SelectItem>
                <SelectItem value="supporter">Supporter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Come join me on LuneBeam to track goals together!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite} 
              disabled={isLoading || !inviteeEmail.trim()}
              className="flex-1"
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}