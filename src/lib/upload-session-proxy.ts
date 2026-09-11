/** Next dev and the public phone page use the same upload backend. */
export async function forwardUploadSession(request: Request) {
  const origin = process.env.UPLOAD_SESSION_ORIGIN || "https://perfilisto.com";
  const source = new URL(request.url);
  const target = new URL(source.pathname + source.search, origin);
  if (target.origin === source.origin) {
    return Response.json({ error: "Upload backend must use a separate origin" }, { status: 503 });
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: ["PUT", "DELETE"].includes(request.method) ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Could not reach the upload service. Please try again." }, { status: 503 });
  }
}
