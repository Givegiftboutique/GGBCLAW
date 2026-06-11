import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const simulatorReportPath = join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json");
const productionEntryGateReportPath = join(dashboardRoot, "data", "generated", "production-entry-gate-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json");

const allowedFields = [
  "schemaVersion",
  "generatedAt",
  "scope",
  "adapterName",
  "adapterEnabled",
  "connected",
  "productionReady",
  "productionStatus",
  "simulatorOnly",
  "safetyMode",
  "mutationEnabled",
  "restartEnabled",
  "productionGatewayEnabled",
  "deployEnabled",
  "authEnabled",
  "endpointConfigured",
  "expectedRealAgentCount",
  "actualRealAgentCount",
  "source",
  "adapterStatus",
  "contractShape",
  "blockedActions",
  "warnings",
  "requiredFollowups"
];

const forbiddenFields = [
  "endpoint",
  "productionEndpoint",
  "url",
  "host",
  "hostname",
  "Authorization",
  "authorization",
  "token",
  "cookie",
  "password",
  "secret",
  "apiKey",
  "privateKey",
  "credentials",
  "session",
  "webhook",
  "email",
  "phone",
  "mutationUrl",
  "restartUrl",
  "deployUrl"
];

const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function reportId(prefix) {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
}

function hasUnsafeFlags(report) {
  if (!report) return true;
  return [
    "productionReady",
    "adapterEnabled",
    "connected",
    "endpointConfigured",
    "authEnabled",
    "mutationEnabled",
    "restartEnabled",
    "productionGatewayEnabled",
    "deployEnabled"
  ].some((field) => report[field] !== false);
}

const simulatorReport = await readJson(simulatorReportPath);
const productionEntryGateReport = await readJson(productionEntryGateReportPath);
const warnings = [];
if (!simulatorReport) warnings.push("Production adapter simulator report is missing; contract review is not evaluated.");
if (!productionEntryGateReport) warnings.push("Production entry gate report is missing; contract review is not evaluated.");
if (hasUnsafeFlags(simulatorReport)) warnings.push("Simulator report must keep all adapter and production flags disabled.");
if (productionEntryGateReport?.productionReady !== false) warnings.push("Production entry gate must keep productionReady false.");

const contractReviewStatus = !simulatorReport || !productionEntryGateReport
  ? "not-evaluated"
  : warnings.length
    ? "blocked"
    : "draft-only";

const report = {
  reportId: reportId("read-only-adapter-contract-review"),
  generatedAt: new Date().toISOString(),
  scope: "read-only-adapter-contract-review",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  simulatorOnly: true,
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false,
  contractReviewStatus,
  readOnlyAdapterContractStatus: contractReviewStatus,
  allowedFields,
  forbiddenFields,
  contractShape: {
    schemaVersion: "read-only-adapter-contract.v1",
    adapterName: "disabled-read-only-production-adapter-draft",
    mode: "disabled-draft",
    allowedMethods: ["GET"],
    mutationMethods: [],
    returnsData: false,
    expectedRealAgentCount: 1,
    actualRealAgentCount: 1,
    source: "local-ingest-single-agent-snapshot",
    requiresSeparateApproval: true
  },
  productionAdapterSimulatorReportPath: "apps/dashboard/data/generated/production-adapter-simulator-report.json",
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  blockedActions,
  warnings,
  requiredFollowups: [
    "Keep the adapter contract draft-only until a separate future adapter approval exists.",
    "Do not add endpoint, auth, credential, mutation, restart, deploy, or production connection behavior.",
    "Manual security design is required outside Dashboard before any real adapter implementation."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw read-only adapter contract review report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
