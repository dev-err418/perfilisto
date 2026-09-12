import { needsHeicConversion } from "./photo-upload.mjs";

/** Convert HEIC and validate image decoding before marking a photo ready. */
export const preparePhoto = async (
  file: File,
  onPreview?: (preview: Blob) => void | Promise<void>,
): Promise<Blob> => {
  let blob: Blob = file;
  if (needsHeicConversion(file)) {
    // Decode locally; the image is sent only when the user submits their photos.
    const { heicTo } = await import("heic-to/csp");
    try {
      if (!onPreview) {
        blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
      } else {
        // Decode once, then expose a small preview before encoding the full photo.
        const bitmap = await heicTo({ blob: file, type: "bitmap" });
        const canvas = document.createElement("canvas");
        const encode = (quality: number) => new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(result => result ? resolve(result) : reject(new Error("Could not encode photo")), "image/jpeg", quality);
        });
        try {
          const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not prepare preview");
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          await onPreview(await encode(0.7));
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          context.drawImage(bitmap, 0, 0);
          blob = await encode(0.9);
        } finally {
          bitmap.close();
          canvas.width = canvas.height = 1;
        }
      }
    } catch {
      throw new Error("Could not convert this photo. Please upload it as JPG or PNG.");
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Could not read photo");
  } finally {
    URL.revokeObjectURL(url);
  }
  return blob;
};
