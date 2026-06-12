import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json");
const snapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const healthReportPath = join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json");
const evidenceReportPath = join(dashboardRoot, "data", "generated", "local-health-evidence-review-report.json");
const reviewedHealthDryRunReportPath = join(dashboardRoot, "data", "generated", "reviewed-local-health-input-dry-run-report.json");
const productionEntryGateReportPath = join(dashboardRoot, "data", "generated", "production-entry-gate-report.json");
const productionAdapterSimulatorReportPath = join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json");
const readOnlyAdapterContractReviewReportPath = join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json");
const disabledReadOnlyAdapterDraftReportPath = join(dashboardRoot, "data", "generated", "disabled-read-only-adapter-draft-report.json");
const dashboardStabilizationAuditReportPath = join(dashboardRoot, "data", "generated", "dashboard-stabilization-audit-report.json");
const localTaskInboxReportPath = join(dashboardRoot, "data", "generated", "local-task-inbox-report.json");
const whatsappTaskVisibilityChecklistPath = join(dashboardRoot, "data", "generated", "whatsapp-task-visibility-checklist.json");
const hourlyRefreshPolicyReportPath = join(dashboardRoot, "data", "generated", "hourly-refresh-policy-report.json");
const providerBalanceCenterReportPath = join(dashboardRoot, "data", "generated", "provider-balance-center-report.json");
const localOpenClawConnectorReportPath = join(dashboardRoot, "data", "generated", "local-openclaw-connector-report.json");
const localOpenClawActivationReportPath = join(dashboardRoot, "data", "generated", "local-openclaw-activation-report.json");
const localOpenClawExportBridgeReportPath = join(dashboardRoot, "data", "generated", "openclaw-local-export-bridge-report.json");

