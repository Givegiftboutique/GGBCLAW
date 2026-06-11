(function () {
const HEALTH_STATUSES = ["online", "stale", "unknown", "review-required"];
const HEARTBEAT_STATUSES = ["fresh", "stale", "missing", "unknown"];
const FRESH_HEARTBEAT_MS = 15 * 60 * 1000;
const STALE_HEARTBEAT_MS = 24 * 60 * 60 * 1000;
const REVIEWED_HEALTH_SCHEMA_VERSION = "local-agent-health.v1";
const REVIEWED_HEALTH_SOURCE = "operator-reviewed-local-snapshot";
const REVIEWED_AGENT_SOURCE = "local-reviewed-json";
const SUSPICIOUS_KEY_PATTERN = /apiKey|api_key|authorization|bearer|token|cookie|secret|password|credential|privateKey|accessToken|refreshToken/i;
const SUSPICIOUS_VALUE_PATTERN = /\bBearer\b|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i;
const REQUIRED_REVIEWED_SAFETY_FLAGS = {
  localOnly: true,
  secretsIncluded: false,
  remoteFetchUsed: false,
  mutationAllowed: false,
  restartAllowed: false,
  productionGatewayConnected: false
};

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function addValidationError(errors, path, key, message) {
  errors.push({ path, key, message });
}

function inspectForUnsafeReviewedContent(value, errors, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectForUnsafeReviewedContent(item, errors, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      const childPath = `${path}.${key}`;
      if (SUSPICIOUS_KEY_PATTERN.test(key) && childPath !== "$.safety.secretsIncluded") {
        addValidationError(errors, childPath, key, "Suspicious key is not allowed in reviewed local health JSON.");
      }
      inspectForUnsafeReviewedContent(child, errors, childPath);
    });
    return;
  }
  if (typeof value === "string") {
    if (/https?:\/\//i.test(value) && !/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(value)) {
      addValidationError(errors, path, path.split(".").pop() || "value", "Remote URL values are not allowed in reviewed local health JSON.");
    }
    if (SUSPICIOUS_VALUE_PATTERN.test(value)) {
      addValidationError(errors, path, path.split(".").pop() || "value", "Secret-like value pattern is not allowed in reviewed local health JSON.");
    }
  }
}

function validateReviewedLocalAgentHealth(input = {}) {
  const errors = [];
  if (!isPlainObject(input)) {
    addValidationError(errors, "$", "root", "Reviewed local health JSON must be an object.");
    return { valid: false, errors };
  }

  inspectForUnsafeReviewedContent(input, errors);

  if (input.schemaVersion !== REVIEWED_HEALTH_SCHEMA_VERSION) {
    addValidationError(errors, "$.schemaVersion", "schemaVersion", "schemaVersion must be local-agent-health.v1.");
  }
  if (input.source !== REVIEWED_HEALTH_SOURCE) {
    addValidationError(errors, "$.source", "source", "source must be operator-reviewed-local-snapshot.");
  }
  if (!toDate(input.reviewedAt)) {
    addValidationError(errors, "$.reviewedAt", "reviewedAt", "reviewedAt must be an ISO timestamp.");
  }
  if (input.environment !== "local") {
    addValidationError(errors, "$.environment", "environment", "environment must be local.");
  }
  if (input.productionReady !== false) {
    addValidationError(errors, "$.productionReady", "productionReady", "productionReady must be false.");
  }
  if (input.expectedAgentCount !== 1) {
    addValidationError(errors, "$.expectedAgentCount", "expectedAgentCount", "expectedAgentCount must be 1.");
  }
  if (!Array.isArray(input.agents) || input.agents.length !== 1) {
    addValidationError(errors, "$.agents", "agents", "agents length must be exactly 1.");
  }

  const agent = Array.isArray(input.agents) ? input.agents[0] : null;
  if (agent) {
    if (!agent.agentId || typeof agent.agentId !== "string") {
      addValidationError(errors, "$.agents[0].agentId", "agentId", "agentId is required.");
    }
    if (!HEALTH_STATUSES.includes(agent.status)) {
      addValidationError(errors, "$.agents[0].status", "status", "agent status is not allowed.");
    }
    if (agent.source !== REVIEWED_AGENT_SOURCE) {
      addValidationError(errors, "$.agents[0].source", "source", "agent source must be local-reviewed-json.");
    }
    if (!isPlainObject(agent.heartbeat)) {
      addValidationError(errors, "$.agents[0].heartbeat", "heartbeat", "heartbeat object is required.");
    } else {
      if (!HEARTBEAT_STATUSES.includes(agent.heartbeat.status)) {
        addValidationError(errors, "$.agents[0].heartbeat.status", "status", "heartbeat status is not allowed.");
      }
      if (agent.heartbeat.lastSeenAt !== null && agent.heartbeat.lastSeenAt !== undefined && !toDate(agent.heartbeat.lastSeenAt)) {
        addValidationError(errors, "$.agents[0].heartbeat.lastSeenAt", "lastSeenAt", "lastSeenAt must be null or an ISO timestamp.");
      }
      if (agent.heartbeat.staleAfterSeconds !== undefined && (!Number.isFinite(agent.heartbeat.staleAfterSeconds) || agent.heartbeat.staleAfterSeconds <= 0)) {
        addValidationError(errors, "$.agents[0].heartbeat.staleAfterSeconds", "staleAfterSeconds", "staleAfterSeconds must be a positive number.");
      }
    }
  }

  if (!isPlainObject(input.safety)) {
    addValidationError(errors, "$.safety", "safety", "safety object is required.");
  } else {
    Object.entries(REQUIRED_REVIEWED_SAFETY_FLAGS).forEach(([key, expected]) => {
      if (input.safety[key] !== expected) {
        addValidationError(errors, `$.safety.${key}`, key, `${key} must be ${String(expected)}.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function reviewedHealthToLocalInput(input = {}) {
  const agent = Array.isArray(input.agents) ? input.agents[0] || {} : {};
  const heartbeat = isPlainObject(agent.heartbeat) ? agent.heartbeat : {};
  return {
    generatedAt: input.reviewedAt || new Date().toISOString(),
    source: REVIEWED_AGENT_SOURCE,
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    agentHealth: [
      {
        agentId: agent.agentId || "unknown-agent",
        displayName: agent.displayName || agent.agentId || "Unknown local agent",
        expectedRealAgent: true,
        source: REVIEWED_AGENT_SOURCE,
        status: HEALTH_STATUSES.includes(agent.status) ? agent.status : "review-required",
        heartbeatStatus: HEARTBEAT_STATUSES.includes(heartbeat.status) ? heartbeat.status : "unknown",
        lastSeenAt: heartbeat.lastSeenAt ?? null,
        healthNotes: Array.isArray(agent.notes) ? agent.notes : [],
        reviewRequired: agent.status === "review-required" || heartbeat.status === "unknown" || heartbeat.status === "missing"
      }
    ]
  };
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
  REVIEWED_HEALTH_SCHEMA_VERSION,
  REVIEWED_HEALTH_SOURCE,
  REVIEWED_AGENT_SOURCE,
  classifyHeartbeat,
  validateReviewedLocalAgentHealth,
  reviewedHealthToLocalInput,
  evaluateLocalAgentHealth,
  summarizeLocalAgentHealth
};
})();
