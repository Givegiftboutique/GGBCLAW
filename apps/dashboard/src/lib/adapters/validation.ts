import type {
  AgentRecord,
  AuditEvent,
  BackupManifest,
  DashboardMetric,
  DashboardSettings,
  ReviewGate,
  RbacSummary,
  TaskRun
} from "./types";

export interface NormalizedDashboardData {
  agents: AgentRecord[];
  tasks: TaskRun[];
  reviews: ReviewGate[];
  logs: AuditEvent[];
  backups: BackupManifest[];
  metrics: DashboardMetric[];
  settings: DashboardSettings;
  rbacSummary: RbacSummary[];
}

export declare function normalizeDashboardData(source: unknown): NormalizedDashboardData;
