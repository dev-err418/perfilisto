"use client";

import { useT, useMessages } from "@/i18n/client";
import { ANALYTICS_READY, trackFunnel } from "@/lib/analytics/client";
import { useEffect, useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";

type Provider = "google" | "facebook";
const ATTEMPT_KEY = "perfilisto-signin-attempt";
function rememberOAuthAttempt(provider: Provider) {
  try { sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ provider, expires: Date.now() + 15 * 60000 })); } catch { /* Storage is optional. */ }
}

export function LoginActions() {
  const t = useT();
  const copy = useMessages().login;
  const [providers, setProviders] = useState<Partial<Record<Provider, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Provider | "email" | null>(null);
  const [error, setError] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const record = () => trackFunnel("login_view", {}, "login_view");
    record();
    window.addEventListener(ANALYTICS_READY, record);
    // Browsers can restore a page with the previous Connecting state intact.
    const restore = () => setPending(null);
    window.addEventListener("pageshow", restore);
    return () => { window.removeEventListener(ANALYTICS_READY, record); window.removeEventListener("pageshow", restore); };
  }, []);

  useEffect(() => {
    if (!resendAt) return;
    const update = () => setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]);
    void Promise.allSettled([
      fetch("/api/auth/providers", { signal, cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error();
        return response.json();
      }),
      fetch("/api/auth/email/status", { signal, cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error();
        return response.json();
      }),
    ]).then(([social, emailStatus]) => {
      if (controller.signal.aborted) return;
      if (social.status === "fulfilled") setProviders(social.value);
      else trackFunnel("sign_in_failed", { reason: "providers_unavailable" });
      setEmailEnabled(emailStatus.status === "fulfilled" && emailStatus.value.enabled === true);
      if (social.status === "fulfilled" || (emailStatus.status === "fulfilled" && emailStatus.value.enabled)) trackFunnel("sign_in_options_ready", {}, "sign_in_options_ready");
      else setError(t("Sign-in is temporarily unavailable. Please refresh and try again."));
      if (new URLSearchParams(window.location.search).has("error")) {
        let provider: Provider | undefined;
        try {
          const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || "null");
          if (saved?.expires > Date.now() && ["google", "facebook"].includes(saved.provider)) provider = saved.provider;
          sessionStorage.removeItem(ATTEMPT_KEY);
        } catch { /* Storage is optional. */ }
        trackFunnel("sign_in_failed", { provider, reason: "callback_error" }, "sign_in_return_error");
        setError(t("Sign-in could not be completed. Please try again."));
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, [t]);

  function destination() {
    return new URLSearchParams(window.location.search).get("redirect") ?? (window.location.pathname.startsWith("/es/") ? "/es/dashboard" : "/en/dashboard");
  }

  async function signIn(provider: Provider) {
    trackFunnel("sign_in_started", { provider });
    setPending(provider); setError("");
    let reason = "csrf_failed";
    try {
      const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!csrfResponse.ok) throw new Error();
      const { csrfToken } = await csrfResponse.json();
      if (!csrfToken) throw new Error();
      reason = "start_failed";
      const response = await fetch(`/api/auth/signin/${provider}`, {
        method: "POST", signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
        body: new URLSearchParams({ csrfToken, callbackUrl: destination() }),
      });
      if (!response.ok) throw new Error();
      const { url } = await response.json();
      if (typeof url !== "string") throw new Error();
      rememberOAuthAttempt(provider);
      window.location.assign(url);
    } catch {
      trackFunnel("sign_in_failed", { provider, reason });
      setError(t("Sign-in could not be started. Please try again."));
      setPending(null);
    }
  }

  async function emailAction(action: "send" | "verify") {
    setPending("email"); setError("");
    trackFunnel(action === "send" ? "sign_in_started" : "email_code_submitted", { provider: "email" });
    try {
      const response = await fetch(`/api/auth/email/${action}`, {
        method: "POST", signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), ...(action === "verify" ? { code } : {}), callbackUrl: destination(), locale: window.location.pathname.startsWith("/es/") ? "es" : "en" }),
      });
      const result = await response.json();
      if (!response.ok) {
        const reason = ["invalid_code", "expired_code", "rate_limited", "send_failed", "unavailable"].includes(result.error) ? result.error : "start_failed";
        trackFunnel("sign_in_failed", { provider: "email", reason });
        if (reason === "rate_limited") {
          const wait = Number(result.retryAfter || response.headers.get("Retry-After") || 60);
          setResendAt(Date.now() + Math.max(1, Math.min(3600, wait || 60)) * 1000);
          setError(t("Too many attempts. Please wait before trying again."));
        } else if (reason === "invalid_code") setError(t("That code is not correct. Please try again."));
        else if (reason === "expired_code") setError(t("This code has expired or reached its attempt limit. Request a new code."));
        else setError(t("We could not complete email sign-in. Please try again."));
        return;
      }
      if (action === "send") {
        setCodeSent(true); setCode(""); setResendAt(Date.now() + 60000);
        trackFunnel("email_code_sent", { provider: "email" });
      } else {
        if (typeof result.url !== "string" || new URL(result.url, location.origin).origin !== location.origin) throw new Error();
        window.location.assign(result.url);
      }
    } catch {
      trackFunnel("sign_in_failed", { provider: "email", reason: "network" });
      setError(t("We could not complete email sign-in. Please try again."));
    } finally { setPending(null); }
  }

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || loading || !emailEnabled) return;
    void emailAction(codeSent ? "verify" : "send");
  }

  const disabled = loading || Boolean(pending);
  return (
    <div className="mt-9 space-y-3" aria-busy={disabled}>
      {(["google", "facebook"] as const).map(provider => (
        <button key={provider} type="button" disabled={disabled || !providers[provider]} onClick={() => void signIn(provider)}
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold shadow-xs transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading || pending === provider ? <Spinner className="size-5" aria-hidden="true" /> : provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
          {pending === provider ? t("Connecting…") : copy[provider]}
        </button>
      ))}
      <div className="flex items-center gap-3 py-3 text-xs text-neutral-500"><span className="h-px flex-1 bg-black/10" />{t("or use email")}<span className="h-px flex-1 bg-black/10" /></div>
      <form onSubmit={submitEmail} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="signin-email">{t("Email address")}</label>
        <input id="signin-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={disabled || codeSent} onChange={e => setEmail(e.target.value)}
          className="h-12 w-full rounded-full border border-black/20 bg-white px-4 text-base outline-offset-2 focus:outline-orange-500 disabled:opacity-60" />
        {codeSent && <>
          <p role="status" className="text-sm text-neutral-600">{t("We sent a six-digit code to your email. It expires in 10 minutes.")}</p>
          <label className="block text-sm font-medium" htmlFor="signin-code">{t("Sign-in code")}</label>
          <input id="signin-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} disabled={disabled}
            onChange={e => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} aria-describedby={error ? "signin-error" : undefined}
            className="h-12 w-full rounded-full border border-black/20 bg-white px-4 text-base tracking-[0.3em] outline-offset-2 focus:outline-orange-500" />
        </>}
        <button type="submit" disabled={disabled || !emailEnabled || (!codeSent && seconds > 0)} className="primary-tint-button flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold">
          {pending === "email" && <Spinner className="size-5" aria-hidden="true" />}
          {pending === "email" ? t("Connecting…") : codeSent ? t("Verify and continue") : t("Continue with email")}
        </button>
        {codeSent && <div className="flex flex-wrap justify-between gap-3 text-sm">
          <button type="button" disabled={disabled || seconds > 0} onClick={() => void emailAction("send")} className="underline underline-offset-4 disabled:opacity-50">{seconds > 0 ? t("Resend in {v0}s", { v0: seconds }) : t("Resend code")}</button>
          <button type="button" disabled={disabled} onClick={() => { setCodeSent(false); setCode(""); setError(""); }} className="underline underline-offset-4">{t("Change email")}</button>
        </div>}
        {!codeSent && seconds > 0 && <p role="status" className="text-sm text-neutral-600">{t("Resend in {v0}s", { v0: seconds })}</p>}
        {!loading && !emailEnabled && <p className="text-xs text-neutral-600">{t("Email sign-in is temporarily unavailable.")}</p>}
      </form>
      {error && <p id="signin-error" role="alert" className="text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#0866FF" />
      <path fill="white" d="M16.67 15.47 17.2 12h-3.33V9.75c0-.95.46-1.88 1.96-1.88h1.51V4.92s-1.37-.23-2.68-.23c-2.73 0-4.51 1.65-4.51 4.64V12H7.12v3.47h3.03v8.39a12.1 12.1 0 0 0 3.72 0v-8.39h2.8Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}
