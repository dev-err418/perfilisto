import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

// These run in worker/index.js in production, outside the static export.
const runtimeFiles = [
  ["src/app/api", ".api-export-skip"],
  ["src/proxy.ts", ".proxy-export-skip"],
];
const moved = [];
let status = 1;

try {
  for (const [source, hidden] of runtimeFiles) {
    if (existsSync(hidden)) throw new Error(`Restore ${hidden} before building.`);
    if (existsSync(source)) {
      renameSync(source, hidden);
      moved.push([source, hidden]);
    }
  }
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: { ...process.env, NEXT_OUTPUT: "export" },
  });
  status = result.status ?? 1;
} finally {
  for (const [source, hidden] of moved.reverse()) renameSync(hidden, source);
}

process.exit(status);
