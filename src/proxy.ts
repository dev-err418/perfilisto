import { NextResponse, type NextRequest } from "next/server";
import { getRequestPolicy } from "@/lib/auth/request-policy.mjs";

// Next.js 16 calls middleware "proxy". Production uses this same policy in
// worker/index.js because Next.js static exports cannot execute a proxy.
export function proxy(request: NextRequest) {
  const policy = getRequestPolicy(request.url);
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
