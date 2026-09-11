"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { LogoMark } from "./logo-mark";

const portraits = [
  ["woman_10", "nature"],
  ["man_02", "office"],
  ["woman_06", "city"],
  ["man_10", "studio"],
  ["woman_01", "office"],
  ["man_04", "nature"],
  ["woman_07", "studio"],
  ["man_06", "city"],
  ["woman_04", "nature"],
  ["man_01", "studio"],
  ["woman_02", "city"],
  ["man_07", "office"],
  ["woman_03", "studio"],
  ["man_08", "nature"],
  ["woman_05", "office"],
  ["man_03", "city"],
  ["woman_08", "nature"],
  ["man_05", "studio"],
  ["woman_09", "office"],
  ["man_09", "city"],
].map(([id, background]) => ({
  id,
  casual: `/headshots/${id}_casual.webp`,
  professional: `/headshots/${id}_professional_${background}.webp`,
}));

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
  label,
  onHover,
}: {
  professional?: boolean;
  hoveredIndex: number | null;
  generatedBadge: string;
  label: string;
  onHover: (index: number) => void;
}) => (
  <div className="headshot-transition-track">
    {[...portraits, ...portraits].map((portrait, index) => (
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
        aria-hidden={index >= portraits.length ? true : undefined}
      >
        <Image
          src={professional ? portrait.professional : portrait.casual}
          alt={`${label} ${index % portraits.length + 1}`}
          width={576}
          height={720}
          unoptimized
          loading="eager"
          draggable={false}
          className="h-full w-full object-cover"
        />
        {professional ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] flex justify-center px-1.5">
            <GeneratedBadge label={generatedBadge} />
          </div>
        ) : (
          <div className="headshot-placeholder-result">
            <Image
              src={portrait.professional}
              alt=""
              width={576}
              height={720}
              unoptimized
              loading="eager"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="relative z-[1]">
              <GeneratedBadge label={generatedBadge} />
            </div>
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
        "headshot-transition-showcase relative mt-10 h-[clamp(220px,32vh,360px)] w-full min-w-full shrink-0 self-stretch overflow-visible sm:mt-12",
        hoveredIndex !== null && "is-paused",
      )}
      aria-label={`${beforeLabel} to ${afterLabel}`}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="headshot-transition-layer headshot-transition-before">
        <PortraitTrack
          hoveredIndex={hoveredIndex}
          generatedBadge={generatedBadge}
          label={beforeLabel}
          onHover={setHoveredIndex}
        />
      </div>
      <div className="headshot-transition-layer headshot-transition-after">
        <PortraitTrack
          professional
          hoveredIndex={hoveredIndex}
          generatedBadge={generatedBadge}
          label={afterLabel}
          onHover={setHoveredIndex}
        />
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_26%,transparent)]" />
    </div>
  );
};
