import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

export const here = dirname(fileURLToPath(import.meta.url));
export const dashboardRoot = resolve(here, "../..");
export const repoRoot = resolve(dashboardRoot, "../..");
export const generatedRoot = join(dashboardRoot, "data", "generated");

export const recommendedOperatorUrl = "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json";

export const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

export const coreReportPaths = {
  localHealth: "apps/dashboard/data/generated/local-real-agent-health-report.json",
  healthEvidence: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  reviewedInputDryRun: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  dailySummary: "apps/dashboard/data/generated/daily-operator-summary-report.json",
  dailyRunbookChecklist: "apps/dashboard/data/generated/daily-operator-runbook-checklist.json",
  localTaskInbox: "apps/dashboard/data/generated/local-task-inbox-report.json",
  whatsappTaskVisibility: "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  hourlyRefreshPolicy: "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  providerBalanceCenter: "apps/dashboard/data/generated/provider-balance-center-report.json",
  localOpenClawConnector: "apps/dashboard/data/generated/local-openclaw-connector-report.json",
  localOpenClawActivation: "apps/dashboard/data/generated/local-openclaw-activation-report.json",
  localOpenClawExportBridge: "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
  productionEntryGate: "apps/dashboard/data/generated/production-entry-gate-report.json",
  productionAdapterSimulator: "apps/dashboard/data/generated/production-adapter-simulator-report.json",
  readOnlyAdapterContract: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  disabledAdapterDraft: "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  dashboardStabilizationAudit: "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json",
  localOperatorReleaseCandidate: "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
  localOperatorFinalChecklist: "apps/dashboard/data/generated/local-operator-final-checklist.json",
  localOperatorKnownRiskRegister: "apps/dashboard/data/generated/local-operator-known-risk-register.json",
  localOperatorReportIndex: "apps/dashboard/data/generated/local-operator-report-index.json"
};

export const corePanels = [
  "Operator Home",
  "Daily Operator Runbook",
  "Local Real Agent Health",
  "Local Health Evidence Review",
  "Reviewed Health Input Assistant",
  "Production Entry Gate",
  "Read-only Production Adapter Simulator",
  "Read-only Adapter Contract Review",
  "Disabled Read-only Adapter Draft",
  "Dashboard Stabilization Audit",
  "Local Operator Release Candidate"
];

export const requiredInputReportKeys = [
  "localHealth",
  "healthEvidence",
  "reviewedInputDryRun",
  "dailySummary",
  "dailyRunbookChecklist",
  "localTaskInbox",
  "whatsappTaskVisibility",
  "hourlyRefreshPolicy",
  "providerBalanceCenter",
  "localOpenClawConnector",
  "localOpenClawActivation",
  "localOpenClawExportBridge",
  "productionEntryGate",
  "productionAdapterSimulator",
  "readOnlyAdapterContract",
  "disabledAdapterDraft",
  "dashboardStabilizationAudit"
];

export const knownRisks = [
  "real reviewed health input remains local-only",
  "health may be unknown/stale/review-required",
  "production adapter disabled",
  "no production endpoint/auth available",
  "browser cache can show old mock view",
  "local server port may be occupied",
  "manual browser console check may be unavailable",
  "fixture sources remain available for demo/tests only"
];

