import Image from "next/image";
import { IconCheck } from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { GenderOption } from "./gender-step";

const messages = getMessages();

export type HairLengthOption =
  (typeof messages.onboarding.hairLength.options)[number]["id"];

const photoFor = (gender: GenderOption | null, id: HairLengthOption) => {
  const set = gender === "woman" ? "woman" : "man";
  return `/onboarding/hair-length/${set}-${id}.jpg`;
};

export const HairLengthStep = ({
  gender,
  value,
  onChange,
}: {
  gender: GenderOption | null;
  value: HairLengthOption | null;
  onChange: (value: HairLengthOption) => void;
}) => {
  const copy = messages.onboarding.hairLength;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {copy.options.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border bg-white text-left",
                selected
                  ? "border-[#141414]"
                  : "border-black/10 hover:border-black/25",
              )}
            >
              <span className="relative aspect-[3/4] w-full overflow-hidden bg-[#ececec]">
                <Image
                  src={photoFor(gender, option.id)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover object-top"
                />
                <span
                  className={cn(
                    "absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full border bg-white/90",
                    selected
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-black/15 text-transparent",
                  )}
                >
                  <IconCheck className="size-3.5" stroke={2.6} />
                </span>
              </span>
              <span className="px-3 py-3 text-[15px] font-semibold text-[#141414]">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
