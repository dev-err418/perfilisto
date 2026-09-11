import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = path.resolve("output/headshot-dataset");
const destination = path.resolve("public/headshots");
const { pairs } = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
await mkdir(destination, { recursive: true });

let originalBytes = 0;
let webBytes = 0;
for (const pair of pairs) {
  for (const filename of [pair.casual, pair.professional]) {
    const input = path.join(source, filename);
    const output = path.join(destination, filename.replace(/\.png$/, ".webp"));
    const result = await sharp(input)
      .resize(576, 720, { fit: "cover", position: "centre" })
      .webp({ quality: 72, effort: 6 })
      .toFile(output);
    originalBytes += (await stat(input)).size;
    webBytes += result.size;
  }
}

console.log(
  `${pairs.length * 2} portraits: ${(originalBytes / 1024 / 1024).toFixed(1)} MB → ${(webBytes / 1024 / 1024).toFixed(2)} MB (${(100 * (1 - webBytes / originalBytes)).toFixed(1)}% smaller)`,
);
