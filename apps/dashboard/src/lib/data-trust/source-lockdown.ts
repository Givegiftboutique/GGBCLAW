export type DashboardSource = "mock" | "json" | "artifact" | "gateway-stub" | "local-ingest" | "dev-gateway";

export type SourceWarningLevel = "none" | "low" | "medium" | "high";

export interface SourceLockdownRule {
  source: DashboardSource;
  operatorRecommended: boolean;
  requiresExplicitSelection: boolean;
  requiresDemoAcknowledgement: boolean;
  defaultAllowed: boolean;
  warningLevel: SourceWarningLevel;
  recommendedUrl: string;
  blockedReason: string;
  expectedAgentCount: number | null;
  operatorTruth: boolean;
  fixtureData: boolean;
  requiresReview?: boolean;
  devOnly?: boolean;
}

export interface SourceLockdownPolicy {
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: "./data/generated/real-local-dashboard-export.single-agent.generated.json";
  operatorRecommendedUrl: string;
  fixtureSources: ["mock", "gateway-stub"];
  reviewRequiredSources: ["json", "artifact"];
  devOnlySources: ["dev-gateway"];
  defaultEntryBehavior: "operator-safe-notice";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  expectedRealAgentCount: 1;
}

export declare const SOURCE_LOCKDOWN_POLICY: SourceLockdownPolicy;
export declare const SOURCE_LOCKDOWN_RULES: Record<DashboardSource, SourceLockdownRule>;

export declare function getSourceLockdownRule(source: DashboardSource): SourceLockdownRule;
export declare function getOperatorRecommendedUrl(origin?: string): string;
export declare function hasExplicitSourceSelection(search?: string): boolean;
export declare function getDefaultEntryNotice(search?: string): {
  defaultEntryBehavior: "operator-safe-notice";
  explicitSourceSelected: boolean;
  showOperatorSafeNotice: boolean;
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: "./data/generated/real-local-dashboard-export.single-agent.generated.json";
  operatorRecommendedUrl: string;
  warningLevel: SourceWarningLevel;
  messageEn: string;
  messageZhHant: string;
};
