import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function exists(relativePath) {
  try {
    await stat(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function runNode(args) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`node ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

async function loadSourceLockdown() {
  const source = await readText("apps/dashboard/src/lib/data-trust/source-lockdown.js");
  const context = { window: {}, URLSearchParams };
  vm.runInNewContext(source, context, { filename: "source-lockdown.js" });
  return context.window.OpenClawSourceLockdown;
}

for (const file of [
  "apps/dashboard/src/lib/data-trust/source-lockdown.js",
  "apps/dashboard/src/lib/data-trust/source-lockdown.ts",
  "apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs",
  "apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs",
  "apps/dashboard/scripts/test-operator-source-lockdown.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/operator-source-lockdown-report.json",
  "apps/dashboard/data/generated/operator-source-selection-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const lockdown = await loadSourceLockdown();
const policy = lockdown.SOURCE_LOCKDOWN_POLICY;
const mock = lockdown.getSourceLockdownRule("mock");
const gatewayStub = lockdown.getSourceLockdownRule("gateway-stub");
const localIngest = lockdown.getSourceLockdownRule("local-ingest");
const json = lockdown.getSourceLockdownRule("json");
const artifact = lockdown.getSourceLockdownRule("artifact");
const devGateway = lockdown.getSourceLockdownRule("dev-gateway");
const defaultNotice = lockdown.getDefaultEntryNotice("");
const report = await readJson("apps/dashboard/data/generated/operator-source-lockdown-report.json");
const checklist = await readJson("apps/dashboard/data/generated/operator-source-selection-checklist.json");
const singleAgentSnapshot = await readJson("apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json");

check(policy.operatorRecommendedSource === "local-ingest", "operator recommended source must be local-ingest.");
check(policy.operatorRecommendedData === "./data/generated/real-local-dashboard-export.single-agent.generated.json", "recommended data must be single-agent snapshot.");
check(policy.defaultEntryBehavior === "operator-safe-notice", "default entry behavior must be operator-safe-notice.");
check(policy.productionStatus === "no-go-for-production", "production status must remain no-go-for-production.");
check(policy.mutationEnabled === false && policy.productionWiring === "disabled" && policy.safetyMode === "read-only", "policy safety flags must remain read-only.");
check(localIngest.operatorRecommended === true && localIngest.defaultAllowed === true && localIngest.expectedAgentCount === 1, "local-ingest must be recommended with expected count 1.");
check(mock.requiresDemoAcknowledgement === true && mock.defaultAllowed === false && mock.warningLevel === "high", "mock must require demo acknowledgement and defaultAllowed false.");
check(gatewayStub.requiresDemoAcknowledgement === true && gatewayStub.defaultAllowed === false && gatewayStub.warningLevel === "high", "gateway-stub must require demo acknowledgement and defaultAllowed false.");
check(mock.operatorTruth === false && gatewayStub.operatorTruth === false, "fixture sources must not be operator truth.");
check(json.requiresReview === true && artifact.requiresReview === true, "json and artifact must require review.");
check(devGateway.devOnly === true && devGateway.operatorTruth === false, "dev-gateway must remain dev-only and not operator truth.");
check(defaultNotice.showOperatorSafeNotice === true && defaultNotice.warningLevel === "high", "no-query default must show operator-safe notice.");

check(Array.isArray(singleAgentSnapshot.agents) && singleAgentSnapshot.agents.length === 1, "single-agent snapshot must contain exactly 1 agent.");
check(report.operatorRecommendedSource === "local-ingest", "report recommended source must be local-ingest.");
check(report.operatorRecommendedData === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "report recommended data must be single-agent snapshot.");
check(report.expectedRealAgentCount === 1 && report.actualSingleAgentCount === 1, "report must expect and find 1 real agent.");
check(report.lockdownStatus === "pass", "operator source lockdown report must pass.");
check(report.fixtureSources?.some((source) => source.source === "mock" && source.requiresDemoAcknowledgement === true && source.defaultAllowed === false), "report must lock down mock.");
check(report.fixtureSources?.some((source) => source.source === "gateway-stub" && source.requiresDemoAcknowledgement === true && source.defaultAllowed === false), "report must lock down gateway-stub.");
check(checklist.operatorRecommendedUrl.includes("?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json"), "checklist must include recommended operator URL.");
check(checklist.fixtureSourceWarnings?.some((item) => item.includes("8-agent")), "checklist must warn that 8-agent views are fixtures.");

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Operator recommended source / Operator 建議資料來源",
  "local-ingest single-agent snapshot",
  "?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
  "High warning: Demo fixture data only.",
  "High warning: Contract fixture data only.",
  "Operator truth candidate loaded.",
  "You are viewing demo fixture data, not real agents.",
  "showOperatorSafeNotice"
]) {
  check(app.includes(marker), `UI must contain source lockdown marker: ${marker}`);
}

for (const file of [
  "docs/dashboard/openclaw-dashboard-operator-source-selection.md",
  "docs/dashboard/openclaw-dashboard-source-lockdown.md"
]) {
  check(await exists(file), `${file} must exist.`);
}
const docsText = [
  await readText("docs/dashboard/openclaw-dashboard-operator-source-selection.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-source-lockdown.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-operator-runbook.md").catch(() => ""),
  await readText("apps/dashboard/README.md").catch(() => "")
].join("\n");
for (const marker of [
  "operator source selection lockdown",
  "recommended operator URL",
  "mock/gateway-stub high warning",
  "single-agent truth candidate",
  "production still no-go"
]) {
  check(docsText.includes(marker), `docs must contain marker: ${marker}`);
}

const qualityGate = await readText("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
for (const marker of [
  "generate-operator-source-lockdown-report.mjs",
  "generate-operator-source-selection-checklist.mjs",
  "test-operator-source-lockdown.mjs",
  "operatorSourceLockdownReport",
  "operatorSourceSelectionChecklist",
  "operatorSourceLockdownTests"
]) {
  check(qualityGate.includes(marker), `quality gate must reference ${marker}.`);
}

const safetyScan = await readText("apps/dashboard/scripts/safety-scan-dashboard.mjs");
for (const marker of [
  "source-lockdown.js",
  "operator-source-lockdown-report.json",
  "operator-source-selection-checklist.json",
  "mock-default-operator-truth-violation",
  "gateway-stub-default-operator-truth-violation"
]) {
  check(safetyScan.includes(marker), `safety scan must reference ${marker}.`);
}

for (const sourceMode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  check(app.includes(sourceMode) || safetyScan.includes(sourceMode), `source mode must remain present: ${sourceMode}`);
}
for (const route of ["/dashboard", "/dashboard/agents", "/dashboard/tasks", "/dashboard/reviews", "/dashboard/logs", "/dashboard/backups", "/dashboard/settings", "/dashboard/rbac", "/dashboard/help", "/dashboard/observability"]) {
  check(app.includes(route), `route must remain present: ${route}`);
}

const generatedReportsText = JSON.stringify({ report, checklist });
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedReportsText), "source lockdown reports must not contain absolute machine paths.");
check(!/(password|api[_-]?key|private[_-]?key)\s*[:=]/i.test(generatedReportsText), "source lockdown reports must not contain secret-like assignments.");
check(!/\bAuthorization\s*:|credentials\s*:\s*["']include["']|document\.cookie|localStorage|sessionStorage|token\s*[:=]|cookie\s*[:=]/i.test(generatedReportsText), "source lockdown reports must not contain auth/token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedReportsText.replace(/\s+/g, "")), "source lockdown reports must not enable mutation or deploy.");
check(!/production-ready/i.test(generatedReportsText), "source lockdown reports must not mark production ready.");

if (failures.length) {
  console.error("OpenClaw operator source lockdown tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw operator source lockdown tests passed.");
