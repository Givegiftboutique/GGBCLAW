import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
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
  return result;
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
  "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
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
const reviewedExample = await readJson("apps/dashboard/data/local/reviewed-local-agent-health.example.json");
const snapshot = await readJson("apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json");
const report = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
const checklist = await readJson("apps/dashboard/data/generated/operator-agent-health-checklist.json");

check(healthModule.classifyHeartbeat(null, sample.generatedAt) === "missing", "missing heartbeat must classify as missing.");
check(healthModule.evaluateLocalAgentHealth(sample).healthConnectionStatus === "local-file-only", "health evaluation must be local-file-only.");
check(healthModule.validateReviewedLocalAgentHealth(reviewedExample).valid === true, "reviewed local health example must validate.");
check(Array.isArray(snapshot.agents) && snapshot.agents.length === 1, "single-agent snapshot must have exactly 1 agent.");
check(sample.agentHealth?.[0]?.agentId === snapshot.agents?.[0]?.id, "sample health agent id must match single-agent snapshot.");
check(sample.productionStatus === "no-go-for-production" && sample.safetyMode === "read-only" && sample.mutationEnabled === false && sample.productionWiring === "disabled", "sample must keep safety markers.");

check(report.productionStatus === "no-go-for-production", "health report productionStatus must remain no-go-for-production.");
check(report.safetyMode === "read-only" && report.mutationEnabled === false && report.productionWiring === "disabled", "health report must keep safety flags.");
check(report.expectedRealAgentCount === 1 && report.actualRealAgentCount === 1, "health report must align to one real agent.");
check(report.operatorTruthSource === "local-ingest", "health report must use local-ingest operator truth source.");
check(report.operatorTruthSnapshot === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "health report must point to the single-agent snapshot.");
check(report.healthConnectionStatus === "local-file-only", "health report must be local-file-only.");
check(["local-file-only", "local-reviewed-json"].includes(report.healthSource), "health report source must be local-file-only or local-reviewed-json.");
check(["missing-fallback-to-sample", "valid", "invalid-review-required"].includes(report.reviewedInputStatus), "health report must include reviewed input status.");
check(["online", "stale", "unknown", "review-required"].includes(report.overallHealthStatus), "health status must be valid.");
check(report.agents?.length === 1 && report.agents[0].agentId === "local-orchestrator", "health report must include the local orchestrator only.");
check(!JSON.stringify(report).includes("gateway-stub") && !JSON.stringify(report).includes("\"source\":\"mock\""), "health report must not fallback to mock or gateway-stub.");
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
  check(report.blockedActions?.includes(blocked), `health report must block ${blocked}.`);
}

check(checklist.productionStatus === "no-go-for-production" && checklist.safetyMode === "read-only", "health checklist must keep production no-go and read-only.");
check(checklist.operatorRecommendedSource === "local-ingest", "health checklist must recommend local-ingest.");
check(checklist.operatorRecommendedData === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "health checklist must point to single-agent data.");
check(checklist.reviewedHealthInputPath === "apps/dashboard/data/local/reviewed-local-agent-health.json", "health checklist must include reviewed health input path.");
check(checklist.healthReportPath === "apps/dashboard/data/generated/local-real-agent-health-report.json", "health checklist must include report path.");
for (const marker of ["確認 reviewed-local-agent-health.json 由 operator 本地生成。", "確認 expectedAgentCount = 1。", "確認 source 是 local-reviewed-json 或 local-file-only。", "不可在 Dashboard restart / stop / start agent。"]) {
  check(checklist.operatorChecks?.includes(marker), `health checklist must include Chinese operator marker: ${marker}`);
}
check(checklist.notAllowed?.some((item) => item.includes("restart")), "health checklist must block restart.");
check(checklist.notAllowed?.some((item) => item.includes("production gateway")), "health checklist must block production gateway.");

