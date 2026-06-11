(function () {
const EVIDENCE_STATUSES = [
  "reviewed-valid",
  "reviewed-invalid-fallback",
  "missing-fallback",
  "sample-fallback",
  "review-required",
  "unsafe-rejected"
];

const EVIDENCE_SOURCES = [
  "local-reviewed-json",
  "local-file-only",
  "sample-fallback",
  "invalid-reviewed-json",
  "missing-reviewed-json"
];

const UNSAFE_KEY_CATEGORY_RE = /apiKey|api_key|authorization|bearer|token|cookie|secret|password|credential|privateKey|accessToken|refreshToken/i;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizePath(value) {
  const text = String(value || "");
  if (/[A-Za-z]:\\Users\\|\/home\//i.test(text)) return "[redacted-local-path]";
  return text.replaceAll("\\", "/");
}

function redactValidationEvidence(input = {}) {
  return safeArray(input.validationErrors || input.validationEvidence).map((entry) => {
    const key = String(entry.key || "unknown");
    const path = sanitizePath(entry.path || "$");
    const category = entry.category
      || (UNSAFE_KEY_CATEGORY_RE.test(key) ? "unsafe-key" : "schema-validation");
    return {
      path,
      key,
      category,
      ruleId: entry.ruleId || category,
      passed: false,
      message: entry.message || "Validation failed; raw values were not printed.",
      rawValuePrinted: false
    };
  });
}

function summarizeReviewedHealthInput(input = {}) {
  const status = input.reviewedInputStatus || "missing-fallback-to-sample";
  const errors = redactValidationEvidence(input);
  return {
    reviewedInputPath: sanitizePath(input.reviewedInputPath || input.reviewedHealthInputPath || "apps/dashboard/data/local/reviewed-local-agent-health.json"),
    reviewedInputExamplePath: sanitizePath(input.reviewedInputExamplePath || input.reviewedHealthExamplePath || "apps/dashboard/data/local/reviewed-local-agent-health.example.json"),
    reviewedInputStatus: status,
    inputFilePresent: status !== "missing-fallback-to-sample" && status !== "missing-reviewed-input",
    parseSuccess: status !== "parse-failed",
    schemaVersionChecked: true,
    agentCountChecked: true,
    safetyFlagsChecked: true,
    unsafeKeyCategories: Array.from(new Set(errors.map((error) => error.category))).filter(Boolean),
    validationEvidence: errors,
    redactionApplied: true,
    rawValuesPrinted: false
  };
}

function classifyEvidenceStatus(input = {}) {
  if (input.evidenceStatus && EVIDENCE_STATUSES.includes(input.evidenceStatus)) {
    return input.evidenceStatus;
  }
  const reviewedInputStatus = input.reviewedInputStatus || "";
  const healthSource = input.healthSource || input.acceptedHealthSource || "local-file-only";
  const validationErrors = redactValidationEvidence(input);
  if (reviewedInputStatus === "valid" && healthSource === "local-reviewed-json") return "reviewed-valid";
  if (validationErrors.some((error) => error.category === "unsafe-key")) return "unsafe-rejected";
  if (reviewedInputStatus === "invalid-review-required" || reviewedInputStatus === "parse-failed") return "reviewed-invalid-fallback";
  if (reviewedInputStatus === "missing-fallback-to-sample" || reviewedInputStatus === "missing-reviewed-input") return "missing-fallback";
  if (healthSource === "local-file-only") return "sample-fallback";
  return "review-required";
}

function buildLocalHealthEvidenceReview(input = {}) {
  const summary = summarizeReviewedHealthInput(input);
  const evidenceStatus = classifyEvidenceStatus(input);
  const acceptedHealthSource = input.healthSource === "local-reviewed-json" ? "local-reviewed-json" : "local-file-only";
  const fallbackUsed = acceptedHealthSource !== "local-reviewed-json";
  const fallbackReason = input.fallbackReason
    || (evidenceStatus === "reviewed-valid" ? "none"
      : evidenceStatus === "missing-fallback" ? "missing-reviewed-input"
        : evidenceStatus === "unsafe-rejected" ? "unsafe-keys"
          : evidenceStatus === "reviewed-invalid-fallback" ? "invalid-reviewed-input"
            : fallbackUsed ? "review-required" : "none");
  return {
    scope: "local-health-evidence-review-pack",
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    operatorTruthSource: "local-ingest",
    operatorTruthSnapshot: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
    expectedRealAgentCount: 1,
    actualRealAgentCount: input.actualRealAgentCount === 1 ? 1 : Number(input.actualRealAgentCount || 0),
    reviewedInputPath: summary.reviewedInputPath,
    reviewedInputExamplePath: summary.reviewedInputExamplePath,
    healthReportPath: sanitizePath(input.healthReportPath || "apps/dashboard/data/generated/local-real-agent-health-report.json"),
    evidenceStatus,
    acceptedHealthSource,
    fallbackUsed,
    fallbackReason,
    redactionApplied: true,
    rawValuesPrinted: false,
    validationEvidence: summary.validationEvidence,
    rejectedEvidence: summary.validationEvidence.filter((entry) => !entry.passed),
    blockedActions: [
      "restart-agent",
      "stop-agent",
      "start-agent",
      "production-gateway-connect",
      "mutation"
    ],
    warnings: safeArray(input.warnings),
    requiredFollowups: safeArray(input.requiredFollowups)
  };
}

window.OpenClawLocalHealthEvidence = {
  EVIDENCE_STATUSES,
  EVIDENCE_SOURCES,
  buildLocalHealthEvidenceReview,
  summarizeReviewedHealthInput,
  redactValidationEvidence,
  classifyEvidenceStatus
};
})();
