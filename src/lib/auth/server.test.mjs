import assert from "node:assert/strict";
import test from "node:test";
import { encode } from "@auth/core/jwt";
import { authConfig, handleAuth, hasSession, safeRedirect } from "./server.mjs";
import { getRequestPolicy } from "./request-policy.mjs";
import worker from "../../../worker/index.js";

const env = { AUTH_SECRET: "test-only-secret-not-used-outside-unit-tests", AUTH_GOOGLE_ID: "test-google", AUTH_GOOGLE_SECRET: "test-secret", AUTH_FACEBOOK_ID: "test-facebook", AUTH_FACEBOOK_SECRET: "test-secret" };
const origin = "https://perfilisto.com";
const cookieName = "__Secure-authjs.session-token";

test("redirects stay on protected same-origin pages", () => {
  for (const value of ["https://evil.example/onboarding", "//evil.example/onboarding", "/login", "/api/auth/signout", "javascript:alert(1)"]) {
    assert.equal(safeRedirect(value, origin), `${origin}/onboarding`);
  }
  assert.equal(safeRedirect("/onboarding?plan=pro", origin), `${origin}/onboarding?plan=pro`);
});

test("both providers are configured with callback protection", () => {
  const config = authConfig(env);
  assert.equal(config.providers.length, 2);
  assert.equal(config.session.strategy, "jwt");
  assert.equal(config.basePath, "/api/auth");
});

test("forged, missing and expired sessions cannot enter onboarding", async () => {
  for (const value of ["", "forged", await encode({ token: { sub: "google:123" }, secret: env.AUTH_SECRET, salt: cookieName, maxAge: -60 })]) {
    const request = new Request(`${origin}/onboarding`, { headers: { cookie: `${cookieName}=${value}` } });
    assert.equal(await hasSession(request, env), false);
  }
});

test("valid encrypted session enters onboarding and static output variants stay guarded", async () => {
  const value = await encode({ token: { sub: "google:123" }, secret: env.AUTH_SECRET, salt: cookieName });
  for (const path of ["/onboarding", "/onboarding.html", "/onboarding.txt", "/onboarding.rsc", "/onboarding/"]) {
    const request = new Request(`${origin}${path}`, { headers: { cookie: `${cookieName}=${value}` } });
    assert.equal(await hasSession(request, env), true);
    assert.equal(getRequestPolicy(request.url, true).redirect, null);
    assert.equal(getRequestPolicy(request.url).status, 307);
  }
});

test("worker protects assets and permits a verified session", async () => {
  let assetCalls = 0;
  const bindings = { ...env, ASSETS: { fetch: async () => { assetCalls++; return new Response("onboarding"); } } };
  const denied = await worker.fetch(new Request(`${origin}/onboarding.html`), bindings);
  assert.equal(denied.status, 307);
  assert.equal(assetCalls, 0);
  const value = await encode({ token: { sub: "facebook:123" }, secret: env.AUTH_SECRET, salt: cookieName });
  const allowed = await worker.fetch(new Request(`${origin}/onboarding`, { headers: { cookie: `${cookieName}=${value}` } }), bindings);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("Cache-Control"), "private, no-store");
  assert.equal(assetCalls, 1);
});

test("providers expose correct callback URLs without credentials", async () => {
  const response = await handleAuth(new Request(`${origin}/api/auth/providers`), env);
  assert.equal(response.status, 200);
  const providers = await response.json();
  for (const provider of ["google", "facebook"]) {
    assert.equal(providers[provider].callbackUrl, `${origin}/api/auth/callback/${provider}`);
  }
  assert.equal(JSON.stringify(providers).includes("test-secret"), false);
});

test("sign-in without CSRF token does not start an OAuth flow", async () => {
  const response = await handleAuth(new Request(`${origin}/api/auth/signin/facebook`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" }, body: "callbackUrl=%2Fonboarding" }), env);
  const body = await response.json();
  assert.equal(new URL(body.url).origin, origin);
  assert.equal(body.url.includes("MissingCSRF"), true);
});

test("cancelled callbacks return a redirect with writable privacy headers", async () => {
  for (const provider of ["google", "facebook"]) {
    const response = await handleAuth(new Request(`${origin}/api/auth/callback/${provider}?error=access_denied`), env);
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get("Location")).pathname, "/login");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});
