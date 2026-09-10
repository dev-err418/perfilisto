const TTL_MS = 2 * 60 * 60 * 1000;
const sessions = (globalThis.__perfilistoUploadSessions ??= new Map());

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const pruneSessions = () => {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff) sessions.delete(id);
  }
};

const handleUploadSessions = async (request, url) => {
  pruneSessions();
  const parts = url.pathname.split("/").filter(Boolean);

  if (request.method === "POST" && parts.length === 2) {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    sessions.set(id, { photos: [], updatedAt: Date.now() });
    return json({ id });
  }

  if (parts.length !== 3) return json({ error: "Not found" }, 404);
  const id = parts[2];

  if (request.method === "GET") {
    const session = sessions.get(id);
    if (!session) return json({ error: "Session not found" }, 404);
    return json({ id, photos: session.photos });
  }

  if (request.method === "PUT") {
    const session = sessions.get(id);
    if (!session) return json({ error: "Session not found" }, 404);
    const body = await request.json();
    if (!Array.isArray(body?.photos)) return json({ error: "photos required" }, 400);
    const existing = new Set(session.photos.map((photo) => photo.id));
    for (const photo of body.photos) {
      if (!photo?.id || existing.has(photo.id)) continue;
      session.photos.push(photo);
    }
    session.updatedAt = Date.now();
    sessions.set(id, session);
    return json({ id, photos: session.photos });
  }

  return json({ error: "Method not allowed" }, 405);
};

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.perfilisto.com") {
      url.hostname = "perfilisto.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/api/upload-sessions")) {
      return handleUploadSessions(request, url);
    }

    const response = await env.ASSETS.fetch(request);
    if (
      url.pathname ===
        "/.well-known/apple-developer-merchantid-domain-association" &&
      response.ok
    ) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/octet-stream");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};

export default worker;
