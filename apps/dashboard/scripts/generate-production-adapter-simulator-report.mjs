import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const samplePath = join(dashboardRoot, "data", "production-simulator", "read-only-production-adapter.sample.json");
const productionEntryGateReportPath = join(dashboardRoot, "data", "generated", "production-entry-gate-report.json");
const dailySummaryReportPath = join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json");

const BLOCKED_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function readJson(path, fallback = {}) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function reportId(prefix) {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
}

function buildBlockers(sample, gateReport, dailySummary) {
  const blockers = [];
  if (sample.productionReady !== false) blockers.push("Sample productionReady must remain false.");
  if (sample.adapterEnabled !== false) blockers.push("Sample adapterEnabled must remain false.");
  if (sample.connected !== false) blockers.push("Sample connected must remain false.");
  if (sample.endpointConfigured !== false) blockers.push("Sample endpointConfigured must remain false.");
  if (sample.authEnabled !== false) blockers.push("Sample authEnabled must remain false.");
  if (sample.productionGatewayEnabled !== false) blockers.push("Sample productionGatewayEnabled must remain false.");
  if (sample.mutationEnabled !== false) blockers.push("Sample mutationEnabled must remain false.");
  if (sample.restartEnabled !== false) blockers.push("Sample restartEnabled must remain false.");
  if (sample.deployEnabled !== false) blockers.push("Sample deployEnabled must remain false.");
  if (sample.simulatorOnly !== true) blockers.push("Sample simulatorOnly must remain true.");
  if (gateReport.productionReady !== false) blockers.push("Production entry gate must keep productionReady false.");
  if (dailySummary.productionReady !== false) blockers.push("Daily summary must keep productionReady false.");
  if (sample.agentInventory?.source === "mock" || sample.agentInventory?.source === "gateway-stub") blockers.push("Fixture source cannot be production adapter source.");
  return blockers;
}

function classifyStatus(sample, blockers) {
  if (blockers.length > 0) return "blocked";
  if (sample.adapterEnabled === false && sample.connected === false && sample.endpointConfigured === false && sample.authEnabled === false) return "disabled";
  if (sample.simulatorOnly === true) return "simulator-only";
  return "not-configured";
}

const sample = await readJson(samplePath);
const gateReport = await readJson(productionEntryGateReportPath, { productionReady: false, gateStatus: "not-evaluated" });
const dailySummary = await readJson(dailySummaryReportPath, { productionReady: false, dailyStatus: "unknown" });
const adapterBlockers = buildBlockers(sample, gateReport, dailySummary);
const adapterStatus = classifyStatus(sample, adapterBlockers);

const report = {
  reportId: reportId("production-adapter-simulator"),
  generatedAt: new Date().toISOString(),
  scope: "read-only-production-adapter-simulator",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  simulatorOnly: true,
  safetyMode: "read-only",
  productionWiring: "disabled",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false,
  authEnabled: false,
  endpointConfigured: false,
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  dailySummaryReportPath: "apps/dashboard/data/generated/daily-operator-summary-report.json",
  adapterStatus,
  contractShape: {
    adapterName: "read-only-production-adapter-simulator",
    mode: "disabled-read-only-simulator",
    enabled: false,
    connected: false,
    endpointConfigured: false,
    authConfigured: false,
    credentialMode: "none",
    allowedMethods: ["GET"],
    mutationMethods: [],
    dataSource: "local-ingest-single-agent-snapshot",
    expectedRealAgentCount: 1,
    actualRealAgentCount: 1,
    productionSource: "disabled"
  },
  adapterBlockers,
  blockedActions: BLOCKED_ACTIONS,
  warnings: [
    "Simulator only, not production data.",
    "No production endpoint configured.",
    "No auth configured.",
    "No production connection is made."
  ],
  requiredFollowups: [
    "Keep simulator disabled until a future separate production adapter approval exists.",
    "Do not add endpoint, auth, credential, mutation, restart, or deploy behavior in Dashboard.",
    "Review production entry gate before any future adapter work."
  ],
  sourceUsePolicy: {
    productionSource: "disabled",
    mockGatewayStubAllowedAsProductionSource: false,
    localIngestSingleAgentOnlyForPlanning: true
  }
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw production adapter simulator report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
