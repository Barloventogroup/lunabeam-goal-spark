import { useState } from "react";
import { ArrowLeft, MoreHorizontal, UserPlus, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Invitation {
  id: string;
  name: string;
  avatarUrl?: string;
  message: string;
  goal?: string;
  mutualFriends: number;
  sentAt: string;
  type: 'received' | 'sent';
}

const mockInvitations: Invitation[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatarUrl: '',
    message: 'Hey! I saw your guitar learning goal and would love to be your practice buddy!',
    goal: 'Learn Guitar - Master Basic Chords',
    mutualFriends: 3,
    sentAt: '2 hours ago',
    type: 'received'
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatarUrl: '',
    message: 'Would love to support your fitness journey!',
    goal: 'Morning Workout Routine',
    mutualFriends: 1,
    sentAt: '1 day ago',
    type: 'received'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    avatarUrl: '',
    message: 'Sent you a friend request',
    mutualFriends: 0,
    sentAt: '3 days ago',
    type: 'sent'
  }
];

export function TabInvitations() {
  const navigate = useNavigate();
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  
  const receivedInvitations = mockInvitations.filter(inv => inv.type === 'received');
  const sentInvitations = mockInvitations.filter(inv => inv.type === 'sent');

  const handleAcceptInvitation = (invitationId: string) => {
    console.log('Accepting invitation:', invitationId);
    setSelectedInvitation(null);
    // TODO: Implement accept invitation logic
  };

  const handleDeclineInvitation = (invitationId: string) => {
    console.log('Declining invitation:', invitationId);
    setSelectedInvitation(null);
    // TODO: Implement decline invitation logic
  };

  const InvitationCard = ({ invitation, showMore = false }: { invitation: Invitation; showMore?: boolean }) => (
    <Card className="bg-card/60 shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={invitation.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-normal">
                {invitation.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{invitation.name}</h3>
              <p className="text-sm text-muted-foreground">{invitation.sentAt}</p>
            </div>
          </div>
          {showMore && invitation.type === 'received' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedInvitation(invitation)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="safe-area-padding">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border/60">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Invitations</h1>
        </div>

        {/* Content */}
        <div className="p-4">
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Received ({receivedInvitations.length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sent ({sentInvitations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-3">
              {receivedInvitations.length > 0 ? (
                receivedInvitations.map(invitation => (
                  <InvitationCard 
                    key={invitation.id} 
                    invitation={invitation} 
                    showMore={true}
                  />
                ))
              ) : (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending invitations</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-3">
              {sentInvitations.length > 0 ? (
                sentInvitations.map(invitation => (
                  <InvitationCard 
                    key={invitation.id} 
                    invitation={invitation} 
                  />
                ))
              ) : (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No sent invitations</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Invitation Detail Modal */}
        <Dialog open={!!selectedInvitation} onOpenChange={() => setSelectedInvitation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invitation Details</DialogTitle>
            </DialogHeader>
            {selectedInvitation && (
              <div className="space-y-4">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedInvitation.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-normal text-lg">
                      {selectedInvitation.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedInvitation.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvitation.mutualFriends} mutual friends
                    </p>
                  </div>
                </div>

                {/* Goal */}
                {selectedInvitation.goal && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Related Goal</label>
                    <Badge variant="secondary" className="mt-1 block w-fit">
                      {selectedInvitation.goal}
                    </Badge>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">
                    {selectedInvitation.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleAcceptInvitation(selectedInvitation.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDeclineInvitation(selectedInvitation.id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}