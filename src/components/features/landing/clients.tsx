"use client";

import { useT } from "@/i18n/client";
import Image from "next/image";
import type { Messages } from "@/i18n";

const ClientCompare = ({
  beforeLabel,
  afterLabel,
  index,
}: {
  beforeLabel: string;
  afterLabel: string;
  index: number;
}) => (
  <figure
    className={`client-compare client-compare-${index} relative aspect-[4/5] overflow-hidden rounded-[18px] bg-[#d8d8d8]`}
    aria-label={`${beforeLabel}, ${afterLabel}`}
  >
    <Image
      src={`/clients/client-${index + 1}-after.webp`}
      alt={afterLabel}
      width={480}
      height={600}
      unoptimized
      draggable={false}
      className="h-full w-full object-cover"
    />
    <div className="client-compare-before">
      <Image
        src={`/clients/client-${index + 1}-before.webp`}
        alt=""
        width={480}
        height={600}
        unoptimized
        draggable={false}
        className="h-full w-full object-cover"
      />
    </div>
    <div className="client-compare-divider" />
    <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between text-[10px] font-semibold text-white">
      <span className="rounded-full bg-black/45 px-2 py-1">{beforeLabel}</span>
      <span className="rounded-full bg-black/45 px-2 py-1">{afterLabel}</span>
    </div>
  </figure>
);

export const Clients = ({ messages }: { messages: Messages }) => {
  const t = useT();
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
          {copy.reviews.map((review, index) => (
            <article
              key={review.name}
              className="rounded-[28px] border border-black/[0.06] bg-white p-5 sm:p-6"
            >
              <ClientCompare
                beforeLabel={copy.before}
                afterLabel={copy.after}
                index={index}
              />
              <div
                className="mt-5 flex gap-0.5"
                aria-label={t("Rated {v0} out of 5", { v0: review.rating })}
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <span
                    key={star}
                    className={`text-[17px] leading-none ${star < review.rating ? "text-[var(--primary)]" : "text-black/15"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <blockquote className="mt-3 text-[15px] leading-6 text-[#5c5c5c] sm:text-base">
                {review.quote}
              </blockquote>
              <p className="mt-5 text-right text-sm font-semibold text-[#141414]">
                {review.name}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
