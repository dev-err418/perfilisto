import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";

const messages = getMessages();
const copy = messages.legal.dataDeletion;

export const metadata: Metadata = {
  title: `${copy.title} · Perfilisto`,
  description: "How to request deletion of your Perfilisto account, photos, and information associated with Google or Facebook sign-in.",
  alternates: { canonical: "/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      messages={messages}
      title={copy.title}
      updated={copy.updated}
      body={copy.body}
    />
  );
}
