"use client";

import { useLocale } from "./client";
import type { Locale } from "./config";
import { localizedPath, stripLocale } from "./routing.mjs";

export function DevLanguageSwitch() {
  const locale = useLocale();

  function switchLanguage(next: Locale) {
    const url = new URL(window.location.href);
    url.pathname = localizedPath(stripLocale(url.pathname), next);
    const redirect = url.searchParams.get("redirect");
    if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
      url.searchParams.set("redirect", localizedPath(stripLocale(redirect), next));
    }
    window.location.assign(url.toString());
  }

  return (
    <div
      role="group"
      aria-label={locale === "es" ? "Idioma de vista previa" : "Preview language"}
      className="fixed right-3 bottom-3 z-[100] flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 text-xs text-black shadow-lg [color-scheme:light]"
    >
      <span className="px-2 text-[10px] font-semibold text-neutral-400">DEV</span>
      {(["es", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={locale === option}
          onClick={() => switchLanguage(option)}
          disabled={locale === option}
          className="min-h-9 rounded-full px-3 font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:bg-black disabled:text-white"
        >
          {option === "es" ? "Español" : "English"}
        </button>
      ))}
    </div>
  );
}