const tempDir = join(tmpdir(), `openclaw-health-test-${Date.now()}`);
await mkdir(tempDir, { recursive: true });
const validReviewedPath = join(tempDir, "valid-reviewed-local-agent-health.json");
await writeFile(validReviewedPath, `${JSON.stringify({
  ...reviewedExample,
  reviewedAt: "2026-06-11T00:00:00.000Z",
  agents: [
    {
      ...reviewedExample.agents[0],
      status: "online",
      heartbeat: {
        status: "fresh",
        lastSeenAt: "2026-06-11T00:00:00.000Z",
        staleAfterSeconds: 300
      }
    }
  ]
}, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs", "--data", validReviewedPath]);
const validReviewedReport = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
check(validReviewedReport.healthSource === "local-reviewed-json", "valid reviewed JSON must set healthSource local-reviewed-json.");
check(validReviewedReport.reviewedInputStatus === "valid", "valid reviewed JSON must set reviewedInputStatus valid.");
check(validReviewedReport.agents?.length === 1 && validReviewedReport.agents[0].source === "local-reviewed-json", "valid reviewed JSON must produce one local-reviewed-json agent.");

function invalidReviewed(overrides = {}) {
  return {
    ...reviewedExample,
    ...overrides,
    agents: overrides.agents ?? reviewedExample.agents,
    safety: overrides.safety ?? reviewedExample.safety
  };
}

const invalidCases = [
  ["secret-like key", invalidReviewed({ agents: [{ ...reviewedExample.agents[0], apiKey: "SHOULD_NOT_PRINT_THIS_VALUE" }] }), "apiKey"],
  ["expectedAgentCount != 1", invalidReviewed({ expectedAgentCount: 2 }), "expectedAgentCount"],
  ["agents length != 1", invalidReviewed({ agents: [reviewedExample.agents[0], { ...reviewedExample.agents[0], agentId: "extra-agent" }] }), "agents"],
  ["productionReady true", invalidReviewed({ productionReady: true }), "productionReady"],
  ["remoteFetchUsed true", invalidReviewed({ safety: { ...reviewedExample.safety, remoteFetchUsed: true } }), "remoteFetchUsed"],
  ["restartAllowed true", invalidReviewed({ safety: { ...reviewedExample.safety, restartAllowed: true } }), "restartAllowed"],
  ["mutationAllowed true", invalidReviewed({ safety: { ...reviewedExample.safety, mutationAllowed: true } }), "mutationAllowed"],
  ["productionGatewayConnected true", invalidReviewed({ safety: { ...reviewedExample.safety, productionGatewayConnected: true } }), "productionGatewayConnected"]
];

for (const [label, payload, expectedKey] of invalidCases) {
  const invalidPath = join(tempDir, `${label.replaceAll(/[^a-z0-9]+/gi, "-")}.json`);
  await writeFile(invalidPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const result = runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs", "--data", invalidPath]);
  check(result.status === 0, `invalid reviewed JSON should produce safe report, not crash: ${label}`);
  const invalidReport = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
  check(invalidReport.healthSource === "local-file-only", `invalid reviewed JSON must fall back to local-file-only: ${label}`);
  check(invalidReport.reviewedInputStatus === "invalid-review-required", `invalid reviewed JSON must be review-required: ${label}`);
  check(invalidReport.overallHealthStatus === "review-required", `invalid reviewed JSON must set report review-required: ${label}`);
  check(invalidReport.validationErrors?.some((error) => error.key === expectedKey || error.path.includes(expectedKey)), `invalid reviewed JSON must report key/path only: ${expectedKey}`);
  check(!JSON.stringify(invalidReport).includes("SHOULD_NOT_PRINT_THIS_VALUE"), "secret-like values must not be printed into invalid report.");
}

await rm(tempDir, { recursive: true, force: true });
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"]);

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Local Real Agent Health / 本地真實 Agent 健康狀態",
  "Health source:",
  "local-reviewed-json",
  "reviewed-local-agent-health.json",
  "invalid reviewed local health input",
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
  "reviewed-local-agent-health.json",
  "local-reviewed-json",
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
  "reviewed-local-agent-health.example.json",
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
