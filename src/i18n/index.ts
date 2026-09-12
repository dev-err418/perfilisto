import { defaultLocale, isLocale, type Locale } from "./config";
import { en, type Messages } from "./messages/en";

import es from "./messages/es.json";

const catalogs: Record<Locale, Messages> = {
  en,
  es: es as Messages,
};

export function getMessages(locale: string = defaultLocale): Messages {
  return catalogs[isLocale(locale) ? locale : defaultLocale];
}

export type { Messages };
export { defaultLocale } from "./config";
