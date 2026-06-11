import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

const paths = {
  contractModule: join(dashboardRoot, "src", "lib", "production-readiness", "read-only-adapter-contract.js"),
  disabledDraftModule: join(dashboardRoot, "src", "lib", "production-readiness", "disabled-read-only-production-adapter.js"),
  contractGenerator: join(dashboardRoot, "scripts", "generate-read-only-adapter-contract-review-report.mjs"),
  disabledDraftGenerator: join(dashboardRoot, "scripts", "generate-disabled-read-only-adapter-draft-report.mjs"),
  checklistGenerator: join(dashboardRoot, "scripts", "generate-read-only-adapter-contract-checklist.mjs"),
  stabilizationGenerator: join(dashboardRoot, "scripts", "generate-dashboard-stabilization-audit-report.mjs"),
  test: join(dashboardRoot, "scripts", "test-read-only-adapter-contract-and-draft.mjs"),
  contractReport: join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json"),
  disabledDraftReport: join(dashboardRoot, "data", "generated", "disabled-read-only-adapter-draft-report.json"),
  checklist: join(dashboardRoot, "data", "generated", "read-only-adapter-contract-checklist.json"),
  stabilizationAudit: join(dashboardRoot, "data", "generated", "dashboard-stabilization-audit-report.json"),
  productionEntryGate: join(dashboardRoot, "data", "generated", "production-entry-gate-report.json"),
  productionAdapterSimulator: join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json"),
  dailySummary: join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json"),
  dailyChecklist: join(dashboardRoot, "data", "generated", "daily-operator-runbook-checklist.json"),
  app: join(dashboardRoot, "src", "app.js"),
  html: join(dashboardRoot, "index.html"),
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

const contractReport = await readJson(paths.contractReport);
const disabledDraftReport = await readJson(paths.disabledDraftReport);
const checklist = await readJson(paths.checklist);
const stabilizationAudit = await readJson(paths.stabilizationAudit);
const productionEntryGate = await readJson(paths.productionEntryGate);
const productionAdapterSimulator = await readJson(paths.productionAdapterSimulator);
const dailySummary = await readJson(paths.dailySummary);
const dailyChecklist = await readJson(paths.dailyChecklist);
const contractModule = await readText(paths.contractModule);
const disabledDraftModule = await readText(paths.disabledDraftModule);
const app = await readText(paths.app);
const html = await readText(paths.html);
const i18n = await readText(paths.i18n);
const quality = await readText(paths.quality);
const safety = await readText(paths.safety);
const launchScript = await readText(paths.launchScript);

for (const marker of [
  "buildReadOnlyAdapterContract",
  "validateReadOnlyAdapterContractShape",
  "buildAdapterContractReview",
  "buildForbiddenAdapterFieldPolicy",
  "buildReadOnlyAdapterContractCards"
]) {
  assert(contractModule.includes(marker), `Contract module missing ${marker}.`);
}

for (const marker of [
  "createDisabledReadOnlyProductionAdapter",
  "getDisabledReadOnlyAdapterStatus",
  "readDisabledAdapterSnapshot",
  "buildDisabledAdapterResponse",
  "assertAdapterDisabled"
]) {
  assert(disabledDraftModule.includes(marker), `Disabled draft module missing ${marker}.`);
}

for (const [field, expected] of Object.entries({
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false
})) {
  assert(contractReport[field] === expected, `Contract report ${field} must be ${expected}.`);
  assert(disabledDraftReport[field] === expected, `Disabled draft ${field} must be ${expected}.`);
  assert(checklist[field] === expected, `Checklist ${field} must be ${expected}.`);
}
assert(disabledDraftReport.dataReturned === false && checklist.dataReturned === false, "dataReturned must remain false.");
assert(contractReport.productionStatus === "no-go-for-production" && disabledDraftReport.productionStatus === "no-go-for-production", "Production must remain no-go.");
assert(["draft-only", "review-required", "blocked", "not-evaluated"].includes(contractReport.contractReviewStatus), "Contract status must be a safe enum.");
assert(disabledDraftReport.disabledAdapterDraftStatus === "disabled-by-default", "Disabled draft status must be disabled-by-default.");

for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
  assert(contractReport.blockedActions.includes(blocked), `Contract report must block ${blocked}.`);
  assert(disabledDraftReport.blockedActions.includes(blocked), `Disabled draft must block ${blocked}.`);
  assert(checklist.notAllowed.includes(blocked) || blocked === "auth-token-use" && checklist.notAllowed.includes("auth-token-use"), `Checklist must block ${blocked}.`);
}

