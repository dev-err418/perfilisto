import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["es", "en"].flatMap(locale => ["", "/privacy", "/terms", "/data-deletion"].map(path => ({
    url: `https://perfilisto.com/${locale}${path}`,
    lastModified: new Date("2026-09-12"),
    alternates: { languages: { es: `https://perfilisto.com/es${path}`, en: `https://perfilisto.com/en${path}` } },
    priority: path ? 0.3 : 1,
  })));
}
