import type { Messages } from "@/i18n";

const PLACEHOLDER_COUNT = 3;

const PortraitSlot = ({
  label,
  variant,
}: {
  label: string;
  variant: "before" | "after";
}) => (
  <figure className="min-w-0 flex-1">
    <div
      className={
        variant === "after"
          ? "aspect-[4/5] rounded-[18px] bg-[var(--primary)]"
          : "aspect-[4/5] rounded-[18px] bg-[#d8d8d8]"
      }
    />
    <figcaption className="mt-2 text-center text-xs font-semibold tracking-tight text-muted-foreground">
      {label}
    </figcaption>
  </figure>
);

const QuotePlaceholder = () => (
  <div className="mt-6 space-y-2" aria-hidden="true">
    <div className="h-3 w-full rounded-full bg-black/[0.06]" />
    <div className="h-3 w-[92%] rounded-full bg-black/[0.06]" />
    <div className="h-3 w-[78%] rounded-full bg-black/[0.06]" />
  </div>
);

const AttributionPlaceholder = () => (
  <div className="mt-5 flex items-center gap-3" aria-hidden="true">
    <span className="size-10 shrink-0 rounded-full bg-black/[0.08]" />
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="h-2.5 w-28 rounded-full bg-black/[0.08]" />
      <div className="h-2.5 w-20 rounded-full bg-black/[0.05]" />
    </div>
  </div>
);

export const Clients = ({ messages }: { messages: Messages }) => {
  const copy = messages.clients;

  return (
    <section
      aria-labelledby="clients-heading"
      className="bg-[#f7f7f7] px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="clients-heading"
            className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-[#141414] sm:text-4xl md:text-[2.75rem]"
          >
            {copy.titleBefore}{" "}
            <span className="primary-tint-text">{copy.titleTint}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-medium text-muted-foreground sm:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
            <article
              key={index}
              className="rounded-[28px] border border-black/[0.06] bg-white p-5 sm:p-6"
            >
              <div className="flex gap-3">
                <PortraitSlot label={copy.before} variant="before" />
                <PortraitSlot label={copy.after} variant="after" />
              </div>
              <div
                className="mt-5 flex gap-0.5 text-[var(--primary)]"
                aria-hidden="true"
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <span key={star} className="text-base leading-none">
                    ★
                  </span>
                ))}
              </div>
              <QuotePlaceholder />
              <AttributionPlaceholder />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
