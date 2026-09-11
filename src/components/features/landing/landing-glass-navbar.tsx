"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type LandingNavbarCtaRevealTrigger =
  | "homepage-preview"
  | "article-image";

export function LandingGlassNavbar({
  logo,
  links,
  accountAction,
  ctaAction,
  ctaRevealTrigger,
}: {
  logo: ReactNode;
  links: ReactNode;
  accountAction: ReactNode;
  ctaAction: ReactNode;
  ctaRevealTrigger?: LandingNavbarCtaRevealTrigger;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const [triggerReached, setTriggerReached] = useState(false);
  const showCta = Boolean(ctaAction) && (!ctaRevealTrigger || triggerReached);

  useEffect(() => {
    if (!ctaRevealTrigger) return;

    const targetSelector =
      ctaRevealTrigger === "homepage-preview"
        ? "#interactive-dashboard-preview"
        : "[data-navbar-cta-trigger='article-image']";
    const target = document.querySelector(targetSelector);

    if (!target) {
      const animationFrame = window.requestAnimationFrame(() => {
        setTriggerReached(true);
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }

    const updateTriggerReached = () => {
      const targetBounds = target.getBoundingClientRect();
      const triggerLine =
        ctaRevealTrigger === "homepage-preview"
          ? Math.max(96, window.innerHeight * 0.45)
          : (navRef.current?.getBoundingClientRect().bottom ?? 96);
      const targetEdge =
        ctaRevealTrigger === "homepage-preview"
          ? targetBounds.top
          : targetBounds.bottom;

      setTriggerReached(targetEdge <= triggerLine);
    };

    const animationFrame = window.requestAnimationFrame(updateTriggerReached);
    window.addEventListener("scroll", updateTriggerReached, { passive: true });
    window.addEventListener("resize", updateTriggerReached);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateTriggerReached);
      window.removeEventListener("resize", updateTriggerReached);
    };
  }, [ctaRevealTrigger]);

  return (
    <div
      ref={navRef}
      className="landing-glass-nav t-resize pointer-events-auto relative mx-auto flex h-[60px] items-center gap-2.5 rounded-full px-6 py-[18px] select-none"
      data-expanded={showCta}
    >
      <div className="relative z-10 shrink-0">{logo}</div>

      <div className="relative z-10 ml-auto flex min-w-0 items-center gap-3 sm:gap-6">
        <div className="hidden items-center gap-6 text-base font-semibold tracking-[0.2px] sm:flex">
          {links}
        </div>
        {accountAction}
        <div
          className={cn("landing-nav-cta", showCta && "is-visible")}
          aria-hidden={!showCta}
        >
          <div className="landing-nav-cta-inner">{ctaAction}</div>
        </div>
      </div>
    </div>
  );
}
