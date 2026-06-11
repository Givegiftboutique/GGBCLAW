export type DailyOperatorStatus = "ok" | "review-required" | "blocked" | "fixture-mode" | "unknown";

export interface DailyOperatorRunbookInput {
  source?: string;
  currentSource?: string;
  agentCount?: number;
  actualRealAgentCount?: number;
  fixtureAgentCount?: number;
  healthStatus?: string;
  overallHealthStatus?: string;
  evidenceStatus?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  reviewedInputStatus?: string;
  productionStatus?: string;
  mutationEnabled?: boolean;
  restartEnabled?: boolean;
  productionGatewayEnabled?: boolean;
  productionWiring?: string;
  redactionApplied?: boolean;
  rawValuesPrinted?: boolean;
  healthReportPath?: string;
  warnings?: string[];
  requiredFollowups?: string[];
}

export interface RunbookCard {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export const DAILY_OPERATOR_STATUSES: DailyOperatorStatus[];
export const BLOCKED_ACTIONS: string[];
export function classifyDailyOperatorStatus(input?: DailyOperatorRunbookInput): DailyOperatorStatus;
export function buildSafeNextSteps(input?: DailyOperatorRunbookInput): string[];
export function buildBlockedActionSummary(input?: DailyOperatorRunbookInput): Array<{ action: string; enabled: false; reason: string }>;
export function buildRunbookCards(input?: DailyOperatorRunbookInput): RunbookCard[];
export function buildDailyOperatorRunbook(input?: DailyOperatorRunbookInput): {
  scope: "daily-operator-runbook-mode";
  language: "zh-Hant";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  restartEnabled: false;
  productionGatewayEnabled: false;
  operatorRecommendedSource: "local-ingest";
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json";
  expectedRealAgentCount: 1;
  actualRealAgentCount: number;
  dailyStatus: DailyOperatorStatus;
  statusReasons: string[];
  safeNextSteps: string[];
  blockedActions: string[];
  blockedActionSummary: Array<{ action: string; enabled: false; reason: string }>;
  runbookCards: RunbookCard[];
  warnings: string[];
  requiredFollowups: string[];
};
