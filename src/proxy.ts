import { localeRedirect, pathLocale, stripLocale } from "@/i18n/routing.mjs";
import { NextResponse, type NextRequest } from "next/server";
import { hasSession, safeRedirect } from "@/lib/auth/server.mjs";
import { getRequestPolicy } from "@/lib/auth/request-policy.mjs";

// Next.js 16 calls middleware "proxy". Production uses this same policy in
// worker/index.js because Next.js static exports cannot execute a proxy.
export async function proxy(request: NextRequest) {
  const redirect = localeRedirect(request, request.headers.get("cf-ipcountry"));
  if (redirect) return NextResponse.redirect(redirect);
  const authenticated = await hasSession(request, process.env);
  if (stripLocale(request.nextUrl.pathname) === "/login" && authenticated) {
    return NextResponse.redirect(safeRedirect(request.nextUrl.searchParams.get("redirect") ?? "/dashboard", request.nextUrl.origin));
  }
  const policy = getRequestPolicy(request.url, authenticated);
  const response = policy.redirect
    ? NextResponse.redirect(policy.redirect, policy.status)
    : NextResponse.next();

  for (const [name, value] of Object.entries(policy.headers)) {
    response.headers.set(name, value);
  }
  const locale = pathLocale(request.nextUrl.pathname);
  if (locale) response.cookies.set("perfilisto-locale", locale, { path: "/", sameSite: "lax", maxAge: 31536000 });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
