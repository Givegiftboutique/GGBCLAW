export interface OperatorUsabilityConfig {
  operatorHomeEnabled: true;
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: "./data/generated/real-local-dashboard-export.single-agent.generated.json";
  operatorRecommendedHash: "#/dashboard";
  operatorRecommendedAgentsHash: "#/dashboard/agents";
  localHealthReportPath: "./data/generated/local-real-agent-health-report.json";
  localEvidenceReportPath: "./data/generated/local-health-evidence-review-report.json";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
  expectedRealAgentCount: 1;
}

export interface OperatorHomeCard {
  id: string;
  label: string;
  value: string;
  status: string;
  detail: string;
}

export const OPERATOR_USABILITY_CONFIG: OperatorUsabilityConfig;
export function getOperatorRecommendedUrl(baseUrl?: string): string;
export function getOperatorLaunchSummary(): {
  title: string;
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: string;
  operatorRecommendedUrl: string;
  expectedRealAgentCount: 1;
  localHealthReportPath: string;
  localEvidenceReportPath: string;
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
};
export function getOperatorUsabilityWarnings(context?: {
  source?: string;
  currentSource?: string;
  agentCount?: number;
  healthStatus?: string;
  evidenceStatus?: string;
}): string[];
export function buildOperatorHomeCards(context?: {
  source?: string;
  currentSource?: string;
  agentCount?: number;
  healthStatus?: string;
  evidenceStatus?: string;
}): OperatorHomeCard[];
