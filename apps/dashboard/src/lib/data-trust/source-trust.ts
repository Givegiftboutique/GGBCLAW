export type DashboardSource = "mock" | "json" | "artifact" | "gateway-stub" | "local-ingest" | "dev-gateway";

export type SourceTrustLevel =
  | "fixture-demo"
  | "fixture-contract"
  | "external-import-review-required"
  | "artifact-review-required"
  | "operator-truth-candidate"
  | "dev-readonly-test";

export interface SourceTrustClassification {
  source: DashboardSource;
  trustLevel: SourceTrustLevel;
  operatorTruth: boolean;
  expectedAgentCount: number | null;
  fixtureData: boolean;
  requiresReview: boolean;
  warningZhHant: string;
  warningEn: string;
  allowedForProductionPlanning: boolean;
}

export declare const SOURCE_TRUST_CLASSIFICATIONS: Record<DashboardSource, SourceTrustClassification>;

export declare function getSourceTrustClassification(
  source: DashboardSource,
  options?: { validationPassed?: boolean }
): SourceTrustClassification;

export declare function sourceTrustToRows(trust: SourceTrustClassification): Array<[string, string]>;
