"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ANALYTICS_READY, consentChoice, privacySignal, saveConsent, trackFunnel, trackPage } from "@/lib/analytics/client";
import { funnelPage } from "@/lib/analytics/shared.mjs";

/** The global pixel owner: one script, SPA page views, and consent before enrichment. */
export function WhopPixel() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setShow(funnelPage(pathname) && consentChoice() === null));
    void trackPage();
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.getAttribute("href")!, location.href);
      if (url.origin !== location.origin || url.pathname !== "/onboarding") return;
      trackFunnel("get_started", { placement: pathname === "/" ? "landing" : "navigation", plan_id: url.searchParams.get("plan") || undefined });
    };
    document.addEventListener("click", click, true);
    const pricing = document.getElementById("pricing");
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) trackFunnel("view_content", { step: "landing_pricing" }, "landing_pricing");
    }, { threshold: 0.15 });
    if (pricing) observer.observe(pricing);
    const visiblePricing = () => { const rect = pricing?.getBoundingClientRect(); if (rect && rect.top < innerHeight && rect.bottom > 0) trackFunnel("view_content", { step: "landing_pricing" }, "landing_pricing"); };
    window.addEventListener(ANALYTICS_READY, visiblePricing);
    return () => { document.removeEventListener("click", click, true); window.removeEventListener(ANALYTICS_READY, visiblePricing); observer.disconnect(); };
  }, [pathname]);
  const choose = (choice: "yes" | "no") => { saveConsent(choice); setShow(false); if (choice === "yes") void trackPage(); };
  if (!show) return null;
  return <section aria-label="Tracking preferences" className="fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-xl rounded-3xl border border-black/10 bg-white p-5 text-neutral-900 shadow-xl sm:inset-x-auto sm:right-5 sm:bottom-5">
    <p className="font-semibold">A little insight helps us improve</p>
    <p className="mt-2 text-sm leading-relaxed text-neutral-600">Allow Whop analytics to connect your visit and purchases, measure our ads, and use your approximate location and account details when signed in. Your photos and card details aren’t included. <Link href="/privacy" className="underline underline-offset-2">Privacy & preferences</Link></p>
    <div className="mt-4 flex gap-3">
      <button type="button" onClick={() => choose("no")} className="flex-1 rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-50">Decline</button>
      <button type="button" onClick={() => choose("yes")} className="flex-1 rounded-full bg-[#ff7416] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">Allow analytics</button>
    </div>
  </section>;
}

/** Track only the stage name, never any appearance or profile answers. */
export function useFunnelStage(step: string) {
  useEffect(() => {
    const record = () => trackFunnel("onboarding_step", { step }, `step:${step}`);
    record();
    window.addEventListener(ANALYTICS_READY, record);
    return () => window.removeEventListener(ANALYTICS_READY, record);
  }, [step]);
}

export function TrackingPreferences() {
  const [status, setStatus] = useState<string>("");
  useEffect(() => { queueMicrotask(() => setStatus(privacySignal() ? "Your browser requests that optional tracking remain off." : consentChoice() === "yes" ? "Optional analytics are enabled." : "Optional analytics are off.")); }, []);
  const choose = (choice: "yes" | "no") => {
    saveConsent(choice);
    // This control lives on /privacy, so reload can stop an already loaded SDK without losing uploads.
    window.location.reload();
  };
  return <section id="tracking-preferences" className="mx-auto mt-10 w-full max-w-3xl rounded-3xl border border-black/10 bg-white p-6 text-neutral-900">
    <h2 className="text-xl font-semibold">Tracking preferences</h2>
    <p role="status" className="mt-2 text-sm text-neutral-600">{status}</p>
    <p className="mt-2 text-sm text-neutral-600">Changing this preference does not affect sign-in or payments. Whop still processes essential checkout and payment information.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button onClick={() => choose("no")} className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold">Decline analytics</button>
      <button onClick={() => choose("yes")} className="rounded-full border border-black/15 px-5 py-2 text-sm font-semibold">Allow analytics</button>
    </div>
  </section>;
}
