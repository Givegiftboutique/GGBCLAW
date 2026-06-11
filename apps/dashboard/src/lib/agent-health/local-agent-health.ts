export type LocalAgentHealthStatus = "online" | "stale" | "unknown" | "review-required";
export type LocalAgentHeartbeatStatus = "fresh" | "stale" | "missing" | "unknown";

export interface LocalAgentHealthInputEntry {
  agentId: string;
  displayName?: string;
  expectedRealAgent?: boolean;
  source?: string;
  status?: LocalAgentHealthStatus;
  heartbeatStatus?: LocalAgentHeartbeatStatus;
  lastSeenAt?: string | null;
  healthNotes?: string[];
  reviewRequired?: boolean;
}

export interface LocalAgentHealthInput {
  generatedAt?: string;
  agentHealth?: LocalAgentHealthInputEntry[];
}

export interface LocalAgentHealthEvaluationEntry {
  agentId: string;
  displayName: string;
  expectedRealAgent: boolean;
  source: string;
  status: LocalAgentHealthStatus;
  heartbeatStatus: LocalAgentHeartbeatStatus;
  lastSeenAt: string | null;
  healthNotes: string[];
  reviewRequired: boolean;
  localOnly: true;
  notificationSent: false;
  mutationEnabled: false;
  productionWiring: "disabled";
}

export interface LocalAgentHealthEvaluation {
  generatedAt: string;
  scope: "local-readonly-agent-health";
  productionStatus: "no-go-for-production";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  healthConnectionStatus: "local-file-only";
  overallHealthStatus: LocalAgentHealthStatus;
  agents: LocalAgentHealthEvaluationEntry[];
  blockedActions: string[];
}

export function classifyHeartbeat(lastSeenAt: string | null | undefined, generatedAt?: string): LocalAgentHeartbeatStatus;
export function evaluateLocalAgentHealth(input?: LocalAgentHealthInput): LocalAgentHealthEvaluation;
export function summarizeLocalAgentHealth(input?: LocalAgentHealthInput): {
  totalAgents: number;
  online: number;
  stale: number;
  unknown: number;
  reviewRequired: number;
  overallHealthStatus: LocalAgentHealthStatus;
  healthConnectionStatus: "local-file-only";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
};
