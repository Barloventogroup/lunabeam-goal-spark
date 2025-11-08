import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyCircle, CircleMembership, CircleInvite, WeeklyCheckin, SelectedGoal, Profile, Consent, CheckInEntry, Evidence, Badge, Goal, Step } from '@/types';
import { database } from '@/services/database';
import { goalsService, stepsService } from '@/services/goalsService';
import { pointsService, type PointsSummary } from '@/services/pointsService';
import { supabase } from '@/integrations/supabase/client';
import { getUserContext, type UserContext } from '@/utils/userTypeUtils';
import { getSupporterContext } from '@/utils/supporterUtils';

interface AppState {
  // Core data
  profile: Profile | null;
  userContext: UserContext | null;
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
  refreshProfile: () => Promise<void>;
  updateUserContext: () => Promise<void>;
  updateConsent: (consent: Consent) => void;
  completeOnboarding: () => Promise<void>;
  clearJustCompletedOnboarding: () => void;
  resetOnboarding: () => Promise<void>;
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
      userContext: null,
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
        // Update user context when profile changes
        const userContext = await getUserContext(profile);
        set({ userContext });
      },

      refreshProfile: async () => {
        try {
          console.log('Store: refreshProfile - forcing fresh fetch from database');
          const freshProfile = await database.getProfile();
          if (freshProfile) {
            console.log('Store: refreshProfile - got fresh profile:', freshProfile);
            set({ profile: freshProfile });
            const userContext = await getUserContext(freshProfile);
            set({ userContext });
          }
        } catch (error) {
          console.error('Store: refreshProfile failed:', error);
        }
      },

      updateUserContext: async () => {
        const { profile } = get();
        const userContext = await getUserContext(profile);
        set({ userContext });
      },
      
      // New Goals & Steps actions
      loadGoals: async () => {
        try {
          console.log('Loading new goals...');
          const goals = await goalsService.getGoals();
          console.log('Loaded new goals:', goals);
          set({ goals });
          
          // Batch load steps for all active/planned goals
          const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'planned');
          if (activeGoals.length > 0) {
            try {
              const stepsPromises = activeGoals.map(g => stepsService.getSteps(g.id));
              const stepsResults = await Promise.allSettled(stepsPromises);
              
              const stepsMap: Record<string, Step[]> = {};
              activeGoals.forEach((goal, index) => {
                const result = stepsResults[index];
                if (result.status === 'fulfilled') {
                  stepsMap[goal.id] = result.value;
                }
              });
              
              // Single store update with all steps data
              set((state) => ({
                steps: { ...state.steps, ...stepsMap }
              }));
            } catch (error) {
              console.error('Failed to batch load steps:', error);
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

      resetOnboarding: async () => {
        try {
          const current = get().profile;
          if (current) {
            const resetProfile = { 
              ...current, 
              onboarding_complete: false,
              user_type: undefined // Clear user type to force role selection
            };
            await database.saveProfile(resetProfile);
            set({ profile: resetProfile });
          }
        } catch (error) {
          console.error('Error resetting onboarding:', error);
        }
      },
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      // Computed helper for onboarding status
      isOnboardingComplete: () => {
        const { profile, userContext } = get();
        const role = userContext?.userType || (profile as any)?.user_type;
        if (role === 'supporter' || role === 'hybrid') return true;
        if (!profile) return false;
        return profile.onboarding_complete === true && !!role;
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
          
          // First check if a profile already exists in database - avoid race conditions
          const profile = await database.getProfile();
          console.log('Store: Profile from DB:', profile);
          
          if (profile) {
            console.log('Store: Found existing profile, using it');
            set({ profile });
            const userContext = await getUserContext(profile);
            set({ userContext });
            return;
          }
          
          console.log('Store: No profile found in DB, checking if one should exist...');

          // Check if this might be a race condition - wait briefly and check again
          await new Promise(resolve => setTimeout(resolve, 100));
          const secondCheck = await database.getProfile();
          if (secondCheck) {
            console.log('Store: Profile appeared after brief delay, using it');
            set({ profile: secondCheck });
            const userContext = await getUserContext(secondCheck);
            set({ userContext });
            return;
          }

          console.log('Store: Definitely no profile exists, creating for new user...');

          // Get current auth user first to scope persisted state
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.error('Store: Failed to get user info:', userError);
            throw userError;
          }

          if (user) {
            console.log('Store: Current authenticated user ID:', user.id);
            console.log('Store: User metadata:', user.user_metadata);
            
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

            // Check if this is a claimed account by looking for claim tokens in session storage
            const claimToken = sessionStorage.getItem('claim_token');
            const isClaimedAccount = !!claimToken;
            
            console.log('Store: Creating minimal profile for', isClaimedAccount ? 'claimed account' : 'regular user');

            // Create minimal profile with proper authentication fields
            const metaFirst = (user.user_metadata?.first_name || '').toString().trim();
            const emailLocal = (user.email || '').split('@')[0] || '';
            const firstName = metaFirst || emailLocal || 'User';

            // Infer role from supporter relationships to classify supporters/hybrids
            let inferredType: 'individual' | 'supporter' | 'hybrid' = 'individual';
            try {
              const supporterCtx = await getSupporterContext(user.id);
              inferredType = supporterCtx.isHybrid
                ? 'hybrid'
                : (supporterCtx.isSupporterOnly ? 'supporter' : 'individual');
            } catch (e) {
              console.warn('Store: could not infer supporter context, defaulting to individual', e);
            }

            const minimalProfile = {
              first_name: firstName,
              strengths: [],
              interests: [],
              challenges: [],
              comm_pref: 'text' as const,
              // Include authentication fields for regular users who just completed signup
              password_set: true as const,
              authentication_status: 'authenticated' as const,
              account_status: isClaimedAccount ? ('user_claimed' as const) : ('active' as const),
              user_type: inferredType as any,
              // Supporters/hybrids and claimed accounts skip onboarding
              onboarding_complete: isClaimedAccount || inferredType === 'supporter' || inferredType === 'hybrid',
            };

            console.log('Store: Creating minimal profile from auth:', minimalProfile);
            console.log('Store: User info:', { id: user.id, email: user.email, metadata: user.user_metadata });
            
            try {
              await database.saveProfile(minimalProfile);
              console.log('Store: Successfully saved minimal profile to DB with auth fields for', isClaimedAccount ? 'claimed account' : 'regular user');
              set({ profile: minimalProfile });
              // Update user context for the new profile
              const userContext = await getUserContext(minimalProfile);
              set({ userContext });
              return;
            } catch (saveError) {
              console.error('Store: Failed to save minimal profile to DB:', saveError);
              // Set profile in state even if DB save fails, so onboarding can proceed
              set({ profile: minimalProfile });
              // Still try to get user context
              const userContext = await getUserContext(minimalProfile);
              set({ userContext });
              return;
            }
          } else {
            console.error('Store: No authenticated user found');
            throw new Error('No authenticated user found');
          }
          
          // Ensure the profile name matches auth metadata; auto-repair if mismatched
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const metaFirst = (user?.user_metadata?.first_name || '').toString().trim();
            const emailLocal = (user?.email || '').split('@')[0] || '';
            const desiredFirst = metaFirst || emailLocal || profile.first_name;
            if (user && desiredFirst && profile.first_name !== desiredFirst) {
              console.log('Store: Profile name mismatch detected. Repairing...', { from: profile.first_name, to: desiredFirst, userId: user.id });
              const repaired = { ...profile, first_name: desiredFirst };
              await database.saveProfile(repaired);
              set({ profile: repaired });
              // Update user context for the repaired profile
              const userContext = await getUserContext(repaired);
              set({ userContext });
              return;
            }
          } catch (mismatchErr) {
            console.warn('Store: Mismatch repair check failed (ignored):', mismatchErr);
          }

          console.log('Store: Setting profile from DB:', profile);
          set({ profile });
          // Update user context for the loaded profile
          const userContext = await getUserContext(profile);
          set({ userContext });
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
            console.log('Store: Auth error detected while loading profile. Initiating safe sign-out.');
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn('Store: Sign out failed (ignored):', e);
            }
            try {
              localStorage.removeItem('lunebeam-store');
              localStorage.setItem('force-logout', 'true');
            } catch (e) {
              console.warn('Store: Failed to update localStorage during auth error');
            }
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