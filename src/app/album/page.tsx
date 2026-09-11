import type { Metadata } from "next";
import { AlbumPage } from "@/components/features/onboarding/album-page";
export const metadata: Metadata = { title: "Your headshots · Perfilisto", robots: { index: false, follow: false } };
export default function Page() { return <AlbumPage />; }
