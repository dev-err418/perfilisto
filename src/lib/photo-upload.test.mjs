import assert from "node:assert/strict";
import test from "node:test";
import { selectUploadFiles, needsHeicConversion } from "./photo-upload.mjs";

test("prepared JPEGs with original HEIC filenames are not converted a second time", () => {
  assert.equal(needsHeicConversion({name: "IMG_1906.HEIC", type: "image/jpeg"}), false);
  assert.equal(needsHeicConversion({name: "IMG_1906.HEIC", type: "image/heic"}), true);
  assert.equal(needsHeicConversion({name: "IMG_1906.HEIC", type: ""}), true);
  assert.equal(needsHeicConversion({name: "photo", type: "image/heif"}), true);
  assert.equal(needsHeicConversion({name: "photo.png", type: "image/png"}), false);
});

test("keeps every photo in a multi-file selection, including missing MIME types", () => {
  const files = [
    { name: "one.jpg", type: "image/jpeg", size: 10 },
    { name: "two.JPG", type: "", size: 10 },
    { name: "three.png", type: "application/octet-stream", size: 10 },
    { name: "four.heic", type: "", size: 10 },
  ];
  const result = selectUploadFiles(files, 10);
  assert.deepEqual(result.accepted, files);
  assert.deepEqual(result.rejected, []);
});

test("rejects individual invalid files without losing the rest of a batch", () => {
  const valid = { name: "good.webp", type: "image/webp", size: 10 };
  const result = selectUploadFiles([
    { name: "text.txt", type: "text/plain", size: 10 },
    valid,
    { name: "huge.jpg", type: "image/jpeg", size: 121 * 1024 * 1024 },
  ], 10);
  assert.deepEqual(result.accepted, [valid]);
  assert.equal(result.rejected.length, 2);
});

test("respects the remaining slots when adding a second batch", () => {
  const files = Array.from({ length: 5 }, (_, i) => ({ name: `${i}.jpg`, type: "image/jpeg", size: 10 }));
  const result = selectUploadFiles(files, 2);
  assert.equal(result.accepted.length, 2);
  assert.equal(result.rejected.length, 3);
});
