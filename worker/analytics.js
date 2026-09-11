import { handleOrders } from "./headshot-order.js";
import plans from "../src/lib/orders/plans.json" with { type: "json" };
import { campaignParams, funnelEvent, funnelPage } from "../src/lib/analytics/shared.mjs";
import { getToken } from "@auth/core/jwt";
import { cloudflareCustomer, hasAnalyticsConsent } from "../src/lib/analytics/shared.mjs";

/** Private, same-origin context for the consented pixel; no per-user data enters cached HTML. */
export async function handleAnalyticsContext(request, env) {
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...headers, Allow: "GET" } });
  const origin = new URL(request.url).origin;
  if (request.headers.get("Sec-Fetch-Site") === "cross-site" || (request.headers.get("Origin") && request.headers.get("Origin") !== origin)) return new Response(null, { status: 403, headers });
  if (!hasAnalyticsConsent(request.headers.get("Cookie") || "") || request.headers.get("Sec-GPC") === "1" || request.headers.get("DNT") === "1" || request.cf?.botManagement?.verifiedBot) return Response.json({}, { headers });
  const customer = cloudflareCustomer(request.cf);
  if (env.AUTH_SECRET) {
    try {
      const token = await getToken({ req: request, secret: env.AUTH_SECRET, secureCookie: origin.startsWith("https:") });
      if (token?.sub && token.exp > Date.now() / 1000) {
        // An opaque identifier, rather than the Google/Facebook account ID.
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`perfilisto:${token.sub}`));
        customer.external_id = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
        if (typeof token.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(token.email)) customer.email = token.email;
        if (typeof token.name === "string" && token.name.length <= 200) customer.name = token.name;
      }
    } catch { /* Invalid/expired authentication never interrupts anonymous browsing. */ }
  }
  // The Whop pixel obtains the visitor IP and user agent directly. Do not expose raw IP here.
  return Response.json(customer, { headers });
}


export async function handleAnalyticsEvent(request, env) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
  const reply = status => new Response(null, { status, headers });
  if (request.method !== "POST") return reply(405);
  if (new URL(request.url).origin !== "https://perfilisto.com" || request.headers.get("Origin") !== "https://perfilisto.com" || request.headers.get("Sec-Fetch-Site") === "cross-site") return reply(403);
  if (!hasAnalyticsConsent(request.headers.get("Cookie") || "") || request.headers.get("Sec-GPC") === "1" || request.headers.get("DNT") === "1" || request.cf?.botManagement?.verifiedBot) return reply(204);
  if (!env.ANALYTICS_DELIVERIES || !env.WHOP_EVENTS_API_KEY) return reply(503);
  const ip = request.cf ? request.headers.get("CF-Connecting-IP") : null;
  if (env.ANALYTICS_RATE_LIMIT && !(await env.ANALYTICS_RATE_LIMIT.limit({ key: ip || "unknown" })).success) return reply(429);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply(415);
  let body;
  try {
    const reader = request.body.getReader();
    let size = 0; const chunks = [];
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8192) { await reader.cancel(); return reply(413); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply(400); }
  if (!body || typeof body !== "object") return reply(400);
  const eventName = funnelEvent(body.name, body.props);
  if (!eventName || typeof body.id !== "string" || !/^perfilisto:[a-zA-Z0-9:_-]{1,180}$/.test(body.id)) return reply(400);
  let url;
  try { url = new URL(body.url); if (url.origin !== "https://perfilisto.com" || !funnelPage(url.pathname)) return reply(400); } catch { return reply(400); }
  const attribution = campaignParams(`https://perfilisto.com/?${new URLSearchParams(body.campaign || {})}`);
  // Keep the route and marketing tags only. OAuth codes and upload/order query tokens never leave here.
  url.search = new URLSearchParams(attribution).toString(); url.hash = "";
  const readHeaders = new Headers(request.headers);
  readHeaders.delete("Content-Length"); readHeaders.delete("Content-Type");
  const contextResponse = await handleAnalyticsContext(new Request(request.url, { headers: readHeaders }), env);
  const user = await contextResponse.json();
  // The copy Request has no CF metadata; use the original edge request explicitly.
  Object.assign(user, cloudflareCustomer(request.cf));
  if (!["visit", "get_started", "view_content", "sign_in_started", "sign_in_failed", "sign_in_started_google", "sign_in_started_facebook", "sign_in_failed_google", "sign_in_failed_facebook"].includes(eventName) && !user.external_id) return reply(401);
  if (body.account && body.account !== user.external_id) return reply(403);
  let plan = plans.find(p => p.id === body.props?.plan_id);
  if (["add_to_cart", "photos_saved", "generation_requested"].includes(eventName)) {
    const id = body.id.match(/^perfilisto:order:([a-f0-9-]{36}):/i)?.[1];
    if (!id) return reply(400);
    const orderResponse = await handleOrders(new Request(`https://perfilisto.com/api/orders/${id}`, { headers: readHeaders }), env);
    if (!orderResponse.ok) return reply(404);
    const order = await orderResponse.json();
    if (eventName === "photos_saved" && order.photos.length < 6) return reply(409);
    if (eventName === "generation_requested" && order.status !== "generating") return reply(409);
    plan = plans.find(p => p.id === order.planId);
  }
  if (typeof body.wuid === "string" && /^wuid_[a-zA-Z0-9_-]{1,200}$/.test(body.wuid)) user.anonymous_id = body.wuid;
  const context = Object.fromEntries(Object.entries(attribution).filter(([key]) => !["wacid", "wasid", "waid"].includes(key)));
  if (ip) context.ip_address = ip;
  const ua = request.headers.get("User-Agent"); if (ua) context.user_agent = ua.slice(0, 1024);
  for (const [cookie, key] of [["_fbp", "fbp"], ["_fbc", "fbc"], ["_ttp", "ttp"], ["_ga", "ga"]]) {
    const value = (request.headers.get("Cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith(`${cookie}=`))?.slice(cookie.length + 1);
    if (value && value.length < 512) context[key] = value;
  }
  const payload = { account_id: env.WHOP_ACCOUNT_ID, event_name: eventName, event_id: body.id, event_time: new Date().toISOString(), action_source: "website", url: url.href, user, context,
    ...(plan ? { plan_id: plan.whopPlanId, ...(eventName === "add_to_cart" ? { value: plan.price, currency: plan.currency } : {}) } : {}) };
  try {
    const result = await env.ANALYTICS_DELIVERIES.getByName(body.id + ":" + eventName).fetch(new Request("https://internal/enqueue", { method: "POST", body: JSON.stringify(payload) }));
    return reply(result.ok ? 202 : 503);
  } catch { return reply(503); }
}
