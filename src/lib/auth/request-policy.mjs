/** Shared by Next.js development and the production Cloudflare Worker. */
export function getRequestPolicy(requestUrl, authenticated = false) {
  const url = new URL(requestUrl);
  const pathname = url.pathname.replace(/\.(html|txt|rsc)$/, "");
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isAlbum = pathname === "/album" || pathname.startsWith("/album/");
  // These bundled examples are public marketing assets, not customer uploads.
  const isPublicExample = url.pathname.startsWith("/onboarding/") && /\.(?:jpe?g|png|webp|avif|gif|svg)$/i.test(url.pathname);
  const requiresLogin = (isDashboard || isOnboarding || isAlbum) && !isPublicExample;
  const isLogin = url.pathname === "/login" || url.pathname === "/login/";
  const headers = requiresLogin || isLogin
    ? { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" }
    : {};

  if (url.hostname === "www.perfilisto.com") {
    url.hostname = "perfilisto.com";
    url.protocol = "https:";
    return { redirect: url.toString(), status: 301, headers };
  }

  // Callers supply only the result of cryptographic session verification.
  if (requiresLogin && !authenticated) {
    const destination = new URL("/login", url);
    destination.searchParams.set("redirect", url.pathname + url.search);
    return { redirect: destination.toString(), status: 307, headers };
  }

  return { redirect: null, status: 200, headers };
}
