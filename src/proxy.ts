import { NextResponse, type NextRequest } from "next/server";
import { hasSession, safeRedirect } from "@/lib/auth/server.mjs";
import { getRequestPolicy } from "@/lib/auth/request-policy.mjs";

// Next.js 16 calls middleware "proxy". Production uses this same policy in
// worker/index.js because Next.js static exports cannot execute a proxy.
export async function proxy(request: NextRequest) {
  const authenticated = await hasSession(request, process.env);
  if (request.nextUrl.pathname === "/login" && authenticated) {
    return NextResponse.redirect(safeRedirect(request.nextUrl.searchParams.get("redirect") ?? "/onboarding", request.nextUrl.origin));
  }
  const policy = getRequestPolicy(request.url, authenticated);
  const response = policy.redirect
    ? NextResponse.redirect(policy.redirect, policy.status)
    : NextResponse.next();

  for (const [name, value] of Object.entries(policy.headers)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
