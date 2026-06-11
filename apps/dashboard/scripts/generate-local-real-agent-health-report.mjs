import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const defaultHealthInputPath = join(dashboardRoot, "data", "local-agent-health", "local-agent-health.sample.json");
const singleAgentSnapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const outputPath = join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json");
const localAgentHealthModulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-agent-health.js");

function parseDataPath(argv) {
  const dataIndex = argv.indexOf("--data");
  return dataIndex >= 0 && argv[dataIndex + 1] ? resolve(repoRoot, argv[dataIndex + 1]) : defaultHealthInputPath;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadLocalAgentHealth() {
  const source = await readFile(localAgentHealthModulePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-agent-health.js" });
  return context.window.OpenClawLocalAgentHealth;
}

function countAgents(snapshot) {
  return Array.isArray(snapshot.agents) ? snapshot.agents.length : 0;
}

function normalizeRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

const inputPath = parseDataPath(process.argv.slice(2));
const warnings = [];
const requiredFollowups = [];

if (!await exists(singleAgentSnapshotPath)) {
  throw new Error("Single-agent operator truth snapshot is missing.");
}

const singleAgentSnapshot = await readJson(singleAgentSnapshotPath);
const actualRealAgentCount = countAgents(singleAgentSnapshot);
if (actualRealAgentCount !== 1) {
  throw new Error(`Single-agent operator truth snapshot must contain exactly 1 agent; found ${actualRealAgentCount}.`);
}

const healthInput = await readJson(inputPath);
const health = await loadLocalAgentHealth();
const evaluation = health.evaluateLocalAgentHealth(healthInput);
const snapshotAgent = singleAgentSnapshot.agents[0];
const snapshotAgentId = snapshotAgent?.id ?? "unknown-agent";
const healthAgentIds = evaluation.agents.map((agent) => agent.agentId);

if (!healthAgentIds.includes(snapshotAgentId)) {
  warnings.push(`Health input does not include the single real agent id ${snapshotAgentId}.`);
  requiredFollowups.push("Review the local health JSON and align it with the single-agent operator truth snapshot.");
}
if (evaluation.agents.some((agent) => agent.source === "mock" || agent.source === "gateway-stub")) {
  warnings.push("Local health report must not use mock or gateway-stub as health truth.");
  requiredFollowups.push("Replace fixture health input with local-readonly-health-snapshot records.");
}
if (evaluation.overallHealthStatus === "unknown" || evaluation.overallHealthStatus === "review-required") {
  requiredFollowups.push("Health requires local operator review; use the runbook, not dashboard restart actions.");
}
if (evaluation.overallHealthStatus === "stale") {
  requiredFollowups.push("Stale health must be investigated manually outside the dashboard.");
}

const report = {
  reportId: `local-real-agent-health-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "local-readonly-agent-health",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorTruthSource: "local-ingest",
  operatorTruthSnapshot: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: 1,
  actualRealAgentCount,
  healthSource: "local-readonly-health-snapshot",
  healthInput: normalizeRelative(inputPath),
  healthConnectionStatus: "local-file-only",
  overallHealthStatus: warnings.length ? "review-required" : evaluation.overallHealthStatus,
  agents: evaluation.agents,
  blockedActions: evaluation.blockedActions,
  warnings,
  requiredFollowups
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw local real agent health report generated.");
console.log(`Report: ${normalizeRelative(outputPath)}`);
