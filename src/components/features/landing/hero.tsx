import type { Messages } from "@/i18n";

import { TrustRating } from "./trust-rating";
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
          {messages.hero.titleBefore}
          <span className="primary-tint-text">{messages.hero.titleTint}</span>
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

      <TrustRating messages={messages} className="mx-auto mt-6" />
    </div>

    <HeadshotTransitionStrip
      beforeLabel={messages.hero.beforeLabel}
      afterLabel={messages.hero.afterLabel}
      generatedBadge={messages.hero.generatedBadge}
    />
  </section>
);