const BLOCKED_ACTIONS = [
  "restart-agent",
  "stop-agent",
  "start-agent",
  "production-gateway-connect",
  "mutation",
  "deploy",
  "auth-token-use"
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function classifyDailyStatus(input) {
  if (input.source === "mock" || input.source === "gateway-stub" || input.fixtureAgentCount === 8 && input.source !== "local-ingest") {
    return "fixture-mode";
  }
  if (
    input.actualRealAgentCount !== 1
    || input.productionStatus !== "no-go-for-production"
    || input.mutationEnabled !== false
    || input.restartEnabled === true
    || input.productionGatewayEnabled === true
    || input.rawValuesPrinted === true
    || input.redactionApplied === false
  ) {
    return "blocked";
  }
  if (input.source !== "local-ingest") return "unknown";
  if (
    ["unknown", "stale", "review-required"].includes(input.healthStatus)
    || ["missing-fallback", "sample-fallback", "reviewed-invalid-fallback", "review-required"].includes(input.evidenceStatus)
    || input.fallbackUsed === true
    || input.reviewedInputStatus === "missing-fallback-to-sample"
    || input.reviewedInputStatus === "invalid-review-required"
    || input.reviewedHealthInputReadiness === "missing-local-input"
    || input.reviewedHealthInputReadiness === "invalid-fallback-required"
    || input.reviewedHealthInputReadiness === "unsafe-rejected"
  ) {
    return "review-required";
  }
  return "ok";
}

function buildStatusReasons(input, dailyStatus) {
  if (dailyStatus === "fixture-mode") {
    return ["Current source is fixture/demo data and not daily operator truth."];
  }
  if (dailyStatus === "blocked") {
    return [
      input.actualRealAgentCount !== 1 ? "Actual real agent count is not 1." : null,
      input.productionStatus !== "no-go-for-production" ? "Production status is not no-go-for-production." : null,
      input.mutationEnabled !== false ? "Mutation is not disabled." : null,
      input.restartEnabled === true ? "Restart is enabled." : null,
      input.productionGatewayEnabled === true ? "Production gateway is enabled." : null,
      input.rawValuesPrinted === true ? "Raw reviewed health values were printed." : null,
      input.redactionApplied === false ? "Evidence redaction is not applied." : null
    ].filter(Boolean);
  }
  if (dailyStatus === "review-required") {
    return [
      ["unknown", "stale", "review-required"].includes(input.healthStatus) ? "Health needs local operator review." : null,
      input.fallbackUsed === true ? "Evidence fallback is active." : null,
      input.reviewedInputStatus === "missing-fallback-to-sample" ? "Reviewed local health JSON is missing; safe sample fallback is active." : null,
      input.evidenceStatus === "missing-fallback" ? "Evidence status is missing-fallback." : null,
      input.reviewedHealthInputReadiness === "missing-local-input" ? "Reviewed health input assistant reports missing-local-input; template copy is needed." : null,
      input.reviewedHealthInputReadiness === "invalid-fallback-required" ? "Reviewed health input dry-run needs operator edit." : null,
      input.reviewedHealthInputReadiness === "unsafe-rejected" ? "Reviewed health input dry-run rejected unsafe fields." : null
    ].filter(Boolean);
  }
  if (dailyStatus === "ok") {
    return ["Single-agent local-ingest source and read-only guardrails are aligned."];
  }
  return ["Cannot classify daily operator status safely."];
}

function buildSafeNextSteps(dailyStatus) {
  if (dailyStatus === "fixture-mode") {
    return [
      "Open recommended operator view.",
      "Treat 8 agents as fixture/demo data only.",
      "Do not use mock or gateway-stub as daily operator truth."
    ];
  }
  if (dailyStatus === "blocked") {
    return [
      "Stop daily interpretation and review blockers.",
      "Confirm production remains no-go-for-production.",
      "Do not restart, mutate, deploy, or connect production gateway."
    ];
  }
  return [
    "Open recommended operator view.",
    "Review local health checklist.",
    "Review evidence checklist.",
    "Copy reviewed-local-agent-health.template.json if reviewed local input is missing.",
    "Run reviewed local health input dry-run validator.",
    "Do not commit the real reviewed-local-agent-health.json file.",
    "Check reviewed-local-agent-health.example.json.",
    "Read troubleshooting guide."
  ];
}

const snapshot = await readJson(snapshotPath);
const healthReport = await readJson(healthReportPath);
const evidenceReport = await readJson(evidenceReportPath);
let dryRunReport = null;
try {
  dryRunReport = await readJson(reviewedHealthDryRunReportPath);
} catch {
  dryRunReport = null;
}
let productionGateReport = null;
try {
  productionGateReport = await readJson(productionEntryGateReportPath);
} catch {
  productionGateReport = null;
}
let productionAdapterSimulatorReport = null;
try {
  productionAdapterSimulatorReport = await readJson(productionAdapterSimulatorReportPath);
} catch {
  productionAdapterSimulatorReport = null;
}
let contractReviewReport = null;
try {
  contractReviewReport = await readJson(readOnlyAdapterContractReviewReportPath);
} catch {
  contractReviewReport = null;
}
let disabledDraftReport = null;
try {
  disabledDraftReport = await readJson(disabledReadOnlyAdapterDraftReportPath);
} catch {
  disabledDraftReport = null;
}
let localTaskInboxReport = null;
try {
  localTaskInboxReport = await readJson(localTaskInboxReportPath);
} catch {
  localTaskInboxReport = null;
}
let whatsappTaskVisibilityChecklist = null;
try {
  whatsappTaskVisibilityChecklist = await readJson(whatsappTaskVisibilityChecklistPath);
} catch {
  whatsappTaskVisibilityChecklist = null;
}
let hourlyRefreshPolicyReport = null;
try {
  hourlyRefreshPolicyReport = await readJson(hourlyRefreshPolicyReportPath);
} catch {
  hourlyRefreshPolicyReport = null;
}
let providerBalanceCenterReport = null;
try {
  providerBalanceCenterReport = await readJson(providerBalanceCenterReportPath);
} catch {
  providerBalanceCenterReport = null;
}
let localOpenClawConnectorReport = null;
try {
  localOpenClawConnectorReport = await readJson(localOpenClawConnectorReportPath);
} catch {
  localOpenClawConnectorReport = null;
}
let localOpenClawActivationReport = null;
try {
  localOpenClawActivationReport = await readJson(localOpenClawActivationReportPath);
} catch {
  localOpenClawActivationReport = null;
}
let localOpenClawExportBridgeReport = null;
try {
  localOpenClawExportBridgeReport = await readJson(localOpenClawExportBridgeReportPath);
} catch {
  localOpenClawExportBridgeReport = null;
}
const actualRealAgentCount = Array.isArray(snapshot.agents) ? snapshot.agents.length : 0;
const input = {
  source: "local-ingest",
  actualRealAgentCount,
  fixtureAgentCount: 0,
  productionStatus: "no-go-for-production",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  healthStatus: healthReport.overallHealthStatus || "unknown",
  evidenceStatus: evidenceReport.evidenceStatus || "unknown",
  fallbackUsed: evidenceReport.fallbackUsed === true,
  fallbackReason: evidenceReport.fallbackReason || "none",
  reviewedInputStatus: healthReport.reviewedInputStatus || "unknown",
  reviewedHealthInputReadiness: dryRunReport?.readinessStatus || "missing-local-input",
  taskInboxStatus: localTaskInboxReport?.taskInboxStatus || "missing",
  whatsappTaskSyncStatus: localTaskInboxReport?.whatsappTaskSyncStatus || whatsappTaskVisibilityChecklist?.whatsappTaskSyncStatus || "not-synced",
  refreshIntervalMinutes: Number(hourlyRefreshPolicyReport?.refreshIntervalMinutes ?? 60),
  balanceCenterStatus: providerBalanceCenterReport?.balanceCenterStatus || "missing-local-input",
  localOpenClawConnectionStatus: localOpenClawConnectorReport?.connectionStatus || "not-connected",
  localOpenClawReadinessStatus: localOpenClawConnectorReport?.readinessStatus || "needs-local-config",
  localOpenClawActivationStatus: localOpenClawActivationReport?.activationStatus || "needs-local-config",
  localOpenClawSetupMode: localOpenClawActivationReport?.setupMode || "not-configured",
  localOpenClawExportBridgeStatus: localOpenClawExportBridgeReport?.exportStatus || "no-safe-agent-task-source-found",
  productionEntryGateStatus: productionGateReport?.gateStatus || "not-evaluated",
  productionAdapterSimulatorStatus: productionAdapterSimulatorReport?.adapterStatus || "not-evaluated",
  readOnlyAdapterContractStatus: contractReviewReport?.contractReviewStatus || "not-evaluated",
  disabledAdapterDraftStatus: disabledDraftReport?.disabledAdapterDraftStatus || "not-evaluated",
  redactionApplied: evidenceReport.redactionApplied === true,
  rawValuesPrinted: evidenceReport.rawValuesPrinted === true
};
const dailyStatus = classifyDailyStatus(input);

const report = {
  reportId: `daily-operator-summary-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "daily-operator-runbook-mode",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  operatorRecommendedSource: "local-ingest",
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: 1,
  actualRealAgentCount,
  healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
  evidenceReviewReportPath: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  reviewedHealthDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  reviewedHealthInputReadiness: input.reviewedHealthInputReadiness,
  reviewedHealthInputAssistantStatus: dryRunReport ? "available" : "missing-dry-run-report",
  localTaskInboxReportPath: "apps/dashboard/data/generated/local-task-inbox-report.json",
  whatsappTaskVisibilityChecklistPath: "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  hourlyRefreshPolicyReportPath: "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  providerBalanceCenterReportPath: "apps/dashboard/data/generated/provider-balance-center-report.json",
  localOpenClawConnectorReportPath: "apps/dashboard/data/generated/local-openclaw-connector-report.json",
  localOpenClawActivationReportPath: "apps/dashboard/data/generated/local-openclaw-activation-report.json",
  localOpenClawExportBridgeReportPath: "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
  uiUxPolishStatus: "operator-facing",
  taskInboxStatus: input.taskInboxStatus,
  whatsappTaskSyncStatus: input.whatsappTaskSyncStatus,
  refreshIntervalMinutes: input.refreshIntervalMinutes,
  balanceCenterStatus: input.balanceCenterStatus,
  localOpenClawConnectionStatus: input.localOpenClawConnectionStatus,
  localOpenClawReadinessStatus: input.localOpenClawReadinessStatus,
  localOpenClawActivationStatus: input.localOpenClawActivationStatus,
  localOpenClawSetupMode: input.localOpenClawSetupMode,
  localOpenClawOperatorSteps: localOpenClawActivationReport?.operatorSteps || [],
  localOpenClawAgentCount: localOpenClawConnectorReport?.agentCount ?? null,
  localOpenClawTaskCount: localOpenClawConnectorReport?.taskCount ?? null,
  localOpenClawSafeNextSteps: localOpenClawConnectorReport?.safeNextSteps || [],
  localOpenClawExportBridgeStatus: input.localOpenClawExportBridgeStatus,
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  productionEntryGateStatus: input.productionEntryGateStatus,
  productionAdapterSimulatorReportPath: "apps/dashboard/data/generated/production-adapter-simulator-report.json",
  productionAdapterSimulatorStatus: input.productionAdapterSimulatorStatus,
  readOnlyAdapterContractReviewReportPath: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  disabledReadOnlyAdapterDraftReportPath: "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  dashboardStabilizationAuditReportPath: "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json",
  readOnlyAdapterContractStatus: input.readOnlyAdapterContractStatus,
  disabledAdapterDraftStatus: input.disabledAdapterDraftStatus,
  productionAdapterEnabled: false,
  productionAdapterConnected: false,
  productionAdapterSimulatorOnly: true,
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  dataReturned: false,
  productionReady: false,
  productionGateSummary: productionGateReport
    ? `${productionGateReport.gateStatus}; productionReady false; production gateway disabled`
    : "not-evaluated; generate production entry gate report",
  healthStatus: input.healthStatus,
  evidenceStatus: input.evidenceStatus,
  fallbackUsed: input.fallbackUsed,
  fallbackReason: input.fallbackReason,
  reviewedInputStatus: input.reviewedInputStatus,
  dailyStatus,
  statusReasons: buildStatusReasons(input, dailyStatus),
  safeNextSteps: [
    ...buildSafeNextSteps(dailyStatus),
    "Review production entry gate report.",
    "Review production adapter simulator report.",
    "Review read-only adapter contract report.",
    "Review disabled adapter draft report.",
    "Confirm no production adapter is enabled.",
    "Do not connect production gateway."
  ],
  blockedActions: BLOCKED_ACTIONS,
  warnings: dailyStatus === "review-required" ? ["Review local health and evidence before daily interpretation."] : [],
  requiredFollowups: dailyStatus === "review-required" ? ["Use local runbook; do not restart from Dashboard."] : []
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw daily operator summary report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
