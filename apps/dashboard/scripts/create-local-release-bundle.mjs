import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const releaseDir = join(dashboardRoot, "release");
const manifestPath = join(dashboardRoot, "data", "generated", "release-manifest.json");
const indexPath = join(releaseDir, "local-release-index.json");
const nodeExe = process.execPath;

const includeRoots = [
  "index.html",
  "src",
  "data",
  "schema",
  "README.md",
  "package.json",
  "verify-dashboard.mjs"
];

const excludedGenerated = new Set([
  "data/generated/quality-gate-report.json",
  "data/generated/safety-scan-report.json"
]);

async function collect(rootRel) {
  const absolute = join(dashboardRoot, rootRel);
  const files = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) {
        if (relative(dashboardRoot, child).replaceAll("\\", "/") === "release") continue;
        await walk(child);
      } else {
        const rel = relative(dashboardRoot, child).replaceAll("\\", "/");
        if (!excludedGenerated.has(rel)) files.push(rel);
      }
    }
  }
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    if (entries) await walk(absolute);
  } catch {
    files.push(rootRel.replaceAll("\\", "/"));
  }
  return files;
}

function assertSafeIndexText(body) {
  const issues = [];
  if (/C:\\Users\\/i.test(body)) issues.push("release index contains an absolute machine path");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("release index contains a production-like endpoint");
  if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("release index contains a secret-like assignment");
  if (issues.length) {
    console.error("OpenClaw local release bundle index failed.");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }
}

const manifestResult = spawnSync(nodeExe, ["apps/dashboard/scripts/generate-release-manifest.mjs"], {
  cwd: repoRoot,
  encoding: "utf8"
});
if (manifestResult.status !== 0) {
  console.error(manifestResult.stdout.trim());
  console.error(manifestResult.stderr.trim());
  process.exit(manifestResult.status ?? 1);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const files = [];
for (const rootRel of includeRoots) {
  files.push(...await collect(rootRel));
}
const uniqueFiles = Array.from(new Set(files)).sort();

const index = {
  schemaVersion: "dashboard-local-release-index-v1",
  generatedAt: new Date().toISOString(),
  releaseId: manifest.releaseId,
  filesIncluded: uniqueFiles,
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  manualRunUrl: "http://localhost:5173/",
  qualityGateCommand: "node apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  rollbackTagSuggestion: "sprint-12a-internal-release-workflow",
  manifestPath: "apps/dashboard/data/generated/release-manifest.json",
  note: "Local static release index only; no zip, no deploy, no CI."
};

const body = `${JSON.stringify(index, null, 2)}\n`;
assertSafeIndexText(body);
await mkdir(releaseDir, { recursive: true });
await writeFile(indexPath, body, "utf8");

console.log("OpenClaw local release bundle index generated.");
