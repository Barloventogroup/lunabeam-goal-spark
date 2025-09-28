import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Copy, Mail, MessageSquare, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { database } from "@/services/database";
import { supabase } from "@/integrations/supabase/client";
import type { ShareScope, FamilyCircle } from "@/types";

interface FamilyInviteModalProps {
  circle: FamilyCircle;
  trigger?: React.ReactNode;
}

const defaultShareScope: ShareScope = {
  goals: true,
  progress: true,
  checkins: false,
  badges: true,
  calendar: false,
  notes: false,
  reflections: false
};

const roleMessages = {
  individual: "You're in control. We'll start with one small goal together.",
  parent_guide: "Help co-pilot goals and cheer on progress. No private reflections.",
  cheerleader: "You'll see summaries and can send encouragement.",
  coach: "Collaborate on assigned goals; respect privacy settings."
};

export function FamilyInviteModal({ circle, trigger }: FamilyInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeContact, setInviteeContact] = useState('');
  const [role, setRole] = useState<'individual' | 'parent_guide' | 'cheerleader' | 'coach'>('parent_guide');
  const [shareScope, setShareScope] = useState<ShareScope>(defaultShareScope);
  const [customScope, setCustomScope] = useState(false);
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms'>('email');
  const [parentLedDraft, setParentLedDraft] = useState(false);
  const { toast } = useToast();

  const handleScopePreset = (preset: string) => {
    setCustomScope(false);
    switch (preset) {
      case 'full':
        setShareScope({
          goals: true,
          progress: true,
          checkins: true,
          badges: true,
          calendar: true,
          notes: true,
          reflections: false
        });
        break;
      case 'goals_only':
        setShareScope({
          goals: true,
          progress: false,
          checkins: false,
          badges: false,
          calendar: false,
          notes: false,
          reflections: false
        });
        break;
      case 'checkins_only':
        setShareScope({
          goals: false,
          progress: false,
          checkins: true,
          badges: false,
          calendar: false,
          notes: false,
          reflections: false
        });
        break;
      default:
        setShareScope(defaultShareScope);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteeContact.trim()) {
      toast({
        title: "Almost there!",
        description: "Who should we invite? Add their email or phone",
        variant: "destructive"
      });
      return;
    }

    // Prevent user from inviting their own email address
    const { data: { user } } = await supabase.auth.getUser();
    if (inviteeContact.includes('@') && user?.email && 
        inviteeContact.toLowerCase().trim() === user.email.toLowerCase()) {
      toast({
        title: "Invalid Email",
        description: "You cannot invite yourself. Please enter a different email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const invite = await database.createCircleInvite({
        circle_id: circle.id,
        invitee_name: inviteeName.trim() || undefined,
        invitee_contact: inviteeContact.trim(),
        role,
        share_scope: shareScope,
        message: message.trim() || undefined,
        delivery_method: deliveryMethod,
        parent_led_draft: parentLedDraft,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Send email invitation if email delivery is selected and we have an email
      if (deliveryMethod === 'email' && inviteeContact.includes('@')) {
        try {
          const siteUrl = window.location.origin;
          const inviteLink = `${siteUrl}/invitations?token=${invite.magic_token}`;
          
          const { data: currentUser } = await supabase.auth.getUser();
          const inviterName = currentUser?.user?.user_metadata?.full_name || 'Someone';

          await supabase.functions.invoke('send-invitation-email', {
            body: {
              type: 'family_circle',
              inviteeName: inviteeName || 'Friend',
              inviteeEmail: inviteeContact,
              inviterName,
              message: message.trim() || undefined,
              inviteLink,
              circeName: circle.name
            }
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          toast({
            title: "Invitation created",
            description: "Invitation created but email could not be sent. You can share the magic link manually.",
          });
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "Invite sent!",
        description: `Invite sent to ${inviteeName || inviteeContact}. Pending acceptance.`
      });

      setIsOpen(false);
      // Reset form
      setInviteeName('');
      setInviteeContact('');
      setRole('parent_guide');
      setShareScope(defaultShareScope);
      setMessage('');
      setParentLedDraft(false);
    } catch (error) {
      toast({
        title: "Invite didn't go through",
        description: "Let's try again in a bit",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMagicLink = () => {
    // This would generate the actual magic link
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${crypto.randomUUID()}`;
  };

  const copyMagicLink = () => {
    const link = generateMagicLink();
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Magic link copied to clipboard (expires in 7 days)"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite someone to your Circle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Who */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="Alex"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Email or phone *</Label>
              <Input
                id="contact"
                placeholder="alex@example.com or +1234567890"
                value={inviteeContact}
                onChange={(e) => setInviteeContact(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-3">
            <Label>Role</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parent_guide" id="parent_guide" />
                <Label htmlFor="parent_guide">Parent-Guide</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cheerleader" id="cheerleader" />
                <Label htmlFor="cheerleader">Cheerleader</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coach" id="coach" />
                <Label htmlFor="coach">Coach</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              {roleMessages[role]}
            </p>
          </div>

          {/* Share Scope */}
          <div className="space-y-3">
            <Label>Share Scope</Label>
            <RadioGroup 
              value={customScope ? 'custom' : 'default'} 
              onValueChange={(value) => {
                if (value !== 'custom') {
                  handleScopePreset(value);
                } else {
                  setCustomScope(true);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full plan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default">Goals + Progress summaries (default)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="goals_only" id="goals_only" />
                <Label htmlFor="goals_only">Goals only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="checkins_only" id="checkins_only" />
                <Label htmlFor="checkins_only">Check-ins only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom...</Label>
              </div>
            </RadioGroup>

            {customScope && (
              <div className="space-y-3 p-4 border rounded-lg">
                {Object.entries(shareScope).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">{key.replace('_', ' ')}</Label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        setShareScope(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="We're using Lunebeam to work on goals together..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Delivery */}
          <div className="space-y-3">
            <Label>Delivery</Label>
            <RadioGroup value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Mail className="h-4 w-4" />
                <Label htmlFor="email">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <MessageSquare className="h-4 w-4" />
                <Label htmlFor="sms">SMS</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Parent Led Draft */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Start Parent-Led, Transfer Later</Label>
              <p className="text-sm text-muted-foreground">
                You can create up to 2 starter goals before acceptance
              </p>
            </div>
            <Switch
              checked={parentLedDraft}
              onCheckedChange={setParentLedDraft}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSendInvite} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send Invite"}
            </Button>
            <Button 
              variant="outline" 
              onClick={copyMagicLink}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Magic Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}