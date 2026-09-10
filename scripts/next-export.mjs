import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const apiDir = "src/app/api";
const hiddenDir = "src/app/.api-export-skip";

if (existsSync(apiDir)) {
  renameSync(apiDir, hiddenDir);
}

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_OUTPUT: "export" },
});

if (existsSync(hiddenDir)) {
  renameSync(hiddenDir, apiDir);
}

process.exit(result.status ?? 1);
