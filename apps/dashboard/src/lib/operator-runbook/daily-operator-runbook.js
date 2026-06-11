(function () {
const DAILY_OPERATOR_STATUSES = [
  "ok",
  "review-required",
  "blocked",
  "fixture-mode",
  "unknown"
];

const BLOCKED_ACTIONS = [
  "restart-agent",
  "stop-agent",
  "start-agent",
  "production-gateway-connect",
  "mutation",
  "deploy"
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSource(input = {}) {
  return input.source || input.currentSource || input.operatorRecommendedSource || "unknown";
}

function hasUnsafeGuardrail(input = {}) {
  return input.productionStatus !== "no-go-for-production"
    || input.mutationEnabled !== false
    || input.restartEnabled === true
    || input.productionGatewayEnabled === true
    || input.productionWiring === "enabled";
}

function hasUnsafeEvidence(input = {}) {
  return input.rawValuesPrinted === true
    || input.redactionApplied === false
    || input.evidenceStatus === "unsafe-rejected";
}

function classifyDailyOperatorStatus(input = {}) {
  const source = normalizeSource(input);
  const agentCount = Number(input.actualRealAgentCount ?? input.agentCount ?? 0);
  const healthStatus = input.healthStatus || input.overallHealthStatus || "unknown";
  const evidenceStatus = input.evidenceStatus || "unknown";
  const fallbackUsed = input.fallbackUsed === true;
  const fixtureAgentCount = Number(input.fixtureAgentCount ?? input.agentCount ?? 0);

  if (source === "mock" || source === "gateway-stub" || fixtureAgentCount === 8 && source !== "local-ingest") {
    return "fixture-mode";
  }

  if (hasUnsafeGuardrail(input) || hasUnsafeEvidence(input) || agentCount !== 1) {
    return "blocked";
  }

  if (source !== "local-ingest") {
    return "unknown";
  }

  if (["unknown", "stale", "review-required"].includes(healthStatus)
    || ["missing-fallback", "sample-fallback", "reviewed-invalid-fallback", "review-required"].includes(evidenceStatus)
    || fallbackUsed
    || input.reviewedInputStatus === "missing-fallback-to-sample"
    || input.reviewedInputStatus === "invalid-review-required") {
    return "review-required";
  }

  if (healthStatus === "online" && ["reviewed-valid", "local-file-only"].includes(evidenceStatus) === false && evidenceStatus !== "reviewed-valid") {
    return "review-required";
  }

  return "ok";
}

function buildStatusReasons(input = {}) {
  const status = classifyDailyOperatorStatus(input);
  const source = normalizeSource(input);
  const reasons = [];
  if (status === "fixture-mode") {
    reasons.push("Current source is fixture/demo data and not daily operator truth.");
  }
  if (status === "blocked") {
    if (Number(input.actualRealAgentCount ?? input.agentCount ?? 0) !== 1) reasons.push("Actual real agent count is not 1.");
    if (input.productionStatus !== "no-go-for-production") reasons.push("Production status is not no-go-for-production.");
    if (input.mutationEnabled !== false) reasons.push("Mutation is not disabled.");
    if (input.restartEnabled === true) reasons.push("Restart is enabled.");
    if (input.productionGatewayEnabled === true) reasons.push("Production gateway is enabled.");
    if (hasUnsafeEvidence(input)) reasons.push("Evidence redaction or unsafe evidence state needs blocking.");
  }
  if (status === "review-required") {
    if (["unknown", "stale", "review-required"].includes(input.healthStatus || input.overallHealthStatus)) {
      reasons.push("Health needs local operator review.");
    }
    if (input.fallbackUsed === true || ["missing-fallback", "sample-fallback", "reviewed-invalid-fallback", "review-required"].includes(input.evidenceStatus || "")) {
      reasons.push("Evidence fallback or review is active.");
    }
    if (input.reviewedInputStatus === "missing-fallback-to-sample") {
      reasons.push("Reviewed local health JSON is missing; safe sample fallback is active.");
    }
  }
  if (status === "ok") {
    reasons.push("Single-agent local-ingest source and read-only guardrails are aligned.");
  }
  if (status === "unknown") {
    reasons.push(`Cannot classify source ${source} as daily operator truth.`);
  }
  return reasons;
}

function buildSafeNextSteps(input = {}) {
  const status = classifyDailyOperatorStatus(input);
  const steps = [
    "Open recommended operator view.",
    "Review local health checklist.",
    "Review evidence checklist.",
    "Check reviewed-local-agent-health.example.json.",
    "Read troubleshooting guide."
  ];
  if (status === "fixture-mode") {
    return [
      "Open recommended operator view.",
      "Treat 8 agents as fixture/demo data only.",
      "Do not use mock or gateway-stub as daily operator truth."
    ];
  }
  if (status === "blocked") {
    return [
      "Stop daily interpretation and review blockers.",
      "Confirm production remains no-go-for-production.",
      "Do not restart, mutate, deploy, or connect production gateway."
    ];
  }
  return steps;
}

function buildBlockedActionSummary(input = {}) {
  return BLOCKED_ACTIONS.map((action) => ({
    action,
    enabled: false,
    reason: input.blockedActionReason || "Dashboard is read-only and local-only."
  }));
}

function buildRunbookCards(input = {}) {
  const status = classifyDailyOperatorStatus(input);
  return [
    {
      id: "daily-status",
      label: "Today status / 今日狀態",
      value: status,
      detail: status === "review-required" ? "需要人工審查" : status
    },
    {
      id: "source",
      label: "Source status / 資料來源狀態",
      value: normalizeSource(input),
      detail: "local-ingest is the daily recommended source."
    },
    {
      id: "agent-count",
      label: "Agent count / Agent 數量",
      value: String(input.actualRealAgentCount ?? input.agentCount ?? "unknown"),
      detail: "Expected real agent count: 1"
    },
    {
      id: "health",
      label: "Health status / 健康狀態",
      value: input.healthStatus || input.overallHealthStatus || "unknown",
      detail: input.healthReportPath || "apps/dashboard/data/generated/local-real-agent-health-report.json"
    },
    {
      id: "evidence",
      label: "Evidence status / 證據狀態",
      value: input.evidenceStatus || "unknown",
      detail: input.fallbackReason || "fallback reason: none"
    }
  ];
}

function buildDailyOperatorRunbook(input = {}) {
  const dailyStatus = classifyDailyOperatorStatus(input);
  return {
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
    actualRealAgentCount: Number(input.actualRealAgentCount ?? input.agentCount ?? 0),
    dailyStatus,
    statusReasons: buildStatusReasons(input),
    safeNextSteps: buildSafeNextSteps(input),
    blockedActions: BLOCKED_ACTIONS,
    blockedActionSummary: buildBlockedActionSummary(input),
    runbookCards: buildRunbookCards(input),
    warnings: safeArray(input.warnings),
    requiredFollowups: safeArray(input.requiredFollowups)
  };
}

window.OpenClawDailyOperatorRunbook = {
  DAILY_OPERATOR_STATUSES,
  BLOCKED_ACTIONS,
  buildDailyOperatorRunbook,
  classifyDailyOperatorStatus,
  buildSafeNextSteps,
  buildBlockedActionSummary,
  buildRunbookCards
};
})();
