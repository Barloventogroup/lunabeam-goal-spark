import { supabase } from '@/integrations/supabase/client';

export interface GoalProposal {
  id: string;
  individual_id: string;
  proposer_id: string;
  title: string;
  description?: string;
  category?: string;
  outcome?: string;
  timeline_start?: string;
  timeline_end?: string;
  frequency_per_week?: number;
  rationale?: string;
  status: 'pending' | 'approved' | 'declined' | 'changes_requested';
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  proposer_name?: string;
  individual_name?: string;
}

export interface CreateProposalData {
  individual_id: string;
  title: string;
  description?: string;
  category?: string;
  outcome?: string;
  timeline_start?: string;
  timeline_end?: string;
  frequency_per_week?: number;
  rationale?: string;
}

export const goalProposalsService = {
  // Create a new goal proposal
  async createProposal(data: CreateProposalData): Promise<GoalProposal> {
    const { data: proposal, error } = await supabase
      .from('goal_proposals')
      .insert({
        ...data,
        proposer_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        proposer:profiles!goal_proposals_proposer_id_fkey(first_name),
        individual:profiles!goal_proposals_individual_id_fkey(first_name)
      `)
      .single();

    if (error) throw error;

    // Create notification for the individual
    await this.createNotification(
      data.individual_id,
      'proposal_submitted',
      'New Goal Proposal',
      `${(proposal as any).proposer?.first_name || 'Someone'} suggested a new goal: "${data.title}"`,
      { proposal_id: proposal.id }
    );

    // Create notification for admins
    await this.notifyAdmins(
      data.individual_id,
      'proposal_submitted',
      'Goal Proposal Needs Review',
      `New proposal for ${(proposal as any).individual?.first_name || 'your individual'}: "${data.title}"`,
      { proposal_id: proposal.id }
    );

    return proposal as GoalProposal;
  },

  // Get proposals for an individual (as admin or individual themselves)
  async getProposalsForIndividual(individualId: string): Promise<GoalProposal[]> {
    const { data, error } = await supabase
      .from('goal_proposals')
      .select(`
        *,
        proposer:profiles!goal_proposals_proposer_id_fkey(first_name),
        individual:profiles!goal_proposals_individual_id_fkey(first_name)
      `)
      .eq('individual_id', individualId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(proposal => ({
      ...proposal,
      proposer_name: (proposal as any).proposer?.first_name,
      individual_name: (proposal as any).individual?.first_name,
    })) as GoalProposal[];
  },

  // Get proposals created by current user
  async getMyProposals(): Promise<GoalProposal[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goal_proposals')
      .select(`
        *,
        proposer:profiles!goal_proposals_proposer_id_fkey(first_name),
        individual:profiles!goal_proposals_individual_id_fkey(first_name)
      `)
      .eq('proposer_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(proposal => ({
      ...proposal,
      proposer_name: (proposal as any).proposer?.first_name,
      individual_name: (proposal as any).individual?.first_name,
    })) as GoalProposal[];
  },

  // Update proposal status (admin action)
  async updateProposalStatus(
    proposalId: string, 
    status: GoalProposal['status'], 
    adminNotes?: string
  ): Promise<GoalProposal> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: proposal, error } = await supabase
      .from('goal_proposals')
      .update({
        status,
        admin_notes: adminNotes,
        approved_by: user.user.id,
        approved_at: status !== 'pending' ? new Date().toISOString() : null
      })
      .eq('id', proposalId)
      .select(`
        *,
        proposer:profiles!goal_proposals_proposer_id_fkey(first_name),
        individual:profiles!goal_proposals_individual_id_fkey(first_name)
      `)
      .single();

    if (error) throw error;

    // Create notification for proposer
    const statusMessages = {
      approved: 'Your goal proposal was approved!',
      declined: 'Your goal proposal needs revision',
      changes_requested: 'Changes requested for your goal proposal'
    };

    if (status !== 'pending') {
      await this.createNotification(
        proposal.proposer_id,
        `proposal_${status}`,
        statusMessages[status] || 'Proposal Status Updated',
        `Your proposal "${proposal.title}" ${status === 'approved' ? 'was approved and added to the plan' : 'was updated'}`,
        { proposal_id: proposal.id, admin_notes: adminNotes }
      );
    }

    return {
      ...proposal,
      proposer_name: (proposal as any).proposer?.first_name,
      individual_name: (proposal as any).individual?.first_name,
    } as GoalProposal;
  },

  // Convert approved proposal to actual goal
  async convertProposalToGoal(proposalId: string): Promise<string> {
    const { data: proposal, error: proposalError } = await supabase
      .from('goal_proposals')
      .select('*')
      .eq('id', proposalId)
      .eq('status', 'approved')
      .single();

    if (proposalError) throw proposalError;
    if (!proposal) throw new Error('Proposal not found or not approved');

    // Create the actual goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        owner_id: proposal.individual_id,
        created_by: proposal.proposer_id,
        title: proposal.title,
        description: proposal.description,
        domain: proposal.category?.toLowerCase().replace(/\s+/g, '-'),
        start_date: proposal.timeline_start,
        due_date: proposal.timeline_end,
        frequency_per_week: proposal.frequency_per_week,
        status: 'active'
      })
      .select('id')
      .single();

    if (goalError) throw goalError;

    // Create notification for individual
    await this.createNotification(
      proposal.individual_id,
      'goal_assigned',
      'New Goal Added',
      `"${proposal.title}" was added to your plan!`,
      { goal_id: goal.id, proposal_id: proposalId }
    );

    return goal.id;
  },

  // Create notification helper
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data
      });

    if (error) {
      console.error('Failed to create notification:', error);
      // Don't throw - notifications are not critical
    }
  },

  // Notify all admins for an individual
  async notifyAdmins(
    individualId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    const { data: admins, error } = await supabase
      .from('supporters')
      .select('supporter_id')
      .eq('individual_id', individualId)
      .eq('is_admin', true);

    if (error) {
      console.error('Failed to get admins:', error);
      return;
    }

    for (const admin of admins || []) {
      await this.createNotification(admin.supporter_id, type, title, message, data);
    }
  }
};