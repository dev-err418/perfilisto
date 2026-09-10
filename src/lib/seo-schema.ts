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
    "A one-page professional profile you can share with recruiters, clients, and anyone who needs to know what you do.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "Tap & Swipe SAS",
  },
};
