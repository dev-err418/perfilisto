export type RemotePhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

export const createRemoteSession = async () => {
  const response = await fetch("/api/upload-sessions", { method: "POST" });
  if (!response.ok) throw new Error("Could not create upload session");
  const data = (await response.json()) as { id: string };
  return data.id;
};

export const getRemoteSessionPhotos = async (id: string) => {
  const response = await fetch(`/api/upload-sessions/${id}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not load upload session");
  const data = (await response.json()) as { photos: RemotePhoto[] };
  return data.photos;
};

export const putRemoteSessionPhotos = async (
  id: string,
  photos: RemotePhoto[],
) => {
  const response = await fetch(`/api/upload-sessions/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ photos }),
  });
  if (!response.ok) throw new Error("Could not send photos");
};

export const fileToJpegDataUrl = (file: File, maxEdge = 1600) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
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
