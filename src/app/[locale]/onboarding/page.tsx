import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/features/onboarding/onboarding-flow";
import { getMessages } from "@/i18n";


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return {
  title: `${messages.onboarding.welcome.title} · Perfilisto`,
  description: messages.onboarding.welcome.subtitle,
  robots: {
    index: false,
    follow: false,
  },
};
}
export default async function OnboardingPage() {
  return <OnboardingFlow />;
}
