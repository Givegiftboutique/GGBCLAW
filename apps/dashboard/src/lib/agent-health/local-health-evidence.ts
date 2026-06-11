export type LocalHealthEvidenceStatus =
  | "reviewed-valid"
  | "reviewed-invalid-fallback"
  | "missing-fallback"
  | "sample-fallback"
  | "review-required"
  | "unsafe-rejected";

export type LocalHealthEvidenceSource =
  | "local-reviewed-json"
  | "local-file-only"
  | "sample-fallback"
  | "invalid-reviewed-json"
  | "missing-reviewed-json";

export interface LocalHealthValidationEvidence {
  path: string;
  key: string;
  category: string;
  ruleId: string;
  passed: false;
  message: string;
  rawValuePrinted: false;
}

export interface LocalHealthEvidenceReview {
  scope: "local-health-evidence-review-pack";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  operatorTruthSource: "local-ingest";
  operatorTruthSnapshot: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json";
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  reviewedInputPath: string;
  reviewedInputExamplePath: string;
  healthReportPath: string;
  evidenceStatus: LocalHealthEvidenceStatus;
  acceptedHealthSource: "local-reviewed-json" | "local-file-only";
  fallbackUsed: boolean;
  fallbackReason: string;
  redactionApplied: true;
  rawValuesPrinted: false;
  validationEvidence: LocalHealthValidationEvidence[];
  rejectedEvidence: LocalHealthValidationEvidence[];
  blockedActions: string[];
  warnings: string[];
  requiredFollowups: string[];
}

export function buildLocalHealthEvidenceReview(input?: unknown): LocalHealthEvidenceReview;
export function summarizeReviewedHealthInput(input?: unknown): {
  reviewedInputPath: string;
  reviewedInputExamplePath: string;
  reviewedInputStatus: string;
  inputFilePresent: boolean;
  parseSuccess: boolean;
  schemaVersionChecked: true;
  agentCountChecked: true;
  safetyFlagsChecked: true;
  unsafeKeyCategories: string[];
  validationEvidence: LocalHealthValidationEvidence[];
  redactionApplied: true;
  rawValuesPrinted: false;
};
export function redactValidationEvidence(input?: unknown): LocalHealthValidationEvidence[];
export function classifyEvidenceStatus(input?: unknown): LocalHealthEvidenceStatus;
