import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, Mail } from "lucide-react";
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
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'create' | 'assign-email'>('create');
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setLoading(true);

      // Create actual Supabase auth user with random password
      const tempPassword = crypto.randomUUID();
      const tempEmail = `${firstName.toLowerCase().replace(/\s+/g, '')}${Date.now()}@temp.local`;

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        user_metadata: {
          first_name: firstName.trim(),
          created_by_admin: true
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          first_name: firstName.trim(),
          email: tempEmail,
          user_type: 'individual',
          account_status: 'pending_user_consent',
          authentication_status: 'pending',
          password_set: false,
          onboarding_complete: false,
          comm_pref: 'text'
        });

      if (profileError) throw profileError;

      // Create supporter relationship
      const { error: supportError } = await supabase
        .from('supporters')
        .insert({
          individual_id: authData.user.id,
          supporter_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'supporter',
          permission_level: 'collaborator',
          is_admin: true,
          is_provisioner: true
        });

      if (supportError) throw supportError;

      setCreatedUserId(authData.user.id);
      setStep('assign-email');
      toast.success(`Account created for ${firstName}! Now assign them an email.`);

    } catch (error: any) {
      console.error('Failed to create account:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !createdUserId) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setLoading(true);

      // Update user's email in auth
      const { error: authError } = await supabase.auth.admin.updateUserById(
        createdUserId,
        { email: email.trim() }
      );

      if (authError) throw authError;

      // Update profile email
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: email.trim() })
        .eq('user_id', createdUserId);

      if (profileError) throw profileError;

      // Send magic link
      const { error: otpError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email.trim(),
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (otpError) throw otpError;

      toast.success(`Magic link sent to ${email}! They can now log in and set their password.`);
      
      onSuccess();
      
      // Reset form
      setFirstName('');
      setEmail('');
      setStep('create');
      setCreatedUserId(null);
      onClose();

    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
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
            Create account for someone
          </DialogTitle>
        </DialogHeader>

        {step === 'create' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter their first name"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">What happens:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>A new account will be created immediately</li>
                    <li>You'll assign them an email address</li>
                    <li>They'll receive a magic link to log in and set their password</li>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter their email address"
                required
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Ready to send invitation:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Account for <strong>{firstName}</strong> has been created</li>
                    <li>They'll receive a magic link at this email</li>
                    <li>No password needed - they'll set one after logging in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('create')} 
                className="flex-1"
              >
                Back
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
        )}
      </DialogContent>
    </Dialog>
  );
};