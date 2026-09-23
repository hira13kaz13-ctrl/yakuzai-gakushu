import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, {
    cwd: appRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("npm", ["run", "build"], { VITE_BASE: "/yakuzai-gakushu/" });
run("npx", ["--yes", "gh-pages@6", "--dist", "dist", "--nojekyll"]);
console.log("Published: https://hira13kaz13-ctrl.github.io/yakuzai-gakushu/");
