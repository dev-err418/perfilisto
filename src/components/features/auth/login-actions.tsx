"use client";

import { trackFunnel } from "@/lib/analytics/client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getMessages } from "@/i18n";

const copy = getMessages().login;
type Provider = "google" | "facebook";

export function LoginActions() {
  const [providers, setProviders] = useState<Partial<Record<Provider, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/providers", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setProviders(await response.json());
        if (new URLSearchParams(window.location.search).has("error")) {
          trackFunnel("sign_in_failed", {}, "sign_in_return_error");
          setError("Sign-in could not be completed. Please try again.");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Sign-in is temporarily unavailable. Please refresh and try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function signIn(provider: Provider) {
    trackFunnel("sign_in_started", { provider });
    setPending(provider);
    setError("");
    try {
      const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store" });
      if (!csrfResponse.ok) throw new Error();
      const { csrfToken } = await csrfResponse.json();
      if (!csrfToken) throw new Error();
      const target = new URLSearchParams(window.location.search).get("redirect") ?? "/onboarding";
      const response = await fetch(`/api/auth/signin/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
        body: new URLSearchParams({ csrfToken, callbackUrl: target }),
      });
      if (!response.ok) throw new Error();
      const { url } = await response.json();
      if (typeof url !== "string") throw new Error();
      window.location.assign(url);
    } catch {
      trackFunnel("sign_in_failed", { provider });
      setError("Sign-in could not be started. Please try again.");
      setPending(null);
    }
  }

  return (
    <div className="mt-9 space-y-3" aria-busy={loading || Boolean(pending)}>
      {(["google", "facebook"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={loading || !providers[provider] || Boolean(pending)}
          onClick={() => void signIn(provider)}
          className="relative flex h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold shadow-xs transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading || pending === provider ? <Spinner className="size-5" aria-hidden="true" /> : provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
          {pending === provider ? "Connecting…" : copy[provider]}
        </button>
      ))}
      {error ? <p role="alert" className="text-center text-sm text-red-700">{error}</p> : null}
      {!loading && !error && (!providers.google || !providers.facebook) ? (
        <p className="text-center text-xs text-muted-foreground">More sign-in options will be available soon.</p>
      ) : null}
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
