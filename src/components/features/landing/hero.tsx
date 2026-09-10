import type { Messages } from "@/i18n";

import { AppSignupCta } from "./app-signup-cta";
import { HeadshotTransitionStrip } from "./headshot-transition-strip";

export const Hero = ({ messages }: { messages: Messages }) => (
  <section
    className="relative z-20 mt-1 flex w-full flex-col items-center justify-start pt-[clamp(2px,1vh,12px)] text-center sm:mt-2"
  >
    <div className="relative z-10 flex w-full min-w-0 max-w-4xl flex-col items-center px-6">
      <p className="hero-badge mx-auto mb-3 w-fit rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.1px] sm:text-sm">
        {messages.hero.badge}
      </p>
      <h1
        className="landing-hero-title mx-auto max-w-[820px] text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-[#141414] sm:text-5xl sm:leading-[1.04] md:text-[3.5rem] xl:text-6xl"
        dir="auto"
      >
        <span className="sm:whitespace-nowrap">
          <span className="primary-tint-text">{messages.hero.titleTint}</span>{" "}
          {messages.hero.titleLine1}
        </span>
        <br />
        {messages.hero.titleLine2}
      </h1>

      <p className="mx-auto mt-5 w-full max-w-xl text-base font-medium text-pretty text-muted-foreground sm:text-lg xl:text-[20px] xl:leading-[26px]">
        {messages.hero.description}
      </p>
      <AppSignupCta
        label={messages.hero.cta}
        supportingText={messages.hero.supportingText}
      />

      <div className="mx-auto mt-6 flex w-fit max-w-full items-center gap-3 text-left sm:gap-5">
        <div className="flex -space-x-2.5 sm:-space-x-3" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className="size-9 rounded-full border-2 border-white bg-[#f2f2f2] shadow-sm sm:size-11"
            />
          ))}
        </div>
        <div className="text-left">
          <div
            className="flex items-center gap-1.5 sm:gap-2"
            aria-label={messages.hero.ratingLabel}
          >
            <span className="text-base font-semibold tracking-tight text-[#141414] sm:text-lg">
              {messages.hero.rating}
            </span>
            <span className="flex gap-0.5 text-primary" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className="text-lg leading-none">
                  ★
                </span>
              ))}
            </span>
          </div>
          <p className="mt-0 text-xs leading-tight font-medium text-muted-foreground sm:text-sm">
            {messages.hero.trustText}
          </p>
        </div>
      </div>
    </div>

    <HeadshotTransitionStrip
      beforeLabel={messages.hero.beforeLabel}
      afterLabel={messages.hero.afterLabel}
      generatedBadge={messages.hero.generatedBadge}
    />
  </section>
);
