import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";

const messages = getMessages();

export const metadata: Metadata = {
  title: `${messages.legal.terms.title} · Perfilisto`,
  description: messages.legal.terms.body[0],
};

export default function TermsPage() {
  return (
    <LegalPage
      messages={messages}
      title={messages.legal.terms.title}
      updated={messages.legal.terms.updated}
      body={messages.legal.terms.body}
    />
  );
}
