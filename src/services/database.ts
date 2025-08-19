import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Profile, SelectedGoal, CheckInEntry, Evidence, Badge, SupporterConsent } from '@/types';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbGoal = Database['public']['Tables']['goals']['Row'];
type DbCheckIn = Database['public']['Tables']['check_ins']['Row'];
type DbEvidence = Database['public']['Tables']['evidence']['Row'];
type DbBadge = Database['public']['Tables']['badges']['Row'];
type DbSupporterConsent = Database['public']['Tables']['supporter_consents']['Row'];

export const database = {
  // Profile operations
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No profile found
      throw error;
    }
    
    return {
      first_name: data.first_name,
      strengths: data.strengths || [],
      interests: data.interests || [],
      challenges: data.challenges || [],
      comm_pref: data.comm_pref as 'voice' | 'text'
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
        comm_pref: profile.comm_pref
      });
    
    if (error) throw error;
  },

  // Goal operations
  async getGoals(): Promise<SelectedGoal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(goal => ({
      id: goal.id,
      title: goal.title,
      week_plan: goal.week_plan as any,
      check_ins: goal.check_ins as any,
      rewards: goal.rewards as any,
      data_to_track: goal.data_to_track as any,
      created_at: goal.created_at,
      status: goal.status as 'active' | 'completed' | 'paused'
    }));
  },

  async saveGoal(goal: Omit<SelectedGoal, 'id' | 'created_at'>): Promise<SelectedGoal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: goal.title,
        week_plan: goal.week_plan as any,
        check_ins: goal.check_ins as any,
        rewards: goal.rewards as any,
        data_to_track: goal.data_to_track,
        status: goal.status
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      week_plan: data.week_plan as any,
      check_ins: data.check_ins as any,
      rewards: data.rewards as any,
      data_to_track: data.data_to_track as any,
      created_at: data.created_at,
      status: data.status as 'active' | 'completed' | 'paused'
    };
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
  }
};