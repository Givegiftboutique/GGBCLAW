export type LocalTaskStatus = "todo" | "in-progress" | "blocked" | "done" | "unknown";
export type LocalTaskSource = "manual" | "whatsapp" | "codex" | "openclaw" | "other";

export interface LocalTask {
  taskId: string;
  title: string;
  source: LocalTaskSource;
  status: LocalTaskStatus;
  priority: string;
  createdAt: string | null;
  dueAt: string | null;
  notes: string[];
}

export interface LocalTaskInboxSummary {
  taskInboxStatus: "loaded" | "missing";
  taskCount: number;
  tasksByStatus: Record<LocalTaskStatus, number>;
  tasksBySource: Record<LocalTaskSource, number>;
  whatsappTaskCount: number;
  whatsappTaskSyncStatus: "local-whatsapp-tasks-present" | "not-synced";
  latestTaskUpdateAt: string | null;
  tasks: LocalTask[];
}
