import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relPath) {
  return readFile(join(repoRoot, relPath), "utf8");
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
  assert(result.status === 0, `${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

const paths = {
  doc: "docs/dashboard/openclaw-dashboard-whatsapp-secret-manager-design.md",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

const doc = await text(paths.doc);
for (const marker of [
  "no secrets in repo",
  "no secrets in generated reports",
  "no browser token input",
  "no `.env` reading",
  "rotation policy",
  "redacted logging policy",
  "production blocker checklist",
  "approval gates",
  "rollback plan"
]) {
  assert(doc.toLowerCase().includes(marker.toLowerCase()), `design doc missing ${marker}.`);
}

for (const file of [paths.app, paths.quality, paths.verifier]) {
  const body = await text(file);
  assert(!/secret manager implementation|credential loader|token store|\.env parser|provider login|secret UI|auth endpoint/i.test(body), `${file} must remain design-only.`);
}

const safety = await text(paths.safety);
assert(safety.includes("openclaw-dashboard-whatsapp-secret-manager-design.md"), "safety scan must cover secret manager design.");

run(["apps/dashboard/scripts/safety-scan-dashboard.mjs"]);

console.log("OpenClaw WhatsApp secret manager design tests passed.");
