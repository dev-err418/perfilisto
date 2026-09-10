import { createUploadSession } from "@/lib/upload-session-store";

export const dynamic = "force-dynamic";

export function POST() {
  return Response.json({ id: createUploadSession() });
}
