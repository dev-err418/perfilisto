import type { Messages } from "@/i18n";
import { AppSignupCta } from "./app-signup-cta";

export const Hero = ({ messages }: { messages: Messages }) => (
  <section
    className="relative z-20 mt-16 flex min-h-[480px] flex-1 flex-col items-center justify-center px-6 text-center sm:mt-20"
    style={{ minHeight: "max(480px, calc(100dvh - 260px))" }}
  >
    <div className="relative z-10 w-full min-w-0 max-w-4xl -translate-y-4 sm:-translate-y-6">
      <p className="mx-auto mb-6 w-fit rounded-full border border-black/10 bg-black/[0.03] px-4 py-1.5 text-xs font-medium text-black/70 sm:text-sm">
        {messages.hero.badge}
      </p>
      <h1
        className="landing-hero-title mx-auto max-w-full text-[2.75rem] leading-[1.1] font-semibold tracking-tight text-[#141414] sm:text-[3.5rem] sm:leading-none md:text-[4.25rem]"
        dir="auto"
      >
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
    </div>
  </section>
);
