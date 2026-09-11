"use client";

import { Popover } from "@base-ui/react/popover";
import Image from "next/image";
import { Select } from "@base-ui/react/select";
import { HairSwatch, hairSwatches, type HairOption } from "./hair-step";
import {
  IconPhoto,
  IconCalendar,
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
  age: "Age",
  glasses: "Glasses",
  reference: "As in my photos",
  professional: "Professional",
  relaxed: "Relaxed",
};
export const labelFor = (value: string) =>
  labels[value] ||
  (/^\d+-\d+$/.test(value)
    ? value.replace("-", "–")
    : value.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase()));
const fieldClass =
  "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white py-2 pl-3 pr-5 text-left text-[15px] font-semibold text-[#141414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
function ChoicePreview({ field, choice, gender }: { field: string; choice: string; gender: string }) {
  const folder = ({ hairType: "hair-type", hairLength: "hair-length", bodyType: "body-type", backgrounds: "backgrounds", attire: "attire" } as Record<string, string>)[field];
  let src = folder && choice ? `/onboarding/${folder}/${gender}-${choice}.jpg` : null;
  if (field === "poses" && choice) src = `/onboarding/attire/${gender}-${choice === "relaxed" ? "smart-casual" : "professional"}.jpg`;
  if (field === "hair" && choice && choice !== "bald") return <span className="grid size-8 shrink-0 place-items-center"><HairSwatch tone={hairSwatches[choice as HairOption]} /></span>;
  if (choice === "bald") src = `/onboarding/hair-length/${gender}-bald.jpg`;
  if (src) return <Image src={src} alt="" width={32} height={36} unoptimized className="h-9 w-8 shrink-0 rounded-md object-cover object-top" />;
  const Icon = field === "glasses" ? choice === "all" ? IconEyeglass : choice === "mixed" ? IconAdjustmentsHorizontal : IconEyeglassOff : field === "age" ? IconCalendar : IconPhoto;
  return <span className="grid size-8 shrink-0 place-items-center text-primary" aria-hidden="true"><Icon className="size-5" stroke={1.7} /></span>;
}
const choiceLabel = (field: string, choice: string) => !choice ? "As in my photos" : labelFor(choice);

function SingleChoice({ field, value, gender, onChange }: { field: keyof Preferences; value: string; gender: string; onChange: (value: string | null) => void }) {
  const choices = [...(!["glasses"].includes(field) ? [""] : []), ...options[field as keyof typeof options]];
  return <div>
    <label id={`detail-label-${field}`} className="mb-2 block text-sm text-muted-foreground">{labelFor(field)}</label>
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger aria-labelledby={`detail-label-${field}`} className={fieldClass}>
        <span className="flex min-w-0 items-center gap-2.5"><ChoicePreview field={field} choice={value} gender={gender} /><span className="truncate">{choiceLabel(field, value)}</span></span>
        <Select.Icon><IconChevronDown className="size-4 shrink-0 text-black/35" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[80] outline-none">
          <Select.Popup className="max-h-[min(var(--available-height),20rem)] w-[var(--anchor-width)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 text-[#141414] shadow-lg [color-scheme:light]">
            {choices.map(choice => <Select.Item key={choice} value={choice} className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl py-2 pr-3 pl-2 outline-none data-highlighted:bg-[#fff4ea]">
              <ChoicePreview field={field} choice={choice} gender={gender} />
              <Select.ItemText className="flex-1 text-sm font-medium">{choiceLabel(field, choice)}</Select.ItemText>
              <Select.ItemIndicator><IconCheck className="size-4 text-primary" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  </div>;
}

function MultiChoice({
  field,
  gender,
  title,
  values,
  choices,
  onToggle,
}: {
  field: string;
  gender: string;
  title: string;
  values: string[];
  choices: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <Popover.Root>
      <div className="relative">
      <span className="mb-2 block text-sm text-muted-foreground">{title}</span>
      <Popover.Trigger
        className={fieldClass}
        aria-label={`${title}: ${values.map(labelFor).join(", ") || "Choose at least one"}`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 -space-x-2" aria-hidden="true">{values.slice(0, 2).map(choice => <span key={choice} className="rounded-md ring-2 ring-white"><ChoicePreview field={field} choice={choice} gender={gender} /></span>)}</span>
          <span className="truncate">{values.map(labelFor).join(", ") || "Choose at least one"}</span>
        </span>
        <IconChevronDown className="size-4 shrink-0 text-black/35" />
      </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-[80]">
        <Popover.Popup className="theme-light max-h-[var(--available-height)] w-[var(--anchor-width)] space-y-3 overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 text-black shadow-lg outline-none" aria-label={title}>
          {choices.map((choice) => (
            <ConsentCheckbox
              key={choice}
              id={`review-${title}-${choice}`}
              checked={values.includes(choice)}
              onChange={() => onToggle(choice)}
            >
              <span className="flex items-center gap-2.5"><ChoicePreview field={field} choice={choice} gender={gender} />{labelFor(choice)}</span>
            </ConsentCheckbox>
          ))}
        </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
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
            : "Review and create"}
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
            ] as const
          ).map((key) =>
            ["backgrounds", "attire", "poses"].includes(key) ? (
              <MultiChoice
                key={key}
                field={key}
                gender={gender}
                title={labelFor(key)}
                values={(value[key] || []) as string[]}
                choices={options[key]}
                onToggle={(item) =>
                  toggle(key as "poses" | "attire" | "backgrounds", item)
                }
              />
            ) : (
              <SingleChoice key={key} field={key} value={String(value[key] || "")} gender={gender} onChange={(choice) => onChange({ ...value, [key]: choice || null })} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
