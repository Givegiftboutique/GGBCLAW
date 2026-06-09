(function () {
const AGENT_STATUSES = new Set(["online", "busy", "degraded", "offline"]);
const RISK_LEVELS = new Set(["low", "medium", "high"]);
const TASK_STATUSES = new Set(["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"]);
const PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const REVIEW_VERDICTS = new Set(["pending", "approved", "rejected", "needs_changes"]);
const SEVERITIES = new Set(["info", "warning", "error", "critical"]);
const METRIC_STATUSES = new Set(["healthy", "watch", "blocked"]);
const BACKUP_STATUSES = new Set(["verified", "pending", "failed"]);
const SECRET_VALUE_RE = /(password|token|cookie|api[_-]?key)\s*[:=]/i;
const PRODUCTION_ENDPOINT_RE = /^https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function requireText(record, field, label) {
  const value = record?.[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}.${field} is required.`);
  }
  checkSafeValue(field, value, `${label}.${field}`);
  return value;
}

function optionalText(record, field, label) {
  const value = record?.[field];
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== "string") {
    throw new Error(`${label}.${field} must be text or null.`);
  }
  checkSafeValue(field, value, `${label}.${field}`);
  return value;
}

function requireNumber(record, field, label) {
  const value = record?.[field];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label}.${field} must be a number.`);
  }
  return value;
}

