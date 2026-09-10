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

export const softwareApplicationJsonLd: JsonValue = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Perfilisto",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "An AI headshot generator that turns selfies into professional photos for LinkedIn, CVs, websites, and company profiles.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "29",
    highPrice: "59",
    offerCount: "3",
    priceCurrency: "EUR",
  },
  publisher: {
    "@type": "Organization",
    name: "Tap & Swipe SAS",
  },
};
