import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInvitationForm, sanitizeInput } from '@/utils/validateInviteFlow';
import { ErrorHandlers } from '@/utils/errorHandling';

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
    // Validate all form inputs
    const validation = validateInvitationForm({
      email: email,
      individualName: individualName,
      message: message
    });

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors[0], // Show first error
        variant: "destructive"
      });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedMessage = sanitizeInput(message);

    // Validate required fields
    if (!individualId) {
      toast({
        title: "Error",
        description: "Individual ID is required",
        variant: "destructive"
      });
      return;
    }

    if (!individualName?.trim()) {
      toast({
        title: "Error", 
        description: "Individual name is required",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Update the individual's profile with email and proper status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email: sanitizedEmail,
          account_status: 'pending_user_consent',
          authentication_status: 'pending'
        })
        .eq('user_id', individualId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // Generate a unique claim token for this invitation
      const claimToken = crypto.randomUUID().replace(/-/g, '').substring(0, 24);
      
      // Create an account claim record with magic link token
      const { error: claimError } = await supabase
        .from('account_claims')
        .insert({
          individual_id: individualId,
          provisioner_id: (await supabase.auth.getUser()).data.user?.id,
          invitee_email: sanitizedEmail,
          first_name: individualName,
          claim_token: claimToken,
          magic_link_token: claimToken, // Use the same token for now
          status: 'pending'
        });

      if (claimError) {
        console.error('Account claim error:', claimError);
        throw new Error(`Failed to create account claim: ${claimError.message}`);
      }

      // Generate invitation link that leads to signup with claim mode
      const inviteLink = `${window.location.origin}/auth?mode=claim&token=${claimToken}&email=${encodeURIComponent(sanitizedEmail)}`;

      // Send invitation email with proper error handling
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          type: 'individual',
          inviteeName: individualName,
          inviteeEmail: sanitizedEmail,
          inviterName: 'Your supporter',
          inviteLink: inviteLink,
          message: sanitizedMessage || `Welcome to Lunabeam! Your account has been set up and is ready for you to start tracking your goals. Click the link to create your password and get started.`
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        throw new Error(`Failed to send invitation email: ${error.message || 'Unknown error'}`);
      }

      console.log('Invitation email sent successfully:', data);

      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${sanitizedEmail}. They will receive an email with setup instructions.`,
      });

      // Reset form and close modal
      setEmail('');
      setMessage('');
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      const formattedError = ErrorHandlers.invitation(error);
      toast({
        title: "Failed to Send Invitation",
        description: formattedError.message,
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
            Send an invitation email to allow the individual to access their account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Sending invitation to <strong>{individualName}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              They'll receive an invitation email with instructions to access their account.
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