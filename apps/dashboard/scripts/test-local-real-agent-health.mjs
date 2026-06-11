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

async function loadHealthModule() {
  const source = await readText("apps/dashboard/src/lib/agent-health/local-agent-health.js");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-agent-health.js" });
  return context.window.OpenClawLocalAgentHealth;
}

for (const file of [
  "apps/dashboard/src/lib/agent-health/local-agent-health.js",
  "apps/dashboard/src/lib/agent-health/local-agent-health.ts",
  "apps/dashboard/data/local-agent-health/local-agent-health.sample.json",
  "apps/dashboard/scripts/generate-local-real-agent-health-report.mjs",
  "apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs",
  "apps/dashboard/scripts/test-local-real-agent-health.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/local-real-agent-health-report.json",
  "apps/dashboard/data/generated/operator-agent-health-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const healthModule = await loadHealthModule();
const sample = await readJson("apps/dashboard/data/local-agent-health/local-agent-health.sample.json");
const snapshot = await readJson("apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json");
const report = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
const checklist = await readJson("apps/dashboard/data/generated/operator-agent-health-checklist.json");

check(healthModule.classifyHeartbeat(null, sample.generatedAt) === "missing", "missing heartbeat must classify as missing.");
check(healthModule.evaluateLocalAgentHealth(sample).healthConnectionStatus === "local-file-only", "health evaluation must be local-file-only.");
check(Array.isArray(snapshot.agents) && snapshot.agents.length === 1, "single-agent snapshot must have exactly 1 agent.");
check(sample.agentHealth?.[0]?.agentId === snapshot.agents?.[0]?.id, "sample health agent id must match single-agent snapshot.");
check(sample.productionStatus === "no-go-for-production" && sample.safetyMode === "read-only" && sample.mutationEnabled === false && sample.productionWiring === "disabled", "sample must keep safety markers.");

check(report.productionStatus === "no-go-for-production", "health report productionStatus must remain no-go-for-production.");
check(report.safetyMode === "read-only" && report.mutationEnabled === false && report.productionWiring === "disabled", "health report must keep safety flags.");
check(report.expectedRealAgentCount === 1 && report.actualRealAgentCount === 1, "health report must align to one real agent.");
check(report.operatorTruthSource === "local-ingest", "health report must use local-ingest operator truth source.");
check(report.operatorTruthSnapshot === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "health report must point to the single-agent snapshot.");
check(report.healthConnectionStatus === "local-file-only", "health report must be local-file-only.");
check(report.healthSource === "local-readonly-health-snapshot", "health report source must be local-readonly-health-snapshot.");
check(["online", "stale", "unknown", "review-required"].includes(report.overallHealthStatus), "health status must be valid.");
check(report.agents?.length === 1 && report.agents[0].agentId === "local-orchestrator", "health report must include the local orchestrator only.");
check(!JSON.stringify(report).includes("gateway-stub") && !JSON.stringify(report).includes("\"source\":\"mock\""), "health report must not fallback to mock or gateway-stub.");
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
  check(report.blockedActions?.includes(blocked), `health report must block ${blocked}.`);
}

check(checklist.productionStatus === "no-go-for-production" && checklist.safetyMode === "read-only", "health checklist must keep production no-go and read-only.");
check(checklist.operatorRecommendedSource === "local-ingest", "health checklist must recommend local-ingest.");
check(checklist.operatorRecommendedData === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "health checklist must point to single-agent data.");
check(checklist.healthReportPath === "apps/dashboard/data/generated/local-real-agent-health-report.json", "health checklist must include report path.");
check(checklist.notAllowed?.some((item) => item.includes("restart")), "health checklist must block restart.");
check(checklist.notAllowed?.some((item) => item.includes("production gateway")), "health checklist must block production gateway.");

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Local Real Agent Health / 本地真實 Agent 健康狀態",
  "Health source: local-file-only",
  "Operator truth source: local-ingest single-agent snapshot",
  "Expected real agent count: 1",
  "Actual real agent count: 1",
  "No restart action available",
  "No production gateway connection",
  "No mutation action",
  "Local health report not loaded.",
  "Health requires local operator review."
]) {
  check(app.includes(marker), `UI must contain local health marker: ${marker}`);
}

const docs = [
  await readText("docs/dashboard/openclaw-dashboard-local-agent-health.md").catch(() => ""),
  await readText("apps/dashboard/README.md").catch(() => ""),
  await readText("docs/dashboard/README.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-operator-runbook.md").catch(() => "")
].join("\n");
for (const marker of [
  "local real agent health",
  "local-file-only",
  "expected real agent count = 1",
  "no restart",
  "production still no-go"
]) {
  check(docs.includes(marker), `docs must contain marker: ${marker}`);
}

const qualityGate = await readText("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
for (const marker of [
  "generate-local-real-agent-health-report.mjs",
  "generate-operator-agent-health-checklist.mjs",
  "test-local-real-agent-health.mjs",
  "localRealAgentHealthReport",
  "operatorAgentHealthChecklist",
  "localRealAgentHealthTests"
]) {
  check(qualityGate.includes(marker), `quality gate must reference ${marker}.`);
}

const safetyScan = await readText("apps/dashboard/scripts/safety-scan-dashboard.mjs");
for (const marker of [
  "local-agent-health.js",
  "local-agent-health.sample.json",
  "local-real-agent-health-report.json",
  "operator-agent-health-checklist.json",
  "restart-agent-enabled",
  "mock-health-truth"
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
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedReportsText), "health reports must not contain absolute machine paths.");
check(!/(password|api[_-]?key|private[_-]?key)\s*[:=]/i.test(generatedReportsText), "health reports must not contain secret-like assignments.");
check(!/\bAuthorization\s*:|credentials\s*:\s*["']include["']|document\.cookie|localStorage|sessionStorage|token\s*[:=]|cookie\s*[:=]/i.test(generatedReportsText), "health reports must not contain auth/token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedReportsText.replace(/\s+/g, "")), "health reports must not enable mutation or deploy.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedReportsText), "health reports must not contain production endpoints.");

if (failures.length) {
  console.error("OpenClaw local real agent health tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw local real agent health tests passed.");
