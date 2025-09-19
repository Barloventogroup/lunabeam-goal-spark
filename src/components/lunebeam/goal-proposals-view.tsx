import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Clock, CheckCircle, XCircle, MessageCircle, User, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalProposalsService, type GoalProposal } from '@/services/goalProposalsService';
import { PermissionsService } from '@/services/permissionsService';
import { formatDistanceToNow } from 'date-fns';

interface GoalProposalsViewProps {
  individualId?: string;
  individualName?: string;
  onBack?: () => void;
  viewMode?: 'individual' | 'admin'; // individual sees proposals for them, admin sees all they can manage
}

export const GoalProposalsView: React.FC<GoalProposalsViewProps> = ({
  individualId,
  individualName,
  onBack,
  viewMode = 'individual'
}) => {
  const [proposals, setProposals] = useState<GoalProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProposals();
    if (individualId) {
      checkAdminStatus();
    }
  }, [individualId, viewMode]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      let proposalsData: GoalProposal[];

      if (viewMode === 'individual' && individualId) {
        proposalsData = await goalProposalsService.getProposalsForIndividual(individualId);
      } else {
        proposalsData = await goalProposalsService.getMyProposals();
      }

      setProposals(proposalsData);
    } catch (error) {
      console.error('Failed to load proposals:', error);
      toast({
        title: 'Failed to load proposals',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!individualId) return;

    try {
      const canManage = await PermissionsService.checkPermission(individualId, 'create_goals');
      setIsAdmin(canManage);
    } catch (error) {
      console.error('Failed to check admin status:', error);
    }
  };

  const handleProposalAction = async (
    proposalId: string, 
    action: 'approved' | 'declined' | 'changes_requested',
    adminNotes?: string
  ) => {
    try {
      await goalProposalsService.updateProposalStatus(proposalId, action, adminNotes);
      
      if (action === 'approved') {
        // Convert to actual goal
        await goalProposalsService.convertProposalToGoal(proposalId);
      }

      toast({
        title: action === 'approved' ? 'Proposal approved!' : 
               action === 'declined' ? 'Proposal declined' : 'Changes requested',
        description: action === 'approved' ? 'Goal added to the plan' : 'Proposer will be notified'
      });

      loadProposals();
    } catch (error) {
      console.error('Failed to update proposal:', error);
      toast({
        title: 'Action failed',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: GoalProposal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changes_requested':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: GoalProposal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'changes_requested':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const ProposalCard: React.FC<{ proposal: GoalProposal }> = ({ proposal }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{proposal.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>
                  {viewMode === 'individual' 
                    ? `by ${proposal.proposer_name || 'Unknown'}`
                    : `for ${proposal.individual_name || 'Unknown'}`
                  }
                </span>
              </div>
              <span>{formatDistanceToNow(new Date(proposal.created_at))} ago</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(proposal.status)}`}>
              {getStatusIcon(proposal.status)}
              {proposal.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {proposal.category && (
          <Badge variant="secondary">{proposal.category}</Badge>
        )}
        
        {proposal.outcome && (
          <div>
            <h4 className="text-sm font-medium mb-1">Expected Outcome</h4>
            <p className="text-sm text-muted-foreground">{proposal.outcome}</p>
          </div>
        )}

        {proposal.rationale && (
          <div>
            <h4 className="text-sm font-medium mb-1">Why this helps</h4>
            <p className="text-sm text-muted-foreground">{proposal.rationale}</p>
          </div>
        )}

        {proposal.timeline_start && proposal.timeline_end && (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {new Date(proposal.timeline_start).toLocaleDateString()} - {new Date(proposal.timeline_end).toLocaleDateString()}
            </span>
            {proposal.frequency_per_week && (
              <span>{proposal.frequency_per_week}x/week</span>
            )}
          </div>
        )}

        {proposal.admin_notes && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-1">Admin feedback</h4>
            <p className="text-sm">{proposal.admin_notes}</p>
          </div>
        )}

        {isAdmin && proposal.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <ApprovalDialog 
              proposal={proposal} 
              onAction={handleProposalAction}
              type="approve"
            >
              <Button size="sm" variant="default">
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </ApprovalDialog>

            <FeedbackDialog
              proposal={proposal}
              onAction={handleProposalAction}
              type="changes"
            >
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-1" />
                Request changes
              </Button>
            </FeedbackDialog>

            <FeedbackDialog
              proposal={proposal}
              onAction={handleProposalAction}
              type="decline"
            >
              <Button size="sm" variant="outline">
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </FeedbackDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ApprovalDialog: React.FC<{ 
    proposal: GoalProposal; 
    onAction: (id: string, action: any, notes?: string) => void;
    type: string;
    children: React.ReactNode;
  }> = ({ proposal, onAction, children }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add this goal to {proposal.individual_name}'s plan?</AlertDialogTitle>
          <AlertDialogDescription>
            This will create an active goal and start tracking progress. Points will be earned for completed steps.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onAction(proposal.id, 'approved')}
          >
            Approve & add goal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const FeedbackDialog: React.FC<{ 
    proposal: GoalProposal; 
    onAction: (id: string, action: any, notes?: string) => void;
    type: 'changes' | 'decline';
    children: React.ReactNode;
  }> = ({ proposal, onAction, type, children }) => {
    const [feedback, setFeedback] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = () => {
      onAction(proposal.id, type === 'changes' ? 'changes_requested' : 'declined', feedback);
      setIsOpen(false);
      setFeedback('');
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {type === 'changes' ? 'What should be improved?' : 'Why decline this proposal?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder={type === 'changes' 
                ? 'Suggest specific improvements...' 
                : 'Explain why this isn\'t suitable...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!feedback.trim()}>
                {type === 'changes' ? 'Request changes' : 'Decline'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredProposals = proposals.filter(p => 
    activeTab === 'all' || p.status === activeTab
  );

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-muted-foreground">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {viewMode === 'individual' 
              ? `Proposals ${individualName ? `for ${individualName}` : ''}`
              : 'My Proposals'
            }
          </h1>
          <p className="text-muted-foreground">
            {viewMode === 'individual' 
              ? 'Goal suggestions from your support team'
              : 'Goals you\'ve proposed for others'
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({proposals.filter(p => p.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({proposals.filter(p => p.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({proposals.filter(p => p.status === 'declined').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({proposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-2">
                <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">No proposals yet</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'No pending proposals to review'
                    : `No ${activeTab} proposals`
                  }
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map(proposal => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};