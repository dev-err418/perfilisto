"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getMessages } from "./index";
import { defaultLocale, type Locale } from "./config";
import { translateText } from "./translate";
const LocaleContext = createContext<Locale>(defaultLocale);
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
export function useMessages() { return getMessages(useLocale()); }
export function useT() {
  const locale = useLocale();
  return useMemo(() => (text: string, values?: Record<string, string | number>) => translateText(text, locale, values), [locale]);
}
