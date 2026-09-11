import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

const messages = getMessages();

export type HairOption = (typeof messages.onboarding.hair.options)[number]["id"];

const swatches: Record<HairOption, string | "rainbow" | "none"> = {
  brown: "#5c3a21",
  black: "#161616",
  blonde: "#f0d56a",
  gray: "#c5c5c5",
  auburn: "#7a3f22",
  red: "#d45a2a",
  white: "#ffffff",
  other: "rainbow",
  bald: "none",
};

const Swatch = ({ tone }: { tone: string | "rainbow" | "none" }) => {
  if (tone === "none") return <span className="size-5 shrink-0" />;

  if (tone === "rainbow") {
    return (
      <span
        aria-hidden="true"
        className="size-5 shrink-0 rounded-full"
        style={{
          background:
            "conic-gradient(#5b8def, #5ad0a8, #f0d56a, #d45a2a, #c45ad4, #5b8def)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-5 shrink-0 rounded-full",
        tone === "#ffffff" && "border border-black/15",
      )}
      style={{ backgroundColor: tone }}
    />
  );
};

export const HairStep = ({
  value,
  onChange,
}: {
  value: HairOption | null;
  onChange: (value: HairOption) => void;
}) => {
  const copy = messages.onboarding.hair;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center pt-6 sm:pt-10">
      <h1 className="text-center text-[2rem] leading-tight font-semibold tracking-tight text-[#141414] sm:text-4xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-[17px] leading-7 text-muted-foreground">
        {copy.subtitle}
      </p>

      <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
        {copy.options.map((option) => {
          const selected = value === option.id;

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
              <Swatch tone={swatches[option.id]} />
              <span className="flex-1">{option.label}</span>
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

export { Swatch as HairSwatch, swatches as hairSwatches };
