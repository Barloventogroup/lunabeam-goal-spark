import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Consent, SelectedGoal, CheckInEntry, Evidence, Badge } from '../types';
import { database } from '../services/database';

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
  setProfile: (profile: Profile) => Promise<void>;
  addGoal: (goal: Omit<SelectedGoal, 'id' | 'created_at'>) => Promise<void>;
  setCurrentGoal: (goalId: string | null) => void;
  addCheckIn: (checkIn: Omit<CheckInEntry, 'id'>) => Promise<void>;
  addEvidence: (evidence: Omit<Evidence, 'id'>) => Promise<void>;
  addBadge: (badge: Omit<Badge, 'id'>) => Promise<void>;
  updateConsent: (consent: Consent) => void;
  completeOnboarding: () => void;
  setCurrentStep: (step: number) => void;
  
  // Data loading
  loadProfile: () => Promise<void>;
  loadGoals: () => Promise<void>;
  loadCheckIns: (goalId?: string) => Promise<void>;
  loadEvidence: (goalId?: string) => Promise<void>;
  loadBadges: (goalId?: string) => Promise<void>;
  loadSupporterConsents: () => Promise<void>;
  
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
      setProfile: async (profile) => {
        await database.saveProfile(profile);
        set({ profile });
      },
      
      addGoal: async (goalData) => {
        const goal = await database.saveGoal(goalData);
        set((state) => ({ 
          goals: [...state.goals, goal],
          currentGoal: goal
        }));
      },
      
      setCurrentGoal: (goalId) => {
        const goal = goalId ? get().goals.find(g => g.id === goalId) || null : null;
        set({ currentGoal: goal });
      },
      
      addCheckIn: async (checkInData) => {
        const checkIn = await database.saveCheckIn(checkInData);
        set((state) => ({ checkIns: [...state.checkIns, checkIn] }));
        
        // Check if badge should be earned
        const goal = get().goals.find(g => g.id === checkInData.goal_id);
        if (goal?.rewards.type === 'badge') {
          // Simple badge logic - can be enhanced
          const goalCheckIns = get().checkIns.filter(c => c.goal_id === checkInData.goal_id);
          if (goalCheckIns.length >= 3 && goal.rewards.criteria === 'streak_3_days') {
            await get().addBadge({
              goal_id: checkInData.goal_id,
              type: goal.rewards.badge_tier || 'silver',
              earned_at: new Date().toISOString(),
              title: `${goal.title} Achiever`,
              description: `Completed 3 check-ins for ${goal.title}`
            });
          }
        }
      },
      
      addEvidence: async (evidenceData) => {
        const evidence = await database.saveEvidence(evidenceData);
        set((state) => ({ evidence: [...state.evidence, evidence] }));
      },
      
      addBadge: async (badgeData) => {
        const badge = await database.saveBadge(badgeData);
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
      },
      
      // Data loading functions
      loadProfile: async () => {
        try {
          const profile = await database.getProfile();
          set({ profile });
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      },
      
      loadGoals: async () => {
        try {
          const goals = await database.getGoals();
          set({ goals });
        } catch (error) {
          console.error('Failed to load goals:', error);
        }
      },
      
      loadCheckIns: async (goalId) => {
        try {
          const checkIns = await database.getCheckIns(goalId);
          set({ checkIns });
        } catch (error) {
          console.error('Failed to load check-ins:', error);
        }
      },
      
      loadEvidence: async (goalId) => {
        try {
          const evidence = await database.getEvidence(goalId);
          set({ evidence });
        } catch (error) {
          console.error('Failed to load evidence:', error);
        }
      },
      
      loadBadges: async (goalId) => {
        try {
          const badges = await database.getBadges(goalId);
          set({ badges });
        } catch (error) {
          console.error('Failed to load badges:', error);
        }
      },
      
      loadSupporterConsents: async () => {
        try {
          const consents = await database.getSupporterConsents();
          set((state) => ({
            consent: {
              ...state.consent,
              share_with: consents
            }
          }));
        } catch (error) {
          console.error('Failed to load supporter consents:', error);
        }
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