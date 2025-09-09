// Lunebeam Core Types

export interface Profile {
  id?: string;
  user_id?: string;
  first_name: string;
  strengths: string[];
  interests: string[];
  challenges: string[];
  comm_pref: 'voice' | 'text';
  onboarding_complete?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
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

// Goals & Steps Types (New MVP Model)
export type GoalDomain = 'school' | 'work' | 'life' | 'health' | 'education' | 'employment' | 'independent_living' | 'social_skills' | 'postsecondary' | 'other';
export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived';
export type StepStatus = 'todo' | 'doing' | 'done' | 'skipped';
export type StepType = 'action' | 'container';

export interface GoalProgress {
  done: number;
  actionable: number;
  percent: number;
}

export interface Goal {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  domain?: GoalDomain;
  priority: GoalPriority;
  start_date?: string;
  due_date?: string;
  status: GoalStatus;
  progress_pct: number;
  streak_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  progress?: GoalProgress;
  
  // New fields for points system
  frequency_per_week?: number;
  duration_weeks?: number;
  planned_steps_count?: number;
  planned_milestones_count?: number;
  planned_scaffold_count?: number;
  base_points_per_planned_step?: number;
  base_points_per_milestone?: number;
  substep_points?: number;
  goal_completion_bonus?: number;
  total_possible_points?: number;
  earned_points?: number;
}

export interface StepFeedback {
  tooBig: boolean;
  confusing: boolean;
  notRelevant: boolean;
  needsMoreSteps: boolean;
}

export interface StepMetadata {
  version: number;
  source: 'rules' | 'llm';
  scoreEase: number; // 1-5
  scoreImpact: number; // 1-5
}

export interface Step {
  id: string;
  goal_id: string;
  title: string;
  explainer?: string; // ≤140 chars plain language
  notes?: string;
  order_index: number;
  estimated_effort_min?: number;
  due_date?: string;
  status: StepStatus;
  type: StepType;
  is_required: boolean;
  points?: number;
  dependency_step_ids: string[];
  created_at: string;
  updated_at: string;
  
  // New fields for points system
  step_type?: string;
  is_planned?: boolean;
  planned_week_index?: number;
  points_awarded?: number;
  
  // Legacy fields (kept for backwards compatibility)
  hidden?: boolean;
  blocked?: boolean;
  isBlocking?: boolean;
  precursors?: string[];
  dependencies?: string[];
  supportingLinks?: string[];
  aiGenerated?: boolean;
  userFeedback?: StepFeedback;
  metadata?: StepMetadata;
  
  // UI state (not persisted)
  canComplete?: boolean;
  showNotes?: boolean;
  showOptions?: boolean;
}

export interface Substep {
  id: string;
  step_id: string;
  title: string;
  description?: string;
  is_planned: boolean;
  completed_at?: string;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface PointsLogEntry {
  id: string;
  user_id: string;
  goal_id: string;
  step_id?: string;
  substep_id?: string;
  category: string;
  step_type: string;
  points_awarded: number;
  awarded_at: string;
}

// Legacy types (kept for backwards compatibility during transition)
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

// Family Circle Types
export interface FamilyCircle {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShareScope {
  goals: boolean;
  progress: boolean;
  checkins: boolean;
  badges: boolean;
  calendar: boolean;
  notes: boolean;
  reflections: boolean;
}

export interface CircleMembership {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'individual' | 'parent_guide' | 'cheerleader' | 'coach';
  status: 'pending' | 'active' | 'revoked';
  share_scope: ShareScope;
  consent_log: any[];
  created_at: string;
  updated_at: string;
}

export interface CircleInvite {
  id: string;
  circle_id: string;
  inviter_id: string;
  invitee_name?: string;
  invitee_contact: string;
  role: 'individual' | 'parent_guide' | 'cheerleader' | 'coach';
  share_scope: ShareScope;
  message?: string;
  delivery_method: 'email' | 'sms';
  magic_token: string;
  parent_led_draft: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckin {
  id: string;
  circle_id: string;
  user_id: string;
  week_of: string;
  wins: any[];
  microsteps: any[];
  reward?: any;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}