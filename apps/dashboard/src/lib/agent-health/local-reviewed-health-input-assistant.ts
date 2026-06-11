export type ReviewedHealthInputReadiness =
  | "ready-for-local-use"
  | "needs-template-copy"
  | "needs-operator-edit"
  | "invalid-fallback-required"
  | "unsafe-rejected"
  | "missing-local-input"
  | "review-required";

export type ReviewedHealthInputFinding = {
  path: string;
  key: string;
  ruleId: string;
  category: string;
  message: string;
  rawValuePrinted: false;
};

export type ReviewedHealthInputTemplateAgent = {
  agentId: string;
  displayName: string;
  expectedRealAgent: true;
  source: "local-reviewed-json";
  status: "online" | "stale" | "unknown" | "review-required";
  heartbeatStatus: "fresh" | "stale" | "missing" | "unknown";
  lastSeenAt: string | null;
  healthNotes: string[];
  reviewRequired: boolean;
};

export type ReviewedHealthInputTemplate = {
  schemaVersion: "local-agent-health.v1";
  generatedAt: string;
  scope: "local-reviewed-health-input";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  agentHealth: ReviewedHealthInputTemplateAgent[];
};

export type ReviewedHealthInputValidationResult = {
  acceptedForLocalUse: boolean;
  readinessStatus: ReviewedHealthInputReadiness;
  validationFindings: ReviewedHealthInputFinding[];
  redactionApplied: true;
  rawValuesPrinted: false;
};

export function buildReviewedHealthInputTemplate(): ReviewedHealthInputTemplate;
export function buildReviewedHealthInputGuide(): Record<string, unknown>;
export function validateReviewedHealthInputDryRun(input: unknown): ReviewedHealthInputValidationResult;
export function buildRedactedReviewedHealthPreview(input: unknown): Record<string, unknown>;
export function classifyReviewedHealthInputReadiness(input: unknown): ReviewedHealthInputReadiness;
