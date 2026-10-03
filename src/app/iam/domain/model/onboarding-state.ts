export interface OnboardingState {
  userId: number;
  laboratoryId: number | null;
  subscriptionId: number | null;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  nextStep: 'PASSWORD_CHANGE' | 'SUBSCRIPTION' | 'LABORATORY' | 'READY';
}

/** Where a staff member waits while the laboratory subscription is not active. */
export const SUBSCRIPTION_PAUSED = '/iam/onboarding';

/**
 * Resolves the view that the user must see next.
 *
 * @param state - onboarding state returned by the platform
 * @param managesSubscription - whether the user can subscribe (quality managers); staff members
 *   cannot, so they wait until their laboratory has an active subscription
 */
export function onboardingDestination(state: OnboardingState, managesSubscription = true): string {
  if (state.nextStep === 'PASSWORD_CHANGE') return '/iam/change-password';
  if (state.subscriptionStatus !== 'ACTIVE') return managesSubscription ? '/subscriptions/plans' : SUBSCRIPTION_PAUSED;
  return state.laboratoryId === null ? '/laboratories/create' : '/dashboard';
}
