import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

const paths = {
  module: join(dashboardRoot, "src", "lib", "production-readiness", "production-adapter-simulator.js"),
  sample: join(dashboardRoot, "data", "production-simulator", "read-only-production-adapter.sample.json"),
  reportGenerator: join(dashboardRoot, "scripts", "generate-production-adapter-simulator-report.mjs"),
  checklistGenerator: join(dashboardRoot, "scripts", "generate-production-adapter-simulator-checklist.mjs"),
  test: join(dashboardRoot, "scripts", "test-production-adapter-simulator.mjs"),
  report: join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json"),
  checklist: join(dashboardRoot, "data", "generated", "production-adapter-simulator-checklist.json"),
  app: join(dashboardRoot, "src", "app.js"),
  i18n: join(dashboardRoot, "src", "lib", "i18n", "zh-hant.js"),
  quality: join(dashboardRoot, "scripts", "run-dashboard-quality-gates.mjs"),
  safety: join(dashboardRoot, "scripts", "safety-scan-dashboard.mjs"),
  launchScript: join(dashboardRoot, "scripts", "start-operator-dashboard.ps1"),
  entryGateReport: join(dashboardRoot, "data", "generated", "production-entry-gate-report.json"),
  dailySummary: join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json")
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
const sample = await readJson(paths.sample);
const entryGateReport = await readJson(paths.entryGateReport);
const dailySummary = await readJson(paths.dailySummary);
const app = await readText(paths.app);
const i18n = await readText(paths.i18n);
const quality = await readText(paths.quality);
const safety = await readText(paths.safety);
const moduleText = await readText(paths.module);
const launchScript = await readText(paths.launchScript);

assert(["disabled", "not-configured", "simulator-only", "blocked"].includes(report.adapterStatus), "adapterStatus must be valid.");
for (const [field, expected] of Object.entries({
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  productionGatewayEnabled: false,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false
})) {
  assert(report[field] === expected, `${field} must be ${expected}.`);
  assert(sample[field] === expected, `sample ${field} must be ${expected}.`);
}
assert(report.productionStatus === "no-go-for-production", "productionStatus must remain no-go-for-production.");
assert(report.simulatorOnly === true && sample.simulatorOnly === true, "simulatorOnly must be true.");
assert(report.contractShape?.productionSource === "disabled", "Contract shape must keep productionSource disabled.");
assert(report.contractShape?.actualRealAgentCount === 1, "Contract shape must keep one real agent.");
assert(entryGateReport.productionAdapterEnabled === false, "Production entry gate must reference disabled simulator.");
assert(dailySummary.productionAdapterEnabled === false, "Daily summary must reference disabled simulator.");
assert(!JSON.stringify(report).includes("\"mock\"") && !JSON.stringify(report).includes("\"gateway-stub\""), "Report must not use fixture source as production source.");

for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
  assert(report.blockedActions.includes(blocked), `Report must block ${blocked}.`);
  assert(checklist.notAllowed.includes(blocked) || blocked === "auth-token-use" && checklist.notAllowed.includes("auth-token-use"), `Checklist must block ${blocked}.`);
}

for (const marker of ["Read-only Production Adapter Simulator", "Adapter status", "Adapter enabled", "Connected", "Simulator only", "Endpoint configured", "Auth enabled", "This simulator does not connect to production."]) {
  assert(app.includes(marker), `UI simulator marker missing: ${marker}`);
}
for (const marker of ["productionAdapterSimulator", "productionAdapterSimulatorStatus", "adapterEnabledFalse", "connectedFalse", "simulatorOnlyTrue"]) {
  assert(i18n.includes(marker), `i18n simulator marker missing: ${marker}`);
}
for (const marker of ["generate-production-adapter-simulator-report.mjs", "generate-production-adapter-simulator-checklist.mjs", "test-production-adapter-simulator.mjs", "productionAdapterSimulatorReport", "productionAdapterSimulatorChecklist", "productionAdapterSimulatorTests"]) {
  assert(quality.includes(marker), `Quality gate missing ${marker}.`);
}
for (const marker of ["production-adapter-simulator.js", "read-only-production-adapter.sample.json", "generate-production-adapter-simulator-report.mjs", "production-adapter-simulator-report.json", "openclaw-dashboard-production-adapter-simulator.md"]) {
  assert(safety.includes(marker), `Safety scan missing ${marker}.`);
}
for (const marker of ["buildProductionAdapterSimulatorPolicy", "buildProductionAdapterContractShape", "classifyProductionAdapterSimulatorStatus", "buildProductionAdapterSimulatorBlockers", "buildProductionAdapterSimulatorCards"]) {
  assert(moduleText.includes(marker), `Module missing ${marker}.`);
}

assert(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(moduleText), "Simulator module must not fetch.");
assert(!/restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(|connectProductionGateway\s*\(|mutate|deployProduction/i.test(moduleText), "Simulator module must not expose unsafe actions.");
assert(!/productionReady"\s*:\s*true|adapterEnabled"\s*:\s*true|connected"\s*:\s*true|endpointConfigured"\s*:\s*true|authEnabled"\s*:\s*true/i.test(JSON.stringify({ report, checklist, sample })), "Simulator outputs must not enable production fields.");
const unsafeLaunchPatterns = [
  new RegExp(["\\.e", "nv\\b"].join(""), "i"),
  new RegExp(["Author", "ization"].join(""), "i"),
  new RegExp(["creden", "tials\\s*:\\s*[\"']include[\"']"].join(""), "i"),
  new RegExp(["Restart", "-Service|Stop", "-Service|Start", "-Service"].join(""), "i")
];
assert(!unsafeLaunchPatterns.some((pattern) => pattern.test(launchScript)), "Launch script must remain safe.");

const combined = JSON.stringify({ report, checklist, sample });
const unsafeGeneratedPatterns = [
  /[A-Za-z]:\\Users\\|\/home\//i,
  /sk-[A-Za-z0-9_-]{8,}/i,
  new RegExp(["Bea", "rer\\s+[A-Za-z0-9._-]+"].join(""), "i"),
  /ghp_[A-Za-z0-9_]{8,}/i,
  /xox[baprs]-/i,
  /https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i
];
assert(!unsafeGeneratedPatterns.some((pattern) => pattern.test(combined)), "Simulator reports must not contain paths, endpoints, or secret-like raw values.");

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real reviewed-local-agent-health.json must not be tracked.");
const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(staged.stdout || "").trim(), "real reviewed-local-agent-health.json must not be staged.");

console.log("OpenClaw production adapter simulator tests passed.");
