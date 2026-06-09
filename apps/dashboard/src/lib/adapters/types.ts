export type AgentStatus = "online" | "busy" | "degraded" | "offline";
export type RiskLevel = "low" | "medium" | "high";
export type TaskStatus = "queued" | "running" | "review_pending" | "succeeded" | "failed" | "timed_out" | "cancelled" | "lost";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type ReviewVerdict = "pending" | "approved" | "rejected" | "needs_changes";
export type Severity = "info" | "warning" | "error" | "critical";

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  runtime: string;
  model: string;
  workspace: string;
  sandbox: string;
  toolsProfile: string;
  status: AgentStatus;
  lastHeartbeat: string;
  riskLevel: RiskLevel;
  responsibilities: string[];
  allowedActions: string[];
  deniedActions: string[];
}

export interface TaskRun {
  id: string;
  workflow: string;
  status: TaskStatus;
  priority: Priority;
  attempt: number;
  ownerAgent: string;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
}

export interface ReviewGate {
  id: string;
  taskId: string;
  reviewer: string;
  verdict: ReviewVerdict;
  policyChecks: string[];
  notes: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  severity: Severity;
  actor: string;
  event: string;
  redacted: boolean;
  taskId?: string;
  agentId?: string;
}

export interface BackupManifest {
  id: string;
  taskId: string;
  verifyStatus: "verified" | "pending" | "failed";
  checksum: string;
  storageUri: string;
  createdAt: string;
  restoreTestedAt: string | null;
  evidenceChain: string[];
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  status: "healthy" | "watch" | "blocked";
  description: string;
}

export interface DashboardSettings {
  gatewayAuthMode: string;
  retentionPolicy: string;
  modelRouting: string;
  mcpServers: string[];
  secretRefsHealth: string;
  productionMutation: string;
}

export interface RbacSummary {
  agentId: string;
  name: string;
  riskLevel: RiskLevel;
  allowedActions: string[];
  deniedActions: string[];
}

export interface DashboardDataAdapter {
  getMetrics(): DashboardMetric[];
  getAgents(): AgentRecord[];
  getAgentById(id: string): AgentRecord | null;
  getTasks(filters?: Partial<Pick<TaskRun, "status" | "priority">>): TaskRun[];
  getTaskById(id: string): TaskRun | null;
  getReviews(filters?: Partial<Pick<ReviewGate, "verdict">>): ReviewGate[];
  getLogs(filters?: Partial<Pick<AuditEvent, "severity">>): AuditEvent[];
  getBackups(): BackupManifest[];
  getSettings(): DashboardSettings;
  getRbacSummary(): RbacSummary[];
}
