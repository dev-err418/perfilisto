import plans from "./plans.json" with { type: "json" };
const usdPrices = [35, 45, 75];
// Keep plan IDs and entitlements independent of translated display names.
function buildPlans(locale) {
  return plans.map((plan, index) => ({ ...plan, price: locale === "en" ? usdPrices[index] : plan.price, currency: locale === "en" ? "usd" : "eur" }));
}
const catalogs = { es: buildPlans("es"), en: buildPlans("en") };
export function getPlans(locale = "es") { return catalogs[locale === "en" ? "en" : "es"]; }
export function formatPrice(value, locale = "es", currency = locale === "en" ? "usd" : "eur") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}
