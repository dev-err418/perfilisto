import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Lucide Loader geometry, matching Grewit's Spinner. See docs/lucide-license.txt.
export function Spinner({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      data-spinner="grewit"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0 animate-spin motion-reduce:animate-none", className)}
      {...props}
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  );
}
