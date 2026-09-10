import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

import { WhopPixel } from "@/components/analytics/whop-pixel";
import { getMessages } from "@/i18n";
import { cn } from "@/lib/utils";

import "./globals.css";

const saans = localFont({
  src: [
    {
      path: "./fonts/Saans-Uprights-Variable.woff2",
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

const messages = getMessages();

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://perfilisto.com"),
  title: messages.meta.title,
  description: messages.meta.description,
  authors: [{ name: "Arthur Spalanzani" }],
  creator: "Tap & Swipe SAS",
  publisher: "Tap & Swipe SAS",
  openGraph: {
    title: messages.meta.title,
    description: messages.meta.description,
    url: "/",
    type: "website",
    locale: "en_US",
    siteName: messages.meta.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: messages.meta.title,
    description: messages.meta.description,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
      <head>
        <WhopPixel />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
