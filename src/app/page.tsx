import type { Metadata } from "next";

import { Hero } from "@/components/features/landing/hero";
import { HowItWorks } from "@/components/features/landing/how-it-works";
import { LandingNavbar } from "@/components/features/landing/navbar";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getMessages } from "@/i18n";
import { softwareApplicationJsonLd } from "@/lib/seo-schema";

const messages = getMessages();

export const metadata: Metadata = {
  title: messages.meta.title,
  description: messages.meta.description,
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main className="homepage-static theme-light flex min-h-screen flex-col overflow-x-hidden bg-white font-[family-name:var(--font-saans)] text-black [color-scheme:light]">
      <JsonLdScript data={softwareApplicationJsonLd} />
      <LandingNavbar theme="light" />
      <Hero messages={messages} />
      <HowItWorks messages={messages} />
    </main>
  );
}
