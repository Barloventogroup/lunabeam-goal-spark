import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyCircle, CircleMembership, CircleInvite, WeeklyCheckin, SelectedGoal, Profile, Consent, CheckInEntry, Evidence, Badge, Goal, Step } from '@/types';
import { database } from '../services/database';
import { goalsService, stepsService } from '../services/goalsService';
import { pointsService, type PointsSummary } from '../services/pointsService';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  // Core data
  profile: Profile | null;
  consent: Consent;
  justCompletedOnboarding: boolean;
  
  // Track which authenticated user this persisted store belongs to
  lastUserId: string | null;
  
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
  
  // Points data
  pointsSummary: PointsSummary | null;
  
  // UI state
  currentGoal: Goal | null;
  currentStep: number;
  
  // Actions
  setProfile: (profile: Profile) => Promise<void>;
  updateConsent: (consent: Consent) => void;
  completeOnboarding: () => Promise<void>;
  clearJustCompletedOnboarding: () => void;
  setCurrentStep: (step: number) => void;
  
  // New Goals & Steps actions
  loadGoals: () => Promise<void>;
  loadSteps: (goalId: string) => Promise<void>;
  setCurrentGoal: (goalId: string | null) => void;
  loadPoints: () => Promise<void>;
  
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
      justCompletedOnboarding: false,
      
      // Track current authenticated user for this store snapshot
      lastUserId: null,
      
      // New Goals & Steps system
      goals: [],
      steps: {},
      
      // Legacy data
      legacyGoals: [],
      checkIns: [],
      evidence: [],
      badges: [],
      
      familyCircles: [],
      pointsSummary: null,
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
          
          // Also refresh steps for the active goal
          const activeGoal = goals.find(g => g.status === 'active');
          if (activeGoal) {
            try {
              const steps = await stepsService.getSteps(activeGoal.id);
              set((state) => ({
                steps: { ...state.steps, [activeGoal.id]: steps }
              }));
            } catch (error) {
              console.error('Failed to load steps for active goal:', error);
            }
          }
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

      loadPoints: async () => {
        try {
          const pointsSummary = await pointsService.getPointsSummary();
          set({ pointsSummary });
        } catch (error) {
          console.error('Failed to load points:', error);
        }
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
        set({ justCompletedOnboarding: true });
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
      
      clearJustCompletedOnboarding: () => {
        set({ justCompletedOnboarding: false });
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
          
          if (!profile) {
            console.log('Store: No profile found in DB, creating for new user...');

            // Get current auth user first to scope persisted state
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
              console.error('Store: Failed to get user info:', userError);
              throw userError;
            }

            if (user) {
              // If switching between accounts on the same device, clear cross-user data
              const storedUserId = get().lastUserId;
              const isSameUser = !!storedUserId && storedUserId === user.id;
              if (storedUserId && !isSameUser) {
                console.log('Store: Detected user switch. Clearing state to prevent data leakage.');
                set({
                  profile: null,
                  goals: [],
                  steps: {},
                  legacyGoals: [],
                  checkIns: [],
                  evidence: [],
                  badges: [],
                  currentGoal: null,
                  lastUserId: user.id,
                });
              } else if (!storedUserId) {
                // First time we see a user, remember it, but do not trust existing local profile
                set({ lastUserId: user.id });
              }

              // Re-evaluate local profile after potential reset
              const localProfile = get().profile;

              // Only sync a meaningful local profile if it belongs to the same user (avoid cross-account leakage)
              if (
                isSameUser &&
                localProfile?.first_name &&
                localProfile.first_name.trim() !== '' &&
                localProfile.first_name !== 'User'
              ) {
                console.log('Store: Syncing local profile to DB:', localProfile);
                await database.saveProfile(localProfile);
                set({ profile: localProfile });
                return;
              }

              // Otherwise, create a minimal profile using auth user info
              const metaFirst = (user.user_metadata?.first_name || '').toString().trim();
              const emailLocal = (user.email || '').split('@')[0] || '';
              const firstName = metaFirst || emailLocal || 'User';

              const minimalProfile = {
                first_name: firstName,
                strengths: [],
                interests: [],
                challenges: [],
                comm_pref: 'text' as const,
                onboarding_complete: false,
              };

              console.log('Store: Creating minimal profile from auth:', minimalProfile);
              console.log('Store: User info:', { id: user.id, email: user.email, metadata: user.user_metadata });
              
              try {
                await database.saveProfile(minimalProfile);
                console.log('Store: Successfully saved minimal profile to DB');
                set({ profile: minimalProfile });
                return;
              } catch (saveError) {
                console.error('Store: Failed to save minimal profile to DB:', saveError);
                // Set profile in state even if DB save fails, so onboarding can proceed
                set({ profile: minimalProfile });
                return;
              }
            } else {
              console.error('Store: No authenticated user found');
              throw new Error('No authenticated user found');
            }
          }
          
          console.log('Store: Setting profile from DB:', profile);
          set({ profile });
        } catch (error) {
          console.error('Store: Failed to load profile:', error);
          const errMsg = (error as any)?.message || '';
          const isAuthError =
            (error as any)?.__isAuthError === true ||
            (error as any)?.status === 403 ||
            errMsg.includes('User from sub claim in JWT does not exist') ||
            errMsg.includes('User not authenticated') ||
            errMsg.includes('No authenticated user');

          // If it's an auth-related error, don't override state with a fallback profile.
          if (isAuthError) {
            console.log('Store: Auth error detected while loading profile. Skipping fallback to avoid onboarding loop.');
            return;
          }

          // If we already have a profile in state, don't override it either.
          if (get().profile) {
            console.log('Store: Existing profile present. Not overriding with fallback.');
            return;
          }

          // Otherwise, set a minimal local profile so UI can proceed.
          const basicProfile = {
            first_name: 'User',
            strengths: [],
            interests: [],
            challenges: [],
            comm_pref: 'text' as const,
            onboarding_complete: false,
          };
          console.log('Store: Setting fallback profile due to non-auth error:', basicProfile);
          set({ profile: basicProfile });
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
        justCompletedOnboarding: state.justCompletedOnboarding,
        currentGoal: state.currentGoal,
        lastUserId: state.lastUserId,
      })
    }
  )
);