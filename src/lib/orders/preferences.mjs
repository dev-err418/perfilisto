import options from "./preference-options.json" with { type: "json" };
import { applyPlanLimits } from "./plan-limits.mjs";

export function sanitizePreferences(input = {}, planId) {
  const result = {};
  for (const [key, allowed] of Object.entries(options)) {
    if (["attire", "backgrounds", "poses"].includes(key)) {
      result[key] = Array.isArray(input?.[key])
        ? [...new Set(input[key].filter((v) => allowed.includes(v)))]
        : [];
    } else if (allowed.includes(input?.[key])) result[key] = input[key];
  }
  return applyPlanLimits(result, planId);
}
