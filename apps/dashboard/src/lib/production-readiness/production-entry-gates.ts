export type ProductionEntryGateStatus =
  | "blocked"
  | "review-required"
  | "local-only-ready"
  | "not-evaluated";

export interface ProductionEntryGateInput {
  source?: string;
  operatorRecommendedSource?: string;
  productionStatus?: string;
  productionReady?: boolean;
  mutationEnabled?: boolean;
  restartEnabled?: boolean;
  productionGatewayEnabled?: boolean;
  productionWiring?: string;
  actualRealAgentCount?: number;
  healthStatus?: string;
  evidenceStatus?: string;
  reviewedHealthInputReadiness?: string;
  dailyStatus?: string;
  reportsMissing?: boolean;
  requiredReportsMissing?: string[];
  rawValueLeakDetected?: boolean;
  rawValuesPrinted?: boolean;
  productionEndpointEnabled?: boolean;
  deployEnabled?: boolean;
  authTokenUseEnabled?: boolean;
  localHealthReportExists?: boolean;
  evidenceReviewReportExists?: boolean;
  reviewedHealthDryRunReportExists?: boolean;
  manualApprovalReceived?: boolean;
  manualApprovalsRequired?: string[];
  warnings?: string[];
  requiredFollowups?: string[];
}

export interface ProductionEntryGateSummary {
  scope: "production-entry-gate-hardening";
  language: "zh-Hant";
  productionStatus: "no-go-for-production";
  productionReady: false;
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
  productionWiring: "disabled";
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json";
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  gateStatus: ProductionEntryGateStatus;
  productionBlockers: string[];
  reviewRequiredItems: string[];
  localOnlyReadyItems: string[];
  manualApprovalsRequired: string[];
  blockedActions: string[];
}

export declare function buildProductionEntryGateStatus(input?: ProductionEntryGateInput): ProductionEntryGateSummary;
export declare function classifyProductionEntryGate(input?: ProductionEntryGateInput): ProductionEntryGateStatus;
export declare function buildProductionBlockers(input?: ProductionEntryGateInput): string[];
export declare function buildProductionPreflightChecklist(input?: ProductionEntryGateInput): Array<{ id: string; label: string; passed: boolean }>;
export declare function buildProductionGateCards(input?: ProductionEntryGateInput): Array<{ id: string; label: string; value: string; detail: string }>;