const combinedGenerated = JSON.stringify({
  contractReport,
  disabledDraftReport,
  checklist,
  stabilizationAudit,
  productionEntryGate,
  productionAdapterSimulator,
  dailySummary,
  dailyChecklist
});
const unsafeGeneratedPatterns = [
  /productionReady"\s*:\s*true|adapterEnabled"\s*:\s*true|connected"\s*:\s*true|endpointConfigured"\s*:\s*true|authEnabled"\s*:\s*true|dataReturned"\s*:\s*true/i,
  /"source"\s*:\s*"(mock|gateway-stub)"[\s\S]{0,200}production/i,
  /[A-Za-z]:\\Users\\|\/home\//i,
  /sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-/i,
  /https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i
];
assert(!unsafeGeneratedPatterns.some((pattern) => pattern.test(combinedGenerated)), "Generated 25A reports must not include unsafe flags, paths, endpoints, or secret-like values.");

for (const forbidden of ["fetch(", "XMLHttpRequest", "WebSocket", "EventSource"]) {
  assert(!disabledDraftModule.includes(forbidden), `Disabled draft module must not include ${forbidden}.`);
}
assert(!/connectProductionGateway\s*\(|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(|deployProduction\s*\(|mutate/i.test(disabledDraftModule), "Disabled draft module must not expose unsafe actions.");

for (const marker of [
  "Read-only Adapter Contract Review",
  "Disabled Read-only Adapter Draft",
  "Dashboard Stabilization Audit",
  "Contract status",
  "Draft status",
  "Data returned",
  "No production connection is made",
  "read-only-adapter-contract-review-report.json",
  "disabled-read-only-adapter-draft-report.json",
  "dashboard-stabilization-audit-report.json",
  "Production Entry Gate",
  "Read-only Production Adapter Simulator",
  "Daily Operator Runbook"
]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
for (const marker of [
  "readOnlyAdapterContractReview",
  "disabledReadOnlyAdapterDraft",
  "dashboardStabilizationAudit",
  "readOnlyAdapterContractStatus",
  "disabledAdapterDraftStatus",
  "dataReturnedFalse"
]) {
  assert(i18n.includes(marker), `i18n marker missing: ${marker}.`);
}
for (const marker of [
  "read-only-adapter-contract.js?v=25A",
  "disabled-read-only-production-adapter.js?v=25A",
  "sprint-25a-read-only-adapter-contract-disabled-draft"
]) {
  assert(html.includes(marker), `Dashboard shell missing ${marker}.`);
}
for (const marker of [
  "generate-read-only-adapter-contract-review-report.mjs",
  "generate-disabled-read-only-adapter-draft-report.mjs",
  "generate-read-only-adapter-contract-checklist.mjs",
  "generate-dashboard-stabilization-audit-report.mjs",
  "test-read-only-adapter-contract-and-draft.mjs",
  "readOnlyAdapterContractReviewReport",
  "disabledReadOnlyAdapterDraftReport",
  "dashboardStabilizationAuditReport"
]) {
  assert(quality.includes(marker), `Quality gate missing ${marker}.`);
}
for (const marker of [
  "read-only-adapter-contract.js",
  "disabled-read-only-production-adapter.js",
  "generate-read-only-adapter-contract-review-report.mjs",
  "disabled-read-only-adapter-draft-report.json",
  "openclaw-dashboard-read-only-adapter-contract-review.md",
  "read-only-adapter-contract-safety-marker-invalid"
]) {
  assert(safety.includes(marker), `Safety scan missing ${marker}.`);
}

assert(productionEntryGate.readOnlyAdapterContractReviewReportPath === "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json", "Production entry gate must reference contract review.");
assert(productionEntryGate.disabledReadOnlyAdapterDraftReportPath === "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json", "Production entry gate must reference disabled draft.");
assert(productionAdapterSimulator.dataReturned === false, "Production adapter simulator report must keep dataReturned false.");
assert(dailySummary.dataReturned === false && dailyChecklist.dataReturned === false, "Daily reports must keep dataReturned false.");
assert(stabilizationAudit.productionReady === false && stabilizationAudit.productionStatus === "no-go-for-production", "Stabilization audit must preserve production no-go.");

const unsafeLaunchPatterns = [
  new RegExp(["\\.e", "nv\\b"].join(""), "i"),
  new RegExp(["Author", "ization"].join(""), "i"),
  new RegExp(["creden", "tials\\s*:\\s*[\"']include[\"']"].join(""), "i"),
  new RegExp(["Restart", "-Service|Stop", "-Service|Start", "-Service"].join(""), "i")
];
assert(!unsafeLaunchPatterns.some((pattern) => pattern.test(launchScript)), "Launch script must remain safe.");

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real reviewed-local-agent-health.json must not be tracked.");
const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(staged.stdout || "").trim(), "real reviewed-local-agent-health.json must not be staged.");

console.log("OpenClaw read-only adapter contract and draft tests passed.");
