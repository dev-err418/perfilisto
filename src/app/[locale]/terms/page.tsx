import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return {
  title: `${messages.legal.terms.title} · Perfilisto`,
  description: messages.legal.terms.body[0],
};
}
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale);
  return (
    <LegalPage
      messages={messages}
      title={messages.legal.terms.title}
      updated={messages.legal.terms.updated}
      body={messages.legal.terms.body}
    />
  );
}
