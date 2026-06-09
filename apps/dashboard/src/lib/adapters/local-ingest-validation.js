(function () {
const SECRET_VALUE_RE = /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i;
const PRODUCTION_ENDPOINT_RE = /^https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;
const ABSOLUTE_MACHINE_PATH_RE = /[A-Za-z]:\\Users\\/i;
const LIFECYCLE = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];

function walkValues(value, path, issues, predicate) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValues(item, `${path}[${index}]`, issues, predicate));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walkValues(item, `${path}.${key}`, issues, predicate));
    return;
  }
  if (typeof value === "string" && predicate(value)) issues.push(path);
}

function validateLocalIngestPayload(payload) {
  const issues = [];
  const warnings = [];
  if (!payload || typeof payload !== "object") issues.push("Local ingest payload must be an object.");
  if (payload?.metadata?.mutationEnabled !== false) issues.push("Local ingest mutationEnabled must be false.");
  if (payload?.metadata?.safetyMode !== "read-only") issues.push("Local ingest safetyMode must be read-only.");
  if (!payload?.agents && !payload?.tasks && !payload?.logs && !payload?.crawlerOutput && !payload?.agentRuns && !payload?.taskMemory && !payload?.artifactIndex) {
    issues.push("Local ingest payload must include a supported data section.");
  }

  walkValues(payload, "localIngest", issues, (value) => SECRET_VALUE_RE.test(value));
  walkValues(payload, "localIngest", issues, (value) => PRODUCTION_ENDPOINT_RE.test(value.trim()));
  walkValues(payload, "localIngest", issues, (value) => ABSOLUTE_MACHINE_PATH_RE.test(value));

  const statuses = new Set((payload?.tasks || payload?.taskMemory || []).map((task) => task.status));
  for (const status of LIFECYCLE) {
    if (!statuses.has(status)) warnings.push(`Local ingest lifecycle status not present in raw data: ${status}`);
  }
  return { ok: issues.length === 0, issues, warnings };
}

function validateMappedLocalIngestExport(exportPayload) {
  const dashboardValidation = window.OpenClawDashboardValidation;
  const result = dashboardValidation.validateDashboardExport(exportPayload);
  const issues = [...result.issues];
  if (exportPayload.metadata?.mutationEnabled !== false) issues.push("Mapped local ingest mutationEnabled must be false.");
  if (exportPayload.metadata?.safetyMode !== "read-only") issues.push("Mapped local ingest safetyMode must be read-only.");
  if (exportPayload.sourceStatus?.productionWiring !== "disabled") issues.push("Mapped local ingest production wiring must be disabled.");
  return { ok: result.ok && issues.length === 0, issues };
}

window.OpenClawLocalIngestValidation = {
  validateLocalIngestPayload,
  validateMappedLocalIngestExport
};
})();
