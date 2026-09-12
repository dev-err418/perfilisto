import type { Metadata } from "next";
import { ResultImageScroll } from "@/components/features/onboarding/result-image-scroll";
import Link from "@/i18n/navigation";

import { LogoMark } from "@/components/features/landing/logo-mark";
import { LoginActions } from "@/components/features/auth/login-actions";
import { getMessages } from "@/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);
  return {
  title: `${messages.nav.login} | Perfilisto`,
  description: messages.login.description,
  alternates: { canonical: `/${locale}/login` },
  robots: { index: false, follow: false },
};
}
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const login = messages.login;

  return (
    <div className="theme-light flex min-h-svh flex-col overflow-x-clip bg-white text-black [color-scheme:light]">
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-stretch gap-8 p-6 lg:grid-cols-2 lg:gap-16 lg:p-10">
        <section className="flex items-center justify-center py-16 sm:py-24" aria-labelledby="login-title">
          <div className="w-full max-w-[360px]">
            <div className="flex flex-col items-center text-center">
              <LogoMark className="mb-6 size-12" />
              <h1 id="login-title" className="text-[32px] leading-10 font-semibold tracking-tight text-[#141414] sm:text-4xl">
                {login.title}
              </h1>
              <p className="mt-3 text-base leading-6 text-muted-foreground">
                {login.description}
              </p>
            </div>

            <LoginActions />

            <p className="mx-auto mt-10 max-w-[300px] text-center text-xs leading-5 text-muted-foreground">
              {login.termsPrefix}{" "}
              <Link href="/terms" className="text-black underline-offset-4 hover:underline">{login.terms}</Link>{" "}
              {login.and}{" "}
              <Link href="/privacy" className="text-black underline-offset-4 hover:underline">{login.privacy}</Link>.
            </p>
          </div>
        </section>

        <aside className="relative hidden min-h-[620px] overflow-hidden rounded-[32px] bg-[#f5f3ef] lg:block" aria-label={login.previewDescription}>
          <ResultImageScroll variant="card" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="max-w-sm text-4xl leading-tight font-semibold tracking-tight">{login.previewTitle}</p>
            <p className="mt-4 text-base text-white/80">{login.previewDescription}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
