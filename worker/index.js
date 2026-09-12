import { localeRedirect, pathLocale, stripLocale } from "../src/i18n/routing.mjs";
export { AnalyticsDelivery } from "./analytics-delivery.js";
import { handleAnalyticsContext, handleAnalyticsEvent } from "./analytics.js";
export { EmailDelivery } from "./email-delivery.js";
import { handleAuth, hasSession, safeRedirect } from "../src/lib/auth/server.mjs";
import { getRequestPolicy } from "../src/lib/auth/request-policy.mjs";

import { handleUploadSessions } from "./upload-session.js";
export { UploadSession } from "./upload-session.js";

import { handleOrders } from "./headshot-order.js";
import { handleWhopWebhook } from "./whop-webhook.js";
export { HeadshotOrder } from "./headshot-order.js";

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/analytics/events") return handleAnalyticsEvent(request, env);
    if (url.pathname === "/api/analytics/context") return handleAnalyticsContext(request, env);
    const languageRedirect = localeRedirect(request, request.cf?.country);
    if (languageRedirect) return new Response(null, { status: 307, headers: { Location: languageRedirect, "Cache-Control": "private, no-store", Vary: "Accept-Language, Cookie" } });
    const authenticated = await hasSession(request, env);
    const policy = getRequestPolicy(request.url, authenticated);
    if (policy.redirect) {
      return new Response(null, {
        status: policy.status,
        headers: { ...policy.headers, Location: policy.redirect },
      });
    }

    if (url.pathname === "/api/webhooks/whop") return handleWhopWebhook(request, env);
    if (url.pathname.startsWith("/api/orders/")) return handleOrders(request, env);

    if (url.pathname.startsWith("/api/auth/")) return handleAuth(request, env);

    if (stripLocale(url.pathname) === "/login" && authenticated) {
      return new Response(null, { status: 307, headers: { Location: safeRedirect(url.searchParams.get("redirect") ?? "/dashboard", url.origin), "Cache-Control": "private, no-store" } });
    }

    if (url.pathname.startsWith("/api/upload-sessions")) {
      return handleUploadSessions(request, url, env);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const response = new Response(assetResponse.body, assetResponse);
    for (const [name, value] of Object.entries(policy.headers)) {
      response.headers.set(name, value);
    }
    if (
      url.pathname ===
        "/.well-known/apple-developer-merchantid-domain-association" &&
      response.ok
    ) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/octet-stream");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    const locale = pathLocale(url.pathname);
    if (locale && response.headers.get("Content-Type")?.includes("text/html")) {
      response.headers.append("Set-Cookie", `perfilisto-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      response.headers.set("Content-Language", locale);
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  },
};

export default worker;
