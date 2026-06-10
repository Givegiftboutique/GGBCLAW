import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const failures = [];

const requiredGeneratedReports = [
  "apps/dashboard/data/generated/internal-release-candidate-report.json",
  "apps/dashboard/data/generated/internal-signoff-package.json",
  "apps/dashboard/data/generated/quality-gate-report.json",
  "apps/dashboard/data/generated/safety-scan-report.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/data/generated/security-privacy-audit-report.json",
  "apps/dashboard/data/generated/data-retention-review-report.json",
  "apps/dashboard/data/generated/operator-daily-summary.json",
  "apps/dashboard/data/generated/operator-incident-drill-report.json",
  "apps/dashboard/data/generated/operator-evidence-manifest.json",
  "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  "apps/dashboard/data/generated/production-readiness-report.json"
];

const requiredDocs = [
  "apps/dashboard/README.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-v1-internal-release-candidate.md",
  "docs/dashboard/openclaw-dashboard-internal-signoff.md"
];

function fail(message) {
  failures.push(message);
}

async function exists(relativePath) {
  try {
    await stat(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
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
    fail(`${relativePath} is invalid JSON: ${error.message}`);
    return null;
  }
}

async function collectFiles(relativePath) {
  const target = join(repoRoot, relativePath);
  const output = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      const relPath = relative(repoRoot, child).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        if ([".git", "node_modules", ".venv"].includes(entry.name)) continue;
        await walk(child);
      } else {
        output.push(relPath);
      }
    }
  }
  if (await exists(relativePath)) await walk(target);
  return output;
}

for (const file of [...requiredGeneratedReports, ...requiredDocs]) {
  if (!(await exists(file))) fail(`${file} must exist`);
}

const rcReport = await readJson("apps/dashboard/data/generated/internal-release-candidate-report.json");
const signoffPackage = await readJson("apps/dashboard/data/generated/internal-signoff-package.json");
const readiness = await readJson("apps/dashboard/data/generated/production-readiness-report.json");
const finalBeta = await readJson("apps/dashboard/data/generated/final-beta-audit-report.json");
const securityAudit = await readJson("apps/dashboard/data/generated/security-privacy-audit-report.json");
const retention = await readJson("apps/dashboard/data/generated/data-retention-review-report.json");
const dailySummary = await readJson("apps/dashboard/data/generated/operator-daily-summary.json");
const incidentDrill = await readJson("apps/dashboard/data/generated/operator-incident-drill-report.json");
const evidenceManifest = await readJson("apps/dashboard/data/generated/operator-evidence-manifest.json");
const staticDryRun = await readJson("apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json");

const safetyReports = [
  ["RC report", rcReport],
  ["sign-off package", signoffPackage],
  ["readiness", readiness],
  ["final beta", finalBeta],
  ["security audit", securityAudit],
  ["retention", retention],
  ["daily summary", dailySummary],
  ["incident drill", incidentDrill],
  ["evidence manifest", evidenceManifest],
  ["static dry-run", staticDryRun]
];

for (const [label, report] of safetyReports) {
  if (!report) continue;
  if (report.safetyMode !== "read-only") fail(`${label} safetyMode must be read-only`);
  if (report.mutationEnabled !== false) fail(`${label} mutationEnabled must be false`);
  if (report.productionWiring !== "disabled") fail(`${label} productionWiring must be disabled`);
}

if (rcReport?.releaseCandidate !== "v1.0.0-internal-rc1") fail("RC report must use v1.0.0-internal-rc1");
if (rcReport?.scope !== "internal-operator-use") fail("RC report scope must be internal-operator-use");
if (rcReport?.internalStatus !== "release-candidate") fail("RC report internalStatus must be release-candidate");
if (rcReport?.productionStatus !== "no-go-for-production") fail("RC report productionStatus must be no-go-for-production");
if (rcReport?.manualSignoffRequired !== true) fail("RC report manualSignoffRequired must be true");
if (rcReport?.signoffStatus !== "pending") fail("RC report signoffStatus must be pending");
for (const mode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  if (!rcReport?.supportedSources?.includes(mode)) fail(`RC report missing source mode ${mode}`);
}

if (signoffPackage?.candidateTag !== "v1.0.0-internal-rc1") fail("sign-off package candidateTag mismatch");
if (signoffPackage?.finalInternalTag !== "v1.0.0-internal") fail("sign-off package finalInternalTag mismatch");
if (signoffPackage?.signoffStatus !== "pending") fail("sign-off status must remain pending");
if (signoffPackage?.notApprovedYet !== true) fail("sign-off package notApprovedYet must be true");
if (!Array.isArray(signoffPackage?.requiredReviewers) || signoffPackage.requiredReviewers.length < 4) fail("sign-off package must list required reviewers");

if (readiness?.recommendation !== "no-go-for-production") fail("production readiness must remain no-go-for-production");
if (readiness?.productionDeploy !== false) fail("productionDeploy must remain false");
if (retention?.retentionPolicyStatus !== "draft-for-internal-review") fail("retention must remain draft-for-internal-review");

const readme = await readRequired("apps/dashboard/README.md");
const docsIndex = await readRequired("docs/dashboard/README.md");
if (!readme.includes("Internal Release Candidate")) fail("README must say Internal Release Candidate");
if (!docsIndex.includes("openclaw-dashboard-internal-signoff.md")) fail("docs index must link sign-off docs");

const generatedBodies = [];
for (const file of requiredGeneratedReports) {
  generatedBodies.push(await readRequired(file));
}
const generatedText = generatedBodies.join("\n");
const unsafePatterns = [
  ["absolute machine path", /[A-Za-z]:\\Users\\|\/home\//i],
  ["secret-like assignment", /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i],
  ["Authorization header", /Authorization\s*:/i],
  ["credentials include", /credentials\s*:\s*["']include["']/i],
  ["mutation enabled", /"mutationEnabled"\s*:\s*true/i],
  ["production deploy enabled", /"productionDeploy"\s*:\s*true/i],
  ["signoff approved", /"signoffStatus"\s*:\s*"approved"/i],
  ["approved flag", /"notApprovedYet"\s*:\s*false/i],
  ["external notification delivery", /\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i]
];
for (const [label, pattern] of unsafePatterns) {
  if (pattern.test(generatedText)) fail(`generated reports contain ${label}`);
}

const repoFiles = await collectFiles(".");
if (repoFiles.some((file) => file === ".env" || file.endsWith("/.env"))) fail("repo must not contain .env");
if (repoFiles.some((file) => file.startsWith(".github/workflows/"))) fail("repo must not contain GitHub Actions workflows");
if (repoFiles.some((file) => file.startsWith("apps/dashboard/release/") && /\.(zip|tar|tgz|gz|7z|rar)$/i.test(file))) fail("dashboard release must not contain archive bundle");

if (failures.length) {
  console.error("OpenClaw v1.0.0 internal release candidate verification failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw v1.0.0 internal release candidate verification passed.");
