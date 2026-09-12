import type { Metadata } from "next";
import { Suspense } from "react";

import { MobileUploadPage } from "@/components/features/onboarding/mobile-upload-page";
import { getMessages } from "@/i18n";


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return {
  title: `${messages.onboarding.upload.mobilePageTitle} · Perfilisto`,
  description: messages.onboarding.upload.mobilePageSubtitle,
  robots: { index: false, follow: false },
};
}
export default async function UploadSessionPage() {
  return (
    <Suspense>
      <MobileUploadPage />
    </Suspense>
  );
}
