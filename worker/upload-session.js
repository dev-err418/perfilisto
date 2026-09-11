const TTL_MS = 2 * 60 * 60 * 1000;
const CHUNK_SIZE = 120_000;
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store" },
});

// One shared, persistent session for both devices, regardless of their edge server.
export class UploadSession {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async fetch(request) {
    return this.ctx.blockConcurrencyWhile(async () => {
      const storage = this.ctx.storage;
      const session = await storage.get("session");
      if (request.method === "POST") {
        if (session) return json({ error: "Session already exists" }, 409);
        const expiresAt = Date.now() + TTL_MS;
        await storage.put("session", { expiresAt, photos: [] });
        await storage.setAlarm(expiresAt);
        return json({ ok: true });
      }
      if (!session || session.expiresAt <= Date.now()) {
        if (session) await storage.deleteAll();
        return json({ error: "Session not found" }, 404);
      }
      if (request.method === "GET") {
        const known = new Set((new URL(request.url).searchParams.get("known") || "").split(","));
        const photos = [];
        for (const photo of session.photos) {
          if (known.has(photo.id)) continue;
          const keys = Array.from({ length: photo.chunks }, (_, i) => `photo:${photo.id}:${i}`);
          const chunks = await storage.get(keys);
          photos.push({ id: photo.id, name: photo.name, dataUrl: keys.map((key) => chunks.get(key)).join("") });
        }
        return json({ photos, ids: session.photos.map((photo) => photo.id) });
      }
      if (request.method === "DELETE") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
        const photo = session.photos.find((item) => item.id === body?.id);
        if (photo) {
          await storage.transaction(async (txn) => {
            await txn.delete(Array.from({ length: photo.chunks }, (_, i) => `photo:${photo.id}:${i}`));
            await txn.put("session", { ...session, photos: session.photos.filter((item) => item.id !== photo.id) });
          });
        }
        return json({ ok: true });
      }
      if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
      if (!Array.isArray(body?.photos) || body.photos.length > 10 || body.photos.some((photo) =>
        typeof photo?.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(photo.id) ||
        typeof photo.name !== "string" || photo.name.length > 500 ||
        typeof photo.dataUrl !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(photo.dataUrl) ||
        photo.dataUrl.length > 5_000_000
      )) return json({ error: "Invalid photos" }, 400);
      const existing = new Set(session.photos.map((photo) => photo.id));
      const fresh = body.photos.filter((photo) => {
        if (existing.has(photo.id)) return false;
        existing.add(photo.id);
        return true;
      });
      if (session.photos.length + fresh.length > 10) return json({ error: "You can upload up to 10 photos" }, 400);
      await storage.transaction(async (txn) => {
        const nextPhotos = [...session.photos];
        for (const photo of fresh) {
          const chunks = Math.ceil(photo.dataUrl.length / CHUNK_SIZE);
          for (let i = 0; i < chunks; i++) {
            await txn.put(`photo:${photo.id}:${i}`, photo.dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
          }
          nextPhotos.push({ id: photo.id, name: photo.name, chunks });
        }
        await txn.put("session", { ...session, photos: nextPhotos });
      });
      return json({ ok: true });
    });
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

export async function handleUploadSessions(request, url, env) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 2 && request.method === "POST") {
    const id = crypto.randomUUID().replaceAll("-", "");
    const response = await env.UPLOAD_SESSIONS.getByName(id).fetch(new Request(request.url, { method: "POST" }));
    return response.ok ? json({ id, mobileUrl: `${env.UPLOAD_PUBLIC_ORIGIN || "https://perfilisto.com"}/upload-session?s=${id}` }) : response;
  }
  if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[2])) return json({ error: "Session not found" }, 404);
  if (!["GET", "PUT", "DELETE"].includes(request.method)) return json({ error: "Method not allowed" }, 405);
  return env.UPLOAD_SESSIONS.getByName(parts[2]).fetch(request);
}
