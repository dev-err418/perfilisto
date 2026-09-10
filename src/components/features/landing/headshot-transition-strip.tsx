"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { LogoMark } from "./logo-mark";

const portraits = Array.from({ length: 10 }, (_, index) => index);

const GeneratedBadge = ({ label }: { label: string }) => (
  <p className="hero-badge flex w-fit max-w-full items-center gap-1 rounded-full px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.1px]">
    <LogoMark className="size-3 shrink-0 rounded-[3px]" />
    <span className="truncate">{label}</span>
  </p>
);

const PortraitTrack = ({
  professional,
  hoveredIndex,
  generatedBadge,
  onHover,
}: {
  professional?: boolean;
  hoveredIndex: number | null;
  generatedBadge: string;
  onHover: (index: number) => void;
}) => (
  <div className="headshot-transition-track">
    {[...portraits, ...portraits].map((_, index) => (
      <div
        key={`${professional ? "professional" : "selfie"}-${index}`}
        className={cn(
          "headshot-placeholder",
          professional
            ? "headshot-placeholder-professional"
            : "headshot-placeholder-selfie",
          hoveredIndex === index && "is-hovered",
        )}
        onMouseEnter={() => onHover(index)}
      >
        {professional ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] flex justify-center px-1.5">
            <GeneratedBadge label={generatedBadge} />
          </div>
        ) : (
          <div className="headshot-placeholder-result">
            <GeneratedBadge label={generatedBadge} />
          </div>
        )}
      </div>
    ))}
  </div>
);

export const HeadshotTransitionStrip = ({
  beforeLabel,
  afterLabel,
  generatedBadge,
}: {
  beforeLabel: string;
  afterLabel: string;
  generatedBadge: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "headshot-transition-showcase relative mt-auto h-[clamp(220px,32vh,360px)] w-full min-w-full shrink-0 self-stretch overflow-visible",
        hoveredIndex !== null && "is-paused",
      )}
      aria-label={`${beforeLabel} to ${afterLabel}`}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="headshot-transition-layer headshot-transition-before">
        <PortraitTrack
          hoveredIndex={hoveredIndex}
          generatedBadge={generatedBadge}
          onHover={setHoveredIndex}
        />
      </div>
      <div className="headshot-transition-layer headshot-transition-after">
        <PortraitTrack
          professional
          hoveredIndex={hoveredIndex}
          generatedBadge={generatedBadge}
          onHover={setHoveredIndex}
        />
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_26%,transparent)]" />
    </div>
  );
};
