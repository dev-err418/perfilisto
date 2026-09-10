import { IconCheck } from "@tabler/icons-react";

import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

const PortraitTile = ({
  className,
  tinted,
}: {
  className?: string;
  tinted?: boolean;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-[10px]",
      tinted ? "bg-[var(--primary)]" : "bg-[#d8d8d8]",
      className,
    )}
  />
);

const AttirePreview = ({ labels }: { labels: readonly string[] }) => (
  <div className="flex h-full items-end justify-center gap-2 px-2 pb-4 pt-6">
    {labels.map((label, index) => (
      <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
        <PortraitTile
          tinted={index === 0}
          className="aspect-[4/5] w-full max-w-[92px]"
        />
        <p className="mt-2 flex items-center gap-0.5 text-[10px] font-semibold tracking-tight text-[#141414]">
          <span className="truncate">{label}</span>
          <IconCheck
            aria-hidden="true"
            className="size-3 shrink-0 text-[var(--primary)]"
            stroke={2.4}
          />
        </p>
      </div>
    ))}
  </div>
);

const UploadPreview = ({ label }: { label: string }) => (
  <div className="flex h-full flex-col px-4 py-4">
    <div className="flex flex-1 items-center justify-center rounded-[22px] border border-dashed border-black/15 bg-white/70 px-3 py-3">
      <div className="grid w-full grid-cols-3 gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <PortraitTile
            key={index}
            tinted={index % 3 === 1}
            className="aspect-square"
          />
        ))}
      </div>
    </div>
    <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
      {label}
    </p>
  </div>
);

const GeneratePreview = () => (
  <div className="flex h-full items-center justify-center p-5">
    <div className="relative aspect-square w-[72%] overflow-hidden rounded-[18px] bg-[#ececec] p-2">
      <PortraitTile tinted className="h-full w-full rounded-[14px]" />
    </div>
  </div>
);

const GalleryPreview = () => (
  <div className="h-full overflow-hidden px-4 pt-5">
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }, (_, index) => (
        <PortraitTile
          key={index}
          tinted={index === 0 || index === 4}
          className="aspect-square"
        />
      ))}
    </div>
  </div>
);

const stepPreview = (
  index: number,
  copy: Messages["howItWorks"],
) => {
  if (index === 0) return <AttirePreview labels={copy.outfits} />;
  if (index === 1) return <UploadPreview label={copy.uploaded} />;
  if (index === 2) return <GeneratePreview />;
  return <GalleryPreview />;
};

export const HowItWorks = ({ messages }: { messages: Messages }) => {
  const copy = messages.howItWorks;

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 bg-white px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-[#141414] sm:text-4xl md:text-[2.75rem]"
          >
            {copy.titleBefore}{" "}
            <span className="primary-tint-text">{copy.titleTint}</span>
            {copy.titleAfter}
          </h2>
          <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {copy.steps.map((step, index) => (
            <li key={step.number} className="flex flex-col">
              <div className="h-[220px] overflow-hidden rounded-[28px] border border-black/[0.06] bg-[#f7f7f7] sm:h-[240px]">
                {stepPreview(index, copy)}
              </div>
              <div className="mt-6 flex gap-3">
                <span className="primary-tint-surface flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {step.number}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg leading-7 font-semibold text-[#141414]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#717171] sm:text-[15px]">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
