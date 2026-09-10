import type { Metadata } from "next";
import { Suspense } from "react";

import { MobileUploadPage } from "@/components/features/onboarding/mobile-upload-page";
import { getMessages } from "@/i18n";

const messages = getMessages();

export const metadata: Metadata = {
  title: `${messages.onboarding.upload.mobilePageTitle} · Perfilisto`,
  description: messages.onboarding.upload.mobilePageSubtitle,
  robots: { index: false, follow: false },
};

export default function UploadSessionPage() {
  return (
    <Suspense>
      <MobileUploadPage />
    </Suspense>
  );
}
