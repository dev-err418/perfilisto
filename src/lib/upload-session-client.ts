import { preparePhoto } from "./prepare-photo";

export type RemotePhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

export class UploadSessionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function checkResponse(response: Response) {
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  throw new UploadSessionError(data?.error || "Could not connect to the upload service", response.status);
}

export const createRemoteSession = async () => {
  const response = await fetch("/api/upload-sessions", { method: "POST", signal: AbortSignal.timeout(30_000) });
  await checkResponse(response);
  return await response.json() as { id: string; mobileUrl: string };
};

export const getRemoteSessionSnapshot = async (id: string, known: string[] = []) => {
  const query = known.length ? `?known=${encodeURIComponent(known.join(","))}` : "";
  const response = await fetch(`/api/upload-sessions/${id}${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) return null;
  await checkResponse(response);
  return await response.json() as { photos: RemotePhoto[]; ids: string[] };
};

export const getRemoteSessionPhotos = async (id: string) => {
  const snapshot = await getRemoteSessionSnapshot(id);
  return snapshot?.photos ?? null;
};

export const putRemoteSessionPhotos = async (id: string, photos: RemotePhoto[]) => {
  const response = await fetch(`/api/upload-sessions/${id}`, {
    method: "PUT", headers: jsonHeaders, body: JSON.stringify({ photos }),
    signal: AbortSignal.timeout(60_000),
  });
  await checkResponse(response);
};

export const deleteRemoteSessionPhoto = async (sessionId: string, id: string) => {
  const response = await fetch(`/api/upload-sessions/${sessionId}`, {
    method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ id }),
    signal: AbortSignal.timeout(30_000),
  });
  await checkResponse(response);
};

export const fileToJpegDataUrl = async (file: File, maxEdge = 1600) => {
  const blob = await preparePhoto(file);
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(blob);
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read photo"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read photo"));
    };
    image.src = objectUrl;
  });
};
