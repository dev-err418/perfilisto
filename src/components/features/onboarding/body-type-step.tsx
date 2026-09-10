import Image from "next/image";
import { IconCheck } from "@tabler/icons-react";

import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import type { GenderOption } from "./gender-step";
import {
  imageChoiceCardClass,
  imageChoiceGridClass,
  imageChoicePhotoClass,
} from "./image-choice";

const messages = getMessages();

export type BodyTypeOption =
  (typeof messages.onboarding.bodyType.options)[number]["id"];

const photoFor = (gender: GenderOption | null, id: BodyTypeOption) => {
  const set = gender === "woman" ? "woman" : "man";
  return `/onboarding/body-type/${set}-${id}.jpg`;
};

export const BodyTypeStep = ({
  gender,
  value,
  onChange,
}: {
  gender: GenderOption | null;
  value: BodyTypeOption | null;
  onChange: (value: BodyTypeOption) => void;
}) => {
  const copy = messages.onboarding.bodyType;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className={imageChoiceGridClass}>
        {copy.options.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
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
                    "absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full border bg-white/90",
                    selected
                      ? "border-transparent bg-[var(--primary)] text-white"
                      : "border-black/15 bg-white/90 text-transparent",
                  )}
                >
                  <IconCheck className="size-3.5" stroke={2.6} />
                </span>
              </span>
              <span
                className={cn(
                  "px-3 py-3 text-[15px] font-semibold",
                  selected ? "bg-[var(--primary)] text-white" : "text-[#141414]",
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
