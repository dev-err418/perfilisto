import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import {
  LandingGlassNavbar,
  type LandingNavbarCtaRevealTrigger,
} from "./landing-glass-navbar";
import { PricingLink } from "./pricing-link";
import { BrandWord } from "./brand-name";
import { getLandingNavbarActions } from "./navbar-actions";
import {
  GET_STARTED_NAV_BUTTON_CLASS,
  PRIMARY_NAV_BUTTON_CLASS,
} from "./button-styles";
import { getMessages } from "@/i18n";
import { LogoMark } from "./logo-mark";

const LandingLogo = ({
  light = false,
  homeAriaLabel,
}: {
  light?: boolean;
  homeAriaLabel: string;
}) => (
  <Link href="/" aria-label={homeAriaLabel} className="flex items-center gap-2">
    <LogoMark
      className={
        light ? "size-6" : "size-[30px] rounded-[5px]"
      }
    />
    <BrandWord
      className={
        light
          ? "landing-nav-brand text-lg font-semibold tracking-tight text-black"
          : "text-lg font-semibold tracking-tight text-white"
      }
    />
  </Link>
);

const LandingNavLinks = ({
  light = false,
  howItWorks,
  pricing,
}: {
  light?: boolean;
  howItWorks: string;
  pricing: string;
}) => {
  const linkClass = light
    ? "text-black/80 transition-colors hover:text-black"
    : "text-white/70 transition-colors hover:text-white";

  return (
    <>
      <Link href="/#how-it-works" className={linkClass}>
        {howItWorks}
      </Link>
      <PricingLink className={linkClass}>{pricing}</PricingLink>
    </>
  );
};

export const LandingNavbar = ({
  theme = "dark",
  ctaRevealTrigger,
}: {
  theme?: "dark" | "light";
  ctaRevealTrigger?: LandingNavbarCtaRevealTrigger;
}) => {
  const messages = getMessages();
  const actions = getLandingNavbarActions(false, messages);
  if (ctaRevealTrigger) actions.push({
    label: messages.hero.cta, href: "/onboarding", style: "tint",
    showArrow: true, forceVisible: true, revealAsCta: true,
  });
  const actionButtons = (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={
            action.style === "primary"
              ? PRIMARY_NAV_BUTTON_CLASS
              : `${GET_STARTED_NAV_BUTTON_CLASS}${
                  action.forceVisible ? " !inline-flex" : ""
                }`
          }
        >
          {action.label}
          {action.showArrow && (
            <IconArrowRight aria-hidden="true" className="size-4" stroke={2} />
          )}
        </Link>
      ))}
    </div>
  );

  if (theme === "light") {
    const accountAction = actions.find((action) => action.style === "primary");
    const ctaAction = actions.find((action) => action.style === "tint");

    return (
      <nav className="pointer-events-none sticky top-0 z-50 w-full px-4 py-4 sm:py-6">
        <LandingGlassNavbar
          logo={
            <LandingLogo light homeAriaLabel={messages.brand.homeAriaLabel} />
          }
          links={
            <LandingNavLinks
              light
              howItWorks={messages.nav.howItWorks}
              pricing={messages.nav.pricing}
            />
          }
          accountAction={
            accountAction ? (
              <Link
                href={accountAction.href}
                className="shrink-0 text-sm font-semibold tracking-[0.2px] text-black transition-colors hover:text-black/70 sm:text-base"
              >
                {accountAction.label}
              </Link>
            ) : null
          }
          ctaAction={
            ctaAction ? (
              <Link
                href={ctaAction.href}
                className={`${GET_STARTED_NAV_BUTTON_CLASS} !inline-flex max-sm:gap-1 max-sm:px-3 max-sm:text-xs`}
              >
                {ctaAction.label}
                {ctaAction.showArrow && (
                  <IconArrowRight
                    aria-hidden="true"
                    className="size-4"
                    stroke={2}
                  />
                )}
              </Link>
            ) : null
          }
          ctaRevealTrigger={ctaAction?.revealAsCta ? ctaRevealTrigger : undefined}
        />
      </nav>
    );
  }

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <LandingLogo homeAriaLabel={messages.brand.homeAriaLabel} />
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm sm:flex">
          <LandingNavLinks
            howItWorks={messages.nav.howItWorks}
            pricing={messages.nav.pricing}
          />
        </div>
        {actionButtons}
      </div>
    </nav>
  );
};
