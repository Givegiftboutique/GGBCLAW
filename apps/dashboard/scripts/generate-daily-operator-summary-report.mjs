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

const BLOCKED_ACTIONS = [
  "restart-agent",
  "stop-agent",
  "start-agent",
  "production-gateway-connect",
  "mutation",
  "deploy"
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
  healthStatus: input.healthStatus,
  evidenceStatus: input.evidenceStatus,
  fallbackUsed: input.fallbackUsed,
  fallbackReason: input.fallbackReason,
  reviewedInputStatus: input.reviewedInputStatus,
  dailyStatus,
  statusReasons: buildStatusReasons(input, dailyStatus),
  safeNextSteps: buildSafeNextSteps(dailyStatus),
  blockedActions: BLOCKED_ACTIONS,
  warnings: dailyStatus === "review-required" ? ["Review local health and evidence before daily interpretation."] : [],
  requiredFollowups: dailyStatus === "review-required" ? ["Use local runbook; do not restart from Dashboard."] : []
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw daily operator summary report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
