import type { MetadataRoute } from "next";

const BASE_URL = "https://perfilisto.com";
const MARKETING_UPDATED_AT = new Date("2026-09-10");
const LEGAL_UPDATED_AT = new Date("2026-09-10");

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/data-deletion`,
      lastModified: new Date("2026-09-11"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/`,
      lastModified: MARKETING_UPDATED_AT,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
