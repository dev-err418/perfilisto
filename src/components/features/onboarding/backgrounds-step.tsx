"use client";

import Image from "next/image";
import { IconCheck } from "@tabler/icons-react";

import { useMessages } from "@/i18n/client";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { GenderOption } from "./gender-step";
import {
  imageChoiceCardClass,
  imageChoiceGridClass,
  imageChoicePhotoClass,
} from "./image-choice";

export type BackgroundOption =
  Messages["onboarding"]["backgrounds"]["options"][number]["id"];

const photoFor = (gender: GenderOption | null, id: BackgroundOption) => {
  const set = gender === "woman" ? "woman" : "man";
  return `/onboarding/backgrounds/${set}-${id}.jpg`;
};

export const BackgroundsStep = ({
  gender,
  value,
  onChange,
}: {
  gender: GenderOption | null;
  value: BackgroundOption[];
  onChange: (value: BackgroundOption[]) => void;
}) => {
  const messages = useMessages();
  const copy = messages.onboarding.backgrounds;

  const toggle = (id: BackgroundOption) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      return;
    }
    onChange([...value, id]);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className={imageChoiceGridClass}>
        {copy.options.map((option) => {
          const selected = value.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={selected}
              className={cn(
                imageChoiceCardClass,
                selected
                  ? "border-[var(--primary)]"
                  : "border-black/10 hover:border-black/25",
              )}
            >
              <span className={imageChoicePhotoClass}>
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
              <span className="px-3 py-3">
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
