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

    if (url.pathname === "/login" && authenticated) {
      return new Response(null, { status: 307, headers: { Location: safeRedirect(url.searchParams.get("redirect") ?? "/onboarding", url.origin), "Cache-Control": "private, no-store" } });
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

    return response;
  },
};

export default worker;
