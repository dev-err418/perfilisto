import type { ReactNode } from "react";
import type { Messages } from "@/i18n";

import { LandingFooter } from "./footer";
import { LandingNavbar } from "./navbar";

export const LegalPage = ({
  messages,
  title,
  updated,
  body,
  children,
}: {
  messages: Messages;
  title: string;
  updated: string;
  body: readonly string[];
  children?: ReactNode;
}) => (
  <main className="homepage-static theme-light flex min-h-screen flex-col overflow-x-clip bg-white font-[family-name:var(--font-saans)] text-black [color-scheme:light]">
    <LandingNavbar theme="light" />
    <article className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-24">
      <h1 className="text-4xl font-semibold tracking-tight text-[#141414] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{updated}</p>
      <div className="mt-10 space-y-5 text-base leading-7 text-[#717171]">
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {children}
    </article>
    <LandingFooter messages={messages} theme="light" />
  </main>
);
