"use client";

import { campaignParams, eventProperties, funnelPage, funnelEvent, hasAnalyticsConsent, CONSENT_COOKIE } from "./shared.mjs";

type Properties = { step?: string; plan_id?: string; provider?: string; placement?: string; photo_count?: number; value?: number; currency?: string };
type Pixel = { c?: Record<string, boolean>; config?: (options: Record<string, boolean>) => void; q: unknown[][]; t: number; s: string[]; o: string; track: (...args: unknown[]) => void; setScope: (...args: string[]) => void };
declare global { interface Window { whop?: Pixel } }
const ACCOUNT = "biz_KrDEESTmp4RqPG";
const CAMPAIGN_KEY = "perfilisto-campaign-v1";
const JOURNEY_KEY = "perfilisto-funnel-v1";
export const ANALYTICS_READY = "perfilisto-analytics-ready";
const events = new Set(["page", "view_content", "get_started", "sign_in_started", "sign_in_failed", "signed_in", "onboarding_step", "uploads_ready", "photos_saved", "package_selected", "add_to_cart", "order_preparation_failed", "generation_requested", "visit"]);
let customer: Record<string, string> = {};
let initialization: Promise<void> | undefined;
let ready = false;
let pagePath = "";
let journey = "";
const seen = new Set<string>();
const OUTBOX_KEY = "perfilisto-analytics-outbox";
type PendingEvent = { name: string; props: Properties; id: string; url: string; campaign: Record<string, string>; wuid?: string; account?: string; expires: number };
const pending = new Map<string, PendingEvent>();
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
function rememberPending() {
  try { sessionStorage.setItem(OUTBOX_KEY, JSON.stringify([...pending.values()])); } catch { /* Keep in memory. */ }
}
async function flushPending() {
  if (flushing || !analyticsAllowed()) return;
  flushing = true;
  try {
    for (const [key, event] of pending) {
      if (event.expires < Date.now()) { pending.delete(key); continue; }
      try {
        const response = await fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ ...event, wuid: event.wuid || checkoutAttribution().wuid }), signal: AbortSignal.timeout(8000) });
        if (response.ok || [400, 401, 403, 404, 409, 413, 415].includes(response.status)) pending.delete(key);
        else break;
      } catch { break; }
    }
  } finally {
    flushing = false;
    rememberPending();
    if (pending.size && analyticsAllowed() && !retryTimer) retryTimer = setTimeout(() => { retryTimer = undefined; void flushPending(); }, 15000);
  }
}
function savedCampaign(): Record<string, string> {
  try {
    const saved = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || "null");
    if (saved?.expires > Date.now()) return campaignParams(`https://perfilisto.com/?${new URLSearchParams(saved.params)}`);
    localStorage.removeItem(CAMPAIGN_KEY);
  } catch { /* Optional. */ }
  return {};
}

