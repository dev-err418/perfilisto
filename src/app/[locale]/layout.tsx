import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { WhopPixel } from "@/components/analytics/whop-pixel";
import { LocaleProvider } from "@/i18n/client";
import { DevLanguageSwitch } from "@/i18n/dev-language-switch";
import { locales, isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import "../globals.css";

const saans = localFont({
  src: [
    {
      path: "../fonts/Saans-Uprights-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
  ],
  variable: "--font-saans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() { return locales.map(locale => ({ locale })); }
export const dynamicParams = false;

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
const { locale } = await params;
const messages = getMessages(locale);
return {
  metadataBase: new URL("https://perfilisto.com"),
  title: messages.meta.title,
  description: messages.meta.description,
  authors: [{ name: "Arthur Spalanzani" }],
  creator: "Tap & Swipe SAS",
  publisher: "Tap & Swipe SAS",
  openGraph: {
    title: messages.meta.title,
    description: messages.meta.description,
    url: `/${locale}`,
    type: "website",
    locale: locale === "es" ? "es_ES" : "en_US",
    siteName: messages.meta.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: messages.meta.title,
    description: messages.meta.description,
  },
  alternates: {
    canonical: `/${locale}`,
    languages: { es: "/es", en: "/en", "x-default": "/" },
  },
};
}

export default async function RootLayout({
  children, params,
}: Readonly<{
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        saans.className,
        saans.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LocaleProvider locale={locale}>
        {children}
        <WhopPixel />
        <Toaster theme="light" className="theme-light toaster group" />
        {process.env.NODE_ENV === "development" && <DevLanguageSwitch />}
        </LocaleProvider>
      </body>
    </html>
  );
}
