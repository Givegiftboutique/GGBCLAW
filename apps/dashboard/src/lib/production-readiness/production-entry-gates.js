(function () {
const PRODUCTION_ENTRY_GATE_STATUSES = [
  "blocked",
  "review-required",
  "local-only-ready",
  "not-evaluated"
];

const BLOCKED_PRODUCTION_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function buildProductionBlockers(input = {}) {
  const blockers = [];
  if (input.reportsMissing === true) blockers.push("Required local reports are missing.");
  if (input.productionStatus !== "no-go-for-production") blockers.push("productionStatus must remain no-go-for-production.");
  if (input.productionReady !== false) blockers.push("productionReady must remain false.");
  if (input.mutationEnabled !== false) blockers.push("mutationEnabled must remain false.");
  if (input.restartEnabled !== false) blockers.push("restartEnabled must remain false.");
  if (input.productionGatewayEnabled !== false) blockers.push("productionGatewayEnabled must remain false.");
  if (input.productionWiring !== "disabled") blockers.push("productionWiring must remain disabled.");
  if (Number(input.actualRealAgentCount) !== 1) blockers.push("actualRealAgentCount must equal 1.");
  if (["mock", "gateway-stub"].includes(input.operatorRecommendedSource) || ["mock", "gateway-stub"].includes(input.source)) {
    blockers.push("mock and gateway-stub cannot be production readiness sources.");
  }
  if (input.rawValueLeakDetected === true || input.rawValuesPrinted === true) blockers.push("raw reviewed health values must not be printed.");
  if (input.productionEndpointEnabled === true) blockers.push("production endpoint must not be enabled.");
  if (input.deployEnabled === true) blockers.push("deploy must remain disabled.");
  if (input.authTokenUseEnabled === true) blockers.push("auth token use must remain disabled.");
  return blockers;
}

function buildReviewRequiredItems(input = {}) {
  const review = [];
  const healthStatus = input.healthStatus || input.overallHealthStatus || "unknown";
  const evidenceStatus = input.evidenceStatus || "unknown";
  const reviewedReadiness = input.reviewedHealthInputReadiness || input.reviewedInputReadiness || "missing-local-input";
  const dailyStatus = input.dailyStatus || "unknown";

  if (["unknown", "stale", "review-required"].includes(healthStatus)) review.push("Local health status requires operator review.");
  if (["missing-fallback", "sample-fallback", "reviewed-invalid-fallback", "review-required", "unsafe-rejected"].includes(evidenceStatus)) review.push("Local health evidence review requires operator attention.");
  if (["missing-local-input", "needs-template-copy", "needs-operator-edit", "invalid-fallback-required", "unsafe-rejected", "review-required"].includes(reviewedReadiness)) review.push("Reviewed health input dry-run is not ready for local use.");
  if (["review-required", "unknown"].includes(dailyStatus)) review.push("Daily operator runbook requires review.");
  if (dailyStatus === "blocked") review.push("Daily operator runbook is blocked.");
  if (input.manualApprovalReceived !== true) review.push("Manual production approval must happen outside Dashboard.");
  return review;
}

function buildLocalOnlyReadyItems(input = {}) {
  return [
    Number(input.actualRealAgentCount) === 1 ? "Single-agent local-ingest operator truth candidate is present." : null,
    input.productionStatus === "no-go-for-production" ? "Production status remains no-go-for-production." : null,
    input.productionReady === false ? "productionReady remains false." : null,
    input.mutationEnabled === false ? "Mutation remains disabled." : null,
    input.restartEnabled === false ? "Restart remains disabled." : null,
    input.productionGatewayEnabled === false ? "Production gateway remains disabled." : null,
    input.productionWiring === "disabled" ? "Production adapter and wiring remain disabled." : null
  ].filter(Boolean);
}

function classifyProductionEntryGate(input = {}) {
  if (input.reportsMissing === true || safeArray(input.requiredReportsMissing).length > 0) return "not-evaluated";
  const blockers = buildProductionBlockers(input);
  if (blockers.length > 0) return "blocked";
  const review = buildReviewRequiredItems(input);
  if (review.length > 0) return "review-required";
  return "local-only-ready";
}

function buildProductionPreflightChecklist(input = {}) {
  return [
    {
      id: "single-agent-truth",
      label: "source must be local-ingest single-agent",
      passed: input.operatorRecommendedSource === "local-ingest" && Number(input.actualRealAgentCount) === 1
    },
    {
      id: "daily-runbook",
      label: "daily runbook must not be blocked",
      passed: input.dailyStatus !== "blocked"
    },
    {
      id: "health-report",
      label: "local health report must exist",
      passed: input.localHealthReportExists === true
    },
    {
      id: "evidence-report",
      label: "local evidence review report must exist",
      passed: input.evidenceReviewReportExists === true
    },
    {
      id: "reviewed-health-dry-run",
      label: "reviewed health dry-run report must exist",
      passed: input.reviewedHealthDryRunReportExists === true
    },
    {
      id: "production-ready-false",
      label: "productionReady must remain false",
      passed: input.productionReady === false
    },
    {
      id: "production-disabled-actions",
      label: "production gateway, mutation, restart, and deploy remain disabled",
      passed: input.productionGatewayEnabled === false && input.mutationEnabled === false && input.restartEnabled === false && input.deployEnabled !== true
    }
  ];
}

function buildProductionGateCards(input = {}) {
  const gateStatus = classifyProductionEntryGate(input);
  return [
    { id: "gate-status", label: "Gate status / 門檻狀態", value: gateStatus, detail: "Production entry is blocked or review-only." },
    { id: "production-ready", label: "Production ready", value: "false", detail: "This sprint never marks production ready." },
    { id: "production-status", label: "Production status", value: "no-go-for-production", detail: "Production remains disabled." },
    { id: "production-gateway", label: "Production gateway", value: "disabled", detail: "No production gateway connection exists." },
    { id: "mutation", label: "Mutation", value: "disabled", detail: "No mutation endpoint is enabled." },
    { id: "manual-approval", label: "Manual approval required", value: "outside Dashboard", detail: "Dashboard cannot approve production entry." }
  ];
}

function buildProductionEntryGateStatus(input = {}) {
  const gateStatus = classifyProductionEntryGate(input);
  return {
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
    actualRealAgentCount: Number(input.actualRealAgentCount ?? 0),
    gateStatus,
    productionBlockers: buildProductionBlockers({ ...input, productionReady: false }),
    reviewRequiredItems: buildReviewRequiredItems(input),
    localOnlyReadyItems: buildLocalOnlyReadyItems({ ...input, productionReady: false }),
    preflightChecklist: buildProductionPreflightChecklist({ ...input, productionReady: false }),
    productionGateCards: buildProductionGateCards({ ...input, productionReady: false }),
    manualApprovalsRequired: safeArray(input.manualApprovalsRequired).length
      ? safeArray(input.manualApprovalsRequired)
      : ["operator-owner", "technical-owner", "security-reviewer", "business-owner"],
    blockedActions: BLOCKED_PRODUCTION_ACTIONS,
    warnings: safeArray(input.warnings),
    requiredFollowups: safeArray(input.requiredFollowups),
    notEvaluated: gateStatus === "not-evaluated" || safeArray(input.requiredReportsMissing).some((item) => !isMissing(item))
  };
}

window.OpenClawProductionEntryGates = {
  PRODUCTION_ENTRY_GATE_STATUSES,
  BLOCKED_PRODUCTION_ACTIONS,
  buildProductionEntryGateStatus,
  classifyProductionEntryGate,
  buildProductionBlockers,
  buildProductionPreflightChecklist,
  buildProductionGateCards
};
})();
