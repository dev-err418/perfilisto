import { getMessages } from "@/i18n";
import { getPlans } from "@/lib/orders/catalog.mjs";
import type { JsonValue } from "@/lib/json-value";

const BASE_URL = "https://perfilisto.com";

export const organizationJsonLd: JsonValue = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Perfilisto",
  url: BASE_URL,
  legalName: "Tap & Swipe SAS",
  founder: {
    "@type": "Person",
    name: "Arthur Spalanzani",
  },
};

export const websiteJsonLd: JsonValue = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Perfilisto",
  url: BASE_URL,
};

export function softwareApplicationJsonLd(locale: string): JsonValue {
const plans = getPlans(locale);
return {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Perfilisto",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    getMessages(locale).meta.description,
  offers: {
    "@type": "AggregateOffer",
    lowPrice: String(plans[0].price),
    highPrice: String(plans[2].price),
    offerCount: "3",
    priceCurrency: plans[0].currency.toUpperCase(),
  },
  publisher: {
    "@type": "Organization",
    name: "Tap & Swipe SAS",
  },
};

}
