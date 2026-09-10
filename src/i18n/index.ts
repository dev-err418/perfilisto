import { defaultLocale, type Locale } from "./config";
import { en, type Messages } from "./messages/en";

const catalogs: Record<Locale, Messages> = {
  en,
  es: en,
};

export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}

export type { Messages };
export { defaultLocale } from "./config";
