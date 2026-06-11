import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "dashboard-stabilization-audit-report.json");

const reportPaths = {
  operatorUsability: join(dashboardRoot, "data", "generated", "operator-daily-usability-checklist.json"),
  dailyRunbook: join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json"),
  localHealth: join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json"),
  healthEvidence: join(dashboardRoot, "data", "generated", "local-health-evidence-review-report.json"),
  reviewedInputAssistant: join(dashboardRoot, "data", "generated", "reviewed-local-health-input-dry-run-report.json"),
  localTaskInbox: join(dashboardRoot, "data", "generated", "local-task-inbox-report.json"),
  whatsappTaskVisibility: join(dashboardRoot, "data", "generated", "whatsapp-task-visibility-checklist.json"),
  hourlyRefreshPolicy: join(dashboardRoot, "data", "generated", "hourly-refresh-policy-report.json"),
  providerBalanceCenter: join(dashboardRoot, "data", "generated", "provider-balance-center-report.json"),
  productionEntryGate: join(dashboardRoot, "data", "generated", "production-entry-gate-report.json"),
  productionAdapterSimulator: join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json"),
  readOnlyAdapterContract: join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json"),
  disabledAdapterDraft: join(dashboardRoot, "data", "generated", "disabled-read-only-adapter-draft-report.json")
};

const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function classifyReport(label, report) {
  if (!report) return "review-required";
  if (report.productionStatus && report.productionStatus !== "no-go-for-production") return "fail";
  if (report.productionReady === true || report.mutationEnabled === true || report.restartEnabled === true || report.productionGatewayEnabled === true) return "fail";
  if (label === "dailyRunbook" && ["blocked", "unknown"].includes(report.dailyStatus)) return "review-required";
  if (label === "localHealth" && ["unknown", "stale", "review-required"].includes(report.overallHealthStatus)) return "review-required";
  if (label === "healthEvidence" && report.fallbackUsed === true) return "review-required";
  if (label === "localTaskInbox" && ["missing", "invalid"].includes(report.taskInboxStatus)) return "review-required";
  if (label === "providerBalanceCenter" && ["missing-local-input", "review-required"].includes(report.balanceCenterStatus)) return "review-required";
  if (label === "productionEntryGate" && ["blocked", "review-required", "not-evaluated"].includes(report.gateStatus)) return "review-required";
  if (label === "readOnlyAdapterContract" && !["draft-only", "review-required"].includes(report.contractReviewStatus)) return "fail";
  if (label === "disabledAdapterDraft" && report.dataReturned !== false) return "fail";
  return "pass";
}

const reports = {};
for (const [label, path] of Object.entries(reportPaths)) {
  reports[label] = await readJson(path);
}

const statuses = Object.fromEntries(
  Object.entries(reports).map(([label, report]) => [label, classifyReport(label, report)])
);

const stabilizationFindings = [
  "Operator Home, Daily Runbook, local health, evidence, production gate, adapter simulator, contract review, and disabled draft are covered by local reports.",
  "Production remains no-go-for-production.",
  "Adapter contract and disabled draft do not configure endpoint, auth, connection, or data return.",
  "Sprint 25C operator UX reports cover local task inbox, WhatsApp visibility, hourly refresh, and provider balance center without production access.",
  Object.values(statuses).includes("review-required")
    ? "Some reports intentionally remain review-required because production approval and reviewed local evidence remain manual."
    : "All local stabilization checks are pass."
];

const report = {
  reportId: `dashboard-stabilization-audit-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "dashboard-stabilization-audit",
  language: "zh-Hant",
  ...statuses,
  productionStatus: "no-go-for-production",
  productionReady: false,
  recommendedOperatorUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
  localTaskInboxReportPath: "apps/dashboard/data/generated/local-task-inbox-report.json",
  whatsappTaskVisibilityChecklistPath: "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  hourlyRefreshPolicyReportPath: "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  providerBalanceCenterReportPath: "apps/dashboard/data/generated/provider-balance-center-report.json",
  uiUxPolishStatus: "operator-facing",
  taskInboxStatus: reports.localTaskInbox?.taskInboxStatus || "missing",
  whatsappTaskSyncStatus: reports.localTaskInbox?.whatsappTaskSyncStatus || reports.whatsappTaskVisibility?.whatsappTaskSyncStatus || "not-synced",
  refreshIntervalMinutes: Number(reports.hourlyRefreshPolicy?.refreshIntervalMinutes ?? 60),
  balanceCenterStatus: reports.providerBalanceCenter?.balanceCenterStatus || "missing-local-input",
  readOnlyAdapterContractReviewReportPath: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  disabledReadOnlyAdapterDraftReportPath: "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  dashboardStabilizationAuditReportPath: "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json",
  stabilizationFindings,
  safeNextSteps: [
    "Open the recommended operator URL.",
    "Review Daily Operator Runbook before daily interpretation.",
    "Review local health and evidence reports.",
    "Review read-only adapter contract before any future adapter work.",
    "Keep future real adapter approval outside Dashboard."
  ],
  blockedActions
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw dashboard stabilization audit report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
