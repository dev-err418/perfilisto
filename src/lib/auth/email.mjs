import { encode } from "@auth/core/jwt";
import { validEmail } from "../email/messages.mjs";

export const EMAIL_CODE_TTL = 10 * 60 * 1000;
export const EMAIL_RESEND_SECONDS = 60;
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export const emailReply = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { ...privateHeaders, ...headers } });
export function normalizeEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return validEmail(email) ? email : null;
}
export async function emailDigest(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
}
export function emailCode() {
  const random = new Uint32Array(1);
  do { crypto.getRandomValues(random); } while (random[0] >= 4294000000);
  return String(random[0] % 1000000).padStart(6, "0");
}
export function codeEmail(email, code, locale) {
  const es = locale === "es";
  const title = es ? "Tu código de acceso a Perfilisto" : "Your Perfilisto sign-in code";
  const copy = es ? "Introduce este código para continuar. Caduca en 10 minutos y solo se puede usar una vez." : "Enter this code to continue. It expires in 10 minutes and can only be used once.";
  const footer = es ? "Si no has solicitado este código, puedes ignorar este correo." : "If you did not request this code, you can ignore this email.";
  return { from: { email: "hello@perfilisto.com", name: "Perfilisto" }, to: email, subject: title,
    text: `${title}\n\n${code}\n\n${copy}\n\n${footer}`,
    html: `<h1>${title}</h1><p>${copy}</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>${footer}</p>` };
}

/** Browser-only, same-origin entry point. Codes never appear in URLs or logs. */
export async function handleEmailAuth(request, env, redirect) {
  const url = new URL(request.url);
  const available = Boolean(env.AUTH_SECRET && env.EMAIL_AUTH && env.EMAIL);
  if (url.pathname === "/api/auth/email/status" && request.method === "GET") return emailReply({ enabled: available });
  if (!["/api/auth/email/send", "/api/auth/email/verify"].includes(url.pathname)) return emailReply({ error: "not_found" }, 404);
  if (request.method !== "POST") return emailReply({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (request.headers.get("Origin") !== url.origin || request.headers.get("Sec-Fetch-Site") === "cross-site") return emailReply({ error: "invalid_origin" }, 403);
  if (!available) return emailReply({ error: "unavailable" }, 503);
  const ip = request.headers.get("CF-Connecting-IP");
  if (url.hostname === "perfilisto.com" && (!env.AUTH_RATE_LIMIT || !ip)) return emailReply({ error: "unavailable" }, 503);
  if (env.AUTH_RATE_LIMIT && !(await env.AUTH_RATE_LIMIT.limit({ key: ip || "local" })).success) return emailReply({ error: "rate_limited" }, 429, { "Retry-After": "60" });
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return emailReply({ error: "invalid_request" }, 415);
  let body;
  try {
    const reader = request.body.getReader();
    const chunks = []; let length = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 2048) { await reader.cancel(); return emailReply({ error: "invalid_request" }, 413); } chunks.push(value); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return emailReply({ error: "invalid_request" }, 400); }
  const email = normalizeEmail(body?.email);
  if (!email) return emailReply({ error: "invalid_email" }, 400);
  const emailId = await emailDigest(env.AUTH_SECRET, `email:${email}`);
  const secure = url.protocol === "https:";
  const challengeCookie = secure ? "__Host-perfilisto.email-challenge" : "perfilisto.email-challenge";
  const cookie = (request.headers.get("Cookie") || "").split(";").map(p => p.trim()).find(p => p.startsWith(`${challengeCookie}=`))?.slice(challengeCookie.length + 1);
  const send = url.pathname.endsWith("/send");
  if (!send && (!/^[a-f0-9-]{36}$/.test(cookie || "") || !/^\d{6}$/.test(body.code || ""))) return emailReply({ error: "invalid_code" }, 400);
  const challenge = send ? crypto.randomUUID() : cookie;
  try {
    const result = await env.EMAIL_AUTH.getByName(emailId).fetch(new Request(`https://internal/${send ? "send" : "verify"}`, { method: "POST", body: JSON.stringify({ email, challenge, code: body.code, locale: body.locale === "es" ? "es" : "en" }) }));
    if (!result.ok) return emailReply(await result.json(), result.status, result.headers.has("Retry-After") ? { "Retry-After": result.headers.get("Retry-After") } : {});
    const suffix = `; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
    if (send) return emailReply({ sent: true, retryAfter: EMAIL_RESEND_SECONDS }, 200, { "Set-Cookie": `${challengeCookie}=${challenge}; Max-Age=${EMAIL_CODE_TTL / 1000}${suffix}` });
    const name = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
    const jwt = await encode({ token: { sub: `email:${emailId}`, email }, secret: env.AUTH_SECRET, salt: name, maxAge: SESSION_SECONDS });
    const response = emailReply({ url: redirect(body.callbackUrl || "/dashboard", url.origin) });
    response.headers.append("Set-Cookie", `${name}=${jwt}; Max-Age=${SESSION_SECONDS}${suffix}`);
    response.headers.append("Set-Cookie", `${challengeCookie}=; Max-Age=0${suffix}`);
    // Remove any old chunked social session so it cannot shadow the new session.
    for (const part of (request.headers.get("Cookie") || "").split(";")) {
      const old = part.trim().split("=")[0];
      if (old.startsWith(`${name}.`) && /^\d+$/.test(old.slice(name.length + 1))) response.headers.append("Set-Cookie", `${old}=; Max-Age=0${suffix}`);
    }
    return response;
  } catch { return emailReply({ error: "unavailable" }, 503); }
}
