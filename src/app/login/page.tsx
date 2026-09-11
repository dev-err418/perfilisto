import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LandingNavbar } from "@/components/features/landing/navbar";
import { LogoMark } from "@/components/features/landing/logo-mark";
import { LoginActions } from "@/components/features/auth/login-actions";
import { getMessages } from "@/i18n";

export const metadata: Metadata = {
  title: "Login | Perfilisto",
  description: "Sign in to your Perfilisto account to access your professional headshots.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  const { login: messages } = getMessages();

  return (
    <div className="theme-light flex min-h-svh flex-col overflow-x-clip bg-white text-black [color-scheme:light]">
      <LandingNavbar theme="light" />
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-stretch gap-8 px-6 pb-6 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pb-10">
        <section className="flex items-center justify-center py-16 sm:py-24" aria-labelledby="login-title">
          <div className="w-full max-w-[360px]">
            <div className="flex flex-col items-center text-center">
              <LogoMark className="mb-6 size-12" />
              <h1 id="login-title" className="text-[32px] leading-10 font-semibold tracking-tight text-[#141414] sm:text-4xl">
                {messages.title}
              </h1>
              <p className="mt-3 text-base leading-6 text-muted-foreground">
                {messages.description}
              </p>
            </div>

            <LoginActions />

            <p className="mx-auto mt-10 max-w-[300px] text-center text-xs leading-5 text-muted-foreground">
              {messages.termsPrefix}{" "}
              <Link href="/terms" className="text-black underline-offset-4 hover:underline">{messages.terms}</Link>{" "}
              {messages.and}{" "}
              <Link href="/privacy" className="text-black underline-offset-4 hover:underline">{messages.privacy}</Link>.
            </p>
          </div>
        </section>

        <aside className="relative hidden min-h-[620px] overflow-hidden rounded-[32px] bg-[#f5f3ef] lg:block" aria-label={messages.previewDescription}>
          <Image
            src="/onboarding/welcome-bg.jpg"
            alt=""
            fill
            priority
            unoptimized
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="max-w-sm text-4xl leading-tight font-semibold tracking-tight">{messages.previewTitle}</p>
            <p className="mt-4 text-base text-white/80">{messages.previewDescription}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
