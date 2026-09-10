import type { Metadata } from "next";

import { OnboardingFlow } from "@/components/features/onboarding/onboarding-flow";
import { getMessages } from "@/i18n";

const messages = getMessages();

export const metadata: Metadata = {
  title: `${messages.onboarding.welcome.title} · Perfilisto`,
  description: messages.onboarding.welcome.subtitle,
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
