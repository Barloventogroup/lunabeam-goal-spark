import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailAccountSetupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmailAccountSetup: React.FC<EmailAccountSetupProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    message: '',
    strengths: [] as string[],
    interests: [] as string[],
    commPref: 'text'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Call the new provisioning function
      const { data, error } = await supabase.rpc('provision_individual_with_email', {
        p_first_name: formData.firstName.trim(),
        p_invitee_email: formData.email.trim(),
        p_strengths: formData.strengths,
        p_interests: formData.interests,
        p_comm_pref: formData.commPref
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result) {
        throw new Error('Failed to create account provision');
      }

      // Get current user's name for the email
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-account-invitation', {
        body: {
          invitee_email: formData.email,
          invitee_name: formData.firstName,
          inviter_name: profile?.first_name || 'Someone',
          claim_token: result.claim_token,
          magic_link_token: result.magic_link_token,
          message: formData.message.trim() || undefined
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        toast.error('Account was created but invitation email failed to send');
      } else {
        toast.success(`Invitation sent to ${formData.email}!`);
      }

      onSuccess();
      
      // Reset form
      setFormData({
        firstName: '',
        email: '',
        message: '',
        strengths: [],
        interests: [],
        commPref: 'text'
      });

    } catch (error: any) {
      console.error('Failed to set up account:', error);
      toast.error(error.message || 'Failed to set up account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Set up account for someone
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter their first name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="their.email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Add a personal note to include in the invitation..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">What happens next:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>An invitation email will be sent to their address</li>
                  <li>They'll click a secure link to set up their account</li>
                  <li>No passwords needed - they'll use magic link authentication</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};