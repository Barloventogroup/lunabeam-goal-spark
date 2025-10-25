export type EntryVariant = 'first_time' | 'returning';

export interface EntryContext {
  onboardingComplete: boolean;
  goalsLoaded?: boolean;
  activeGoalsCount?: number;
}

/**
 * Determines whether a user should see the first-time or returning experience
 * based on their onboarding status and goal state.
 */
export function resolveEntryVariant(context: EntryContext): EntryVariant {
  // If onboarding isn't complete, definitely first time
  if (!context.onboardingComplete) {
    return 'first_time';
  }

  // If onboarding is complete but they have no active goals, treat as first time
  if (context.goalsLoaded && (context.activeGoalsCount ?? 0) === 0) {
    return 'first_time';
  }

  // Otherwise, they're a returning user
  return 'returning';
}
