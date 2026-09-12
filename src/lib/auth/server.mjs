import { stripLocale } from "../../i18n/routing.mjs";
import { Auth } from "@auth/core";
import Google from "@auth/core/providers/google";
import Facebook from "@auth/core/providers/facebook";
import { getToken } from "@auth/core/jwt";

/** @param {string} target @param {string} origin */
export function safeRedirect(target, origin) {
  try {
    const url = new URL(target, origin);
    const pathname = stripLocale(url.pathname);
    if (url.origin === origin && !url.username && !url.password &&
      (pathname === "/onboarding" || pathname.startsWith("/onboarding/") ||
       pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
       pathname === "/album" || pathname.startsWith("/album/"))) {
      return url.href;
    }
  } catch { /* Use the default destination. */ }
  return `${origin}/dashboard`;
}

/** @param {Record<string, string | undefined>} env */
export function authConfig(env) {
  /** @type {import('@auth/core').AuthConfig} */
  const config = {
    secret: env.AUTH_SECRET,
    trustHost: true,
    basePath: "/api/auth",
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
    pages: { signIn: "/login", error: "/login" },
    providers: [],
    callbacks: {
      redirect: ({ url, baseUrl }) => safeRedirect(url, baseUrl),
      jwt: ({ token, account }) => {
        if (account) token.sub = `${account.provider}:${account.providerAccountId}`;
        return token;
      },
    },
    // Do not log provider responses, tokens, or request details.
    logger: { error: (error) => console.error("Authentication failed:", error.type) },
  };
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    config.providers.push(Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      checks: ["pkce", "state", "nonce"],
    }));
  }
  if (env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET) {
    config.providers.push(Facebook({
      clientId: env.AUTH_FACEBOOK_ID,
      clientSecret: env.AUTH_FACEBOOK_SECRET,
      authorization: { url: "https://www.facebook.com/v25.0/dialog/oauth", params: { scope: "email,public_profile" } },
      checks: ["state"],
    }));
  }
  return config;
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function hasSession(request, env) {
  if (!env.AUTH_SECRET) return false;
  const token = await getToken({
    req: request,
    secret: env.AUTH_SECRET,
    secureCookie: new URL(request.url).protocol === "https:",
  });
  return Boolean(token?.sub && token.exp && token.exp > Date.now() / 1000);
}

/** @param {Request} request @param {Record<string, string | undefined>} env */
export async function handleAuth(request, env) {
  if (!env.AUTH_SECRET) {
    return Response.json({ error: "Sign-in is not configured yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  // Explicitly bound origins: do not trust forwarded host headers for OAuth URLs.
  const url = new URL(request.url);
  if (url.origin !== "https://perfilisto.com" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    return new Response("Invalid authentication origin", { status: 400 });
  }
  const authResponse = await Auth(request, authConfig(env));
  // Redirect responses can have immutable headers in the Worker runtime.
  const response = new Response(authResponse.body, authResponse);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