export function rel(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonRel(relPath, fallback = null) {
  try {
    return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJsonRel(relPath, data) {
  const outputPath = join(repoRoot, relPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return outputPath;
}

export function reportId(prefix) {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
}

export async function loadRcAuditModule() {
  const source = await readFile(join(dashboardRoot, "src", "lib", "release-readiness", "local-operator-rc-audit.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-operator-rc-audit.js" });
  return context.window.OpenClawLocalOperatorRcAudit;
}

export function isRealReviewedInputTrackedOrStaged() {
  const target = "apps/dashboard/data/local/reviewed-local-agent-health.json";
  const tracked = spawnSync("git", ["ls-files", target], { cwd: repoRoot, encoding: "utf8" });
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", target], { cwd: repoRoot, encoding: "utf8" });
  return Boolean((tracked.stdout || "").trim() || (staged.stdout || "").trim());
}

export async function buildRcAuditInput() {
  const reports = {
    localHealth: await readJsonRel(coreReportPaths.localHealth),
    healthEvidence: await readJsonRel(coreReportPaths.healthEvidence),
    reviewedInputDryRun: await readJsonRel(coreReportPaths.reviewedInputDryRun),
    dailySummary: await readJsonRel(coreReportPaths.dailySummary),
    dailyRunbookChecklist: await readJsonRel(coreReportPaths.dailyRunbookChecklist),
    localTaskInbox: await readJsonRel(coreReportPaths.localTaskInbox),
    whatsappTaskVisibility: await readJsonRel(coreReportPaths.whatsappTaskVisibility),
    hourlyRefreshPolicy: await readJsonRel(coreReportPaths.hourlyRefreshPolicy),
    providerBalanceCenter: await readJsonRel(coreReportPaths.providerBalanceCenter),
    localOpenClawConnector: await readJsonRel(coreReportPaths.localOpenClawConnector),
    localOpenClawActivation: await readJsonRel(coreReportPaths.localOpenClawActivation),
    localOpenClawExportBridge: await readJsonRel(coreReportPaths.localOpenClawExportBridge),
    productionEntryGate: await readJsonRel(coreReportPaths.productionEntryGate),
    productionAdapterSimulator: await readJsonRel(coreReportPaths.productionAdapterSimulator),
    readOnlyAdapterContract: await readJsonRel(coreReportPaths.readOnlyAdapterContract),
    disabledAdapterDraft: await readJsonRel(coreReportPaths.disabledAdapterDraft),
    dashboardStabilizationAudit: await readJsonRel(coreReportPaths.dashboardStabilizationAudit)
  };

  const missing = requiredInputReportKeys
    .filter((key) => !reports[key])
    .map((key) => coreReportPaths[key]);

  const daily = reports.dailySummary || {};
  const localHealth = reports.localHealth || {};
  const evidence = reports.healthEvidence || {};
  const dryRun = reports.reviewedInputDryRun || {};
  const taskInbox = reports.localTaskInbox || {};
  const refreshPolicy = reports.hourlyRefreshPolicy || {};
  const balanceCenter = reports.providerBalanceCenter || {};
  const localOpenClawConnector = reports.localOpenClawConnector || {};
  const localOpenClawActivation = reports.localOpenClawActivation || {};
  const localOpenClawExportBridge = reports.localOpenClawExportBridge || {};
  const gate = reports.productionEntryGate || {};
  const simulator = reports.productionAdapterSimulator || {};
  const contract = reports.readOnlyAdapterContract || {};
  const draft = reports.disabledAdapterDraft || {};

  return {
    reports,
    requiredReportsMissing: missing,
    reportsMissing: missing.length > 0,
    productionStatus: "no-go-for-production",
    productionReady: false,
    adapterEnabled: false,
    connected: false,
    endpointConfigured: false,
    authEnabled: false,
    dataReturned: false,
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    deployEnabled: false,
    operatorRecommendedSource: daily.operatorRecommendedSource || "local-ingest",
    expectedRealAgentCount: 1,
    actualRealAgentCount: Number(daily.actualRealAgentCount ?? gate.actualRealAgentCount ?? 1),
    dailyStatus: daily.dailyStatus || "review-required",
    healthStatus: localHealth.overallHealthStatus || daily.healthStatus || "unknown",
    fallbackUsed: evidence.fallbackUsed === true || daily.fallbackUsed === true,
    productionEntryGateStatus: gate.gateStatus || "review-required",
    productionAdapterSimulatorStatus: simulator.adapterStatus || "disabled",
    readOnlyAdapterContractStatus: contract.contractReviewStatus || "draft-only",
    disabledAdapterDraftStatus: draft.disabledAdapterDraftStatus || "disabled-by-default",
    reviewedHealthInputReadiness: dryRun.readinessStatus || "missing-local-input",
    uiUxPolishStatus: "operator-facing",
    taskInboxStatus: taskInbox.taskInboxStatus || "missing",
    whatsappTaskSyncStatus: taskInbox.whatsappTaskSyncStatus || reports.whatsappTaskVisibility?.whatsappTaskSyncStatus || "not-synced",
    refreshIntervalMinutes: Number(refreshPolicy.refreshIntervalMinutes ?? 60),
    balanceCenterStatus: balanceCenter.balanceCenterStatus || "missing-local-input",
    localOpenClawConnectionStatus: localOpenClawConnector.connectionStatus || "not-connected",
    localOpenClawReadinessStatus: localOpenClawConnector.readinessStatus || "needs-local-config",
    localOpenClawAgentCount: localOpenClawConnector.agentCount ?? null,
    localOpenClawTaskCount: localOpenClawConnector.taskCount ?? null,
    localOpenClawSafeNextSteps: localOpenClawConnector.safeNextSteps || [],
    localOpenClawActivationStatus: localOpenClawActivation.activationStatus || "needs-local-config",
    localOpenClawSetupMode: localOpenClawActivation.setupMode || "not-configured",
    localOpenClawOperatorSteps: localOpenClawActivation.operatorSteps || [],
    localOpenClawExportBridgeStatus: localOpenClawExportBridge.exportStatus || "no-safe-agent-task-source-found",
    localOpenClawExportBridgeReportPath: coreReportPaths.localOpenClawExportBridge,
    manualOperatorReviewRequired: ["review-required", "unknown", "stale"].includes(localHealth.overallHealthStatus) || evidence.fallbackUsed === true,
    rawValuesPrinted: evidence.rawValuesPrinted === true || dryRun.rawValuesPrinted === true,
    realReviewedHealthInputTracked: isRealReviewedInputTrackedOrStaged(),
    coreReports: Object.values(coreReportPaths),
    corePanels,
    knownRisks,
    releaseNotes: [
      "Local operator release candidate audit only.",
      "Daily local operator use is available when review-required items are understood.",
      "Production remains no-go-for-production and productionReady remains false."
    ],
    requiredFollowups: [
      "Review final local operator checklist.",
      "Review known risk register before daily use.",
      "Keep future production work under separate approval."
    ]
  };
}

export async function buildRcAudit() {
  const module = await loadRcAuditModule();
  const input = await buildRcAuditInput();
  return {
    input,
    audit: module.buildLocalOperatorRcAudit(input)
  };
}
