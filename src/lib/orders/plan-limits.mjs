export const PLAN_LIMITS = {
  basic: { attire: 1, backgrounds: 1, quality: "medium" },
  professional: { attire: 3, backgrounds: 4, quality: "high" },
  executive: { attire: 3, backgrounds: 4, quality: "high" },
};

export function applyPlanLimits(preferences, planId) {
  const limits = PLAN_LIMITS[planId];
  if (!limits) return preferences;
  return {
    ...preferences,
    attire: (preferences.attire || []).slice(0, limits.attire),
    backgrounds: (preferences.backgrounds || []).slice(0, limits.backgrounds),
  };
}
