import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const ConsentCheckbox = ({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) => {
  const toggleFromText = (event: MouseEvent<HTMLSpanElement>) => {
    if ((event.target as HTMLElement).closest("a")) return;
    onChange(!checked);
  };

  return (
    <div className="flex items-start gap-3">
      <span className="relative mt-0.5 size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={`${id}-label`}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-[5px] border",
            checked
              ? "border-transparent bg-[var(--primary)]"
              : "border-black/25 bg-white",
          )}
        >
          {checked ? (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="size-3 text-white"
            >
              <path
                d="M2 6.2 4.6 8.8 10 3.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      </span>
      <span
        id={`${id}-label`}
        className="cursor-pointer text-[15px] leading-6 text-[#141414]"
        onClick={toggleFromText}
      >
        {children}
      </span>
    </div>
  );
};
