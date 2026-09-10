import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

const messages = getMessages();

export type AgeOption = (typeof messages.onboarding.age.options)[number]["id"];

export const AgeStep = ({
  value,
  onChange,
}: {
  value: AgeOption | null;
  onChange: (value: AgeOption) => void;
}) => {
  const copy = messages.onboarding.age;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-center text-[17px] leading-7 text-muted-foreground">
        {messages.onboarding.shared.subtitle}
      </p>

      <div className="mt-10 flex w-full flex-wrap justify-center gap-3">
        {copy.options.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={selected}
              className={cn(
                "inline-flex h-12 min-w-[6.5rem] items-center justify-between gap-4 rounded-2xl border bg-white px-4 text-[15px] font-medium text-[#141414]",
                selected
                  ? "border-[#141414]"
                  : "border-black/15 hover:border-black/30",
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  selected ? "border-[var(--primary)]" : "border-black/25",
                )}
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-[var(--primary)]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
