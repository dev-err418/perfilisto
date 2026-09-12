import { getMessages } from "@/i18n";
import type { Metadata } from "next";
import { AlbumPage } from "@/components/features/onboarding/album-page";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return { title: `${messages.hero.afterLabel} · Perfilisto`, robots: { index: false, follow: false } };
}
export default async function Page() {
  return <AlbumPage />; }
