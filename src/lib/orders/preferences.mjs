import options from "./preference-options.json" with { type: "json" };
export function sanitizePreferences(input = {}) {
  const result = {};
  for (const [key, allowed] of Object.entries(options)) {
    if (["attire", "backgrounds", "poses"].includes(key)) {
      result[key] = Array.isArray(input?.[key])
        ? [...new Set(input[key].filter((v) => allowed.includes(v)))]
        : [];
    } else if (allowed.includes(input?.[key])) result[key] = input[key];
  }
  return result;
}
