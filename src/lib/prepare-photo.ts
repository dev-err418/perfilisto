/** Convert HEIC and validate image decoding before marking a photo ready. */
export const preparePhoto = async (file: File): Promise<Blob> => {
  let blob: Blob = file;
  if (/\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf](?:-sequence)?$/i.test(file.type)) {
    // Decode locally; the image is sent only when the user submits their photos.
    const { heicTo } = await import("heic-to/csp");
    blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
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
