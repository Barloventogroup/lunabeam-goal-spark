// Lunebeam Core Types

export interface Profile {
  first_name: string;
  strengths: string[];
  interests: string[];
  challenges: string[];
  comm_pref: 'voice' | 'text';
}

export interface ConsentSection {
  profile: string[];
  goals: string[];
  checkins: string[];
  rewards: string[];
  evidence: string[];
  reflections: string[];
  safety_plan: string[];
  account_consent: string[];
}

export interface SupporterConsent {
  contact_id: string;
  role: 'parent' | 'coach' | 'teacher' | 'peer' | 'other';
  scope: 'summary' | 'goals_only' | 'goals_and_progress' | 'full_read' | 'full_read_write' | 'custom';
  sections: ConsentSection;
  redactions: string[];
  expires_at: string | null;
  notes_visible_to_user: boolean;
  name?: string;
}

export interface Consent {
  share_with: SupporterConsent[];
}

export interface WeekPlan {
  steps: string[];
  time_per_day: string;
  success_criteria: string[];
  too_hard_try: string[];
}

export interface CheckIns {
  frequency: 'once_midweek' | 'daily' | 'every_other_day';
  method: 'in_app' | 'text' | 'email';
  encourager: 'self' | 'parent' | 'coach';
}

export interface Rewards {
  type: 'badge' | 'custom' | 'none';
  criteria: 'milestone_complete' | 'goal_complete' | 'streak_3_days';
  badge_tier: 'silver' | 'gold' | null;
  proof_required: boolean;
  accepted_proof_types: ('photo' | 'video' | 'doc')[];
  custom_label: string;
}

export interface SelectedGoal {
  id: string;
  title: string;
  week_plan: WeekPlan;
  check_ins: CheckIns;
  rewards: Rewards;
  data_to_track: ('count_of_attempts' | 'minutes_spent' | 'confidence_1_5')[];
  created_at: string;
  status: 'active' | 'completed' | 'paused';
}

export interface CheckInEntry {
  id: string;
  goal_id: string;
  date: string;
  count_of_attempts: number;
  minutes_spent: number;
  confidence_1_5: number;
  reflection?: string;
  reflection_is_voice?: boolean;
  evidence_attachments?: string[];
}

export interface Evidence {
  id: string;
  goal_id: string;
  type: 'photo' | 'video' | 'doc';
  url: string;
  uploaded_at: string;
  description?: string;
}

export interface Badge {
  id: string;
  goal_id: string;
  type: 'silver' | 'gold';
  earned_at: string;
  title: string;
  description: string;
}