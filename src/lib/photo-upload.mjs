const MAX_BYTES = 120 * 1024 * 1024;
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|heic|heif)$/i;
const IMAGE_TYPE = /^image\/(jpeg|png|webp|heic|heif)$/i;

/** Validate each file independently so one rejected file never discards a batch. */
export function selectUploadFiles(files, availableSlots) {
  const accepted = [];
  const rejected = [];
  for (const file of Array.from(files)) {
    if (!IMAGE_TYPE.test(file.type) && !IMAGE_EXTENSION.test(file.name)) {
      rejected.push(`${file.name}: unsupported format.`);
    } else if (file.size > MAX_BYTES) {
      rejected.push(`${file.name}: exceeds the 120 MB limit.`);
    } else if (accepted.length >= availableSlots) {
      rejected.push(`${file.name}: you can upload up to 10 photos.`);
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
// Prepared photos retain their original filename, but their Blob has a new MIME type.
export function needsHeicConversion(file) {
  const type = (file.type || "").split(";")[0].toLowerCase();
  if (/^image\/(jpeg|png|webp|gif|avif|bmp)$/.test(type)) return false;
  return /^image\/hei[cf](?:-sequence)?$/.test(type) || /\.(heic|heif)$/i.test(file.name);
}
