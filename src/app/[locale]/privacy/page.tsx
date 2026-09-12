import { TrackingPreferences } from "@/components/analytics/whop-pixel";
import type { Metadata } from "next";

import { LegalPage } from "@/components/features/landing/legal-page";
import { getMessages } from "@/i18n";


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return {
  title: `${messages.legal.privacy.title} · Perfilisto`,
  description: messages.legal.privacy.body[0],
};
}
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale);
  return (
    <LegalPage
      messages={messages}
      title={messages.legal.privacy.title}
      updated={messages.legal.privacy.updated}
      body={messages.legal.privacy.body}
    >
      <TrackingPreferences />
    </LegalPage>
  );
}
