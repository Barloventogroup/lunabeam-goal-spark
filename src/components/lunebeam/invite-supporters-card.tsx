import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail } from 'lucide-react';
import { AddCommunityMemberModal } from '@/components/lunebeam/add-community-member-modal';
import { SimpleInviteModal } from '@/components/lunebeam/simple-invite-modal';

interface InviteSupportersCardProps {
  onSuccess?: () => void;
}

export const InviteSupportersCard: React.FC<InviteSupportersCardProps> = ({ onSuccess }) => {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserPlus className="h-6 w-6 text-primary" />
          Add Supporters
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Build your support network by inviting friends, family, coaches, or mentors to help you achieve your goals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AddCommunityMemberModal 
              trigger={
                <Button size="lg" className="w-full h-12 text-base font-medium">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Invite Supporter
                </Button>
              }
              onSuccess={onSuccess}
            />
            <SimpleInviteModal 
              trigger={
                <Button variant="outline" size="lg" className="w-full h-12 text-base font-medium">
                  <Mail className="h-5 w-5 mr-2" />
                  Quick Invite
                </Button>
              }
            />
          </div>
          <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> Supporters can view your progress, cheer you on, and help keep you accountable on your journey
          </div>
        </div>
      </CardContent>
    </Card>
  );
};