function requireList(record, field, label) {
  const value = record?.[field];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label}.${field} must be a non-empty list.`);
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`${label}.${field}[${index}] must be text.`);
    }
    checkSafeValue(`${field}[${index}]`, item, `${label}.${field}[${index}]`);
  });
  return value;
}

function requireEnum(record, field, allowed, label) {
  const value = requireText(record, field, label);
  if (!allowed.has(value)) {
    throw new Error(`${label}.${field} has unsupported value: ${value}`);
  }
  return value;
}

function checkSafeValue(field, value, label) {
  if (typeof value === "string" && PRODUCTION_ENDPOINT_RE.test(value.trim())) {
    throw new Error(`${label} contains a non-local endpoint.`);
  }
  if (typeof value === "string" && SECRET_VALUE_RE.test(value)) {
    throw new Error(`${label} contains a secret-like assignment.`);
  }
}

function validateAgentRecord(agent, index) {
  const label = `AgentRecord[${index}]`;
  requireText(agent, "id", label);
  requireText(agent, "name", label);
  requireText(agent, "role", label);
  requireText(agent, "runtime", label);
  requireText(agent, "model", label);
  requireText(agent, "workspace", label);
  requireText(agent, "sandbox", label);
  requireText(agent, "toolsProfile", label);
  requireEnum(agent, "status", AGENT_STATUSES, label);
  requireText(agent, "lastHeartbeat", label);
  requireEnum(agent, "riskLevel", RISK_LEVELS, label);
  requireList(agent, "responsibilities", label);
  requireList(agent, "allowedActions", label);
  requireList(agent, "deniedActions", label);
  return agent;
}

function validateTaskRun(task, index) {
  const label = `TaskRun[${index}]`;
  requireText(task, "id", label);
  requireText(task, "workflow", label);
  requireEnum(task, "status", TASK_STATUSES, label);
  requireEnum(task, "priority", PRIORITIES, label);
  requireNumber(task, "attempt", label);
  requireText(task, "ownerAgent", label);
  requireText(task, "reviewer", label);
  requireText(task, "createdAt", label);
  requireText(task, "updatedAt", label);
  requireText(task, "summary", label);
  return task;
}

function validateReviewGate(review, index) {
  const label = `ReviewGate[${index}]`;
  requireText(review, "id", label);
  requireText(review, "taskId", label);
  requireText(review, "reviewer", label);
  requireEnum(review, "verdict", REVIEW_VERDICTS, label);
  requireList(review, "policyChecks", label);
  requireText(review, "notes", label);
  requireText(review, "createdAt", label);
  return review;
}

function validateAuditEvent(event, index) {
  const label = `AuditEvent[${index}]`;
  requireText(event, "id", label);
  requireText(event, "timestamp", label);
  requireEnum(event, "severity", SEVERITIES, label);
  requireText(event, "actor", label);
  requireText(event, "event", label);
  if (typeof event.redacted !== "boolean") {
    throw new Error(`${label}.redacted must be boolean.`);
  }
  optionalText(event, "taskId", label);
  optionalText(event, "agentId", label);
  return event;
}

function validateBackupManifest(backup, index) {
  const label = `BackupManifest[${index}]`;
  requireText(backup, "id", label);
  requireText(backup, "taskId", label);
  requireEnum(backup, "verifyStatus", BACKUP_STATUSES, label);
  requireText(backup, "checksum", label);
  requireText(backup, "storageUri", label);
  requireText(backup, "createdAt", label);
  optionalText(backup, "restoreTestedAt", label);
  requireList(backup, "evidenceChain", label);
  return backup;
}

function validateDashboardMetric(metric, index) {
  const label = `DashboardMetric[${index}]`;
  requireText(metric, "id", label);
  requireText(metric, "label", label);
  requireText(metric, "value", label);
  requireText(metric, "trend", label);
  requireEnum(metric, "status", METRIC_STATUSES, label);
  requireText(metric, "description", label);
  return metric;
}

function validateDashboardSettings(settings) {
  const label = "DashboardSettings";
  requireText(settings, "gatewayAuthMode", label);
  requireText(settings, "retentionPolicy", label);
  requireText(settings, "modelRouting", label);
  requireList(settings, "mcpServers", label);
  requireText(settings, "secretRefsHealth", label);
  requireText(settings, "productionMutation", label);
  return settings;
}

function createRbacSummary(agents) {
  return agents.map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    riskLevel: agent.riskLevel,
    allowedActions: agent.allowedActions,
    deniedActions: agent.deniedActions
  }));
}

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

function detectSecretLikeValues(payload) {
  const issues = [];
  walkValues(payload, "payload", issues, (value) => SECRET_VALUE_RE.test(value));
  return issues;
}

function detectProductionEndpointValues(payload) {
  const issues = [];
  walkValues(payload, "payload", issues, (value) => PRODUCTION_ENDPOINT_RE.test(value.trim()));
  return issues;
}

function validationResult(fn) {
  try {
    fn();
    return { ok: true, issues: [] };
  } catch (error) {
    return { ok: false, issues: [error.message] };
  }
}

function validateDashboardExport(payload) {
  const secretIssues = detectSecretLikeValues(payload);
  const endpointIssues = detectProductionEndpointValues(payload);
  if (secretIssues.length || endpointIssues.length) {
    return {
      ok: false,
      issues: [
        ...secretIssues.map((issue) => `secret-like value at ${issue}`),
        ...endpointIssues.map((issue) => `production endpoint value at ${issue}`)
      ]
    };
  }
  return validationResult(() => normalizeDashboardData(payload));
}

function validateSourceConfig(config) {
  return validationResult(() => {
    if (!config || typeof config !== "object") {
      throw new Error("Source config is required.");
    }
    if (!["mock", "json", "artifact"].includes(config.source)) {
      throw new Error(`Unsupported source: ${config.source}`);
    }
    if (typeof config.dataUrl !== "string" || !config.dataUrl.trim()) {
      throw new Error("Source config dataUrl is required.");
    }
    if (PRODUCTION_ENDPOINT_RE.test(config.dataUrl.trim())) {
      throw new Error("Source config cannot use a production endpoint.");
    }
  });
}

function validateSourceStatus(status) {
  return validationResult(() => {
    if (!status || typeof status !== "object") {
      throw new Error("Source status is required.");
    }
    if (!["mock", "json", "artifact"].includes(status.currentSource)) {
      throw new Error(`Unsupported source status: ${status.currentSource}`);
    }
    if (!["ok", "warning", "error"].includes(status.health)) {
      throw new Error(`Unsupported source health: ${status.health}`);
    }
    if (!["passed", "failed"].includes(status.validation)) {
      throw new Error(`Unsupported validation status: ${status.validation}`);
    }
    if (!["none", "mock"].includes(status.fallback)) {
      throw new Error(`Unsupported fallback status: ${status.fallback}`);
    }
  });
}

function validateArtifactManifest(payload) {
  const secretIssues = detectSecretLikeValues(payload);
  const endpointIssues = detectProductionEndpointValues(payload);
  if (secretIssues.length || endpointIssues.length) {
    return {
      ok: false,
      issues: [
        ...secretIssues.map((issue) => `secret-like value at ${issue}`),
        ...endpointIssues.map((issue) => `production endpoint value at ${issue}`)
      ]
    };
  }
  return validationResult(() => {
    requireText(payload, "manifestId", "ArtifactManifest");
    requireText(payload, "createdAt", "ArtifactManifest");
    requireText(payload, "checksum", "ArtifactManifest");
    requireEnum(payload, "verifyStatus", BACKUP_STATUSES, "ArtifactManifest");
    requireList(payload, "artifactRefs", "ArtifactManifest");
    normalizeDashboardData(payload.dashboardData);
  });
}

function normalizeDashboardData(source) {
  if (!source || typeof source !== "object") {
    throw new Error("Dashboard data source is required.");
  }
  const agents = assertArray(source.agents, "agents").map(validateAgentRecord);
  const tasks = assertArray(source.tasks, "tasks").map(validateTaskRun);
  const reviews = assertArray(source.reviews, "reviews").map(validateReviewGate);
  const logs = assertArray(source.auditEvents, "auditEvents").map(validateAuditEvent);
  const backups = assertArray(source.backups, "backups").map(validateBackupManifest);
  const metrics = assertArray(source.metrics, "metrics").map(validateDashboardMetric);
  const settings = validateDashboardSettings(source.settings);
  return {
    agents,
    tasks,
    reviews,
    logs,
    backups,
    metrics,
    settings,
    rbacSummary: createRbacSummary(agents)
  };
}

window.OpenClawDashboardValidation = {
  normalizeDashboardData,
  validateDashboardExport,
  validateSourceConfig,
  validateSourceStatus,
  detectSecretLikeValues,
  detectProductionEndpointValues,
  validateArtifactManifest,
  validateAgentRecord,
  validateTaskRun,
  validateReviewGate,
  validateAuditEvent,
  validateBackupManifest,
  validateDashboardMetric,
  validateDashboardSettings
};
})();
