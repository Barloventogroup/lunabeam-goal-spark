import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddCommunityMemberModal } from '@/components/lunebeam/add-community-member-modal';
import { Lightbulb } from 'lucide-react';
interface InviteSupportersCardProps {
  onSuccess?: () => void;
}
export const InviteSupportersCard: React.FC<InviteSupportersCardProps> = ({
  onSuccess
}) => {
  return <Card className="w-full bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="text-xl">Add Community Members</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Build your support network by inviting friends, family, coaches, or mentors to help you achieve your goals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AddCommunityMemberModal trigger={<Button size="lg" className="w-full h-12 text-base font-medium">
                Invite Someone
              </Button>} onSuccess={onSuccess} />
          <div className="flex gap-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-foreground mb-1">Tip</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Supporters can view your progress, cheer you on, and help keep you accountable on your journey
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};