import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, UserPlus, X, Users, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { supabase } from "../../integrations/supabase/client";
import { PermissionsService } from "../../services/permissionsService";
import { useToast } from "../../hooks/use-toast";

interface ReceivedInvitation {
  id: string;
  role: string;
  permission_level: string;
  invitee_name: string;
  status: string;
  expires_at: string;
  created_at: string;
  message: string;
  masked_email: string;
  inviter_name: string;
  invite_token?: string;
}

interface SentInvitation {
  id: string;
  individual_id: string;
  role: string;
  permission_level: string;
  invitee_name: string;
  masked_email: string;
  status: string;
  expires_at: string;
  created_at: string;
  message: string;
}


export function TabInvitations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedInvitation, setSelectedInvitation] = useState<ReceivedInvitation | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle URL-based invitation acceptance (avoid duplicate runs)
  const token = searchParams.get('token');
  const [handledToken, setHandledToken] = useState<string | null>(null);

  useEffect(() => {
    if (token && token !== handledToken) {
      setHandledToken(token);
      handleTokenAcceptance(token);
    }
  }, [token, handledToken]);

  const handleTokenAcceptance = async (token: string) => {
    try {
      // Store the token temporarily to handle after signup
      localStorage.setItem('pending_supporter_invite', token);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is already signed in, accept invitation directly
        await PermissionsService.acceptSupporterInvite(token);
        localStorage.removeItem('pending_supporter_invite');
        
        toast({
          title: "Invitation Accepted",
          description: "You are now connected as a supporter",
        });
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // User needs to sign up/sign in first
        toast({
          title: "Sign Up Required",
          description: "Please create an account to accept this supporter invitation",
        });
        
        setTimeout(() => {
          navigate('/auth?redirect=supporter-invite');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      let message = 'Failed to accept invitation or invitation expired';
      
      // Check if it's an "already accepted" error and show appropriate message
      if (error instanceof Error) {
        if (error.message.includes('already accepted') || error.message.includes('already exists')) {
          toast({
            title: "Already Connected",
            description: "You are already connected as a supporter",
          });
          // Still redirect to dashboard
          setTimeout(() => {
            navigate('/');
          }, 1500);
          return;
        }
        message = error.message;
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  // Load invitations data
  const loadInvitations = async () => {
    try {
      setLoading(true);
      
      // Get received invitations
      const { data: receivedData, error: receivedError } = await supabase
        .rpc('get_my_received_invites');
      
      if (receivedError) {
        console.error('Error loading received invitations:', receivedError);
      } else {
        setReceivedInvitations(receivedData || []);
      }
      
      // Get sent invitations
      const sentData = await PermissionsService.getSentInvites();
      setSentInvitations(sentData || []);
      
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  // Set up real-time updates for invitations
  useEffect(() => {
    const channel = supabase
      .channel('invitations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supporter_invites'
        },
        () => {
          // Reload invitations when any change occurs
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcceptInvitation = async (invitation: ReceivedInvitation) => {
    try {
      // Accept the invitation using the PermissionsService
      if (invitation.invite_token) {
        await PermissionsService.acceptSupporterInvite(invitation.invite_token);
        
        toast({
          title: "Invitation Accepted",
          description: "You are now connected as a supporter",
        });
        
        // Redirect to dashboard
        window.location.href = '/';
      } else {
        throw new Error('No invitation token available');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      const message = (error as any)?.message || 'Failed to accept invitation';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  const handleDeclineInvitation = async (invitation: ReceivedInvitation) => {
    try {
      toast({
        title: "Feature Coming Soon", 
        description: "Invitation declining will be implemented with token-based flow",
      });
      setSelectedInvitation(null);
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800', 
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const ReceivedInvitationCard = ({ invitation, showMore = false }: { invitation: ReceivedInvitation; showMore?: boolean }) => (
    <Card className="bg-card/60 shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-normal">
                {invitation.inviter_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{invitation.inviter_name}</h3>
              <p className="text-sm text-muted-foreground">{formatTimeAgo(invitation.created_at)}</p>
              <Badge variant="secondary" className={`text-xs mt-1 ${getStatusBadge(invitation.status)}`}>
                {invitation.status}
              </Badge>
            </div>
          </div>
          {showMore && invitation.status === 'pending' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedInvitation(invitation)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
        {invitation.message && (
          <p className="text-sm text-muted-foreground mt-2 ml-13">
            {invitation.message}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const SentInvitationCard = ({ invitation }: { invitation: SentInvitation }) => (
    <Card className="bg-card/60 shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-normal">
                {invitation.invitee_name ? invitation.invitee_name.split(' ').map(n => n[0]).join('') : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{invitation.invitee_name || 'Unnamed User'}</h3>
              <p className="text-sm text-muted-foreground">{invitation.masked_email}</p>
              <p className="text-sm text-muted-foreground">{formatTimeAgo(invitation.created_at)}</p>
              <Badge variant="secondary" className={`text-xs mt-1 ${getStatusBadge(invitation.status)}`}>
                {invitation.status}
              </Badge>
            </div>
          </div>
        </div>
        {invitation.message && (
          <p className="text-sm text-muted-foreground mt-2 ml-13">
            {invitation.message}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background to-muted/20 pt-safe-header pb-safe-nav">
      <div className="safe-area-padding">
        {/* Header */}
        <div className="fixed left-0 right-0 top-safe z-40 flex items-center gap-4 border-b border-border/60 px-4 pb-4 pt-4">
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
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading invitations...</span>
            </div>
          ) : (
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
                    <ReceivedInvitationCard 
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
                    <SentInvitationCard 
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
          )}
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
                    <AvatarFallback className="bg-primary/10 text-primary font-normal text-lg">
                      {selectedInvitation.inviter_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedInvitation.inviter_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Role: {selectedInvitation.role} • {selectedInvitation.permission_level}
                    </p>
                    <Badge variant="secondary" className={`text-xs mt-1 ${getStatusBadge(selectedInvitation.status)}`}>
                      {selectedInvitation.status}
                    </Badge>
                  </div>
                </div>

                {/* Invitation Details */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Invitation Type</label>
                  <p className="mt-1 text-sm">
                    <span className="capitalize">{selectedInvitation.role}</span> with <span className="capitalize">{selectedInvitation.permission_level}</span> permissions
                  </p>
                </div>

                {/* Message */}
                {selectedInvitation.message && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Message</label>
                    <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">
                      {selectedInvitation.message}
                    </p>
                  </div>
                )}

                {/* Expiry */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expires</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTimeAgo(selectedInvitation.expires_at)}
                  </p>
                </div>

                {/* Actions */}
                {selectedInvitation.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleAcceptInvitation(selectedInvitation)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleDeclineInvitation(selectedInvitation)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}