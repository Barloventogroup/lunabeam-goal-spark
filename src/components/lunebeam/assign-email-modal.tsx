import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssignEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  individualId: string;
  individualName: string;
  onSuccess?: () => void;
}

export const AssignEmailModal: React.FC<AssignEmailModalProps> = ({
  open,
  onOpenChange,
  individualId,
  individualName,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Update the individual's email and send invitation via the simplified flow
      // First update the profile with the email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email: email.trim(),
          account_status: 'pending_user_consent'
        })
        .eq('user_id', individualId);

      if (updateError) {
        throw updateError;
      }

      // Generate invite link
      const inviteLink = `${window.location.origin}/auth?mode=signup`;

      // Send invitation email
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          type: 'individual',
          inviteeName: individualName,
          inviteeEmail: email.trim(),
          inviterName: 'Your supporter',
          inviteLink: inviteLink,
          message: message.trim() || `Welcome to Lunabeam! Your account has been set up and is ready for you to start tracking your goals.`
        }
      });

      if (error) {
        console.error('Error sending invitation:', error);
        throw error;
      }

      toast({
        title: "Invitation Sent!",
        description: `Magic link sent to ${email}. They can now access their account.`,
      });

      // Reset form and close modal
      setEmail('');
      setMessage('');
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send invitation email",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Account Invite
          </DialogTitle>
          <DialogDescription>
            Send a magic link invitation to allow the individual to access their account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Sending invitation to <strong>{individualName}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              They'll receive a magic link to access their account and can set their own password.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter their email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !email.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};