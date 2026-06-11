import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "production-entry-gate-report.json");
const snapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const dailySummaryPath = join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json");
const localHealthPath = join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json");
const evidencePath = join(dashboardRoot, "data", "generated", "local-health-evidence-review-report.json");
const reviewedDryRunPath = join(dashboardRoot, "data", "generated", "reviewed-local-health-input-dry-run-report.json");

const BLOCKED_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function reportId(prefix) {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
}

function buildProductionBlockers(input) {
  const blockers = [];
  if (input.requiredReportsMissing.length) blockers.push("Required local reports are missing.");
  if (input.productionStatus !== "no-go-for-production") blockers.push("productionStatus must remain no-go-for-production.");
  if (input.productionReady !== false) blockers.push("productionReady must remain false.");
  if (input.mutationEnabled !== false) blockers.push("mutationEnabled must remain false.");
  if (input.restartEnabled !== false) blockers.push("restartEnabled must remain false.");
  if (input.productionGatewayEnabled !== false) blockers.push("productionGatewayEnabled must remain false.");
  if (input.productionWiring !== "disabled") blockers.push("productionWiring must remain disabled.");
  if (input.actualRealAgentCount !== 1) blockers.push("actualRealAgentCount must equal 1.");
  if (["mock", "gateway-stub"].includes(input.operatorRecommendedSource)) blockers.push("fixture source cannot be production readiness source.");
  if (input.rawValuesPrinted === true || input.rawValueLeakDetected === true) blockers.push("raw reviewed health values must not be printed.");
  if (input.productionEndpointEnabled === true) blockers.push("production endpoint must not be enabled.");
  if (input.deployEnabled === true) blockers.push("deploy must remain disabled.");
  if (input.authTokenUseEnabled === true) blockers.push("auth token use must remain disabled.");
  return blockers;
}

function buildReviewRequiredItems(input) {
  const items = [];
  if (["unknown", "stale", "review-required"].includes(input.healthStatus)) items.push("Local health status requires operator review.");
  if (["missing-fallback", "sample-fallback", "reviewed-invalid-fallback", "review-required", "unsafe-rejected"].includes(input.evidenceStatus)) items.push("Local health evidence review requires operator attention.");
  if (["missing-local-input", "needs-template-copy", "needs-operator-edit", "invalid-fallback-required", "unsafe-rejected", "review-required"].includes(input.reviewedHealthInputReadiness)) items.push("Reviewed health input dry-run is not ready for local use.");
  if (["review-required", "unknown"].includes(input.dailyStatus)) items.push("Daily operator runbook requires review.");
  if (input.dailyStatus === "blocked") items.push("Daily operator runbook is blocked.");
  if (input.manualApprovalReceived !== true) items.push("Manual production approval must happen outside Dashboard.");
  return items;
}

function classifyGate(input) {
  if (input.requiredReportsMissing.length) return "not-evaluated";
  if (buildProductionBlockers(input).length) return "blocked";
  if (buildReviewRequiredItems(input).length) return "review-required";
  return "local-only-ready";
}

const requiredReports = [
  { label: "single-agent snapshot", path: snapshotPath },
  { label: "daily operator summary", path: dailySummaryPath },
  { label: "local health report", path: localHealthPath },
  { label: "local health evidence review", path: evidencePath },
  { label: "reviewed health dry-run", path: reviewedDryRunPath }
];

const requiredReportsMissing = [];
for (const required of requiredReports) {
  if (!(await exists(required.path))) requiredReportsMissing.push(required.label);
}

const snapshot = requiredReportsMissing.includes("single-agent snapshot") ? { agents: [] } : await readJson(snapshotPath);
const dailySummary = requiredReportsMissing.includes("daily operator summary") ? {} : await readJson(dailySummaryPath);
const healthReport = requiredReportsMissing.includes("local health report") ? {} : await readJson(localHealthPath);
const evidenceReport = requiredReportsMissing.includes("local health evidence review") ? {} : await readJson(evidencePath);
const dryRunReport = requiredReportsMissing.includes("reviewed health dry-run") ? {} : await readJson(reviewedDryRunPath);

const actualRealAgentCount = Array.isArray(snapshot.agents) ? snapshot.agents.length : 0;
const input = {
  requiredReportsMissing,
  productionStatus: "no-go-for-production",
  productionReady: false,
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  productionWiring: "disabled",
  operatorRecommendedSource: "local-ingest",
  actualRealAgentCount,
  healthStatus: healthReport.overallHealthStatus || "unknown",
  evidenceStatus: evidenceReport.evidenceStatus || "unknown",
  reviewedHealthInputReadiness: dryRunReport.readinessStatus || "missing-local-input",
  dailyStatus: dailySummary.dailyStatus || "unknown",
  rawValuesPrinted: evidenceReport.rawValuesPrinted === true || dryRunReport.rawValuesPrinted === true,
  rawValueLeakDetected: false,
  productionEndpointEnabled: false,
  deployEnabled: false,
  authTokenUseEnabled: false,
  manualApprovalReceived: false
};

const gateStatus = classifyGate(input);
const productionBlockers = buildProductionBlockers(input);
const reviewRequiredItems = buildReviewRequiredItems(input);

const report = {
  reportId: reportId("production-entry-gate"),
  generatedAt: new Date().toISOString(),
  scope: "production-entry-gate-hardening",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  productionWiring: "disabled",
  operatorRecommendedSource: "local-ingest",
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: 1,
  actualRealAgentCount,
  dailySummaryReportPath: "apps/dashboard/data/generated/daily-operator-summary-report.json",
  localHealthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
  evidenceReviewReportPath: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  reviewedHealthDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  gateStatus,
  productionBlockers,
  reviewRequiredItems,
  localOnlyReadyItems: [
    "Single-agent local-ingest operator truth candidate is present.",
    "Production status remains no-go-for-production.",
    "productionReady remains false.",
    "Mutation, restart, deploy, and production gateway remain disabled.",
    "Production adapter remains disabled."
  ],
  manualApprovalsRequired: [
    "operator-owner",
    "technical-owner",
    "security-reviewer",
    "business-owner"
  ],
  blockedActions: BLOCKED_ACTIONS,
  warnings: gateStatus === "review-required" ? ["Production entry requires review and remains disabled."] : [],
  requiredFollowups: [
    "Review production entry gate checklist.",
    "Confirm no production adapter is enabled.",
    "Do not connect production gateway.",
    "Keep productionReady false until a future external production approval process exists."
  ],
  sourceUsePolicy: {
    productionReadinessSource: "local-ingest single-agent local reports only",
    mockGatewayStubAllowed: false,
    fixtureSourcesMayNotBeProductionTruth: true
  }
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw production entry gate report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
