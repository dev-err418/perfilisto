import {
  getUploadSession,
  mergeUploadSessionPhotos,
  type SessionPhoto,
} from "@/lib/upload-session-store";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = getUploadSession(id);
  if (!session) return json({ error: "Session not found" }, 404);
  return json({ id, photos: session.photos });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { photos?: SessionPhoto[] };
  if (!Array.isArray(body.photos)) {
    return json({ error: "photos required" }, 400);
  }
  const session = mergeUploadSessionPhotos(id, body.photos);
  if (!session) return json({ error: "Session not found" }, 404);
  return json({ id, photos: session.photos });
}
