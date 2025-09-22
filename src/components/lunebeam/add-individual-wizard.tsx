import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

interface AddIndividualWizardProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const AddIndividualWizard: React.FC<AddIndividualWizardProps> = ({ 
  trigger, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    strengths: '',
    interests: '',
    commPref: 'text'
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      strengths: '',
      interests: '',
      commPref: 'text'
    });
    setStep(1);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.firstName.trim()) return;

    setLoading(true);
    try {
      // Create individual profile via provision function
      const { data: provisionResult, error } = await supabase.rpc('provision_individual', {
        p_first_name: formData.firstName.trim(),
        p_strengths: formData.strengths ? formData.strengths.split(',').map(s => s.trim()).filter(Boolean) : [],
        p_interests: formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        p_comm_pref: formData.commPref
      });

      if (error) throw error;

      toast({
        title: "Individual Added",
        description: `${formData.firstName} has been added to your support network.`
      });

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding individual:', error);
      toast({
        title: "Error",
        description: "Failed to add individual. Please try again.",
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
          <DialogTitle>
            Add Individual - Step {step} of 2
          </DialogTitle>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths (Optional)</Label>
              <Input
                id="strengths"
                placeholder="e.g., Creative, Athletic, Good listener (comma-separated)"
                value={formData.strengths}
                onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests (Optional)</Label>
              <Input
                id="interests"
                placeholder="e.g., Music, Sports, Reading (comma-separated)"
                value={formData.interests}
                onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
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
                onClick={handleNext}
                disabled={!formData.firstName.trim()}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Contact information is optional but helps with communication and invitations.
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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

            <div className="space-y-2">
              <Label htmlFor="commPref">Preferred Communication</Label>
              <select
                id="commPref"
                className="w-full p-2 border border-input rounded-md bg-background"
                value={formData.commPref}
                onChange={(e) => setFormData(prev => ({ ...prev, commPref: e.target.value }))}
              >
                <option value="text">Text/SMS</option>
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="app">In-App Only</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add Individual'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};