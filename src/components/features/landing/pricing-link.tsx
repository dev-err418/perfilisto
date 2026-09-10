"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export const PricingLink = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Link
    href="/#pricing"
    className={className}
    onClick={(event) => {
      if (window.location.pathname !== "/") return;

      const pricingSection = document.getElementById("pricing");
      if (!pricingSection) return;

      event.preventDefault();

      if (window.location.hash !== "#pricing") {
        window.history.pushState(null, "", "/#pricing");
      }

      pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
  >
    {children}
  </Link>
);
