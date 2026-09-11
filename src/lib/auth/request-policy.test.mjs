import assert from "node:assert/strict";
import test from "node:test";
import { getRequestPolicy } from "./request-policy.mjs";

test("dashboard redirects retain the intended path and query on the same origin", () => {
  const policy = getRequestPolicy("https://perfilisto.com/dashboard/photos?album=one");
  const destination = new URL(policy.redirect);
  assert.equal(policy.status, 307);
  assert.equal(destination.origin, "https://perfilisto.com");
  assert.equal(destination.pathname, "/login");
  assert.equal(destination.searchParams.get("redirect"), "/dashboard/photos?album=one");
  assert.equal(policy.headers["Cache-Control"], "private, no-store");
});

test("public pages, API routes, and similar prefixes remain accessible", () => {
  for (const path of ["/", "/onboarding-example", "/upload-session?s=abc", "/api/upload-sessions", "/dashboard-example"]) {
    assert.equal(getRequestPolicy(`http://localhost:3000${path}`).redirect, null);
  }
});

test("onboarding requires login and preserves the requested destination", () => {
  for (const path of ["/onboarding", "/onboarding/", "/onboarding/upload?plan=professional"]) {
    const policy = getRequestPolicy(`http://localhost:3000${path}`);
    const destination = new URL(policy.redirect);
    assert.equal(policy.status, 307);
    assert.equal(destination.pathname, "/login");
    assert.equal(destination.searchParams.get("redirect"), path);
    assert.equal(policy.headers["Cache-Control"], "private, no-store");
  }
});

test("login does not loop and is private on both trailing-slash variants", () => {
  for (const path of ["/login", "/login/"]) {
    const policy = getRequestPolicy(`https://perfilisto.com${path}?redirect=https://example.com`);
    assert.equal(policy.redirect, null);
    assert.equal(policy.headers["X-Robots-Tag"], "noindex, nofollow");
    assert.equal(policy.headers["Cache-Control"], "private, no-store");
  }
});

test("canonical redirects preserve paths and query parameters", () => {
  const policy = getRequestPolicy("http://www.perfilisto.com/login?redirect=%2Fdashboard");
  assert.equal(policy.status, 301);
  assert.equal(policy.redirect, "https://perfilisto.com/login?redirect=%2Fdashboard");
});

test("album pages require login, preserve the order link and disable public caching", () => {
  for (const path of ['/album?order=example', '/album.html?order=example', '/album/']) {
    const policy = getRequestPolicy(`https://perfilisto.com${path}`);
    assert.equal(new URL(policy.redirect).searchParams.get('redirect'), path);
    assert.equal(policy.headers['Cache-Control'], 'private, no-store');
    assert.equal(getRequestPolicy(`https://perfilisto.com${path}`, true).redirect, null);
  }
});
