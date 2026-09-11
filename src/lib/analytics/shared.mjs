export const CONSENT_COOKIE = "perfilisto_analytics";
export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "twclid", "li_fat_id", "rdt_cid", "sccid", "wacid", "wasid", "waid"];
export function campaignParams(input) {
  try {
    const url = new URL(input);
    return Object.fromEntries(ATTRIBUTION_KEYS.flatMap(key => {
      const value = url.searchParams.get(key);
      return value && value.length <= 512 ? [[key, value]] : [];
    }));
  } catch { return {}; }
}
export function isAnalyticsEnabled(cookie = "") {
  return !cookie.split(";").some(part => part.trim() === `${CONSENT_COOKIE}=no`);
}
export function funnelPage(path) {
  return ["/", "/login", "/onboarding", "/dashboard", "/album"].includes(path.replace(/\/$/, "") || "/");
}
/** Whitelist only coarse, edge-derived location. Never trust forwarded geo headers. */
export function cloudflareCustomer(cf) {
  const fields = { city: cf?.city, state: cf?.regionCode || cf?.region, postal_code: cf?.postalCode, country: cf?.country };
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === "string" && value.length > 0 && value.length <= 128 && !["XX", "T1"].includes(value)));
}
/** No free-form errors, photo URLs, appearance answers, tokens, or card details. */
export function eventProperties(input = {}) {
  if (!input || typeof input !== "object") return {};
  const result = {};
  if (["basic", "professional", "executive"].includes(input.plan_id)) result.plan_id = input.plan_id;
  if (["google", "facebook"].includes(input.provider)) result.provider = input.provider;
  if (typeof input.step === "string" && /^[a-z_]{1,40}$/.test(input.step)) result.step = input.step;
  if (typeof input.placement === "string" && /^[a-z_]{1,40}$/.test(input.placement)) result.placement = input.placement;
  if (Number.isInteger(input.photo_count) && input.photo_count >= 0 && input.photo_count <= 10) result.photo_count = input.photo_count;
  if (typeof input.value === "number" && Number.isFinite(input.value) && input.value > 0 && input.value <= 1000) result.value = input.value;
  if (input.currency?.toLowerCase() === "eur") result.currency = "EUR";
  return result;
}
export function funnelEvent(name, input = {}) {
  const properties = eventProperties(input);
  const steps = ["welcome", "gender", "age", "hair", "hair_length", "hair_type", "body_type", "attire", "backgrounds", "upload", "packages"];
  if (name === "onboarding_step") return steps.includes(properties.step) ? `onboarding_${properties.step}` : null;
  if (["sign_in_started", "sign_in_failed"].includes(name)) return properties.provider ? `${name}_${properties.provider}` : name;
  if (name === "view_content") return properties.step === "landing_pricing" ? "view_content" : null;
  return ["visit", "get_started", "signed_in", "uploads_ready", "photos_saved", "package_selected", "add_to_cart", "order_preparation_failed", "generation_requested"].includes(name) ? name : null;
}
