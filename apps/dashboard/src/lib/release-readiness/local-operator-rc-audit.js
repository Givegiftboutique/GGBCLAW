(function () {
const LOCAL_OPERATOR_RC_STATUSES = [
  "local-operator-rc",
  "review-required",
  "blocked",
  "not-evaluated"
];

const BLOCKED_LOCAL_OPERATOR_RC_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

const REQUIRED_LOCAL_OPERATOR_RC_REPORTS = [
  "local-real-agent-health-report.json",
  "local-health-evidence-review-report.json",
  "reviewed-local-health-input-dry-run-report.json",
  "daily-operator-summary-report.json",
  "daily-operator-runbook-checklist.json",
  "production-entry-gate-report.json",
  "production-adapter-simulator-report.json",
  "read-only-adapter-contract-review-report.json",
  "disabled-read-only-adapter-draft-report.json",
  "dashboard-stabilization-audit-report.json"
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasUnsafeProductionFlag(input = {}) {
  return input.productionReady === true
    || input.adapterEnabled === true
    || input.connected === true
    || input.endpointConfigured === true
    || input.authEnabled === true
    || input.dataReturned === true
    || input.mutationEnabled === true
    || input.restartEnabled === true
    || input.productionGatewayEnabled === true
    || input.deployEnabled === true
    || input.productionStatus !== "no-go-for-production";
}

function classifyLocalOperatorRcStatus(input = {}) {
  if (safeArray(input.requiredReportsMissing).length > 0 || input.reportsMissing === true) {
    return "not-evaluated";
  }
  if (
    hasUnsafeProductionFlag(input)
    || Number(input.actualRealAgentCount ?? 0) !== 1
    || ["mock", "gateway-stub"].includes(input.operatorRecommendedSource)
    || input.mockIsOperatorTruth === true
    || input.gatewayStubIsOperatorTruth === true
    || input.rawValuesPrinted === true
    || input.realReviewedHealthInputTracked === true
  ) {
    return "blocked";
  }
  if (
    ["review-required", "unknown", "blocked"].includes(input.dailyStatus)
    || ["review-required", "unknown", "stale"].includes(input.healthStatus)
    || input.fallbackUsed === true
    || ["review-required", "not-evaluated"].includes(input.productionEntryGateStatus)
    || input.manualOperatorReviewRequired === true
  ) {
    return "review-required";
  }
  return "local-operator-rc";
}

function buildLocalOperatorRcFindings(input = {}) {
  const status = classifyLocalOperatorRcStatus(input);
  const findings = [];
  if (status === "not-evaluated") {
    findings.push("Required local operator RC reports are missing.");
  }
  if (status === "blocked") {
    if (hasUnsafeProductionFlag(input)) findings.push("A production, adapter, connection, auth, data return, mutation, restart, gateway, or deploy flag is unsafe.");
    if (Number(input.actualRealAgentCount ?? 0) !== 1) findings.push("Actual real agent count is not 1.");
    if (["mock", "gateway-stub"].includes(input.operatorRecommendedSource)) findings.push("Fixture source cannot be operator truth.");
    if (input.rawValuesPrinted === true) findings.push("Raw reviewed health values must not be printed.");
    if (input.realReviewedHealthInputTracked === true) findings.push("Real reviewed local health input must not be tracked or staged.");
  }
  if (status === "review-required") {
    if (["review-required", "unknown", "blocked"].includes(input.dailyStatus)) findings.push("Daily operator status still requires review.");
    if (["review-required", "unknown", "stale"].includes(input.healthStatus)) findings.push("Local health status needs operator review.");
    if (input.fallbackUsed === true) findings.push("Local evidence or health input fallback is active.");
    if (["review-required", "not-evaluated"].includes(input.productionEntryGateStatus)) findings.push("Production entry remains manual-review only.");
  }
  if (status === "local-operator-rc") {
    findings.push("Local operator dashboard checkpoint is ready for daily local use.");
  }
  return findings;
}

function buildLocalOperatorRcKnownRisks(input = {}) {
  return [
    "Real reviewed health input remains local-only and must not be committed.",
    "Health may be unknown, stale, or review-required until manually reviewed.",
    "Production adapter remains disabled and does not return production data.",
    "No production endpoint or auth configuration is available in Dashboard.",
    "Browser cache can show an old mock or fixture view.",
    "Local server port may be occupied.",
    "Manual browser console checks may be unavailable in some environments.",
    "Fixture sources remain available for demo and contract tests only.",
    ...safeArray(input.knownRisks)
  ];
}

function buildLocalOperatorRcCards(input = {}) {
  const status = classifyLocalOperatorRcStatus(input);
  return [
    { id: "rc-status", label: "RC status / Local Operator RC status", value: status },
    { id: "daily-use", label: "Daily use available / Daily local use", value: input.dailyUseAvailable === false ? "No" : "Yes" },
    { id: "production-ready", label: "Production ready", value: "No / false" },
    { id: "production-status", label: "Production status", value: "no-go-for-production" },
    { id: "adapter-enabled", label: "Adapter enabled", value: "No / false" },
    { id: "connected", label: "Connected", value: "No / false" },
    { id: "endpoint-auth", label: "Endpoint/Auth", value: "No / false" },
    { id: "blocked-actions", label: "Blocked actions", value: BLOCKED_LOCAL_OPERATOR_RC_ACTIONS.join(", ") }
  ];
}

function buildLocalOperatorRcAudit(input = {}) {
  const releaseCandidateStatus = classifyLocalOperatorRcStatus(input);
  return {
    scope: "local-operator-release-candidate",
    language: "zh-Hant",
    releaseCandidateType: "local-operator-dashboard",
    releaseCandidateStatus,
    productionReady: false,
    productionStatus: "no-go-for-production",
    operatorRecommendedSource: "local-ingest",
    expectedRealAgentCount: 1,
    actualRealAgentCount: Number(input.actualRealAgentCount ?? 0),
    dailyUseAvailable: releaseCandidateStatus !== "blocked" && releaseCandidateStatus !== "not-evaluated",
    launchScriptPath: "apps/dashboard/scripts/start-operator-dashboard.ps1",
    recommendedOperatorUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
    coreReports: safeArray(input.coreReports),
    corePanels: safeArray(input.corePanels),
    findings: buildLocalOperatorRcFindings(input),
    knownRisks: buildLocalOperatorRcKnownRisks(input),
    blockedActions: BLOCKED_LOCAL_OPERATOR_RC_ACTIONS,
    releaseNotes: safeArray(input.releaseNotes),
    warnings: releaseCandidateStatus === "review-required" ? ["Manual local operator review remains required before treating the checkpoint as green."] : [],
    requiredFollowups: releaseCandidateStatus === "blocked" ? ["Resolve blockers before local operator use."] : safeArray(input.requiredFollowups),
    rcCards: buildLocalOperatorRcCards(input)
  };
}

window.OpenClawLocalOperatorRcAudit = {
  LOCAL_OPERATOR_RC_STATUSES,
  BLOCKED_LOCAL_OPERATOR_RC_ACTIONS,
  REQUIRED_LOCAL_OPERATOR_RC_REPORTS,
  buildLocalOperatorRcAudit,
  classifyLocalOperatorRcStatus,
  buildLocalOperatorRcFindings,
  buildLocalOperatorRcKnownRisks,
  buildLocalOperatorRcCards
};
})();
