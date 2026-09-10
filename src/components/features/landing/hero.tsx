import type { Messages } from "@/i18n";

import { AppSignupCta } from "./app-signup-cta";

export const Hero = ({ messages }: { messages: Messages }) => (
  <section
    className="relative z-20 mt-16 flex min-h-[480px] flex-1 flex-col items-center justify-center px-6 text-center sm:mt-20"
    style={{ minHeight: "max(480px, calc(100dvh - 260px))" }}
  >
    <div className="relative z-10 w-full min-w-0 max-w-4xl -translate-y-4 sm:-translate-y-6">
      <p className="hero-badge mx-auto mb-6 w-fit rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.1px] sm:text-sm">
        {messages.hero.badge}
      </p>
      <h1
        className="landing-hero-title mx-auto max-w-full text-[2.75rem] leading-[1.1] font-semibold tracking-tight text-[#141414] sm:text-[3.5rem] sm:leading-none md:text-[4.25rem]"
        dir="auto"
      >
        <span className="primary-tint-text">{messages.hero.titleTint}</span>{" "}
        {messages.hero.titleLine1}
        <br />
        {messages.hero.titleLine2}
      </h1>

      <p className="mx-auto mt-6 w-full max-w-xl text-base text-pretty text-muted-foreground sm:text-lg xl:text-[20px] xl:leading-[26px] xl:font-[400]">
        {messages.hero.description}
      </p>
      <AppSignupCta
        label={messages.hero.cta}
        supportingText={messages.hero.supportingText}
      />

      <div className="mx-auto mt-8 flex w-fit max-w-full flex-col items-center gap-4 text-left sm:flex-row sm:gap-5">
        <div className="flex -space-x-3" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className="size-11 rounded-full border-2 border-white bg-[#f2f2f2] shadow-sm"
            />
          ))}
        </div>
        <div className="text-center sm:text-left">
          <div
            className="flex items-center justify-center gap-2 sm:justify-start"
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
  </section>
);
