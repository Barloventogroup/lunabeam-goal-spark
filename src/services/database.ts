import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Profile, SelectedGoal, CheckInEntry, Evidence, Badge, SupporterConsent, FamilyCircle, CircleMembership, CircleInvite, WeeklyCheckin } from '@/types';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbGoal = Database['public']['Tables']['goals']['Row'];
type DbCheckIn = Database['public']['Tables']['check_ins']['Row'];
type DbEvidence = Database['public']['Tables']['evidence']['Row'];
type DbBadge = Database['public']['Tables']['badges']['Row'];
type DbSupporterConsent = Database['public']['Tables']['supporter_consents']['Row'];
type DbFamilyCircle = Database['public']['Tables']['family_circles']['Row'];
type DbCircleMembership = Database['public']['Tables']['circle_memberships']['Row'];
type DbCircleInvite = Database['public']['Tables']['circle_invites']['Row'];
type DbWeeklyCheckin = Database['public']['Tables']['weekly_checkins']['Row'];

export const database = {
  // Profile operations
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      first_name: data.first_name,
      strengths: data.strengths || [],
      interests: data.interests || [],
      challenges: data.challenges || [],
      comm_pref: data.comm_pref as 'voice' | 'text',
      onboarding_complete: data.onboarding_complete ?? false
    };
  },

  async saveProfile(profile: Profile): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        first_name: profile.first_name,
        strengths: profile.strengths,
        interests: profile.interests,
        challenges: profile.challenges,
        comm_pref: profile.comm_pref,
        onboarding_complete: profile.onboarding_complete ?? false
      }, { onConflict: 'user_id' });
    
    if (error) throw error;
  },

  // Goal operations
  async getGoals(): Promise<SelectedGoal[]> {
    // Legacy goals API deprecated; return empty during transition to new Goals & Steps
    return [];
  },

  async saveGoal(_goal: Omit<SelectedGoal, 'id' | 'created_at'>): Promise<SelectedGoal> {
    throw new Error('Legacy goals API removed. Use goalsService.createGoal instead.');
  },

  // Check-in operations
  async getCheckIns(goalId?: string): Promise<CheckInEntry[]> {
    let query = supabase
      .from('check_ins')
      .select('*')
      .order('date', { ascending: false });
    
    if (goalId) {
      query = query.eq('goal_id', goalId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(checkIn => ({
      id: checkIn.id,
      goal_id: checkIn.goal_id,
      date: checkIn.date,
      count_of_attempts: checkIn.count_of_attempts || 0,
      minutes_spent: checkIn.minutes_spent || 0,
      confidence_1_5: checkIn.confidence_1_5 || 1,
      reflection: checkIn.reflection || undefined,
      reflection_is_voice: checkIn.reflection_is_voice || undefined,
      evidence_attachments: checkIn.evidence_attachments || undefined
    }));
  },

  async saveCheckIn(checkIn: Omit<CheckInEntry, 'id'>): Promise<CheckInEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        goal_id: checkIn.goal_id,
        date: checkIn.date,
        count_of_attempts: checkIn.count_of_attempts,
        minutes_spent: checkIn.minutes_spent,
        confidence_1_5: checkIn.confidence_1_5,
        reflection: checkIn.reflection,
        reflection_is_voice: checkIn.reflection_is_voice,
        evidence_attachments: checkIn.evidence_attachments
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      goal_id: data.goal_id,
      date: data.date,
      count_of_attempts: data.count_of_attempts || 0,
      minutes_spent: data.minutes_spent || 0,
      confidence_1_5: data.confidence_1_5 || 1,
      reflection: data.reflection || undefined,
      reflection_is_voice: data.reflection_is_voice || undefined,
      evidence_attachments: data.evidence_attachments || undefined
    };
  },

  // Supporter consent operations
  async getSupporterConsents(): Promise<SupporterConsent[]> {
    const { data, error } = await supabase
      .from('supporter_consents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(consent => ({
      contact_id: consent.contact_id,
      name: consent.name || undefined,
      role: consent.role as any,
      scope: consent.scope as any,
      sections: consent.sections as any,
      redactions: consent.redactions || [],
      expires_at: consent.expires_at,
      notes_visible_to_user: consent.notes_visible_to_user || true
    }));
  },

  async saveSupporterConsent(consent: SupporterConsent): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('supporter_consents')
      .upsert({
        user_id: user.id,
        contact_id: consent.contact_id,
        name: consent.name,
        role: consent.role,
        scope: consent.scope,
        sections: consent.sections as any,
        redactions: consent.redactions,
        expires_at: consent.expires_at,
        notes_visible_to_user: consent.notes_visible_to_user
      });
    
    if (error) throw error;
  },

  // Evidence operations
  async getEvidence(goalId?: string): Promise<Evidence[]> {
    let query = supabase
      .from('evidence')
      .select('*')
      .order('uploaded_at', { ascending: false });
    
    if (goalId) {
      query = query.eq('goal_id', goalId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(evidence => ({
      id: evidence.id,
      goal_id: evidence.goal_id,
      type: evidence.type as 'photo' | 'video' | 'doc',
      url: evidence.url,
      uploaded_at: evidence.uploaded_at,
      description: evidence.description || undefined
    }));
  },

  async saveEvidence(evidence: Omit<Evidence, 'id'>): Promise<Evidence> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('evidence')
      .insert({
        user_id: user.id,
        goal_id: evidence.goal_id,
        type: evidence.type,
        url: evidence.url,
        description: evidence.description
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      goal_id: data.goal_id,
      type: data.type as 'photo' | 'video' | 'doc',
      url: data.url,
      uploaded_at: data.uploaded_at,
      description: data.description || undefined
    };
  },

  // Badge operations
  async getBadges(goalId?: string): Promise<Badge[]> {
    let query = supabase
      .from('badges')
      .select('*')
      .order('earned_at', { ascending: false });
    
    if (goalId) {
      query = query.eq('goal_id', goalId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(badge => ({
      id: badge.id,
      goal_id: badge.goal_id,
      type: badge.type as 'silver' | 'gold',
      earned_at: badge.earned_at,
      title: badge.title,
      description: badge.description
    }));
  },

  async saveBadge(badge: Omit<Badge, 'id'>): Promise<Badge> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('badges')
      .insert({
        user_id: user.id,
        goal_id: badge.goal_id,
        type: badge.type,
        title: badge.title,
        description: badge.description
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      goal_id: data.goal_id,
      type: data.type as 'silver' | 'gold',
      earned_at: data.earned_at,
      title: data.title,
      description: data.description
    };
  },

  // Family Circle operations
  async getFamilyCircles(): Promise<FamilyCircle[]> {
    const { data, error } = await supabase
      .from('family_circles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createFamilyCircle(name: string): Promise<FamilyCircle> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('family_circles')
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCircleMemberships(circleId: string): Promise<CircleMembership[]> {
    const { data, error } = await supabase
      .from('circle_memberships')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(membership => ({
      ...membership,
      role: membership.role as any,
      status: membership.status as any,
      share_scope: membership.share_scope as any
    }));
  },

  async createCircleInvite(invite: Omit<CircleInvite, 'id' | 'created_at' | 'updated_at' | 'magic_token' | 'inviter_id'>): Promise<CircleInvite> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate magic token
    const magic_token = crypto.randomUUID();

    const { data, error } = await supabase
      .from('circle_invites')
      .insert({
        ...invite,
        inviter_id: user.id,
        magic_token,
        share_scope: invite.share_scope as any
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      role: data.role as any,
      status: data.status as any,
      delivery_method: data.delivery_method as any,
      share_scope: data.share_scope as any
    };
  },

  async getCircleInvites(circleId?: string): Promise<CircleInvite[]> {
    let query = supabase
      .from('circle_invites')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (circleId) {
      query = query.eq('circle_id', circleId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data.map(invite => ({
      ...invite,
      role: invite.role as any,
      status: invite.status as any,
      delivery_method: invite.delivery_method as any,
      share_scope: invite.share_scope as any
    }));
  },

  async acceptCircleInvite(magic_token: string): Promise<CircleMembership> {
    const { data: invite, error: inviteError } = await supabase
      .from('circle_invites')
      .select('*')
      .eq('magic_token', magic_token)
      .eq('status', 'pending')
      .single();
    
    if (inviteError) throw inviteError;
    if (!invite) throw new Error('Invite not found or expired');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from('circle_memberships')
      .insert({
        circle_id: invite.circle_id,
        user_id: user.id,
        role: invite.role,
        share_scope: invite.share_scope
      })
      .select()
      .single();
    
    if (membershipError) throw membershipError;

    // Update invite status
    await supabase
      .from('circle_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id);

    return {
      ...membership,
      role: membership.role as any,
      status: membership.status as any,
      share_scope: membership.share_scope as any
    };
  },

  async getWeeklyCheckins(circleId?: string, weekOf?: string): Promise<WeeklyCheckin[]> {
    let query = supabase
      .from('weekly_checkins')
      .select('*')
      .order('week_of', { ascending: false });
    
    if (circleId) {
      query = query.eq('circle_id', circleId);
    }
    
    if (weekOf) {
      query = query.eq('week_of', weekOf);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async saveWeeklyCheckin(checkin: Omit<WeeklyCheckin, 'id' | 'created_at' | 'updated_at'>): Promise<WeeklyCheckin> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('weekly_checkins')
      .upsert({
        ...checkin,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};