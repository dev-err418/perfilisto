import type { Metadata } from "next";

import { Clients } from "@/components/features/landing/clients";
import { Compare } from "@/components/features/landing/compare";
import { FaqSection } from "@/components/features/landing/faq-section";
import { LandingFooter } from "@/components/features/landing/footer";
import { Hero } from "@/components/features/landing/hero";
import { HowItWorks } from "@/components/features/landing/how-it-works";
import { LandingNavbar } from "@/components/features/landing/navbar";
import { Pricing } from "@/components/features/landing/pricing";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getMessages } from "@/i18n";
import type { JsonValue } from "@/lib/json-value";
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
  const faqPageJsonLd: JsonValue = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: messages.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="homepage-static theme-light flex min-h-screen flex-col overflow-x-clip bg-white font-[family-name:var(--font-saans)] text-black [color-scheme:light]">
      <JsonLdScript data={softwareApplicationJsonLd} />
      <JsonLdScript data={faqPageJsonLd} />
      <LandingNavbar theme="light" />
      <Hero messages={messages} />
      <HowItWorks messages={messages} />
      <Clients messages={messages} />
      <Compare messages={messages} />
      <Pricing messages={messages} />
      <FaqSection messages={messages} />
      <LandingFooter messages={messages} theme="light" />
    </main>
  );
}
