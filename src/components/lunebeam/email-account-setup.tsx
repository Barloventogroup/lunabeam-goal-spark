import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setLoading(true);

      // Create the individual account directly (simplified approach)
      const { data, error } = await supabase.rpc('provision_individual_direct', {
        p_first_name: firstName.trim(),
        p_strengths: [],
        p_interests: [],
        p_comm_pref: 'text'
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result) {
        throw new Error('Failed to create individual account');
      }

      toast.success(`Account created for ${firstName}! They will appear in your Community view.`);

      onSuccess();
      
      // Reset form
      setFirstName('');

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
                  <li>They will appear in your Community view</li>
                  <li>You can manage their goals and progress</li>
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
      </DialogContent>
    </Dialog>
  );
};