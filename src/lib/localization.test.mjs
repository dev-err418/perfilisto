import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLocale, localeRedirect, localizedPath } from "../i18n/routing.mjs";
import { getRequestPolicy } from "./auth/request-policy.mjs";
import { safeRedirect } from "./auth/server.mjs";
import worker from "../../worker/index.js";

test("Spain or a preferred Spanish language selects Spanish; other signals select English", () => {
  assert.equal(detectLocale({ country: "ES", acceptLanguage: "en-US,en;q=0.9" }), "es");
  assert.equal(detectLocale({ country: "US", acceptLanguage: "es-MX,es;q=0.9,en;q=0.8" }), "es");
  assert.equal(detectLocale({ country: "FR", acceptLanguage: "fr-FR" }), "en");
  assert.equal(detectLocale({ country: "US" }), "en");
  assert.equal(detectLocale({ acceptLanguage: "es;q=0.5,en;q=1" }), "en");
  assert.equal(detectLocale({ acceptLanguage: "es;q=0,en;q=1" }), "en");
  assert.equal(detectLocale({ acceptLanguage: "*", country: "XX" }), "es");
  assert.equal(detectLocale(), "es");
});

test("Locale redirects preserve deep links and queries, respect chosen routes, and skip assets/APIs", () => {
  const request = new Request("https://perfilisto.com/onboarding?plan=executive&order=abc", { headers: { "Accept-Language": "en" } });
  assert.equal(localeRedirect(request, "ES"), "https://perfilisto.com/es/onboarding?plan=executive&order=abc");
  assert.equal(localeRedirect(new Request(request, { headers: { cookie: "perfilisto-locale=en" } }), "ES"), "https://perfilisto.com/en/onboarding?plan=executive&order=abc");
  for (const path of ["/es", "/en/privacy", "/api/auth/session", "/_next/static/app.js", "/onboarding/attire/man-professional.jpg", "/es/onboarding.txt"]) assert.equal(localeRedirect(new Request(`https://perfilisto.com${path}`), "ES"), null);
  assert.equal(localizedPath("/#pricing", "en"), "/en/#pricing");
});

test("Both languages protect HTML and RSC routes and retain localized OAuth destinations", () => {
  for (const locale of ["es", "en"]) {
    for (const path of ["onboarding", "album", "dashboard", "onboarding.txt", "dashboard/index.txt", "album.html"]) {
      const url = `https://perfilisto.com/${locale}/${path}?order=abc`;
      const policy = getRequestPolicy(url, false);
      assert.equal(new URL(policy.redirect).pathname, `/${locale}/login`);
      assert.equal(new URL(policy.redirect).searchParams.get("redirect"), `/${locale}/${path}?order=abc`);
      assert.equal(policy.headers["Cache-Control"], "private, no-store");
    }
    assert.equal(safeRedirect(`/${locale}/onboarding?plan=basic`, "https://perfilisto.com"), `https://perfilisto.com/${locale}/onboarding?plan=basic`);
  }
});

test("Production uses Cloudflare's country and serves explicit locales without cross-language caching", async () => {
  const request = new Request("https://perfilisto.com/", { headers: { "Accept-Language": "en" } });
  Object.defineProperty(request, "cf", { value: { country: "ES" } });
  const response = await worker.fetch(request, {});
  assert.equal(response.headers.get("Location"), "https://perfilisto.com/es");
  const page = await worker.fetch(new Request("https://perfilisto.com/en"), { ASSETS: { fetch: async () => new Response("English", { headers: { "Content-Type": "text/html" } }) } });
  assert.equal(await page.text(), "English");
  assert.equal(page.headers.get("Content-Language"), "en");
  assert.match(page.headers.get("Set-Cookie"), /perfilisto-locale=en/);
});
