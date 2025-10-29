import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { AddCommunityMemberModal } from '@/components/lunebeam/add-community-member-modal';

interface InviteSupportersCardProps {
  onSuccess?: () => void;
}

export const InviteSupportersCard: React.FC<InviteSupportersCardProps> = ({ onSuccess }) => {
  return (
    <Card className="w-full bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="text-xl">
          Add Supporters
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Build your support network by inviting friends, family, coaches, or mentors to help you achieve your goals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AddCommunityMemberModal 
            trigger={
              <Button size="lg" className="w-full h-12 text-base font-medium">
                Invite Someone
              </Button>
            }
            onSuccess={onSuccess}
          />
          <div className="text-sm text-muted-foreground text-center bg-muted/50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> Supporters can view your progress, cheer you on, and help keep you accountable on your journey
          </div>
        </div>
      </CardContent>
    </Card>
  );
};