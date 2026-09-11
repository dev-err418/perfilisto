import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LandingNavbar } from "@/components/features/landing/navbar";
import { LogoMark } from "@/components/features/landing/logo-mark";
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

            <div className="mt-9">
              <button
                type="button"
                disabled
                aria-describedby="login-availability"
                className="relative flex h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                {messages.google}
              </button>
              <button
                type="button"
                disabled
                aria-describedby="login-availability"
                className="relative mt-3 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FacebookIcon />
                {messages.facebook}
              </button>
              <p id="login-availability" className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                {messages.unavailable}
              </p>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {messages.newHere}{" "}
              <Link href="/onboarding" className="font-semibold text-black underline-offset-4 hover:underline">
                {messages.getStarted}
              </Link>
            </p>
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

function FacebookIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#0866FF" />
      <path fill="white" d="M16.67 15.47 17.2 12h-3.33V9.75c0-.95.46-1.88 1.96-1.88h1.51V4.92s-1.37-.23-2.68-.23c-2.73 0-4.51 1.65-4.51 4.64V12H7.12v3.47h3.03v8.39a12.1 12.1 0 0 0 3.72 0v-8.39h2.8Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  );
}
