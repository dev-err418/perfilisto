import { getToken, encode } from "@auth/core/jwt";

// Localhost uses the same durable orders as production. Forward a narrowly scoped,
// short-lived signed session rather than forwarding browser cookies verbatim.
export async function forwardOrder(request) {
  const source = new URL(request.url);
  if (
    request.method !== "GET" &&
    request.headers.get("Origin") !== source.origin
  )
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const secret = process.env.AUTH_SECRET;
  const token = secret
    ? await getToken({
        req: request,
        secret,
        secureCookie: source.protocol === "https:",
      })
    : null;
  if (!token?.sub || !token.exp || token.exp <= Date.now() / 1000)
    return Response.json({ error: "Please sign in again" }, { status: 401 });
  const target = new URL(
    source.pathname + source.search,
    "https://perfilisto.com",
  );
  const salt = "__Secure-authjs.session-token";
  const session = await encode({
    token: { sub: token.sub, email: token.email, name: token.name },
    secret,
    salt,
    maxAge: 300,
  });
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        Cookie: `${salt}=${session}`,
        Origin: target.origin,
        "Content-Type": "application/json",
      },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
      redirect: "manual",
    });
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type":
        response.headers.get("Content-Type") || "application/json",
    });
    if (response.headers.has("Content-Disposition"))
      headers.set(
        "Content-Disposition",
        response.headers.get("Content-Disposition"),
      );
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json(
      { error: "The order service could not be reached. Please try again." },
      { status: 503 },
    );
  }
}
