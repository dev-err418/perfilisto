export const defaultLocale = "es";
export const locales = ["es", "en"];
export function detectLocale({ country, acceptLanguage = "" } = {}) {
  const languages = acceptLanguage.split(",").map((part) => {
    const [tag, ...parameters] = part.trim().split(";");
    const quality = parameters.find(p => p.trim().startsWith("q="));
    return { tag: tag.toLowerCase(), q: quality ? Number(quality.trim().slice(2)) : 1 };
  }).filter(({ tag, q }) => tag && tag !== "*" && q > 0).sort((a, b) => b.q - a.q);
  if (country?.toUpperCase() === "ES" || /^es(?:-|$)/.test(languages[0]?.tag || "")) return "es";
  return languages.length || (country && !["XX", "T1"].includes(country.toUpperCase())) ? "en" : defaultLocale;
}
export function pathLocale(pathname) { return pathname.match(/^\/(es|en)(?:\/|$)/)?.[1]; }
export function stripLocale(pathname) { return pathname.replace(/^\/(?:es|en)(?=\/|$)/, "") || "/"; }
export function localizedPath(path, locale) {
  if (!path.startsWith("/") || path.startsWith("//") || pathLocale(path) || /^\/(?:api|_next)(?:\/|$)/.test(path)) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}
export function localeRedirect(request, country) {
  const url = new URL(request.url);
  if (pathLocale(url.pathname) || /^\/(?:api|_next|\.well-known)(?:\/|$)/.test(url.pathname) || /\.[^/]+$/.test(url.pathname)) return null;
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)perfilisto-locale=(es|en)(?:;|$)/)?.[1];
  const locale = cookie || detectLocale({ country, acceptLanguage: request.headers.get("accept-language") || "" });
  url.pathname = localizedPath(url.pathname, locale);
  return url.toString();
}
