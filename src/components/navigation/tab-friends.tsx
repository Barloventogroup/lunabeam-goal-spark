import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  Share2,
  Search,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { SimpleInviteModal } from '../lunebeam/simple-invite-modal';

// Mock invitation data
interface Invitation {
  id: string;
  name: string;
  avatar: string;
  message: string;
  goal?: string;
  mutualFriends: number;
  sentTime: string;
  type: 'received' | 'sent';
}

const mockInvitations: Invitation[] = [
  {
    id: '1',
    name: 'Emma Rodriguez',
    avatar: 'E',
    message: 'Hey! I saw your fitness goals and would love to connect. Let\'s motivate each other!',
    goal: 'Complete Marathon Training',
    mutualFriends: 3,
    sentTime: '2 hours ago',
    type: 'received'
  },
  {
    id: '2',
    name: 'Alex Chen',
    avatar: 'A',
    message: 'Hi there! I\'m also working on coding goals. Would be great to share progress!',
    goal: 'Learn React Development',
    mutualFriends: 1,
    sentTime: '1 day ago',
    type: 'received'
  },
  {
    id: '3',
    name: 'Sarah Williams',
    avatar: 'S',
    message: 'Invitation sent',
    mutualFriends: 0,
    sentTime: '3 days ago',
    type: 'sent'
  }
];

export const TabFriends: React.FC = () => {
  const { familyCircles, loadFamilyCircles } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [mainTab, setMainTab] = useState('support-network');
  const [invitationTab, setInvitationTab] = useState('received');
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    loadFamilyCircles();
  }, [loadFamilyCircles]);

  const primaryCircle = familyCircles[0]; // For MVP, focus on first circle

  const mockMembers = [
    { id: '1', name: 'You', role: 'admin', permission: 'admin', category: 'family', avatar: 'Y', isOwner: true },
    { id: '2', name: 'Mom', role: 'supporter', permission: 'collaborator', category: 'family', avatar: 'M', isOwner: false },
    { id: '3', name: 'Sarah (Coach)', role: 'supporter', permission: 'viewer', category: 'providers', avatar: 'S', isOwner: false },
    { id: '4', name: 'Alex', role: 'friend', permission: 'viewer', category: 'friends', avatar: 'A', isOwner: false },
    { id: '5', name: 'Dr. Smith', role: 'provider', permission: 'collaborator', category: 'providers', avatar: 'D', isOwner: false },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'supporter': return <Users className="h-4 w-4 text-purple-500" />;
      case 'friend': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'provider': return <Edit3 className="h-4 w-4 text-green-500" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'supporter': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'friend': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'provider': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || member.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const receivedInvitations = mockInvitations.filter(inv => inv.type === 'received');
  const sentInvitations = mockInvitations.filter(inv => inv.type === 'sent');

  const handleAcceptInvitation = (id: string) => {
    console.log('Accepting invitation:', id);
    setSelectedInvitation(null);
  };

  const handleDeclineInvitation = (id: string) => {
    console.log('Declining invitation:', id);
    setSelectedInvitation(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="p-6 pt-8 bg-card/80 backdrop-blur border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold">Community</h1>
            <p className="text-sm text-muted-foreground">
              Manage your support network
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Main Tabs */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="support-network">Support Network</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>

            {/* Support Network Tab */}
            <TabsContent value="support-network" className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search within your support network..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Tabs and Friends Table */}
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="family">Family</TabsTrigger>
                  <TabsTrigger value="friends">Friends</TabsTrigger>
                  <TabsTrigger value="providers">Providers</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeFilter} className="mt-6">
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                    {member.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{member.name}</span>
                                  {member.isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getRoleColor(member.role)}>
                                {getRoleIcon(member.role)}
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {!member.isOwner && (
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="space-y-6">
              {/* Share & Invite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share & Invite
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SimpleInviteModal 
                    trigger={
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3"
                      >
                        <UserPlus className="h-4 w-4" />
                        Send Invitation Link
                      </Button>
                    }
                  />
                </CardContent>
              </Card>

              {/* Invitations Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={invitationTab} onValueChange={setInvitationTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="received">
                        Received ({receivedInvitations.length})
                      </TabsTrigger>
                      <TabsTrigger value="sent">
                        Sent ({sentInvitations.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="received" className="mt-4 space-y-3">
                      {receivedInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {invitation.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{invitation.name}</p>
                              <p className="text-sm text-muted-foreground">{invitation.sentTime}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedInvitation(invitation)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="sent" className="mt-4 space-y-3">
                      {sentInvitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {invitation.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{invitation.name}</p>
                              <p className="text-sm text-muted-foreground">{invitation.sentTime}</p>
                            </div>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Invitation Detail Modal */}
      {selectedInvitation && (
        <Dialog open={!!selectedInvitation} onOpenChange={() => setSelectedInvitation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invitation Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-2xl">
                    {selectedInvitation.avatar}
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
                  <p className="text-sm font-medium text-muted-foreground">Related Goal:</p>
                  <p className="text-sm">{selectedInvitation.goal}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message:</p>
                <p className="text-sm">{selectedInvitation.message}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => handleAcceptInvitation(selectedInvitation.id)}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleDeclineInvitation(selectedInvitation.id)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </>
  );
};