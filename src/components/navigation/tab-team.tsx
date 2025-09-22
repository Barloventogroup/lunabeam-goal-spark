import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Eye, 
  MessageSquare, 
  Edit3,
  MoreHorizontal,
  Mail,
  Phone,
  UserMinus,
  Bell,
  Save,
  X,
  User
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { PermissionsService, type Supporter } from '@/services/permissionsService';
import { SimpleInviteModal } from '../lunebeam/simple-invite-modal';
import { AddCommunityMemberModal } from '../lunebeam/add-community-member-modal';
import { AddIndividualWizard } from '../lunebeam/add-individual-wizard';
import { EditIndividualModal } from '../lunebeam/edit-individual-modal';
import { CollectEmailModal } from '../lunebeam/collect-email-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SupporterWithProfile extends Supporter {
  profile?: {
    first_name: string;
    avatar_url?: string;
    email?: string;
    phone?: string;
  };
  memberType?: 'supporter' | 'individual'; // supporter = supports me, individual = I support them
  displayStatus?: 'Accepted' | 'Pending' | 'Not invited yet' | 'Active';
}

interface PendingInvite {
  id: string;
  invitee_name?: string;
  invitee_email: string;
  role: string;
  permission_level: string;
  status: string;
  created_at: string;
}

interface MemberDetailData {
  id: string;
  name: string;
  role: string;
  permission_level: string;
  email?: string;
  phone?: string;
  is_admin: boolean;
  type: 'supporter' | 'invite';
}

