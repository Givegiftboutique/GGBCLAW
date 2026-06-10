import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const requiredFiles = [
  "apps/dashboard/data/generated/quality-gate-report.json",
  "apps/dashboard/data/generated/safety-scan-report.json",
  "apps/dashboard/data/generated/release-manifest.json",
  "apps/dashboard/data/generated/observability-report.json",
  "apps/dashboard/data/generated/production-readiness-report.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/README.md",
  "apps/dashboard/verify-dashboard.mjs",
  "apps/dashboard/scripts/generate-final-beta-audit.mjs",
  "apps/dashboard/scripts/verify-final-beta.mjs",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/dashboard/openclaw-dashboard-production-readiness.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "tests/manual-smoke-tests.md",
  "ops/tasks/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT.md",
  "artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md"
];

const sourceModes = ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"];
const failures = [];

function fail(message) {
  failures.push(message);
}

async function readRequired(relativePath) {
  try {
    const body = await readFile(join(repoRoot, relativePath), "utf8");
    if (!body.trim()) fail(`${relativePath} is empty`);
    return body;
  } catch (error) {
    fail(`${relativePath} missing or unreadable: ${error.message}`);
    return "";
  }
}

async function readJson(relativePath) {
  const body = await readRequired(relativePath);
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function collectRepoFiles(start) {
  const files = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      const rel = relative(repoRoot, child).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        if (rel === ".git" || rel === "node_modules") continue;
        await walk(child);
      } else {
        files.push(rel);
      }
    }
  }
  await walk(start);
  return files;
}

for (const file of requiredFiles) {
  await readRequired(file);
}

const qualityGate = await readJson("apps/dashboard/data/generated/quality-gate-report.json");
const safetyScan = await readJson("apps/dashboard/data/generated/safety-scan-report.json");
const releaseManifest = await readJson("apps/dashboard/data/generated/release-manifest.json");
const observability = await readJson("apps/dashboard/data/generated/observability-report.json");
const readiness = await readJson("apps/dashboard/data/generated/production-readiness-report.json");
const finalAudit = await readJson("apps/dashboard/data/generated/final-beta-audit-report.json");

const readOnlyReports = [
  ["release manifest", releaseManifest?.dashboard ?? releaseManifest],
  ["observability report", observability],
  ["production readiness report", readiness],
  ["final beta audit report", finalAudit]
];

for (const [label, report] of readOnlyReports) {
  if (!report) continue;
  if (report.safetyMode !== "read-only") fail(`${label} must contain safetyMode read-only`);
  if (report.mutationEnabled !== false) fail(`${label} must contain mutationEnabled false`);
  if (report.productionWiring !== "disabled") fail(`${label} must contain productionWiring disabled`);
}

if (!qualityGate?.result) fail("quality gate report must include a result");
if (!safetyScan?.result) fail("safety scan report must include a result");
if (readiness?.recommendation !== "no-go-for-production") fail("production readiness recommendation must remain no-go-for-production");
if (readiness?.productionDeploy !== false) fail("production readiness productionDeploy must be false");
if (finalAudit?.overallStatus !== "internal-beta-ready") fail("final beta audit overallStatus must be internal-beta-ready");
if (finalAudit?.productionStatus !== "no-go-for-production") fail("final beta audit productionStatus must be no-go-for-production");

const readme = await readRequired("apps/dashboard/README.md");
const docsIndex = await readRequired("docs/dashboard/README.md");
const runbook = await readRequired("docs/dashboard/openclaw-dashboard-operator-runbook.md");
const handoff = await readRequired("docs/dashboard/openclaw-dashboard-operator-handoff.md");
const hygiene = await readRequired("docs/dashboard/openclaw-dashboard-repo-hygiene.md");
const qualityGateScript = await readRequired("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
const safetyScanScript = await readRequired("apps/dashboard/scripts/safety-scan-dashboard.mjs");

if (!readme.includes("OpenClaw Dashboard - Internal Operator Beta") && !readme.includes("OpenClaw Dashboard — Internal Operator Beta")) {
  fail("apps/dashboard/README.md must contain Internal Operator Beta marker");
}

for (const mode of sourceModes) {
  if (!readme.includes(mode) || !docsIndex.includes(mode) || !handoff.includes(mode)) {
    fail(`source mode is not documented everywhere: ${mode}`);
  }
}

for (const marker of ["generate-final-beta-audit.mjs", "verify-final-beta.mjs", "finalBetaAudit", "finalBetaVerification"]) {
  if (!qualityGateScript.includes(marker)) fail(`quality gate missing final beta marker: ${marker}`);
}

for (const marker of ["final-beta-audit-report.json", "openclaw-dashboard-repo-hygiene.md", "openclaw-dashboard-operator-handoff.md", "docs/dashboard/README.md"]) {
  if (!safetyScanScript.includes(marker)) fail(`safety scan missing final beta marker: ${marker}`);
}

for (const marker of ["internal operator beta", "Production: no-go", "production still no-go", "no-go-for-production"]) {
  const allDocs = `${readme}\n${docsIndex}\n${runbook}\n${handoff}\n${hygiene}`.toLowerCase();
  if (!allDocs.includes(marker.toLowerCase())) fail(`docs missing marker: ${marker}`);
}

const repoFiles = await collectRepoFiles(repoRoot);
if (repoFiles.some((file) => file === ".env" || file.endsWith("/.env"))) fail("repo contains .env file name");
if (repoFiles.some((file) => file.startsWith(".github/workflows/"))) fail("repo contains GitHub Actions workflow");
if (repoFiles.some((file) => file.startsWith("apps/dashboard/release/") && /\.(zip|tar|tgz|gz|7z|rar)$/i.test(file))) {
  fail("dashboard release contains a large archive-style bundle");
}
if (repoFiles.some((file) => file.startsWith("apps/dashboard/release/dist/") || file.startsWith("apps/dashboard/release/build/"))) {
  fail("dashboard release contains dist/build bundle");
}

const textTargets = [
  "apps/dashboard/README.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "apps/dashboard/data/generated/final-beta-audit-report.json"
];
const forbiddenTextPatterns = [
  { label: "production endpoint", pattern: /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i },
  { label: "secret-like assignment", pattern: /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i },
  { label: "production-ready current status", pattern: /recommendation["']?\s*[:=]\s*["']production-ready["']|productionStatus["']?\s*[:=]\s*["']production-ready["']/i },
  { label: "external notification send", pattern: /\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i },
  { label: "active mutation", pattern: /\b(approveReview|rejectReview|restoreBackup|updateSettings|runBackup)\s*\(/i }
];

for (const file of textTargets) {
  const body = await readRequired(file);
  for (const rule of forbiddenTextPatterns) {
    if (rule.pattern.test(body)) fail(`${file} contains forbidden ${rule.label}`);
  }
}

if (failures.length) {
  console.error("OpenClaw final beta verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("OpenClaw final beta verification passed.");
