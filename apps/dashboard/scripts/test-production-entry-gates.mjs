import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

const paths = {
  module: join(dashboardRoot, "src", "lib", "production-readiness", "production-entry-gates.js"),
  reportGenerator: join(dashboardRoot, "scripts", "generate-production-entry-gate-report.mjs"),
  checklistGenerator: join(dashboardRoot, "scripts", "generate-production-entry-gate-checklist.mjs"),
  test: join(dashboardRoot, "scripts", "test-production-entry-gates.mjs"),
  report: join(dashboardRoot, "data", "generated", "production-entry-gate-report.json"),
  checklist: join(dashboardRoot, "data", "generated", "production-entry-gate-checklist.json"),
  app: join(dashboardRoot, "src", "app.js"),
  i18n: join(dashboardRoot, "src", "lib", "i18n", "zh-hant.js"),
  quality: join(dashboardRoot, "scripts", "run-dashboard-quality-gates.mjs"),
  safety: join(dashboardRoot, "scripts", "safety-scan-dashboard.mjs"),
  launchScript: join(dashboardRoot, "scripts", "start-operator-dashboard.ps1")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readText(path) {
  return readFile(path, "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

for (const [label, path] of Object.entries(paths)) {
  await readText(path).catch(() => {
    throw new Error(`${label} missing: ${path}`);
  });
}

const report = await readJson(paths.report);
const checklist = await readJson(paths.checklist);
const app = await readText(paths.app);
const i18n = await readText(paths.i18n);
const quality = await readText(paths.quality);
const safety = await readText(paths.safety);
const moduleText = await readText(paths.module);
const launchScript = await readText(paths.launchScript);

assert(["blocked", "review-required", "local-only-ready", "not-evaluated"].includes(report.gateStatus), "gateStatus must be valid.");
assert(report.productionReady === false, "productionReady must be false.");
assert(report.productionStatus === "no-go-for-production", "productionStatus must remain no-go-for-production.");
assert(report.productionGatewayEnabled === false, "productionGatewayEnabled must be false.");
assert(report.mutationEnabled === false, "mutationEnabled must be false.");
assert(report.restartEnabled === false, "restartEnabled must be false.");
assert(report.productionWiring === "disabled", "productionWiring must be disabled.");
assert(report.expectedRealAgentCount === 1, "expected real agent count must be 1.");
assert(report.actualRealAgentCount === 1, "actual real agent count must be 1.");
assert(report.operatorRecommendedSource === "local-ingest", "Production entry readiness must use local-ingest.");
assert(!["mock", "gateway-stub"].includes(report.operatorRecommendedSource), "Must not use fixture source as production readiness source.");

for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
  assert(report.blockedActions.includes(blocked), `Report must block ${blocked}.`);
  assert(checklist.notAllowed.includes(blocked) || blocked === "auth-token-use" && checklist.notAllowed.includes("auth-token-use"), `Checklist must block ${blocked}.`);
}

for (const marker of ["Production Entry Gate", "Gate status", "Production ready", "production-entry-gate-report.json", "production-entry-gate-checklist.json", "Manual approval required"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
for (const marker of ["Production Entry Gate", "Production 進場門檻", "productionReadyFalse", "manualApprovalRequired"]) {
  assert(i18n.includes(marker), `i18n marker missing: ${marker}`);
}
for (const marker of ["generate-production-entry-gate-report.mjs", "generate-production-entry-gate-checklist.mjs", "test-production-entry-gates.mjs", "productionEntryGateReport", "productionEntryGateChecklist", "productionEntryGateTests"]) {
  assert(quality.includes(marker), `Quality gate missing ${marker}.`);
}
for (const marker of ["production-entry-gates.js", "generate-production-entry-gate-report.mjs", "production-entry-gate-report.json", "openclaw-dashboard-production-entry-gate-hardening.md"]) {
  assert(safety.includes(marker), `Safety scan missing ${marker}.`);
}
for (const marker of ["buildProductionEntryGateStatus", "classifyProductionEntryGate", "buildProductionBlockers", "buildProductionPreflightChecklist", "buildProductionGateCards"]) {
  assert(moduleText.includes(marker), `Module missing ${marker}.`);
}

assert(!/productionReady"\s*:\s*true|production-ready current|production gateway connected/i.test(JSON.stringify(report)), "Report must not claim production ready or connected.");
assert(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(moduleText), "Production entry module must not fetch.");
assert(!/restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(|connectProductionGateway\s*\(|mutate/i.test(moduleText), "Production entry module must not expose unsafe actions.");
const unsafeLaunchPatterns = [
  new RegExp(["\\.e", "nv\\b"].join(""), "i"),
  new RegExp(["Author", "ization"].join(""), "i"),
  new RegExp(["creden", "tials\\s*:\\s*[\"']include[\"']"].join(""), "i"),
  new RegExp(["Restart", "-Service|Stop", "-Service|Start", "-Service"].join(""), "i")
];
assert(!unsafeLaunchPatterns.some((pattern) => pattern.test(launchScript)), "Launch script must remain safe.");

const combined = JSON.stringify({ report, checklist });
const unsafeGeneratedPatterns = [
  /[A-Za-z]:\\Users\\|\/home\//i,
  /(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/i,
  new RegExp(["Bea", "rer\\s+[A-Za-z0-9._-]+"].join(""), "i"),
  /ghp_[A-Za-z0-9_]{8,}/i,
  /xox[baprs]-/i
];
assert(!unsafeGeneratedPatterns.some((pattern) => pattern.test(combined)), "Generated production entry reports must not contain paths or secret-like raw values.");

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real reviewed-local-agent-health.json must not be tracked.");
const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(staged.stdout || "").trim(), "real reviewed-local-agent-health.json must not be staged.");

console.log("OpenClaw production entry gate tests passed.");
