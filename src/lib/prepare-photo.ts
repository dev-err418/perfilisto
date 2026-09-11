/** Convert HEIC locally before using it in an image element or canvas. */
export const preparePhoto = async (file: File): Promise<Blob> => {
  if (!/\.(heic|heif)$/i.test(file.name) && !/^image\/hei[cf](?:-sequence)?$/i.test(file.type)) {
    return file;
  }

  // Load the decoder only for HEIC selections; photos never leave the browser.
  const { heicTo } = await import("heic-to/csp");
  return heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
};
