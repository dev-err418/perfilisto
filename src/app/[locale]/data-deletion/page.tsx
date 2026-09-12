import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  const copy = messages.legal.dataDeletion;
  return {
  title: `${copy.title} · Perfilisto`,
  description: copy.body[0],
  alternates: { canonical: `/${locale}/data-deletion` },
};
}
export default async function DataDeletionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const copy = messages.legal.dataDeletion;
  return (
    <LegalPage
      messages={messages}
      title={copy.title}
      updated={copy.updated}
      body={copy.body}
    />
  );
}
