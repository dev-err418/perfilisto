import Link from "@/i18n/navigation";

import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

import { PRIMARY_TINT_BUTTON_CLASS } from "./button-styles";
import { PlanFeatureList } from "./plan-feature-list";

const planCtaClassName = (featured: boolean) =>
  cn(
    "mt-8 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full border px-5 text-[16px] font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/25",
    featured
      ? `${PRIMARY_TINT_BUTTON_CLASS} border-transparent text-white`
      : "border-black/15 bg-white text-black hover:bg-black/[0.04]",
  );

export const Pricing = ({ messages }: { messages: Messages }) => {
  const copy = messages.pricing;

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-white px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="pricing-heading"
            className="text-4xl font-semibold text-black sm:text-5xl"
          >
            {copy.titleBefore}{" "}
            <span className="primary-tint-text">{copy.titleTint}</span>{" "}
            {copy.titleAfter}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-pretty text-muted-foreground sm:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {copy.plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex w-full flex-col rounded-[28px] border p-7 sm:p-8",
                plan.featured
                  ? "border-transparent bg-black/[0.055]"
                  : "border-black/10 bg-white",
              )}
            >
              <header>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[30px] leading-none font-semibold tracking-[-0.04em] text-black">
                    {plan.name}
                  </h3>
                  {plan.featured ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-tint px-3 text-xs font-bold text-white">
                      {copy.popular}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-[17px] text-muted-foreground">
                  {plan.description}
                </p>
              </header>

              <div className="mt-10 flex min-h-16 items-end gap-3">
                <span className="text-[48px] leading-none font-semibold tracking-[-0.055em] text-black">
                  {copy.currency === "$" ? `$${plan.price}` : `${plan.price} €`}
                </span>
                <span className="flex flex-col justify-end pb-1 text-sm leading-5 font-medium text-muted-foreground">
                  {copy.period}
                </span>
              </div>

              <Link
                href={`/onboarding?plan=${plan.id}`}
                className={planCtaClassName(plan.featured)}
              >
                {plan.cta}
              </Link>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                {plan.note}
              </p>

              <PlanFeatureList className="mt-8" features={plan.features} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
