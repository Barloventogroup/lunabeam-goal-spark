export type EntryVariant = 'first_time' | 'returning';

export interface EntryContext {
  onboardingComplete: boolean;
  goalsLoaded?: boolean;
  activeGoalsCount?: number;
}

/**
 * Determines whether a user should see the first-time or returning experience
 * based solely on their onboarding completion status.
 */
export function resolveEntryVariant(context: EntryContext): EntryVariant {
  return context.onboardingComplete ? 'returning' : 'first_time';
}
