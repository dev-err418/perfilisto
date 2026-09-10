import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";

const messages = getMessages();

export const metadata: Metadata = {
  title: `${messages.legal.privacy.title} · Perfilisto`,
  description: messages.legal.privacy.body[0],
};

export default function PrivacyPage() {
  return (
    <LegalPage
      messages={messages}
      title={messages.legal.privacy.title}
      updated={messages.legal.privacy.updated}
      body={messages.legal.privacy.body}
    />
  );
}
