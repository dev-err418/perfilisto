import {
  IconClock,
  IconCrop,
  IconHanger,
  IconShieldCheck,
  IconUmbrella,
  IconUser,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

const featureIcons = {
  headshots: IconUser,
  delivery: IconClock,
  outfits: IconHanger,
  backgrounds: IconUmbrella,
  resolution: IconCrop,
  guarantee: IconShieldCheck,
} as const;

export function PlanFeatureList({
  features,
  className,
}: {
  features: readonly { icon: string; label: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {features.map((feature) => {
        const Icon =
          featureIcons[feature.icon as keyof typeof featureIcons] ?? IconUser;

        return (
          <li
            key={feature.label}
            className="flex items-center gap-3 text-[15px] leading-6 text-[#141414]"
          >
            <Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--primary)]"
              stroke={1.8}
            />
            {feature.label}
          </li>
        );
      })}
    </ul>
  );
}
