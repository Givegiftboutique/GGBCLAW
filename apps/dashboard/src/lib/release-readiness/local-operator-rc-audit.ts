export type LocalOperatorRcStatus = "local-operator-rc" | "review-required" | "blocked" | "not-evaluated";

export interface LocalOperatorRcAuditInput {
  productionStatus?: string;
  productionReady?: boolean;
  adapterEnabled?: boolean;
  connected?: boolean;
  endpointConfigured?: boolean;
  authEnabled?: boolean;
  dataReturned?: boolean;
  mutationEnabled?: boolean;
  restartEnabled?: boolean;
  productionGatewayEnabled?: boolean;
  deployEnabled?: boolean;
  operatorRecommendedSource?: string;
  actualRealAgentCount?: number;
  dailyStatus?: string;
  healthStatus?: string;
  fallbackUsed?: boolean;
  productionEntryGateStatus?: string;
  manualOperatorReviewRequired?: boolean;
  rawValuesPrinted?: boolean;
  realReviewedHealthInputTracked?: boolean;
  requiredReportsMissing?: string[];
  reportsMissing?: boolean;
}

export interface LocalOperatorRcCard {
  id: string;
  label: string;
  value: string;
}

export interface LocalOperatorRcAudit {
  scope: "local-operator-release-candidate";
  language: "zh-Hant";
  releaseCandidateType: "local-operator-dashboard";
  releaseCandidateStatus: LocalOperatorRcStatus;
  productionReady: false;
  productionStatus: "no-go-for-production";
  operatorRecommendedSource: "local-ingest";
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  dailyUseAvailable: boolean;
  launchScriptPath: string;
  recommendedOperatorUrl: string;
  findings: string[];
  knownRisks: string[];
  blockedActions: string[];
  rcCards: LocalOperatorRcCard[];
}

export declare function buildLocalOperatorRcAudit(input?: LocalOperatorRcAuditInput): LocalOperatorRcAudit;
export declare function classifyLocalOperatorRcStatus(input?: LocalOperatorRcAuditInput): LocalOperatorRcStatus;
export declare function buildLocalOperatorRcFindings(input?: LocalOperatorRcAuditInput): string[];
export declare function buildLocalOperatorRcKnownRisks(input?: LocalOperatorRcAuditInput): string[];
export declare function buildLocalOperatorRcCards(input?: LocalOperatorRcAuditInput): LocalOperatorRcCard[];
