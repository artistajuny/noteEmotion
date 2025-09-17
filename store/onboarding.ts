// store/onboarding.ts
export type OnboardingStep = "step1"|"step2"|"step3"|"step4"|"done";

export function decideNextStep(u: {
  consent_required_terms: boolean|null|undefined;
  consent_privacy: boolean|null|undefined;
  phone_verified_at: string|null|undefined;
  onboarding_completed_at: string|null|undefined;
}): OnboardingStep {
  if (!u) return "step1";
  if (!u.consent_required_terms || !u.consent_privacy) return "step2";
  if (!u.phone_verified_at) return "step3";
  if (!u.onboarding_completed_at) return "step4";
  return "done";
}
