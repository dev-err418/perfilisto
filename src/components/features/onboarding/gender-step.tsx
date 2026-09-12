"use client";

import { IconMars, IconVenus } from "@tabler/icons-react";

import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

export type GenderOption = "man" | "woman" | "other";

const options: {
  id: GenderOption;
  icon?: typeof IconMars;
}[] = [
  { id: "man", icon: IconMars },
  { id: "woman", icon: IconVenus },
  { id: "other" },
];

export const GenderStep = ({
  value,
  onChange,
}: {
  value: GenderOption | null;
  onChange: (value: GenderOption) => void;
}) => {
  const messages = useMessages();
  const copy = messages.onboarding.gender;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-center text-[17px] leading-7 text-muted-foreground">
        {messages.onboarding.shared.subtitle}
      </p>

      <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.id;
          const Icon = option.icon;
          const label = copy[option.id];

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "flex h-14 items-center gap-3 rounded-full border px-4 text-left text-[15px] font-medium transition-colors",
                selected
                  ? "border-transparent bg-[var(--primary)] text-white"
                  : "border-black/15 bg-white text-[#141414] hover:border-black/30",
              )}
            >
              {Icon ? (
                <Icon className="size-5 shrink-0" stroke={1.8} />
              ) : (
                <span className="size-5 shrink-0" />
              )}
              <span className="flex-1">{label}</span>
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  selected ? "border-white" : "border-black/25",
                )}
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-white" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
