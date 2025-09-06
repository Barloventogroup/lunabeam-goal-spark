import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  Share2,
  QrCode,
  Search
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FamilyInviteModal } from '../lunebeam/family-invite-modal';

export const TabFriends: React.FC = () => {
  const { familyCircles, loadFamilyCircles } = useStore();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadFamilyCircles();
  }, [loadFamilyCircles]);

  const primaryCircle = familyCircles[0]; // For MVP, focus on first circle

  const mockMembers = [
    { id: '1', name: 'You', role: 'Admin', category: 'family', avatar: '👤', isOwner: true },
    { id: '2', name: 'Mom', role: 'Parent Guide', category: 'family', avatar: '👩', isOwner: false },
    { id: '3', name: 'Sarah (Coach)', role: 'Coach', category: 'providers', avatar: '👩‍🏫', isOwner: false },
    { id: '4', name: 'Alex', role: 'Friend', category: 'friends', avatar: '👨', isOwner: false },
    { id: '5', name: 'Dr. Smith', role: 'Therapist', category: 'providers', avatar: '👨‍⚕️', isOwner: false },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'Edit': return <Edit3 className="h-4 w-4 text-green-500" />;
      case 'Comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'View': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'Parent Guide': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'Coach': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'Friend': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Therapist': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || member.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="p-6 pt-8 bg-card/80 backdrop-blur border-b">
          <div>
            <h1 className="text-xl font-bold">Community</h1>
            <p className="text-sm text-muted-foreground">
              Manage your support network
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Invitations */}
          <Card className="bg-gradient-subtle border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Manage friend requests</p>
                  <p className="text-xs text-muted-foreground mt-1">3 pending invitations</p>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Share & Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share & Invite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowInviteModal(true)}
                variant="outline" 
                className="w-full justify-start gap-3"
              >
                <UserPlus className="h-4 w-4" />
                Send Invitation Link
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
              >
                <QrCode className="h-4 w-4" />
                Show QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
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
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                              {member.avatar}
                            </div>
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
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && primaryCircle && (
        <FamilyInviteModal circle={primaryCircle} />
      )}
    </>
  );
};