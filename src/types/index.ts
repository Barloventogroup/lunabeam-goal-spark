// Lunebeam Core Types

export interface Profile {
  id?: string;
  user_id?: string;
  first_name: string;
  email?: string;
  birthday?: string;
  strengths: string[];
  interests: string[];
  challenges: string[];
  comm_pref: 'voice' | 'text';
  onboarding_complete?: boolean;
  avatar_url?: string;
  account_status?: 'active' | 'pending_user_consent' | 'user_claimed';
  claimed_at?: string;
  created_at?: string;
  updated_at?: string;
  created_by_supporter?: string | null;
  user_type?: 'admin' | 'individual' | 'supporter' | 'hybrid'; // New field for role
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

// Progressive Mastery Types (defined before Goal interface as they're referenced in metadata)
export interface SkillAssessment {
  calculated_level: number;
  q1_familiarity: number;
  q2_confidence: number;
  q3_independence: number;
  assessment_date: string;
  level_label: 'beginner' | 'early_learner' | 'developing' | 'proficient' | 'independent';
}

export interface TeachingHelper {
  helper_id: string;
  helper_name: string;
  relationship: 'parent' | 'teacher' | 'coach';
}

export interface SmartStartPlan {
  suggested_initial: number;
  target_frequency: number;
  rationale: string;
  phase_guidance: string;
}

export interface ProgressionSummary {
  total_steps: number;
  completed_steps: number;
  avg_quality_rating: number;
  avg_independence_level: number;
  latest_independence_level: number;
  quality_trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  independence_trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  sessions_with_helper: number;
  sessions_independent: number;
  avg_time_spent_minutes: number;
  skill_assessment?: SkillAssessment;
  smart_start?: any;
  teaching_helper?: TeachingHelper;
  current_phase?: 'learning' | 'developing' | 'proficient' | 'independent';
}

export interface TeachingHelperGoal {
  goal_id: string;
  goal_title: string;
  individual_id: string;
  individual_name: string;
  current_phase: 'learning' | 'developing' | 'proficient' | 'independent';
  avg_independence: number;
  total_sessions: number;
  last_session_date: string;
}

export interface CheckInData {
  goalId: string;
  stepId: string;
  qualityRating: number;
  independenceLevel: number;
  timeSpentMinutes?: number;
  confidenceBefore?: number;
  confidenceAfter?: number;
  notes?: string;
  helperPresent?: boolean;
  helperId?: string;
}

// Check-Ins Types (for checkInsService)
export interface CheckInInput {
  goalId: string;
  stepId: string;
  qualityRating: number; // 1-5
  independenceLevel: number; // 1-5
  timeSpentMinutes?: number; // 1-480
  confidenceBefore?: number; // 1-5
  confidenceAfter?: number; // 1-5
  notes?: string; // max 500 chars
  helperPresent?: boolean;
  helperId?: string;
}

export interface CheckIn extends CheckInInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  stepTitle?: string;
  goalTitle?: string;
}

export interface ProgressionAnalytics {
  totalCheckIns: number;
  avgQualityRating: number;
  avgIndependenceLevel: number;
  qualityTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  independenceTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  avgTimeSpentMinutes: number;
  sessionsWithHelper: number;
  sessionsIndependent: number;
  confidenceGain: number;
  recentCheckIns: CheckIn[];
}

export interface StepProgressionData {
  stepId: string;
  stepTitle: string;
  attemptCount: number;
  checkIns: CheckIn[];
  improvementRate: number;
  avgQuality: number;
  avgIndependence: number;
}

// Goals & Steps Types (New MVP Model)
export type GoalDomain = 'school' | 'work' | 'life' | 'health' | 'education' | 'employment' | 'independent_living' | 'social_skills' | 'postsecondary' | 'fun_recreation' | 'other';
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
  created_by: string;
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
  goal_type?: 'habit' | 'progressive_mastery';
  
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
  
  // Metadata for generation tracking and Progressive Mastery
  metadata?: {
    generation_incomplete?: boolean;
    failed_days?: Array<{ day: number; date: Date; error: string }>;
    successful_days?: number;
    total_expected_days?: number;
    skill_assessment?: SkillAssessment;
    smart_start?: any;
    teaching_helper?: TeachingHelper;
    current_phase?: 'learning' | 'developing' | 'proficient' | 'independent';
    [key: string]: any;
  };
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
  initiated_at?: string;
  is_supporter_step?: boolean;
  
  // Habit tracking fields
  completion_streak?: number;
  skip_count?: number;
  skip_reasons?: any; // JSONB field, parsed as SkipRecord[]
  last_skipped_date?: string;
  
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
  initiated_at?: string;
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

// Habit Tracking Types
export type StreakMilestone = 'bronze' | 'silver' | 'gold' | 'platinum';
export type SkipReason = 'sick' | 'busy' | 'tired' | 'not_ready' | 'forgot' | 'other';

export interface StreakCalculation {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  consecutiveDays: number;
  isStreakAtRisk: boolean;
  streakMilestone?: StreakMilestone;
  goalId: string;
}

export interface SkipRecord {
  stepId: string;
  skippedAt: string;
  reason: SkipReason;
  customNote?: string;
  streakAtRisk: boolean;
}

export interface HabitAnalytics {
  goalId: string;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  averageSkipsPerWeek: number;
  mostCommonSkipReason: string | null;
  skipPatterns: SkipPatterns;
}

export interface SkipPatterns {
  timeOfDay: { hour: number; count: number }[];
  dayOfWeek: { day: string; count: number }[];
  reasons: { reason: string; count: number }[];
  consecutiveSkips: number;
}