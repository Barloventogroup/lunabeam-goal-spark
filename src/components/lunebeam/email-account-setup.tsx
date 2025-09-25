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

    setFirstName(firstName.trim());
    setStep('assign-email');
    toast.success(`Ready to create account for ${firstName.trim()}! Enter their email address.`);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !firstName.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setLoading(true);

      // Create account using regular signup (this will require email confirmation)
      const tempPassword = crypto.randomUUID();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: {
          data: {
            first_name: firstName.trim(),
            created_by_admin: true
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

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

      toast.success(`Account created and confirmation email sent to ${email}! They need to confirm their email, then they can set their password.`);
      
      onSuccess();
      
      // Reset form
      setFirstName('');
      setEmail('');
      setStep('create');
      setCreatedUserId(null);
      onClose();

    } catch (error: any) {
      console.error('Failed to create account:', error);
      toast.error(error.message || 'Failed to create account');
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
                    <li>Enter their name, then their email address</li>
                    <li>An account will be created and confirmation email sent</li>
                    <li>They confirm their email, then set their password</li>
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
                  <p className="font-medium">Ready to create account:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Account for <strong>{firstName}</strong> will be created</li>
                    <li>Confirmation email will be sent to this address</li>
                    <li>They confirm email, then set their password</li>
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