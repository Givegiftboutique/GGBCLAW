(function () {
const EXPECTED_ENDPOINTS = [
  "/dashboard/metrics",
  "/dashboard/agents",
  "/dashboard/agents/:id",
  "/dashboard/tasks",
  "/dashboard/tasks/:id",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/source-status"
];

const REQUIRED_FIXTURE_KEYS = [
  "metrics",
  "agents",
  "agentDetail",
  "tasks",
  "taskDetail",
  "reviews",
  "logs",
  "backups",
  "settings",
  "rbac",
  "sourceStatus"
];

const LIFECYCLE = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
const SECRET_VALUE_RE = /(password|token|cookie|api[_-]?key)\s*[:=]/i;
const PRODUCTION_ENDPOINT_RE = /^https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;

function walkValues(value, path, issues, predicate) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValues(item, `${path}[${index}]`, issues, predicate));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walkValues(item, `${path}.${key}`, issues, predicate));
    return;
  }
  if (typeof value === "string" && predicate(value)) {
    issues.push(path);
  }
}

function collectSafetyIssues(payload) {
  const issues = [];
  walkValues(payload, "gateway", issues, (value) => SECRET_VALUE_RE.test(value));
  walkValues(payload, "gateway", issues, (value) => PRODUCTION_ENDPOINT_RE.test(value.trim()));
  return issues;
}

function validateEnvelope(name, payload, expectedEndpoint) {
  const issues = [];
  if (!payload || typeof payload !== "object") {
    return [`${name} fixture must be an object.`];
  }
  if (payload.meta?.contractVersion !== "gateway-read-only-v1") {
    issues.push(`${name} contractVersion must be gateway-read-only-v1.`);
  }
  if (payload.meta?.endpoint !== expectedEndpoint) {
    issues.push(`${name} endpoint must be ${expectedEndpoint}.`);
  }
  if (payload.meta?.safetyMode !== "read-only") {
    issues.push(`${name} safetyMode must be read-only.`);
  }
  if (payload.meta?.mutationEnabled !== false) {
    issues.push(`${name} mutationEnabled must be false.`);
  }
  if (payload.meta?.productionWiring !== "disabled") {
    issues.push(`${name} productionWiring must be disabled.`);
  }
  if (!payload.data || typeof payload.data !== "object") {
    issues.push(`${name} data object is required.`);
  }
  if (!Array.isArray(payload.errors)) {
    issues.push(`${name} errors must be an array.`);
  }
  return issues;
}

function validateGatewayFixtureSet(fixtures) {
  const issues = [];
  REQUIRED_FIXTURE_KEYS.forEach((key) => {
    if (!fixtures?.[key]) {
      issues.push(`Missing gateway fixture: ${key}.`);
    }
  });
  if (issues.length) return { ok: false, issues };

  REQUIRED_FIXTURE_KEYS.forEach((key, index) => {
    issues.push(...validateEnvelope(key, fixtures[key], EXPECTED_ENDPOINTS[index]));
  });
  issues.push(...collectSafetyIssues(fixtures).map((issue) => `unsafe gateway stub value at ${issue}`));

  const mapper = window.OpenClawGatewayContractMapper;
  const validation = window.OpenClawDashboardValidation;
  try {
    const exportPayload = mapper.createDashboardExportFromGatewayFixtures(fixtures);
    const exportResult = validation.validateDashboardExport(exportPayload);
    if (!exportResult.ok) {
      issues.push(...exportResult.issues);
    }
    const agentCount = exportPayload.agents?.length ?? 0;
    if (agentCount !== 8) {
      issues.push(`Gateway stub must include 8 agents; found ${agentCount}.`);
    }
    const statuses = new Set((exportPayload.tasks ?? []).map((task) => task.status));
    LIFECYCLE.forEach((status) => {
      if (!statuses.has(status)) {
        issues.push(`Gateway stub missing task lifecycle status: ${status}.`);
      }
    });
    const status = exportPayload.sourceStatus;
    if (status?.currentSource !== "gateway-stub") {
      issues.push("Gateway sourceStatus currentSource must be gateway-stub.");
    }
    if (status?.safetyMode !== "read-only") {
      issues.push("Gateway sourceStatus safetyMode must be read-only.");
    }
    if (status?.productionWiring !== "disabled") {
      issues.push("Gateway sourceStatus productionWiring must be disabled.");
    }
  } catch (error) {
    issues.push(error.message);
  }

  return { ok: issues.length === 0, issues };
}

window.OpenClawGatewayContractValidation = {
  EXPECTED_ENDPOINTS,
  REQUIRED_FIXTURE_KEYS,
  validateGatewayFixtureSet
};
})();
