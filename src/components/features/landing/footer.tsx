import Link from "next/link";

import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

import { BrandWord } from "./brand-name";
import { LogoMark } from "./logo-mark";
import { PricingLink } from "./pricing-link";

const footerLinkClass =
  "inline-flex rounded-md py-1 text-[17px] font-semibold tracking-[-0.01em] text-white/90 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45";

export const LandingFooter = ({
  messages,
  theme = "light",
}: {
  messages: Messages;
  theme?: "dark" | "light";
}) => {
  const light = theme === "light";
  const year = new Date().getFullYear();
  const copy = messages.footer;

  return (
    <footer className="relative overflow-hidden bg-[#151515] text-white">
      <div
        aria-hidden="true"
        className={cn(
          "h-10 rounded-b-[32px] sm:h-14 sm:rounded-b-[44px]",
          light ? "bg-white" : "bg-[#0a0a0a]",
        )}
      />

      <div>
        <div className="mx-auto flex min-h-[480px] max-w-[1600px] flex-col px-6 pt-16 pb-8 sm:px-10 sm:pt-20 lg:min-h-[560px] lg:px-[clamp(3rem,6vw,7rem)] lg:pt-24 lg:pb-10">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:gap-24">
            <div>
              <p className="flex items-center gap-2.5 text-[34px] leading-none font-semibold tracking-[-0.04em] text-white">
                <LogoMark className="size-[30px] shrink-0" />
                <BrandWord />
              </p>
              <p className="mt-6 max-w-md text-[17px] leading-7 text-muted-foreground">
                {copy.tagline}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:gap-12">
              <nav aria-label={copy.explore}>
                <p className="mb-3 text-[15px] font-semibold text-muted-foreground">
                  {copy.explore}
                </p>
                <ul className="space-y-1">
                  <li>
                    <Link href="/#how-it-works" className={footerLinkClass}>
                      {copy.howItWorks}
                    </Link>
                  </li>
                  <li>
                    <PricingLink className={footerLinkClass}>
                      {copy.pricing}
                    </PricingLink>
                  </li>
                  <li>
                    <Link href="/#faq" className={footerLinkClass}>
                      {copy.faq}
                    </Link>
                  </li>
                </ul>
              </nav>

              <nav aria-label={copy.company}>
                <p className="mb-3 text-[15px] font-semibold text-muted-foreground">
                  {copy.company}
                </p>
                <ul className="space-y-1">
                  <li>
                    <Link href="/privacy" className={footerLinkClass}>
                      {copy.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className={footerLinkClass}>
                      {copy.terms}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          <div className="mt-24 grid gap-6 text-sm text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:mt-auto lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)]">
            <div>
              <p>
                &copy; {year} {copy.copyright}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-3 sm:justify-end lg:justify-between">
              <Link
                href="/privacy"
                className="rounded-md transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                {copy.privacyPolicy}
              </Link>
              <Link
                href="/terms"
                className="rounded-md transition-colors hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              >
                {copy.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
