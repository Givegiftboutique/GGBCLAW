(function () {
const HEALTH_STATUSES = ["online", "stale", "unknown", "review-required"];
const HEARTBEAT_STATUSES = ["fresh", "stale", "missing", "unknown"];
const FRESH_HEARTBEAT_MS = 15 * 60 * 1000;
const STALE_HEARTBEAT_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function classifyHeartbeat(lastSeenAt, generatedAt = new Date().toISOString()) {
  if (lastSeenAt === null || lastSeenAt === undefined || lastSeenAt === "") {
    return "missing";
  }
  const lastSeenDate = toDate(lastSeenAt);
  const generatedDate = toDate(generatedAt);
  if (!lastSeenDate || !generatedDate) return "unknown";
  const ageMs = Math.max(0, generatedDate.getTime() - lastSeenDate.getTime());
  if (ageMs <= FRESH_HEARTBEAT_MS) return "fresh";
  if (ageMs <= STALE_HEARTBEAT_MS) return "stale";
  return "stale";
}

function normalizeStatus(entry, generatedAt) {
  if (entry.reviewRequired === true) return "review-required";
  const heartbeat = entry.heartbeatStatus && HEARTBEAT_STATUSES.includes(entry.heartbeatStatus)
    ? entry.heartbeatStatus
    : classifyHeartbeat(entry.lastSeenAt, generatedAt);
  if (heartbeat === "fresh") return "online";
  if (heartbeat === "stale") return "stale";
  if (heartbeat === "missing") return entry.status === "unknown" ? "unknown" : "review-required";
  return HEALTH_STATUSES.includes(entry.status) ? entry.status : "unknown";
}

function evaluateLocalAgentHealth(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const agentHealth = Array.isArray(input.agentHealth) ? input.agentHealth : [];
  const agents = agentHealth.map((entry) => {
    const heartbeatStatus = entry.heartbeatStatus && HEARTBEAT_STATUSES.includes(entry.heartbeatStatus)
      ? entry.heartbeatStatus
      : classifyHeartbeat(entry.lastSeenAt, generatedAt);
    const status = normalizeStatus({ ...entry, heartbeatStatus }, generatedAt);
    return {
      agentId: entry.agentId || "unknown-agent",
      displayName: entry.displayName || entry.agentId || "Unknown local agent",
      expectedRealAgent: entry.expectedRealAgent === true,
      source: entry.source || "local-readonly-health-snapshot",
      status,
      heartbeatStatus,
      lastSeenAt: entry.lastSeenAt ?? null,
      healthNotes: Array.isArray(entry.healthNotes) ? entry.healthNotes : [],
      reviewRequired: entry.reviewRequired === true || status === "review-required",
      localOnly: true,
      notificationSent: false,
      mutationEnabled: false,
      productionWiring: "disabled"
    };
  });
  const hasReview = agents.some((agent) => agent.status === "review-required");
  const hasUnknown = agents.some((agent) => agent.status === "unknown");
  const hasStale = agents.some((agent) => agent.status === "stale");
  const hasOnline = agents.some((agent) => agent.status === "online");
  const overallHealthStatus = hasReview
    ? "review-required"
    : hasUnknown || agents.length === 0
      ? "unknown"
      : hasStale
        ? "stale"
        : hasOnline
          ? "online"
          : "unknown";
  return {
    generatedAt,
    scope: "local-readonly-agent-health",
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    healthConnectionStatus: "local-file-only",
    overallHealthStatus,
    agents,
    blockedActions: [
      "restart-agent",
      "stop-agent",
      "start-agent",
      "production-gateway-connect",
      "mutation"
    ]
  };
}

function summarizeLocalAgentHealth(input = {}) {
  const evaluation = evaluateLocalAgentHealth(input);
  return {
    totalAgents: evaluation.agents.length,
    online: evaluation.agents.filter((agent) => agent.status === "online").length,
    stale: evaluation.agents.filter((agent) => agent.status === "stale").length,
    unknown: evaluation.agents.filter((agent) => agent.status === "unknown").length,
    reviewRequired: evaluation.agents.filter((agent) => agent.status === "review-required").length,
    overallHealthStatus: evaluation.overallHealthStatus,
    healthConnectionStatus: evaluation.healthConnectionStatus,
    safetyMode: evaluation.safetyMode,
    mutationEnabled: evaluation.mutationEnabled,
    productionWiring: evaluation.productionWiring
  };
}

window.OpenClawLocalAgentHealth = {
  HEALTH_STATUSES,
  HEARTBEAT_STATUSES,
  classifyHeartbeat,
  evaluateLocalAgentHealth,
  summarizeLocalAgentHealth
};
})();
