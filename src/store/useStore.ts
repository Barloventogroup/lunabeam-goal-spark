import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Consent, SelectedGoal, CheckInEntry, Evidence, Badge } from '../types';

interface AppState {
  // Core data
  profile: Profile | null;
  consent: Consent;
  goals: SelectedGoal[];
  checkIns: CheckInEntry[];
  evidence: Evidence[];
  badges: Badge[];
  
  // UI state
  currentGoal: SelectedGoal | null;
  onboardingComplete: boolean;
  currentStep: number;
  
  // Actions
  setProfile: (profile: Profile) => void;
  addGoal: (goal: Omit<SelectedGoal, 'id' | 'created_at'>) => void;
  setCurrentGoal: (goalId: string | null) => void;
  addCheckIn: (checkIn: Omit<CheckInEntry, 'id'>) => void;
  addEvidence: (evidence: Omit<Evidence, 'id'>) => void;
  addBadge: (badge: Omit<Badge, 'id'>) => void;
  updateConsent: (consent: Consent) => void;
  completeOnboarding: () => void;
  setCurrentStep: (step: number) => void;
  
  // Computed helpers
  getActiveGoal: () => SelectedGoal | null;
  getRecentCheckIns: (goalId: string) => CheckInEntry[];
}

// Demo data
const demoConsent: Consent = {
  share_with: [
    {
      contact_id: 'demo-parent-1',
      name: 'Mom',
      role: 'parent',
      scope: 'summary',
      sections: {
        profile: ['view'],
        goals: ['view'],
        checkins: [],
        rewards: [],
        evidence: [],
        reflections: [],
        safety_plan: [],
        account_consent: []
      },
      redactions: ['reflections', 'safety_plan'],
      expires_at: null,
      notes_visible_to_user: true
    },
    {
      contact_id: 'demo-coach-1',
      name: 'Sarah (Coach)',
      role: 'coach',
      scope: 'goals_and_progress',
      sections: {
        profile: ['view'],
        goals: ['view', 'comment'],
        checkins: ['view'],
        rewards: ['view'],
        evidence: ['view'],
        reflections: [],
        safety_plan: [],
        account_consent: []
      },
      redactions: ['reflections'],
      expires_at: null,
      notes_visible_to_user: true
    }
  ]
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: null,
      consent: demoConsent,
      goals: [],
      checkIns: [],
      evidence: [],
      badges: [],
      currentGoal: null,
      onboardingComplete: false,
      currentStep: 0,
      
      // Actions
      setProfile: (profile) => set({ profile }),
      
      addGoal: (goalData) => {
        const goal: SelectedGoal = {
          ...goalData,
          id: `goal-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'active'
        };
        set((state) => ({ 
          goals: [...state.goals, goal],
          currentGoal: goal
        }));
      },
      
      setCurrentGoal: (goalId) => {
        const goal = goalId ? get().goals.find(g => g.id === goalId) || null : null;
        set({ currentGoal: goal });
      },
      
      addCheckIn: (checkInData) => {
        const checkIn: CheckInEntry = {
          ...checkInData,
          id: `checkin-${Date.now()}`
        };
        set((state) => ({ checkIns: [...state.checkIns, checkIn] }));
        
        // Check if badge should be earned
        const goal = get().goals.find(g => g.id === checkInData.goal_id);
        if (goal?.rewards.type === 'badge') {
          // Simple badge logic - can be enhanced
          const goalCheckIns = get().checkIns.filter(c => c.goal_id === checkInData.goal_id);
          if (goalCheckIns.length >= 3 && goal.rewards.criteria === 'streak_3_days') {
            get().addBadge({
              goal_id: checkInData.goal_id,
              type: goal.rewards.badge_tier || 'silver',
              earned_at: new Date().toISOString(),
              title: `${goal.title} Achiever`,
              description: `Completed 3 check-ins for ${goal.title}`
            });
          }
        }
      },
      
      addEvidence: (evidenceData) => {
        const evidence: Evidence = {
          ...evidenceData,
          id: `evidence-${Date.now()}`
        };
        set((state) => ({ evidence: [...state.evidence, evidence] }));
      },
      
      addBadge: (badgeData) => {
        const badge: Badge = {
          ...badgeData,
          id: `badge-${Date.now()}`
        };
        set((state) => ({ badges: [...state.badges, badge] }));
      },
      
      updateConsent: (consent) => set({ consent }),
      
      completeOnboarding: () => set({ onboardingComplete: true }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Helpers
      getActiveGoal: () => {
        const goals = get().goals;
        return goals.find(g => g.status === 'active') || null;
      },
      
      getRecentCheckIns: (goalId) => {
        return get().checkIns
          .filter(c => c.goal_id === goalId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
      }
    }),
    {
      name: 'lunebeam-store',
      partialize: (state) => ({
        profile: state.profile,
        consent: state.consent,
        goals: state.goals,
        checkIns: state.checkIns,
        evidence: state.evidence,
        badges: state.badges,
        onboardingComplete: state.onboardingComplete,
        currentGoal: state.currentGoal
      })
    }
  )
);