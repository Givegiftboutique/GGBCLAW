export type LocalAgentHealthStatus = "online" | "stale" | "unknown" | "review-required";
export type LocalAgentHeartbeatStatus = "fresh" | "stale" | "missing" | "unknown";

export interface ReviewedLocalAgentHealthInput {
  schemaVersion: "local-agent-health.v1";
  source: "operator-reviewed-local-snapshot";
  reviewedAt: string;
  reviewedBy?: string;
  environment: "local";
  productionReady: false;
  expectedAgentCount: 1;
  agents: Array<{
    agentId: string;
    displayName?: string;
    role?: string;
    status: LocalAgentHealthStatus;
    heartbeat: {
      status: LocalAgentHeartbeatStatus;
      lastSeenAt: string | null;
      staleAfterSeconds?: number;
    };
    source: "local-reviewed-json";
    notes?: string[];
  }>;
  safety: {
    localOnly: true;
    secretsIncluded: false;
    remoteFetchUsed: false;
    mutationAllowed: false;
    restartAllowed: false;
    productionGatewayConnected: false;
  };
}

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

export interface ReviewedLocalAgentHealthValidationError {
  path: string;
  key: string;
  message: string;
}

export function classifyHeartbeat(lastSeenAt: string | null | undefined, generatedAt?: string): LocalAgentHeartbeatStatus;
export function validateReviewedLocalAgentHealth(input?: unknown): {
  valid: boolean;
  errors: ReviewedLocalAgentHealthValidationError[];
};
export function reviewedHealthToLocalInput(input?: ReviewedLocalAgentHealthInput): LocalAgentHealthInput;
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