export function privacySignal() {
  return typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true);
}
export function analyticsAllowed() {
  return typeof window !== "undefined" && window.location.hostname === "perfilisto.com" && !privacySignal() && hasAnalyticsConsent(document.cookie);
}
function eligiblePage() {
  return funnelPage(location.pathname) && !/[?&](s|token|code|secret|access_token)=/i.test(location.search);
}
export function consentChoice(): "yes" | "no" | null {
  if (typeof document === "undefined") return null;
  if (privacySignal()) return "no";
  return document.cookie.match(/(?:^|;\s*)perfilisto_analytics=(yes|no)(?:;|$)/)?.[1] as "yes" | "no" || null;
}
export function saveConsent(value: "yes" | "no") {
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (value === "no") {
    try { localStorage.removeItem(CAMPAIGN_KEY); localStorage.removeItem("_wuid"); sessionStorage.removeItem(JOURNEY_KEY); sessionStorage.removeItem(OUTBOX_KEY); } catch { /* Storage can be unavailable. */ }
    for (const domain of ["", "; Domain=perfilisto.com", "; Domain=.perfilisto.com"]) document.cookie = `_wuid=; Path=/; Max-Age=0${domain}`;
    customer = {}; pending.clear(); if (retryTimer) clearTimeout(retryTimer);
  }
}
function captureCampaign() {
  if (!analyticsAllowed()) return;
  const params = campaignParams(location.href);
  if (!Object.keys(params).length) return;
  try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify({ params, expires: Date.now() + 30 * 86400000 })); } catch { /* Pixel still captures current URL. */ }
}
export function checkoutAttribution(): { utm?: Record<string, string>; wuid?: string } {
  if (!analyticsAllowed()) return {};
  const params = savedCampaign();
  const utm = Object.fromEntries(Object.entries(params).filter(([key]) => key.startsWith("utm_")));
  const wuid = document.cookie.match(/(?:^|;\s*)_wuid=([^;]+)/)?.[1];
  return { ...(Object.keys(utm).length ? { utm } : {}), ...(wuid && /^wuid_[a-zA-Z0-9_-]{1,200}$/.test(wuid) ? { wuid } : {}) };
}
function eventId(key: string) {
  if (!journey) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(JOURNEY_KEY) || "null");
      if (saved?.expires > Date.now() && typeof saved.id === "string") journey = saved.id;
    } catch { /* In-memory IDs still deduplicate React effect replay. */ }
    journey ||= crypto.randomUUID();
    try { sessionStorage.setItem(JOURNEY_KEY, JSON.stringify({ id: journey, expires: Date.now() + 86400000 })); } catch { /* Optional. */ }
  }
  return key.startsWith("order:") ? `perfilisto:${key}` : `perfilisto:${journey}:${key}`;
}
/** Tracking failures never become product failures. Stable keys refer to one real action. */
export function trackFunnel(name: string, props: Properties = {}, key?: string, sourceUrl?: string) {
  try {
    if (!events.has(name) || !analyticsAllowed() || !eligiblePage()) return;
    sourceUrl ||= location.origin + location.pathname;
    if (!ready) { void initializeAnalytics().then(() => trackFunnel(name, props, key, sourceUrl)); return; }
    const id = key ? eventId(key) : `perfilisto:${crypto.randomUUID()}`;
    if (seen.has(`${name}:${id}`)) return;
    if ((window.whop?.q?.length ?? 0) > 100) return;
    if (name === "page") window.whop?.track("page");
    else {
      if (!funnelEvent(name, props)) return;
      const event = { name, props: eventProperties(props), id, url: sourceUrl, campaign: savedCampaign(), wuid: checkoutAttribution().wuid, account: customer.external_id, expires: Date.now() + 10 * 60000 };
      if (pending.size >= 100) return;
      pending.set(`${name}:${id}`, event);
      rememberPending();
      void flushPending();
    }
    seen.add(`${name}:${id}`);
    if (seen.size > 300) seen.delete(seen.values().next().value!);
  } catch { /* Analytics must never block sign-in, uploads, or payment. */ }
}
export async function initializeAnalytics() {
  if (!analyticsAllowed() || !eligiblePage()) return;
  captureCampaign();
  initialization ||= (async () => {
    try {
      const response = await fetch("/api/analytics/context", { cache: "no-store", signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const context = await response.json();
        customer = Object.fromEntries(["email", "name", "external_id", "city", "state", "postal_code", "country"].flatMap(key => typeof context[key] === "string" ? [[key, context[key]]] : []));
      }
    } catch { /* Anonymous pixel attribution remains available. */ }
    if (!analyticsAllowed() || !eligiblePage()) { initialization = undefined; return; }
    if (!window.whop) {
      const pixel: Pixel = { c: { autoPage: false, forms: false, urlIdentity: false }, q: [], t: Date.now(), s: [], o: "https://t.whop.tw", track(...args) { this.q.push([Date.now(), ...args]); }, setScope(...args) { this.s = args; this.q.push([Date.now(), "setScope", ...args]); } };
      window.whop = pixel;
      const script = document.createElement("script");
      script.id = "whop-pixel";
      script.async = true;
      script.src = "https://t.whop.tw/s.js";
      // SDK has its own SPA/form observers; disable them so React owns page views and inputs stay private.
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 2500);
        script.onload = script.onerror = () => { clearTimeout(timer); resolve(); };
        document.head.appendChild(script);
      });
    }
    if (!analyticsAllowed() || !eligiblePage()) return;
    window.whop.setScope(ACCOUNT);
    window.whop.config?.({ autoPage: false, forms: false, urlIdentity: false });
    if (customer.external_id) window.whop.track("identify", { email: customer.email, full_name: customer.name, user_id: customer.external_id });
    try {
      const saved = JSON.parse(sessionStorage.getItem(OUTBOX_KEY) || "[]");
      if (Array.isArray(saved)) for (const event of saved.slice(0, 100)) if (event?.expires > Date.now() && (!event.account || event.account === customer.external_id)) pending.set(`${event.name}:${event.id}`, event);
    } catch { /* Optional retry recovery. */ }
    ready = true;
    window.addEventListener("online", () => void flushPending());
    void flushPending();
    window.dispatchEvent(new Event(ANALYTICS_READY));
  })();
  await initialization;
}
export async function trackPage() {
  if (!eligiblePage()) { pagePath = ""; return; }
  await initializeAnalytics();
  if (!ready || !analyticsAllowed() || !eligiblePage() || pagePath === location.pathname) return;
  pagePath = location.pathname;
  trackFunnel("page");
  trackFunnel("visit", {}, `visit:${pagePath === "/" ? "landing" : pagePath.slice(1)}`);
  if (customer.external_id) trackFunnel("signed_in", {}, `signed_in:${customer.external_id}`);
}
