"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IconCheck,
  IconChevronDown,
  IconEyeglass,
  IconEyeglassOff,
  IconAdjustmentsHorizontal,
} from "@tabler/icons-react";
import type { Preferences } from "@/lib/orders/types";
import options from "@/lib/orders/preference-options.json";
import { cn } from "@/lib/utils";
import {
  imageChoiceCardClass,
  imageChoiceGridClass,
  imageChoicePhotoClass,
} from "./image-choice";
import { ConsentCheckbox } from "./consent-checkbox";

export type FinishingStep = "photos" | "poses" | "glasses" | "details";
const labels: Record<string, string> = {
  none: "No glasses",
  mixed: "Mix of both",
  all: "All glasses",
  hair: "Hair color",
  hairType: "Hair type",
  hairLength: "Hair length",
  bodyType: "Body type",
  backgrounds: "Backgrounds",
  attire: "Attire",
  poses: "Poses",
  headwear: "Headwear",
  age: "Age",
  glasses: "Glasses",
  reference: "As in my photos",
  professional: "Professional",
  relaxed: "Relaxed",
};
export const labelFor = (value: string) =>
  labels[value] ||
  value.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase());
const fieldClass =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 text-left text-[15px] font-semibold text-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
function MultiChoice({
  title,
  values,
  choices,
  onToggle,
}: {
  title: string;
  values: string[];
  choices: string[];
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div
      className="relative"
      ref={ref}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          ref.current?.querySelector("button")?.focus();
        }
      }}
    >
      <span className="mb-2 block text-sm text-muted-foreground">{title}</span>
      <button
        type="button"
        className={fieldClass}
        aria-label={`${title}: ${values.map(labelFor).join(", ") || "Choose at least one"}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {values.map(labelFor).join(", ") || "Choose at least one"}
        </span>
        <IconChevronDown className="size-4 shrink-0 text-black/35" />
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-full z-20 mt-2 space-y-3 rounded-2xl border border-black/10 bg-white p-4 shadow-lg"
          role="group"
          aria-label={title}
        >
          {choices.map((choice) => (
            <ConsentCheckbox
              key={choice}
              id={`review-${title}-${choice}`}
              checked={values.includes(choice)}
              onChange={() => onToggle(choice)}
            >
              {labelFor(choice)}
            </ConsentCheckbox>
          ))}
        </div>
      )}
    </div>
  );
}
function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full",
        selected
          ? "bg-[var(--primary)] text-white"
          : "border border-black/15 bg-white/90 text-transparent",
      )}
    >
      <IconCheck className="size-3.5" stroke={2.6} />
    </span>
  );
}
const withoutGlasses = [
  "/onboarding/attire/man-smart-casual.jpg",
  "/onboarding/attire/man-business-casual.jpg",
];
const withGlasses = [
  "/onboarding/attire/man-professional.jpg",
  "/headshots/man_09_professional_city.webp",
];
export function FinishingSteps({
  step,
  value,
  onChange,
}: {
  step: FinishingStep;
  value: Preferences;
  onChange: (next: Preferences) => void;
}) {
  const toggle = (key: "poses" | "attire" | "backgrounds", item: string) => {
    const current = value[key] || [];
    onChange({
      ...value,
      [key]: current.includes(item)
        ? current.filter((v) => v !== item)
        : [...current, item],
    });
  };
  const gender = value.gender === "woman" ? "woman" : "man";
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {step === "poses"
          ? "Select your poses"
          : step === "glasses"
            ? "Would you like glasses in your headshots?"
            : "Confirm your details"}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {step === "poses"
          ? "Choose one or both poses for your headshots."
          : step === "glasses"
            ? "Choose the option that best fits your preferred look."
            : "Double-check your choices. You can update anything below before we start."}
      </p>
      {step === "poses" && (
        <div className={imageChoiceGridClass} role="group" aria-label="Poses">
          {options.poses.map((pose, i) => (
            <button
              key={pose}
              type="button"
              aria-pressed={value.poses?.includes(pose)}
              onClick={() => toggle("poses", pose)}
              className={cn(
                imageChoiceCardClass,
                value.poses?.includes(pose)
                  ? "border-[var(--primary)]"
                  : "border-black/10 hover:border-black/25",
              )}
            >
              <span className={imageChoicePhotoClass}>
                <Image
                  src={`/onboarding/attire/${gender}-${i ? "smart-casual" : "professional"}.jpg`}
                  alt={`${labelFor(pose)} portrait example`}
                  fill
                  unoptimized
                  className="object-cover object-top"
                />
                <SelectionMark selected={!!value.poses?.includes(pose)} />
              </span>
              <span className="px-3 py-3">
                <span className="block text-[15px] font-semibold text-[#141414]">
                  {labelFor(pose)} pose
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {i
                    ? "Relaxed stance, arms at your sides or hands in pockets."
                    : "Confident stance, a three-quarter turn or arms crossed."}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {step === "glasses" && (
        <>
          <div
            className={imageChoiceGridClass}
            role="group"
            aria-label="Glasses preference"
          >
            {options.glasses.map((choice, i) => {
              const Icon = [
                IconEyeglassOff,
                IconAdjustmentsHorizontal,
                IconEyeglass,
              ][i];
              const sources =
                choice === "mixed"
                  ? [
                      withGlasses[0],
                      withoutGlasses[0],
                      withGlasses[1],
                      withoutGlasses[1],
                    ]
                  : choice === "all"
                    ? [...withGlasses, ...withGlasses]
                    : [...withoutGlasses, ...withoutGlasses];
              return (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={value.glasses === choice}
                  onClick={() => onChange({ ...value, glasses: choice })}
                  className={cn(
                    imageChoiceCardClass,
                    value.glasses === choice
                      ? "border-[var(--primary)]"
                      : "border-black/10 hover:border-black/25",
                  )}
                >
                  <span className="relative grid aspect-square w-full grid-cols-2 gap-1 overflow-hidden bg-[#ececec] p-1">
                    {sources.map((src, j) => (
                      <span
                        key={j}
                        className="relative overflow-hidden rounded-lg"
                      >
                        <Image
                          src={src}
                          alt={
                            choice === "all" ||
                            (choice === "mixed" && j % 2 === 0)
                              ? "Portrait with glasses"
                              : "Portrait without glasses"
                          }
                          fill
                          unoptimized
                          className={cn(
                            "object-cover",
                            j > 1 ? "object-[50%_25%] scale-125" : "object-top",
                          )}
                        />
                      </span>
                    ))}
                    <SelectionMark selected={value.glasses === choice} />
                  </span>
                  <span className="px-3 py-3">
                    <Icon className="mb-2 size-6 text-primary" stroke={1.7} />
                    <span className="block text-[15px] font-semibold text-[#141414]">
                      {labelFor(choice)}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      {
                        [
                          "Photos without glasses.",
                          "An equal mix with and without glasses.",
                          "Glasses in every photo.",
                        ][i]
                      }
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-6 max-w-2xl rounded-2xl bg-[#fff4ea] px-5 py-4 text-center text-sm text-[#141414]">
            For the best match, include reference photos that show your
            preferred look.
          </p>
        </>
      )}
      {step === "details" && (
        <div className="mt-10 grid w-full max-w-4xl gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              "glasses",
              "hairType",
              "hairLength",
              "hair",
              "bodyType",
              "age",
              "backgrounds",
              "attire",
              "poses",
              "headwear",
            ] as const
          ).map((key) =>
            ["backgrounds", "attire", "poses"].includes(key) ? (
              <MultiChoice
                key={key}
                title={labelFor(key)}
                values={(value[key] || []) as string[]}
                choices={options[key]}
                onToggle={(item) =>
                  toggle(key as "poses" | "attire" | "backgrounds", item)
                }
              />
            ) : (
              <label key={key} className="block text-sm text-muted-foreground">
                {labelFor(key)}
                <select
                  className={`${fieldClass} mt-2`}
                  value={String(value[key] || "")}
                  onChange={(e) =>
                    onChange({ ...value, [key]: e.target.value || null })
                  }
                >
                  {!["glasses", "headwear"].includes(key) && (
                    <option value="">As in my photos</option>
                  )}
                  {options[key].map((choice) => (
                    <option key={choice} value={choice}>
                      {key === "headwear" && choice === "none"
                        ? "No headwear"
                        : labelFor(choice)}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
        </div>
      )}
    </div>
  );
}
