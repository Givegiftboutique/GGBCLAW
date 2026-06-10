import { readFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const requiredFiles = [
  "apps/dashboard/data/generated/release-manifest.json",
  "apps/dashboard/release/local-release-index.json",
  "apps/dashboard/data/generated/quality-gate-report.json",
  "apps/dashboard/data/generated/safety-scan-report.json",
  "apps/dashboard/data/generated/dashboard-export.generated.json",
  "apps/dashboard/data/generated/action-drafts.sample.json",
  "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
  "docs/dashboard/openclaw-dashboard-internal-deployment-plan.md",
  "docs/dashboard/openclaw-dashboard-operator-release-workflow.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md"
];

const issues = [];

async function readJson(relPath) {
  try {
    return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
  } catch (error) {
    issues.push(`${relPath} is missing or invalid JSON: ${error.message}`);
    return null;
  }
}

for (const relPath of requiredFiles) {
  try {
    const body = await readFile(join(repoRoot, relPath), "utf8");
    if (!body.trim()) issues.push(`${relPath} is empty`);
    if (/C:\\Users\\/i.test(body) && !["apps/dashboard/README.md", "docs/dashboard/openclaw-dashboard-operator-runbook.md"].includes(relPath)) {
      issues.push(`${relPath} contains an absolute machine path`);
    }
    if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push(`${relPath} contains a production-like endpoint`);
    if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push(`${relPath} contains a secret-like assignment`);
  } catch (error) {
    issues.push(`${relPath} missing: ${error.message}`);
  }
}

const manifest = await readJson("apps/dashboard/data/generated/release-manifest.json");
const index = await readJson("apps/dashboard/release/local-release-index.json");
const quality = await readJson("apps/dashboard/data/generated/quality-gate-report.json");
const safety = await readJson("apps/dashboard/data/generated/safety-scan-report.json");

if (manifest) {
  if (manifest.dashboard?.mode !== "static-read-only") issues.push("release manifest dashboard mode must be static-read-only");
  if (manifest.dashboard?.safetyMode !== "read-only") issues.push("release manifest safetyMode must be read-only");
  if (manifest.dashboard?.mutationEnabled !== false) issues.push("release manifest mutationEnabled must be false");
  if (manifest.dashboard?.productionWiring !== "disabled") issues.push("release manifest productionWiring must be disabled");
  for (const source of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
    if (!manifest.dashboard?.supportedSources?.includes(source)) issues.push(`release manifest missing supported source ${source}`);
  }
}

if (index) {
  if (index.safetyMode !== "read-only") issues.push("local release index safetyMode must be read-only");
  if (index.mutationEnabled !== false) issues.push("local release index mutationEnabled must be false");
  if (index.productionWiring !== "disabled") issues.push("local release index productionWiring must be disabled");
  for (const file of ["index.html", "src/app.js", "src/styles.css", "README.md"]) {
    if (!index.filesIncluded?.includes(file)) issues.push(`local release index missing ${file}`);
  }
}

if (quality && typeof quality.result !== "string") issues.push("quality gate report must include a result field");
if (safety && typeof safety.result !== "string") issues.push("safety scan report must include a result field");

if (issues.length) {
  console.error("OpenClaw local dashboard release verification failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw local dashboard release verification passed.");
