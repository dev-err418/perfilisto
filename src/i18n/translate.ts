import translations from "./messages/ui-es.json";
import type { Locale } from "./config";
const dictionary: Record<string, string> = translations;
// Photo validation helpers include filenames. Match only known complete messages.
const patterns = Object.entries(dictionary).filter(([key]) => key.includes("{v")).map(([key, value]) => {
  const keys: string[] = [];
  const source = key.split(/(\{\w+\})/).map(part => {
    if (/^\{\w+\}$/.test(part)) { keys.push(part.slice(1, -1)); return "(.+?)"; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return { pattern: new RegExp(`^${source}$`), keys, value };
});
export function translateText(text: string, locale: Locale, values?: Record<string, string | number>): string {
  let translated = locale === "es" ? dictionary[text] ?? text : text;
  if (locale === "es" && translated === text && !values) {
    for (const { pattern, keys, value } of patterns) {
      const match = text.match(pattern);
      if (match) { translated = value; values = Object.fromEntries(keys.map((key, i) => [key, match[i + 1]])); break; }
    }
  }
  return translated.replace(/\{(\w+)\}/g, (match, key) => values?.[key] === undefined ? match : String(values[key]));
}
