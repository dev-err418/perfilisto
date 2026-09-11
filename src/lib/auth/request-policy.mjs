/** Shared by Next.js development and the production Cloudflare Worker. */
export function getRequestPolicy(requestUrl) {
  const url = new URL(requestUrl);
  const isDashboard = url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");
  const isLogin = url.pathname === "/login" || url.pathname === "/login/";
  const headers = isDashboard || isLogin
    ? { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" }
    : {};

  if (url.hostname === "www.perfilisto.com") {
    url.hostname = "perfilisto.com";
    url.protocol = "https:";
    return { redirect: url.toString(), status: 301, headers };
  }

  // Fail closed until a provider-backed session verifier is connected.
  // Never grant access based solely on the presence of a cookie.
  if (isDashboard) {
    const destination = new URL("/login", url);
    destination.searchParams.set("redirect", url.pathname + url.search);
    return { redirect: destination.toString(), status: 307, headers };
  }

  return { redirect: null, status: 200, headers };
}