export const TabTeam: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supporters, setSupporters] = useState<SupporterWithProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<MemberDetailData | null>(null);
  const [editIndividualModal, setEditIndividualModal] = useState<{
    open: boolean;
    individualId: string;
    initialData: any;
  }>({
    open: false,
    individualId: '',
    initialData: {}
  });
  // Quick provision state
  const [newIndividualName, setNewIndividualName] = useState('');
  const [creatingIndividual, setCreatingIndividual] = useState(false);

  useEffect(() => {
    if (user) {
      loadCommunityData();
    }
  }, [user]);

  const loadCommunityData = async () => {
    if (!user) {
      console.log('TabTeam: No user found, cannot load community data');
      return;
    }
    
    console.log('TabTeam: Loading community data for user:', user.id);
    setLoading(true);
    try {
      // Load supporters of the current user (people who support me)
      console.log('TabTeam: Fetching my supporters...');
      const supportersData = await PermissionsService.getSupporters(user.id);
      console.log('TabTeam: My supporters data:', supportersData);

      // Load invitations I've sent (to determine status for individuals)
      console.log('TabTeam: Fetching my sent invites (for status)...');
      const invitesData = await PermissionsService.getSentInvites();
      const invitesByIndividual = new Map<string, any>((invitesData || []).map((i: any) => [i.individual_id, i]));
      console.log('TabTeam: Invites data:', invitesData);
      
      // Load individuals that I support (people I am a supporter for)
      console.log('TabTeam: Fetching individuals I support...');
      const { data: individualsISupport, error: individualsError } = await supabase
        .from('supporters')
        .select('individual_id, role, permission_level, is_admin, is_provisioner')
        .eq('supporter_id', user.id);

      if (individualsError) {
        console.error('TabTeam: Error fetching individuals I support:', individualsError);
      } else {
        console.log('TabTeam: Individuals I support:', individualsISupport);
      }

      // Fetch account claim statuses for these individuals
      const individualIds = (individualsISupport || []).map((i: any) => i.individual_id);
      const claimsMap = new Map<string, 'pending' | 'accepted'>();
      if (individualIds.length) {
        const { data: claims } = await supabase
          .from('account_claims')
          .select('individual_id, status, expires_at')
          .eq('provisioner_id', user.id)
          .in('individual_id', individualIds);
        
        // Only consider valid, non-expired claims
        (claims || []).forEach((c: any) => {
          const isExpired = new Date(c.expires_at) < new Date();
          if (!isExpired && (c.status === 'pending' || c.status === 'accepted')) {
            claimsMap.set(c.individual_id, c.status);
          }
        });
      }

      // Also fetch any individuals I have provisioned (even if no supporter relationship yet)
      const { data: provisionedList, error: provisionedErr } = await (supabase as any)
        .rpc('get_my_provisioned_individuals');
      if (provisionedErr) {
        console.warn('TabTeam: get_my_provisioned_individuals error:', provisionedErr);
      } else {
        console.log('TabTeam: Provisioned individuals (via claims):', provisionedList);
      }
      // Combine supporters and individuals I support into one list
      const allMembers: SupporterWithProfile[] = [];
      const supportersWithProfiles = await Promise.all(
        supportersData.map(async (supporter) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, avatar_url')
            .eq('user_id', supporter.supporter_id)
            .single();
          
          return {
            ...supporter,
            profile: profile || { first_name: 'Unknown User' },
            memberType: 'supporter' as const,
          };
        })
      );
      
      allMembers.push(...supportersWithProfiles);
      
      // Add individuals I support (people I am a supporter for)
      if (individualsISupport) {
        const individualsWithProfiles = (individualsISupport as any[]).map((individual) => {
          // Provisioned individuals default to "Not invited yet" 
          // They only become "Pending" when an invitation is actually sent
          // and "Accepted" when they claim their account
          let displayStatus = 'Not invited yet';
          
          // Only check for accepted status if there's a claimed account
          const claimStatus = claimsMap.get(individual.individual_id);
          if (claimStatus === 'accepted') {
            displayStatus = 'Accepted';
          }
          // Note: We don't set to "Pending" just because there's an unclaimed provision
          // "Pending" should only be set when an invite is actually sent
          
          return {
            id: `individual-${individual.individual_id}`,
            individual_id: individual.individual_id,
            supporter_id: user.id,
            role: 'individual' as any,
            permission_level: (individual.permission_level as 'viewer' | 'collaborator') || 'viewer',
            specific_goals: [],
            is_admin: individual.is_admin,
            is_provisioner: individual.is_provisioner,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile: { first_name: 'Unknown Individual' },
            memberType: 'individual' as const,
            displayStatus,
          } as SupporterWithProfile & { displayStatus: string };
        });
        
        allMembers.push(...individualsWithProfiles);
      }

      // Include profiles I created (on-behalf) even if no supporter relation exists yet
      console.log('TabTeam: Fetching profiles I created (on-behalf)...');
      const { data: createdProfiles, error: createdErr } = await supabase
        .rpc('get_profiles_created_by_me');
      console.log('TabTeam: get_profiles_created_by_me result:', { data: createdProfiles, error: createdErr });
      if (createdErr) {
        console.error('TabTeam: Error fetching created profiles:', createdErr);
      } else if (createdProfiles && createdProfiles.length > 0) {
        console.log('TabTeam: Found created profiles:', createdProfiles);
        const existingIndividualIds = new Set(allMembers.filter(m => m.memberType === 'individual').map(m => (m as any).individual_id));
        console.log('TabTeam: Existing individual IDs:', Array.from(existingIndividualIds));
        for (const p of createdProfiles) {
          console.log('TabTeam: Processing created profile:', p);
          if (!existingIndividualIds.has(p.user_id)) {
            // Determine status - provisioned accounts start as "Not invited yet"
            let displayStatus: 'Pending' | 'Accepted' | 'Not invited yet' = 'Not invited yet';
            const { data: claim } = await supabase
              .from('account_claims')
              .select('status, expires_at')
              .eq('provisioner_id', user.id)
              .eq('individual_id', p.user_id)
              .maybeSingle();
            
            console.log('TabTeam: Account claim for', p.user_id, ':', claim);
            // Only show "Accepted" if they've actually claimed their account
            if (claim && claim.status === 'accepted') {
              displayStatus = 'Accepted';
            }
            // Provisioned accounts remain "Not invited yet" until actually invited

            console.log('TabTeam: Adding created profile with status:', displayStatus);
            allMembers.push({
              id: `individual-${p.user_id}`,
              individual_id: p.user_id,
              supporter_id: user.id,
              role: 'individual' as any,
              permission_level: 'viewer',
              specific_goals: [],
              is_admin: false,
              is_provisioner: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              profile: { first_name: p.first_name, avatar_url: p.avatar_url },
              memberType: 'individual',
              displayStatus,
            } as any);
          } else {
            console.log('TabTeam: Skipping duplicate individual ID:', p.user_id);
          }
        }
      } else {
        console.log('TabTeam: No created profiles found (empty result)');
      }

      // Merge provisioned individuals from account claims as a fallback source
      if (provisionedList && provisionedList.length > 0) {
        const existingIndividualIds = new Set(allMembers.filter(m => m.memberType === 'individual').map(m => (m as any).individual_id));
        for (const p of provisionedList as any[]) {
          if (!existingIndividualIds.has(p.user_id)) {
            // Provisioned individuals start as "Not invited yet"
            let displayStatus = 'Not invited yet';
            // Only show "Accepted" if they've actually claimed their account
            if (p.status === 'accepted') displayStatus = 'Accepted';
            
            allMembers.push({
              id: `individual-${p.user_id}`,
              individual_id: p.user_id,
              supporter_id: user.id,
              role: 'individual' as any,
              permission_level: 'viewer',
              specific_goals: [],
              is_admin: false,
              is_provisioner: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              profile: { first_name: p.first_name },
              memberType: 'individual',
              displayStatus,
            } as any);
          }
        }
      }
      
      console.log('TabTeam: All community members:', allMembers);
      setSupporters(allMembers);

      // Keep pending invites list for the table (for invite rows)
      setPendingInvites((invitesData || []).filter((invite: any) => invite.status === 'pending'));

    } catch (error) {
      console.error('TabTeam: Error loading community data:', error);
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditIndividual = async (member: SupporterWithProfile) => {
    // Fetch full profile data for editing
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, strengths, interests, comm_pref')
      .eq('user_id', member.individual_id)
      .single();

    setEditIndividualModal({
      open: true,
      individualId: member.individual_id,
      initialData: {
        firstName: profile?.first_name || member.profile?.first_name || '',
        lastName: '', // Add if you have last name field
        email: '', // Add if you have email field
        phone: '', // Add if you have phone field
        strengths: profile?.strengths || [],
        interests: profile?.interests || [],
        commPref: profile?.comm_pref || 'text'
      }
    });
  };

  const createIndividual = async () => {
    if (!newIndividualName.trim()) return;
    if (!user) return;
    setCreatingIndividual(true);
    try {
      const { data: provisionResult, error } = await supabase.rpc('provision_individual', {
        p_first_name: newIndividualName.trim(),
        p_strengths: [],
        p_interests: [],
        p_comm_pref: 'text'
      });
      if (error) throw error;

      // Refresh list
      setNewIndividualName('');
      await loadCommunityData();
      toast({ title: 'Added', description: 'Individual has been added to your community' });
    } catch (err) {
      console.error('TabTeam: Failed to provision individual:', err);
      toast({ title: 'Error', description: 'Failed to add individual', variant: 'destructive' });
    } finally {
      setCreatingIndividual(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'supporter': return <Users className="h-3 w-3" />;
      case 'friend': return <MessageSquare className="h-3 w-3" />;
      case 'provider': return <Edit3 className="h-3 w-3" />;
      case 'individual': return <User className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'supporter': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      case 'friend': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'provider': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      case 'individual': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  const getStatusBadge = (type: 'supporter' | 'invite', inviteStatus?: string, displayStatus?: string) => {
    const status = displayStatus || (type === 'invite' ? inviteStatus : undefined) || (type === 'supporter' ? 'Active' : 'Pending');
    switch (status) {
      case 'Active':
      case 'Accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">Accepted</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300">Pending</Badge>;
      case 'Not invited yet':
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300">Not invited yet</Badge>;
    }
  };

  const [collectEmailModal, setCollectEmailModal] = useState<{
    open: boolean;
    individualId: string;
    individualName: string;
  } | null>(null);

  const handleInvite = async (member?: any) => {
    // If member is provided, we're handling a specific individual
    if (member && 'individual_id' in member) {
      const individualId = member.individual_id;
      const individualName = member.profile?.first_name || 'Unknown Individual';
      
      try {
        // Check if individual has an email in their profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', individualId)
          .maybeSingle(); // Use maybeSingle to handle no data gracefully

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to check profile information",
            variant: "destructive"
          });
          return;
        }

        // Check if profile exists and has email
        if (!profile || !profile.email) {
          // Show modal to collect email
          setCollectEmailModal({
            open: true,
            individualId,
            individualName
          });
          return;
        }

        // Email exists, proceed with sending invitation
        await sendInvitationEmail(individualId, individualName, profile.email);
        
      } catch (error) {
        console.error('Error in invite process:', error);
        toast({
          title: "Error",
          description: "Failed to process invitation",
          variant: "destructive"
        });
      }
    } else {
      // Fallback for general invite (existing behavior)
      toast({
        title: "Invite sent",
        description: "Your invitation has been sent successfully"
      });
      loadCommunityData();
    }
  };

  const sendInvitationEmail = async (individualId: string, individualName: string, email: string) => {
    console.group('📧 Sending Invitation Email');
    console.log('Parameters:', { individualId, individualName, email, currentUserId: user?.id });
    
    try {
      // Create a proper supporter invite record first
      console.log('Step 1: Creating supporter invite...');
      const inviteData = {
        individual_id: individualId,
        inviter_id: user?.id || '',
        invitee_email: email,
        invitee_name: individualName,
        role: 'supporter' as const,
        permission_level: 'viewer' as const,
        specific_goals: [] as never[],
        message: '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.log('Invite data being sent:', inviteData);
      const inviteResponse = await PermissionsService.createSupporterInvite(inviteData);
      console.log('✅ Invite created:', inviteResponse);
      
      const inviteLink = `${window.location.origin}/invitations?token=${inviteResponse.invite_token}`;
      console.log('Step 2: Generated invite link:', inviteLink);
      
      // Call the send-invitation-email edge function
      console.log('Step 3: Sending email via edge function...');
      const emailPayload = {
        type: 'supporter',
        inviteeName: individualName,
        inviteeEmail: email,
        inviterName: user?.user_metadata?.first_name || 'Your supporter',
        inviteLink: inviteLink,
        roleName: 'supporter',
        message: `You have been set up as an individual on Lunabeam. Please use this invitation to claim your account and start tracking your goals!`
      };
      console.log('Email payload:', emailPayload);
      
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: emailPayload
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Email sent successfully');
      console.groupEnd();

      toast({
        title: "Invitation Sent",
        description: `Invitation has been sent to ${individualName} at ${email}`
      });
      
      loadCommunityData(); // Refresh data
    } catch (error) {
      console.error('❌ Full error in sendInvitationEmail:', error);
      console.groupEnd();
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation email. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailCollected = async (email: string) => {
    if (collectEmailModal) {
      await sendInvitationEmail(
        collectEmailModal.individualId,
        collectEmailModal.individualName,
        email
      );
      setCollectEmailModal(null);
    }
  };

  const handleRemove = async (memberId: string, type: 'supporter' | 'invite') => {
    try {
      if (type === 'supporter') {
        await PermissionsService.removeSupporter(memberId);
        toast({
          title: "Removed",
          description: "Member has been removed from your community"
        });
      } else {
        // Handle removing pending invite
        await supabase
          .from('supporter_invites')
          .delete()
          .eq('id', memberId);
        toast({
          title: "Invite cancelled",
          description: "Invitation has been cancelled"
        });
      }
      loadCommunityData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const handleNudge = async (member: MemberDetailData) => {
    if (member.type === 'invite') {
      // Send nudge email for pending invites
      toast({
        title: "Nudge sent",
        description: `Reminder sent to ${member.name || member.email}`
      });
    } else {
      // Send nudge notification for active supporters
      toast({
        title: "Nudge sent",
        description: `Notification sent to ${member.name}`
      });
    }
  };

  const handleMemberClick = (member: SupporterWithProfile | PendingInvite, type: 'supporter' | 'invite') => {
    const memberData: MemberDetailData = {
      id: member.id,
      name: type === 'supporter' 
        ? (member as SupporterWithProfile).profile?.first_name || 'Unknown User'
        : (member as PendingInvite).invitee_name || 'Unknown User',
      role: member.role,
      permission_level: type === 'supporter' ? (member as SupporterWithProfile).permission_level : (member as PendingInvite).permission_level,
      email: type === 'supporter' 
        ? (member as SupporterWithProfile).profile?.email
        : (member as PendingInvite).invitee_email,
      phone: type === 'supporter' ? (member as SupporterWithProfile).profile?.phone : undefined,
      is_admin: type === 'supporter' ? (member as SupporterWithProfile).is_admin : false,
      type
    };
    
    setSelectedMember(memberData);
    setEditData({ ...memberData });
  };

  const handleSaveEdit = async () => {
    if (!editData || !selectedMember) return;

    try {
      if (selectedMember.type === 'supporter') {
        // Update supporter permissions
        await PermissionsService.updateSupporterPermissions(selectedMember.id, {
          permission_level: editData.permission_level as any,
          is_admin: editData.is_admin
        });

        // Update profile information if changed
        if (editData.name !== selectedMember.name) {
          await supabase
            .from('profiles')
            .update({ first_name: editData.name })
            .eq('user_id', supporters.find(s => s.id === selectedMember.id)?.supporter_id);
        }
      }

      setSelectedMember(null);
      setIsEditing(false);
      loadCommunityData(); // Refresh data
      
      toast({
        title: "Updated",
        description: "Member information has been updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member information",
        variant: "destructive"
      });
    }
  };

  const combinedMembers = [
    ...supporters.map(s => ({ ...s, type: 'supporter' as const })),
    ...pendingInvites.map(p => ({ ...p, type: 'invite' as const }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="p-4 bg-card/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Community</h1>
              <p className="text-sm text-muted-foreground">
                Manage your support network ({combinedMembers.length} members)
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Quick add individual when empty */}
          {supporters.filter(s => 'memberType' in s && s.memberType === 'individual').length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                  <div className="flex-1">
                    <Label htmlFor="newIndividual">Add an individual you support</Label>
                    <Input id="newIndividual" placeholder="Enter a name" value={newIndividualName} onChange={(e) => setNewIndividualName(e.target.value)} />
                  </div>
                  <Button onClick={createIndividual} disabled={creatingIndividual || !newIndividualName.trim()}>
                    {creatingIndividual ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individuals you support (moved to top) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  People You Support
                </div>
                <AddIndividualWizard 
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  }
                  onSuccess={loadCommunityData}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supporters.filter(s => 'memberType' in s && s.memberType === 'individual').length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No individuals yet</h3>
                  <p className="text-muted-foreground mb-4">Add people you support to start tracking their goals.</p>
                  <AddIndividualWizard 
                    trigger={
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Individual
                      </Button>
                    }
                    onSuccess={loadCommunityData}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supporters
                      .filter(s => 'memberType' in s && s.memberType === 'individual')
                      .map((member) => {
                      const name = member.profile?.first_name || 'Unknown Individual';
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <TableRow key={`individual-row-${member.individual_id}`}>
                          <TableCell>
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-70"
                              onClick={() => handleMemberClick(member as any, 'supporter')}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{name}</span>
                            </div>
                           </TableCell>
                           <TableCell>
                             {getStatusBadge('supporter', undefined, (member as any).displayStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                <DropdownMenuItem 
                                  onClick={() => handleEditIndividual(member)}
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={('displayStatus' in member && (member as any).displayStatus === 'Not invited yet') ? () => handleInvite(member) : undefined}
                                  className={('displayStatus' in member && (member as any).displayStatus !== 'Not invited yet') ? 'text-muted-foreground cursor-not-allowed' : ''}
                                  disabled={('displayStatus' in member && (member as any).displayStatus !== 'Not invited yet')}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Invite
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleNudge(member as any)}>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Nudge
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemove((member as any).id, 'supporter')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Community Members Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Members
                </div>
                <AddCommunityMemberModal 
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  }
                  onSuccess={loadCommunityData}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {combinedMembers.filter(m => {
                // Community members excludes individuals (they go in People You Support)
                const isNotIndividual = !(m.type === 'supporter' && 'memberType' in m && m.memberType === 'individual');
                const name = m.type === 'supporter' ? m.profile?.first_name : m.invitee_name;
                const isNotNat = name?.toLowerCase() !== 'nat';
                return isNotIndividual && isNotNat;
              }).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No community members yet</h3>
                  <p className="text-muted-foreground mb-4">Start building your support network by inviting people to join.</p>
                  <AddCommunityMemberModal 
                    trigger={
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send First Invite
                      </Button>
                    }
                    onSuccess={loadCommunityData}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                     <TableRow>
                       <TableHead>Name</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedMembers
                      .filter(m => {
                        // Community members excludes individuals (they go in People You Support)
                        const isNotIndividual = !(m.type === 'supporter' && 'memberType' in m && m.memberType === 'individual');
                        const name = m.type === 'supporter' ? m.profile?.first_name : m.invitee_name;
                        const isNotNat = name?.toLowerCase() !== 'nat';
                        return isNotIndividual && isNotNat;
                      })
                      .map((member) => {
                      const name = member.type === 'supporter' 
                        ? member.profile?.first_name || 'Unknown User'
                        : member.invitee_name || 'Unknown User';
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <TableRow key={`${member.type}-${member.id}`}>
                          <TableCell>
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-70"
                              onClick={() => handleMemberClick(member, member.type)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                        <span className="font-medium">{name}</span>
                        {member.type === 'supporter' && 'memberType' in member && member.memberType === 'individual' && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                            Individual
                          </Badge>
                        )}
                        {member.type === 'supporter' && member.is_admin && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                              </div>
                            </div>
                           </TableCell>
                           <TableCell>
                             {getStatusBadge(member.type, member.type === 'invite' ? member.status : undefined, ('displayStatus' in member ? (member as any).displayStatus : undefined))}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                {member.type === 'supporter' && 'memberType' in member && member.memberType === 'individual' && (
                                  <DropdownMenuItem 
                                    onClick={('displayStatus' in member && (member as any).displayStatus === 'Not invited yet') ? () => handleInvite(member) : undefined}
                                    className={('displayStatus' in member && (member as any).displayStatus !== 'Not invited yet') ? 'text-muted-foreground cursor-not-allowed' : ''}
                                    disabled={('displayStatus' in member && (member as any).displayStatus !== 'Not invited yet')}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Invite
                                  </DropdownMenuItem>
                                )}
                                {member.type === 'invite' && (
                                  <DropdownMenuItem onClick={handleInvite}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Resend Invite
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleNudge(member as any)}>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Nudge
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemove(member.id, member.type)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Edit Individual Modal */}
      <EditIndividualModal
        open={editIndividualModal.open}
        onOpenChange={(open) => setEditIndividualModal(prev => ({ ...prev, open }))}
        individualId={editIndividualModal.individualId}
        initialData={editIndividualModal.initialData}
        onSuccess={loadCommunityData}
      />

      {/* Collect Email Modal */}
      {collectEmailModal && (
        <CollectEmailModal
          open={collectEmailModal.open}
          onClose={() => setCollectEmailModal(null)}
          individualId={collectEmailModal.individualId}
          individualName={collectEmailModal.individualName}
          onEmailCollected={handleEmailCollected}
        />
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => {
          setSelectedMember(null);
          setIsEditing(false);
          setEditData(null);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                Member Details
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...selectedMember });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editData?.name || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.name}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {isEditing ? (
                  <Select 
                    value={editData?.role || ''} 
                    onValueChange={(value) => setEditData(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supporter">Supporter</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted rounded capitalize">{selectedMember.role}</p>
                )}
              </div>

              {/* Permissions - Only editable by admin */}
              <div className="space-y-2">
                <Label htmlFor="permissions">Permissions</Label>
                {isEditing && user && supporters.find(s => s.supporter_id === user.id)?.is_admin ? (
                  <Select 
                    value={editData?.permission_level || ''} 
                    onValueChange={(value) => setEditData(prev => prev ? { ...prev, permission_level: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="collaborator">Collaborator</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm p-2 bg-muted rounded capitalize">{selectedMember.permission_level}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData?.email || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, email: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.email || 'Not provided'}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={editData?.phone || ''}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  />
                ) : (
                  <p className="text-sm p-2 bg-muted rounded">{selectedMember.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMember.type)}
                  {selectedMember.is_admin && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};