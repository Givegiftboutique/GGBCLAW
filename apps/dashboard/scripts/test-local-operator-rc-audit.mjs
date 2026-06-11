import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

const paths = {
  module: join(dashboardRoot, "src", "lib", "release-readiness", "local-operator-rc-audit.js"),
  runner: join(dashboardRoot, "scripts", "run-local-operator-rc-audit.mjs"),
  rcGenerator: join(dashboardRoot, "scripts", "generate-local-operator-release-candidate-report.mjs"),
  checklistGenerator: join(dashboardRoot, "scripts", "generate-local-operator-final-checklist.mjs"),
  riskGenerator: join(dashboardRoot, "scripts", "generate-local-operator-known-risk-register.mjs"),
  indexGenerator: join(dashboardRoot, "scripts", "generate-local-operator-report-index.mjs"),
  rcReport: join(dashboardRoot, "data", "generated", "local-operator-release-candidate-report.json"),
  finalChecklist: join(dashboardRoot, "data", "generated", "local-operator-final-checklist.json"),
  riskRegister: join(dashboardRoot, "data", "generated", "local-operator-known-risk-register.json"),
  reportIndex: join(dashboardRoot, "data", "generated", "local-operator-report-index.json"),
  app: join(dashboardRoot, "src", "app.js"),
  i18n: join(dashboardRoot, "src", "lib", "i18n", "zh-hant.js"),
  quality: join(dashboardRoot, "scripts", "run-dashboard-quality-gates.mjs"),
  safety: join(dashboardRoot, "scripts", "safety-scan-dashboard.mjs"),
  launchScript: join(dashboardRoot, "scripts", "start-operator-dashboard.ps1")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readText(path) {
  return readFile(path, "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

for (const [label, path] of Object.entries(paths)) {
  assert(await exists(path), `${label} missing: ${path}`);
}

const moduleText = await readText(paths.module);
const appText = await readText(paths.app);
const i18nText = await readText(paths.i18n);
const qualityText = await readText(paths.quality);
const safetyText = await readText(paths.safety);
const launchText = await readText(paths.launchScript);
const rcReport = await readJson(paths.rcReport);
const checklist = await readJson(paths.finalChecklist);
const riskRegister = await readJson(paths.riskRegister);
const reportIndex = await readJson(paths.reportIndex);

for (const marker of [
  "buildLocalOperatorRcAudit",
  "classifyLocalOperatorRcStatus",
  "buildLocalOperatorRcFindings",
  "buildLocalOperatorRcKnownRisks",
  "buildLocalOperatorRcCards"
]) {
  assert(moduleText.includes(marker), `RC audit module missing ${marker}.`);
}

assert(["local-operator-rc", "review-required", "blocked", "not-evaluated"].includes(rcReport.releaseCandidateStatus), "releaseCandidateStatus must be valid.");
assert(rcReport.productionReady === false && checklist.productionReady === false && riskRegister.productionReady === false && reportIndex.productionReady === false, "productionReady must remain false.");
assert(rcReport.productionStatus === "no-go-for-production", "productionStatus must remain no-go-for-production.");
assert(rcReport.operatorRecommendedSource === "local-ingest", "operatorRecommendedSource must be local-ingest.");
assert(rcReport.expectedRealAgentCount === 1 && rcReport.actualRealAgentCount === 1, "RC report must keep one real agent.");
assert(!["mock", "gateway-stub"].includes(rcReport.operatorRecommendedSource), "RC must not use fixture source as operator truth.");
assert(rcReport.dailyUseAvailable === true || rcReport.releaseCandidateStatus === "review-required", "Daily use must be available or review-required, never production ready.");

for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
  assert(rcReport.blockedActions.includes(blocked), `RC report must block ${blocked}.`);
  assert(checklist.notAllowed.includes(blocked) || blocked === "auth-token-use" && checklist.notAllowed.includes("auth-token-secrets"), `Checklist must block ${blocked}.`);
}

for (const marker of [
  "Local Operator Release Candidate",
  "RC status",
  "Daily use available",
  "Known risks",
  "Production ready",
  "Read-only Adapter Contract Review",
  "Disabled Read-only Adapter Draft",
  "Dashboard Stabilization Audit",
  "Reviewed Health Input Assistant",
  "Daily Operator Runbook",
  "Operator Home"
]) {
  assert(appText.includes(marker), `UI marker missing: ${marker}`);
}

for (const marker of ["localOperatorReleaseCandidate", "localOperatorRcStatus", "dailyUseAvailable", "knownRisks", "productionReadyFalse"]) {
  assert(i18nText.includes(marker), `i18n marker missing: ${marker}`);
}

for (const marker of [
  "run-local-operator-rc-audit.mjs",
  "generate-local-operator-release-candidate-report.mjs",
  "generate-local-operator-final-checklist.mjs",
  "generate-local-operator-known-risk-register.mjs",
  "generate-local-operator-report-index.mjs",
  "test-local-operator-rc-audit.mjs",
  "localOperatorRcAudit"
]) {
  assert(qualityText.includes(marker), `Quality gate missing ${marker}.`);
  assert(safetyText.includes(marker) || marker === "localOperatorRcAudit", `Safety scan missing ${marker}.`);
}

for (const marker of [
  "operator-home-panel",
  "daily-runbook-panel",
  "local-agent-health-panel",
  "local-health-evidence-panel",
  "reviewed-health-input-panel",
  "production-entry-gate-panel",
  "production-adapter-simulator-panel",
  "read-only-adapter-contract-panel",
  "disabled-adapter-draft-panel",
  "stabilization-audit-panel"
]) {
  assert(appText.includes(marker), `Major panel marker missing: ${marker}.`);
}

const generatedCombined = JSON.stringify({ rcReport, checklist, riskRegister, reportIndex });
assert(!/"productionReady"\s*:\s*true|"adapterEnabled"\s*:\s*true|"connected"\s*:\s*true|"endpointConfigured"\s*:\s*true|"authEnabled"\s*:\s*true|"dataReturned"\s*:\s*true/i.test(generatedCombined), "RC generated reports must not enable production/adapter flags.");
assert(!/[A-Za-z]:\\Users\\|\/home\/|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedCombined), "RC generated reports must not contain machine paths, secrets, or remote URLs.");

assert(!/\.env\b|Authorization|credentials\s*:\s*["']include["']|Restart-Service|Stop-Service|Start-Service/i.test(launchText), "Launch script must remain safe.");

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real reviewed-local-agent-health.json must not be tracked.");
const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(staged.stdout || "").trim(), "real reviewed-local-agent-health.json must not be staged.");

console.log("OpenClaw local operator RC audit tests passed.");
