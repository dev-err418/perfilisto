import Image from "next/image";
import { IconCheck } from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { GenderOption } from "./gender-step";

const messages = getMessages();

export type AttireOption =
  (typeof messages.onboarding.attire.options)[number]["id"];

const photoFor = (gender: GenderOption | null, id: AttireOption) => {
  const set = gender === "woman" ? "woman" : "man";
  return `/onboarding/attire/${set}-${id}.jpg`;
};

export const AttireStep = ({
  gender,
  value,
  onChange,
}: {
  gender: GenderOption | null;
  value: AttireOption[];
  onChange: (value: AttireOption[]) => void;
}) => {
  const copy = messages.onboarding.attire;

  const toggle = (id: AttireOption) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
        {copy.options.map((option) => {
          const selected = value.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border bg-white text-left",
                selected
                  ? "border-[var(--primary)]"
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
                    "absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full",
                    selected
                      ? "bg-[var(--primary)] text-white"
                      : "border border-black/15 bg-white/90 text-transparent",
                  )}
                >
                  <IconCheck className="size-3.5" stroke={2.6} />
                </span>
              </span>
              <span className="px-4 py-4">
                <span className="block text-[15px] font-semibold text-[#141414]">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
