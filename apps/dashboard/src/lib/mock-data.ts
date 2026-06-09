export type AgentStatus = "online" | "busy" | "degraded" | "offline";
export type RiskLevel = "low" | "medium" | "high";
export type TaskStatus =
  | "queued"
  | "running"
  | "review_pending"
  | "succeeded"
  | "failed"
  | "timed_out"
  | "cancelled"
  | "lost";
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

export interface TaskAttempt {
  id: string;
  taskId: string;
  agentId: string;
  startedAt: string;
  endedAt: string | null;
  result: string;
  diffSummary: string;
  testResults: string;
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

export interface ArtifactBundle {
  id: string;
  taskId: string;
  path: string;
  kind: string;
  checksum: string;
  createdAt: string;
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

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  status: "healthy" | "watch" | "blocked";
  description: string;
}

export const agents: AgentRecord[] = [
  {
    id: "agent-orchestrator",
    name: "Orchestrator Agent",
    role: "Task routing and coordination",
    runtime: "Codex runtime",
    model: "gpt-5-codex",
    workspace: "OPENCLAW GGB",
    sandbox: "workspace-write mock",
    toolsProfile: "routing, task memory, review handoff",
    status: "busy",
    lastHeartbeat: "2026-06-09T12:36:00+08:00",
    riskLevel: "high",
    responsibilities: ["Route tasks", "Coordinate RAG", "Plan retry and cancel flows"],
    allowedActions: ["Create task plan", "Update task memory", "Open review gate"],
    deniedActions: ["Call production mutation endpoint", "Read secrets", "Deploy runtime"]
  },
  {
    id: "agent-research",
    name: "Research Agent",
    role: "Evidence gathering",
    runtime: "Codex runtime",
    model: "gpt-5-mini",
    workspace: "docs and specs",
    sandbox: "read-only mock",
    toolsProfile: "reference search, evidence bundle",
    status: "online",
    lastHeartbeat: "2026-06-09T12:33:00+08:00",
    riskLevel: "medium",
    responsibilities: ["Gather references", "Summarize evidence", "Attach artifact refs"],
    allowedActions: ["Create evidence bundle", "Read public docs"],
    deniedActions: ["Store PII", "Store credentials", "Mutate gateway state"]
  },
  {
    id: "agent-spec",
    name: "Spec Agent",
    role: "Contracts and acceptance criteria",
    runtime: "Codex runtime",
    model: "gpt-5-codex",
    workspace: "docs/dashboard",
    sandbox: "workspace-write mock",
    toolsProfile: "schema, API, UI spec",
    status: "online",
    lastHeartbeat: "2026-06-09T12:34:00+08:00",
    riskLevel: "medium",
    responsibilities: ["Define schemas", "Write API contracts", "Draft UI specs"],
    allowedActions: ["Edit specs", "Write acceptance criteria"],
    deniedActions: ["Enable production auth", "Change deploy workflow"]
  },
  {
    id: "agent-builder",
    name: "Builder Agent",
    role: "Implementation",
    runtime: "Codex runtime",
    model: "gpt-5-codex",
    workspace: "apps/dashboard",
    sandbox: "workspace-write mock",
    toolsProfile: "patch, static scaffold, verification",
    status: "busy",
    lastHeartbeat: "2026-06-09T12:37:00+08:00",
    riskLevel: "high",
    responsibilities: ["Build UI", "Create mock data", "Run checks"],
    allowedActions: ["Edit scaffold", "Run local verification"],
    deniedActions: ["Commit secrets", "Call live backup restore", "Deploy"]
  },
  {
    id: "agent-reviewer",
    name: "Reviewer Agent",
    role: "Review and policy gate",
    runtime: "Codex runtime",
    model: "gpt-5-codex",
    workspace: "repo",
    sandbox: "read-only mock",
    toolsProfile: "code review, policy gate, test review",
    status: "online",
    lastHeartbeat: "2026-06-09T12:30:00+08:00",
    riskLevel: "medium",
    responsibilities: ["Review code", "Check policy", "Review tests"],
    allowedActions: ["Record verdict", "Request changes"],
    deniedActions: ["Approve production release automatically", "Bypass review gate"]
  },
  {
    id: "agent-release",
    name: "Release Agent",
    role: "Release handoff",
    runtime: "Codex runtime",
    model: "gpt-5-mini",
    workspace: "release notes",
    sandbox: "read-only mock",
    toolsProfile: "PR notes, release notes, CI handoff",
    status: "offline",
    lastHeartbeat: "2026-06-09T11:50:00+08:00",
    riskLevel: "medium",
    responsibilities: ["Prepare release notes", "Summarize CI", "Coordinate handoff"],
    allowedActions: ["Draft release notes", "Prepare PR checklist"],
    deniedActions: ["Push deploy", "Rotate secrets"]
  },
  {
    id: "agent-monitor",
    name: "Monitor Agent",
    role: "Health and SLA monitor",
    runtime: "Codex runtime",
    model: "gpt-5-mini",
    workspace: "observability",
    sandbox: "read-only mock",
    toolsProfile: "SLA, health, lost task alert",
    status: "degraded",
    lastHeartbeat: "2026-06-09T12:20:00+08:00",
    riskLevel: "high",
    responsibilities: ["Watch SLA", "Flag lost tasks", "Report alerts"],
    allowedActions: ["Create alert record", "Update mock health"],
    deniedActions: ["Restart production services", "Page external systems"]
  },
  {
    id: "agent-backup-audit",
    name: "Backup Audit Agent",
    role: "Backup evidence and restore drill",
    runtime: "Codex runtime",
    model: "gpt-5-mini",
    workspace: "artifacts",
    sandbox: "read-only mock",
    toolsProfile: "export, checksum, backup verify",
    status: "online",
    lastHeartbeat: "2026-06-09T12:35:00+08:00",
    riskLevel: "high",
    responsibilities: ["Verify checksums", "Track manifests", "Record restore drills"],
    allowedActions: ["Write mock manifest", "Record checksum"],
    deniedActions: ["Restore production backup", "Expose storage credentials"]
  }
];

export const tasks: TaskRun[] = [
  {
    id: "TASK-20260609-OC-DASH-001",
    workflow: "FLOW-openclaw-dashboard-core",
    status: "running",
    priority: "P1",
    attempt: 1,
    ownerAgent: "agent-builder",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-09T12:00:00+08:00",
    updatedAt: "2026-06-09T12:37:00+08:00",
    summary: "Create dashboard scaffold and Markdown memory system."
  },
  {
    id: "TASK-20260609-OC-REVIEW-002",
    workflow: "FLOW-review-gate",
    status: "review_pending",
    priority: "P2",
    attempt: 1,
    ownerAgent: "agent-spec",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-09T10:20:00+08:00",
    updatedAt: "2026-06-09T11:15:00+08:00",
    summary: "Validate API contract shape before adapter design."
  },
  {
    id: "TASK-20260609-OC-BACKUP-003",
    workflow: "FLOW-backup-evidence",
    status: "queued",
    priority: "P2",
    attempt: 0,
    ownerAgent: "agent-backup-audit",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-09T09:40:00+08:00",
    updatedAt: "2026-06-09T09:40:00+08:00",
    summary: "Draft backup manifest evidence chain."
  },
  {
    id: "TASK-20260608-OC-MONITOR-004",
    workflow: "FLOW-health-monitor",
    status: "lost",
    priority: "P0",
    attempt: 2,
    ownerAgent: "agent-monitor",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-08T18:00:00+08:00",
    updatedAt: "2026-06-09T08:10:00+08:00",
    summary: "Investigate stale heartbeat in mock monitor stream."
  },
  {
    id: "TASK-20260608-OC-BUILD-006",
    workflow: "FLOW-scaffold-check",
    status: "failed",
    priority: "P2",
    attempt: 1,
    ownerAgent: "agent-builder",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-08T12:00:00+08:00",
    updatedAt: "2026-06-08T12:45:00+08:00",
    summary: "Mock failed task used to verify lifecycle visibility."
  },
  {
    id: "TASK-20260608-OC-SPEC-005",
    workflow: "FLOW-spec-authoring",
    status: "succeeded",
    priority: "P3",
    attempt: 1,
    ownerAgent: "agent-spec",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-08T14:00:00+08:00",
    updatedAt: "2026-06-08T16:25:00+08:00",
    summary: "Draft first-pass task workflow lifecycle labels."
  },
  {
    id: "TASK-20260608-OC-TIMEOUT-007",
    workflow: "FLOW-timeout-check",
    status: "timed_out",
    priority: "P3",
    attempt: 1,
    ownerAgent: "agent-monitor",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-08T10:00:00+08:00",
    updatedAt: "2026-06-08T10:30:00+08:00",
    summary: "Mock timed-out task used to verify lifecycle visibility."
  },
  {
    id: "TASK-20260608-OC-CANCEL-008",
    workflow: "FLOW-cancel-check",
    status: "cancelled",
    priority: "P3",
    attempt: 1,
    ownerAgent: "agent-orchestrator",
    reviewer: "agent-reviewer",
    createdAt: "2026-06-08T09:00:00+08:00",
    updatedAt: "2026-06-08T09:20:00+08:00",
    summary: "Mock cancelled task used to verify lifecycle visibility."
  }
];

export const attempts: TaskAttempt[] = [
  {
    id: "attempt-dash-001-a1",
    taskId: "TASK-20260609-OC-DASH-001",
    agentId: "agent-builder",
    startedAt: "2026-06-09T12:12:00+08:00",
    endedAt: null,
    result: "running",
    diffSummary: "Docs and static scaffold in progress.",
    testResults: "Pending"
  }
];

export const reviews: ReviewGate[] = [
  {
    id: "review-dash-001",
    taskId: "TASK-20260609-OC-DASH-001",
    reviewer: "agent-reviewer",
    verdict: "pending",
    policyChecks: ["mock-only UI", "no secrets", "no production endpoint"],
    notes: "Awaiting scaffold verification.",
    createdAt: "2026-06-09T12:40:00+08:00"
  },
  {
    id: "review-api-002",
    taskId: "TASK-20260609-OC-REVIEW-002",
    reviewer: "agent-reviewer",
    verdict: "needs_changes",
    policyChecks: ["read-only GET contract", "mutation guard"],
    notes: "Add explicit forbidden mutation section before adapter work.",
    createdAt: "2026-06-09T11:20:00+08:00"
  }
];

export const artifacts: ArtifactBundle[] = [
  {
    id: "artifact-dash-docs",
    taskId: "TASK-20260609-OC-DASH-001",
    path: "docs/dashboard/",
    kind: "documentation",
    checksum: "mock-sha256-docs-0001",
    createdAt: "2026-06-09T12:30:00+08:00"
  },
  {
    id: "artifact-task-memory",
    taskId: "TASK-20260609-OC-DASH-001",
    path: "ops/tasks/TASK-20260609-OC-DASH-001.md",
    kind: "markdown-memory",
    checksum: "mock-sha256-memory-0001",
    createdAt: "2026-06-09T12:31:00+08:00"
  }
];

export const backups: BackupManifest[] = [
  {
    id: "backup-dash-001",
    taskId: "TASK-20260609-OC-DASH-001",
    verifyStatus: "pending",
    checksum: "mock-sha256-backup-0001",
    storageUri: "mock://artifact-bundle/TASK-20260609-OC-DASH-001",
    createdAt: "2026-06-09T12:42:00+08:00",
    restoreTestedAt: null,
    evidenceChain: ["git commit: pending", "artifact bundle: docs/dashboard", "checksum: mock-sha256-backup-0001", "backup manifest: backup-dash-001"]
  },
  {
    id: "backup-spec-002",
    taskId: "TASK-20260608-OC-SPEC-005",
    verifyStatus: "verified",
    checksum: "mock-sha256-backup-0002",
    storageUri: "mock://artifact-bundle/TASK-20260608-OC-SPEC-005",
    createdAt: "2026-06-08T16:30:00+08:00",
    restoreTestedAt: "2026-06-08T17:10:00+08:00",
    evidenceChain: ["git commit: mock-ab12cd3", "artifact bundle: ops/specs", "checksum: mock-sha256-backup-0002", "backup manifest: backup-spec-002"]
  }
];

export const auditEvents: AuditEvent[] = [
  {
    id: "audit-001",
    timestamp: "2026-06-09T12:42:00+08:00",
    severity: "info",
    actor: "agent-builder",
    event: "Dashboard scaffold files created.",
    redacted: false,
    taskId: "TASK-20260609-OC-DASH-001",
    agentId: "agent-builder"
  },
  {
    id: "audit-002",
    timestamp: "2026-06-09T12:20:00+08:00",
    severity: "warning",
    actor: "agent-monitor",
    event: "Mock lost task heartbeat exceeded expected interval.",
    redacted: false,
    taskId: "TASK-20260608-OC-MONITOR-004",
    agentId: "agent-monitor"
  },
  {
    id: "audit-003",
    timestamp: "2026-06-09T12:10:00+08:00",
    severity: "info",
    actor: "system",
    event: "Sensitive runtime references hidden by scaffold redaction guard.",
    redacted: true
  },
  {
    id: "audit-004",
    timestamp: "2026-06-09T11:18:00+08:00",
    severity: "error",
    actor: "agent-reviewer",
    event: "Review gate flagged missing mutation boundary text.",
    redacted: false,
    taskId: "TASK-20260609-OC-REVIEW-002",
    agentId: "agent-reviewer"
  }
];

export const metrics: DashboardMetric[] = [
  {
    id: "metric-gateway",
    label: "Gateway status",
    value: "Mock disconnected",
    trend: "No production endpoint configured",
    status: "healthy",
    description: "Scaffold protects against accidental live runtime calls."
  },
  {
    id: "metric-agents",
    label: "Active agents",
    value: "6 / 8",
    trend: "2 busy, 1 degraded",
    status: "watch",
    description: "Registry is populated with the required OpenClaw roles."
  },
  {
    id: "metric-running",
    label: "Running tasks",
    value: "1",
    trend: "P1 dashboard scaffold",
    status: "healthy",
    description: "One mock task is actively owned by Builder Agent."
  },
  {
    id: "metric-failed",
    label: "Failed / lost",
    value: "1",
    trend: "Lost mock monitor task",
    status: "blocked",
    description: "Lost state is visible for workflow design validation."
  },
  {
    id: "metric-backup",
    label: "Backup verification",
    value: "1 pending",
    trend: "1 verified mock manifest",
    status: "watch",
    description: "Backup evidence chain is represented without live restore."
  }
];

export const settings = {
  gatewayAuthMode: "read-only mock",
  retentionPolicy: "30 days mock trace retention",
  modelRouting: "static model labels only",
  mcpServers: ["filesystem mock", "browser disabled", "gateway adapter absent"],
  secretRefsHealth: "not connected; no secret refs loaded",
  productionMutation: "disabled"
};
