(function () {
const REVIEWED_HEALTH_TEMPLATE_PATH = "apps/dashboard/data/local/reviewed-local-agent-health.template.json";
const REVIEWED_HEALTH_LOCAL_INPUT_PATH = "apps/dashboard/data/local/reviewed-local-agent-health.json";
const REVIEWED_HEALTH_DRY_RUN_REPORT_PATH = "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json";
const REVIEWED_HEALTH_TEMPLATE_REPORT_PATH = "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json";
const OPERATOR_REVIEWED_HEALTH_CHECKLIST_PATH = "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json";

const READINESS_STATUSES = [
  "ready-for-local-use",
  "needs-template-copy",
  "needs-operator-edit",
  "invalid-fallback-required",
  "unsafe-rejected",
  "missing-local-input",
  "review-required"
];

const HEALTH_STATUSES = ["online", "stale", "unknown", "review-required"];
const HEARTBEAT_STATUSES = ["fresh", "stale", "missing", "unknown"];
const ALLOWED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "generatedAt",
  "scope",
  "productionStatus",
  "safetyMode",
  "mutationEnabled",
  "productionWiring",
  "agentHealth"
];
const ALLOWED_AGENT_KEYS = [
  "agentId",
  "displayName",
  "expectedRealAgent",
  "source",
  "status",
  "heartbeatStatus",
  "lastSeenAt",
  "healthNotes",
  "reviewRequired"
];
const FORBIDDEN_KEY_PATTERN = /token|cookie|password|secret|apiKey|authorization|endpoint|productionEndpoint|webhook|email|phone|privateKey|credentials|session/i;
const FORBIDDEN_VALUE_PATTERN = /\bBearer\b|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildValidationFinding(path, key, ruleId, category, message) {
  return {
    path,
    key,
    ruleId,
    category,
    message,
    rawValuePrinted: false
  };
}

function isIsoTimestamp(value) {
  if (typeof value !== "string" || !value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function buildReviewedHealthInputTemplate() {
  return {
    schemaVersion: "local-agent-health.v1",
    generatedAt: "2026-06-11T00:00:00.000Z",
    scope: "local-reviewed-health-input",
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    agentHealth: [
      {
        agentId: "local-orchestrator",
        displayName: "Local Orchestrator",
        expectedRealAgent: true,
        source: "local-reviewed-json",
        status: "review-required",
        heartbeatStatus: "unknown",
        lastSeenAt: null,
        healthNotes: [
          "Sanitized operator-reviewed local health snapshot only.",
          "No restart, mutation, production gateway, token, cookie, or secret is allowed."
        ],
        reviewRequired: true
      }
    ]
  };
}

function buildReviewedHealthInputGuide() {
  return {
    templatePath: REVIEWED_HEALTH_TEMPLATE_PATH,
    localInputPath: REVIEWED_HEALTH_LOCAL_INPUT_PATH,
    dryRunReportPath: REVIEWED_HEALTH_DRY_RUN_REPORT_PATH,
    templateReportPath: REVIEWED_HEALTH_TEMPLATE_REPORT_PATH,
    checklistPath: OPERATOR_REVIEWED_HEALTH_CHECKLIST_PATH,
    readinessStatuses: READINESS_STATUSES,
    commitPolicy: "local-only-do-not-commit",
    redactionApplied: true,
    rawValuesPrinted: false,
    steps: [
      "Copy reviewed-local-agent-health.template.json to reviewed-local-agent-health.json locally.",
      "Edit only sanitized local agent health fields.",
      "Run the dry-run validator before generating local health reports.",
      "Do not commit the real reviewed-local-agent-health.json file."
    ],
    notAllowed: [
      "token",
      "cookie",
      "password",
      "secret",
      "apiKey",
      "authorization",
      "endpoint",
      "productionEndpoint",
      "webhook",
      "email",
      "phone",
      "privateKey",
      "credentials",
      "session",
      "restart-agent",
      "mutation",
      "production-gateway-connect"
    ]
  };
}

function inspectUnsafeKeys(value, findings, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectUnsafeKeys(item, findings, `${path}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      const childPath = `${path}.${key}`;
      if (FORBIDDEN_KEY_PATTERN.test(key)) {
        findings.push(buildValidationFinding(childPath, key, "forbidden-key", "unsafe-key", "Forbidden reviewed health input key was rejected; raw value was not printed."));
      }
      inspectUnsafeKeys(child, findings, childPath);
    });
    return;
  }
  if (typeof value === "string" && FORBIDDEN_VALUE_PATTERN.test(value)) {
    findings.push(buildValidationFinding(path, path.split(".").pop() || "value", "forbidden-value-pattern", "unsafe-value", "Unsafe value pattern was rejected; raw value was not printed."));
  }
}

function validateReviewedHealthInputDryRun(input) {
  const findings = [];
  if (!isPlainObject(input)) {
    findings.push(buildValidationFinding("$", "root", "root-object-required", "schema-validation", "Reviewed health input must be a JSON object."));
    return {
      acceptedForLocalUse: false,
      readinessStatus: "invalid-fallback-required",
      validationFindings: findings,
      redactionApplied: true,
      rawValuesPrinted: false
    };
  }

  inspectUnsafeKeys(input, findings);

  Object.keys(input).forEach((key) => {
    if (!ALLOWED_TOP_LEVEL_KEYS.includes(key)) {
      findings.push(buildValidationFinding(`$.${key}`, key, "top-level-key-not-allowed", "schema-validation", "Only approved reviewed health input keys are allowed."));
    }
  });
  if (input.schemaVersion !== "local-agent-health.v1") {
    findings.push(buildValidationFinding("$.schemaVersion", "schemaVersion", "schema-version", "schema-validation", "schemaVersion must be local-agent-health.v1."));
  }
  if (!isIsoTimestamp(input.generatedAt)) {
    findings.push(buildValidationFinding("$.generatedAt", "generatedAt", "generated-at", "schema-validation", "generatedAt must be an ISO timestamp."));
  }
  if (input.scope !== "local-reviewed-health-input") {
    findings.push(buildValidationFinding("$.scope", "scope", "scope", "schema-validation", "scope must be local-reviewed-health-input."));
  }
  if (input.productionStatus !== "no-go-for-production") {
    findings.push(buildValidationFinding("$.productionStatus", "productionStatus", "production-status", "safety-guardrail", "productionStatus must remain no-go-for-production."));
  }
  if (input.safetyMode !== "read-only") {
    findings.push(buildValidationFinding("$.safetyMode", "safetyMode", "safety-mode", "safety-guardrail", "safetyMode must be read-only."));
  }
  if (input.mutationEnabled !== false) {
    findings.push(buildValidationFinding("$.mutationEnabled", "mutationEnabled", "mutation-disabled", "safety-guardrail", "mutationEnabled must be false."));
  }
  if (input.productionWiring !== "disabled") {
    findings.push(buildValidationFinding("$.productionWiring", "productionWiring", "production-wiring", "safety-guardrail", "productionWiring must be disabled."));
  }
  if (!Array.isArray(input.agentHealth) || input.agentHealth.length !== 1) {
    findings.push(buildValidationFinding("$.agentHealth", "agentHealth", "single-agent-required", "operator-truth", "agentHealth must contain exactly 1 real agent candidate."));
  }

  const agent = Array.isArray(input.agentHealth) ? input.agentHealth[0] : null;
  if (agent) {
    Object.keys(agent).forEach((key) => {
      if (!ALLOWED_AGENT_KEYS.includes(key)) {
        findings.push(buildValidationFinding(`$.agentHealth[0].${key}`, key, "agent-key-not-allowed", "schema-validation", "Only approved agent health keys are allowed."));
      }
    });
    if (agent.agentId !== "local-orchestrator") {
      findings.push(buildValidationFinding("$.agentHealth[0].agentId", "agentId", "single-agent-id", "operator-truth", "agentId must be local-orchestrator for the current single-agent operator truth."));
    }
    if (agent.expectedRealAgent !== true) {
      findings.push(buildValidationFinding("$.agentHealth[0].expectedRealAgent", "expectedRealAgent", "expected-real-agent", "operator-truth", "expectedRealAgent must be true."));
    }
    if (agent.source !== "local-reviewed-json") {
      findings.push(buildValidationFinding("$.agentHealth[0].source", "source", "local-reviewed-source", "operator-truth", "agent source must be local-reviewed-json."));
    }
    if (!HEALTH_STATUSES.includes(agent.status)) {
      findings.push(buildValidationFinding("$.agentHealth[0].status", "status", "health-status", "schema-validation", "agent status is not an allowed reviewed health status."));
    }
    if (!HEARTBEAT_STATUSES.includes(agent.heartbeatStatus)) {
      findings.push(buildValidationFinding("$.agentHealth[0].heartbeatStatus", "heartbeatStatus", "heartbeat-status", "schema-validation", "heartbeatStatus is not an allowed heartbeat status."));
    }
    if (agent.lastSeenAt !== null && agent.lastSeenAt !== undefined && !isIsoTimestamp(agent.lastSeenAt)) {
      findings.push(buildValidationFinding("$.agentHealth[0].lastSeenAt", "lastSeenAt", "last-seen-at", "schema-validation", "lastSeenAt must be null or an ISO timestamp."));
    }
    if (!Array.isArray(agent.healthNotes)) {
      findings.push(buildValidationFinding("$.agentHealth[0].healthNotes", "healthNotes", "health-notes", "schema-validation", "healthNotes must be an array of sanitized notes."));
    }
  }

  const unsafe = findings.some((finding) => finding.category === "unsafe-key" || finding.category === "unsafe-value");
  const valid = findings.length === 0;
  return {
    acceptedForLocalUse: valid,
    readinessStatus: unsafe ? "unsafe-rejected" : valid ? "ready-for-local-use" : "invalid-fallback-required",
    validationFindings: findings,
    redactionApplied: true,
    rawValuesPrinted: false
  };
}

function buildRedactedReviewedHealthPreview(input) {
  const agentCount = Array.isArray(input?.agentHealth) ? input.agentHealth.length : 0;
  const agent = agentCount === 1 ? input.agentHealth[0] : {};
  return {
    schemaVersion: input?.schemaVersion || "unknown",
    scope: input?.scope || "unknown",
    productionStatus: input?.productionStatus || "unknown",
    safetyMode: input?.safetyMode || "unknown",
    mutationEnabled: input?.mutationEnabled === false ? false : "unknown",
    productionWiring: input?.productionWiring || "unknown",
    agentCount,
    agentId: agent?.agentId || "unknown",
    source: agent?.source || "unknown",
    status: agent?.status || "unknown",
    heartbeatStatus: agent?.heartbeatStatus || "unknown",
    redactionApplied: true,
    rawValuesPrinted: false
  };
}

function classifyReviewedHealthInputReadiness(input) {
  if (input === null || input === undefined) return "missing-local-input";
  const validation = validateReviewedHealthInputDryRun(input);
  return validation.readinessStatus;
}

window.OpenClawReviewedHealthInputAssistant = {
  READINESS_STATUSES,
  REVIEWED_HEALTH_TEMPLATE_PATH,
  REVIEWED_HEALTH_LOCAL_INPUT_PATH,
  REVIEWED_HEALTH_DRY_RUN_REPORT_PATH,
  REVIEWED_HEALTH_TEMPLATE_REPORT_PATH,
  OPERATOR_REVIEWED_HEALTH_CHECKLIST_PATH,
  buildReviewedHealthInputTemplate,
  buildReviewedHealthInputGuide,
  validateReviewedHealthInputDryRun,
  buildRedactedReviewedHealthPreview,
  classifyReviewedHealthInputReadiness
};
})();
