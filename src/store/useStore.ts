import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyCircle, CircleMembership, CircleInvite, WeeklyCheckin, SelectedGoal, Profile, Consent, CheckInEntry, Evidence, Badge, Goal, Step } from '@/types';
import { database } from '../services/database';
import { goalsService, stepsService } from '../services/goalsService';

interface AppState {
  // Core data
  profile: Profile | null;
  consent: Consent;
  
  // New Goals & Steps system
  goals: Goal[];
  steps: Record<string, Step[]>; // keyed by goal_id
  
  // Legacy data (for backwards compatibility)
  legacyGoals: SelectedGoal[];
  checkIns: CheckInEntry[];
  evidence: Evidence[];
  badges: Badge[];
  
  // Family Circle data
  familyCircles: FamilyCircle[];
  
  // UI state
  currentGoal: Goal | null;
  currentStep: number;
  
  // Actions
  setProfile: (profile: Profile) => Promise<void>;
  updateConsent: (consent: Consent) => void;
  completeOnboarding: () => Promise<void>;
  setCurrentStep: (step: number) => void;
  
  // New Goals & Steps actions
  loadGoals: () => Promise<void>;
  loadSteps: (goalId: string) => Promise<void>;
  setCurrentGoal: (goalId: string | null) => void;
  
  // Legacy actions (for backwards compatibility)
  addGoal: (goal: Omit<SelectedGoal, 'id' | 'created_at'>) => Promise<void>;
  addCheckIn: (checkIn: Omit<CheckInEntry, 'id'>) => Promise<void>;
  addEvidence: (evidence: Omit<Evidence, 'id'>) => Promise<void>;
  addBadge: (badge: Omit<Badge, 'id'>) => Promise<void>;
  
  // Family Circle actions
  loadFamilyCircles: () => Promise<void>;
  createFamilyCircle: (name: string) => Promise<void>;
  
  // Data loading (legacy)
  loadProfile: () => Promise<void>;
  loadCheckIns: (goalId?: string) => Promise<void>;
  loadEvidence: (goalId?: string) => Promise<void>;
  loadBadges: (goalId?: string) => Promise<void>;
  loadSupporterConsents: () => Promise<void>;
  
  // Computed helpers
  getActiveGoal: () => Goal | null;
  getRecentCheckIns: (goalId: string) => CheckInEntry[];
  isOnboardingComplete: () => boolean;
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
      
      // New Goals & Steps system
      goals: [],
      steps: {},
      
      // Legacy data
      legacyGoals: [],
      checkIns: [],
      evidence: [],
      badges: [],
      
      familyCircles: [],
      currentGoal: null,
      currentStep: 0,
      
      // Actions
      setProfile: async (profile) => {
        await database.saveProfile(profile);
        set({ profile });
      },
      
      // New Goals & Steps actions
      loadGoals: async () => {
        try {
          console.log('Loading new goals...');
          const goals = await goalsService.getGoals();
          console.log('Loaded new goals:', goals);
          set({ goals });
        } catch (error) {
          console.error('Failed to load goals:', error);
        }
      },

      loadSteps: async (goalId) => {
        try {
          const steps = await stepsService.getSteps(goalId);
          set((state) => ({
            steps: { ...state.steps, [goalId]: steps }
          }));
        } catch (error) {
          console.error('Failed to load steps:', error);
        }
      },

      setCurrentGoal: (goalId) => {
        const goal = goalId ? get().goals.find(g => g.id === goalId) || null : null;
        set({ currentGoal: goal });
      },

      // Legacy actions
      addGoal: async (goalData) => {
        const goal = await database.saveGoal(goalData);
        set((state) => ({ 
          legacyGoals: [...state.legacyGoals, goal]
        }));
      },
      
      addCheckIn: async (checkInData) => {
        const checkIn = await database.saveCheckIn(checkInData);
        set((state) => ({ checkIns: [...state.checkIns, checkIn] }));
        
        // Check if badge should be earned
        const goal = get().legacyGoals.find(g => g.id === checkInData.goal_id);
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
      
      completeOnboarding: async () => {
        try {
          const current = get().profile;
          const baseProfile = current ?? {
            first_name: 'User',
            strengths: [],
            interests: [],
            challenges: [],
            comm_pref: 'text' as const,
            onboarding_complete: true,
          };

          const updatedProfile = { ...baseProfile, onboarding_complete: true };

          // Persist to DB (best-effort)
          try {
            await database.saveProfile(updatedProfile);
          } catch (err) {
            console.warn('Failed to save onboarding completion to DB. Using local state only.', err);
          }

          set({ profile: updatedProfile });
        } catch (error) {
          console.error('Error completing onboarding:', error);
        }
      },
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Computed helper for onboarding status
      isOnboardingComplete: () => {
        const profile = get().profile;
        return profile?.onboarding_complete || false;
      },
      
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
          console.log('Store: loadProfile called');
          const profile = await database.getProfile();
          console.log('Store: Profile from DB:', profile);
          // Preserve existing local-only flags like onboarding_complete when DB payload lacks them
          const existing = get().profile;
          console.log('Store: Existing profile in store:', existing);
          const mergedProfile = profile ? { ...existing, ...profile } : (existing ?? null);
          console.log('Store: Merged profile:', mergedProfile);
          set({ profile: mergedProfile });
        } catch (error) {
          console.error('Store: Failed to load profile:', error);
        }
      },
      
      loadLegacyGoals: async () => {
        try {
          const goals = await database.getGoals();
          set({ legacyGoals: goals });
        } catch (error) {
          console.error('Failed to load legacy goals:', error);
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
      },

      // Family Circle operations
      loadFamilyCircles: async () => {
        try {
          console.log('Loading family circles...');
          const circles = await database.getFamilyCircles();
          console.log('Loaded family circles:', circles);
          set({ familyCircles: circles });
        } catch (error) {
          console.error('Failed to load family circles:', error);
        }
      },

      createFamilyCircle: async (name) => {
        try {
          const circle = await database.createFamilyCircle(name);
          set((state) => ({ 
            familyCircles: [circle, ...state.familyCircles]
          }));
        } catch (error) {
          console.error('Failed to create family circle:', error);
        }
      }
    }),
    {
      name: 'lunebeam-store',
      partialize: (state) => ({
        profile: state.profile,
        consent: state.consent,
        goals: state.goals,
        steps: state.steps,
        legacyGoals: state.legacyGoals,
        checkIns: state.checkIns,
        evidence: state.evidence,
        badges: state.badges,
        familyCircles: state.familyCircles,
        currentGoal: state.currentGoal
      })
    }
  )
);