export type LocalTaskStatus = "todo" | "in-progress" | "blocked" | "done" | "unknown" | "review_pending" | "failed" | "cancelled";
export type LocalTaskSource = "manual" | "whatsapp" | "codex" | "openclaw" | "other";

export interface LocalTask {
  taskId: string;
  title: string;
  summary: string;
  source: LocalTaskSource;
  sourceLabel: string;
  status: LocalTaskStatus;
  priority: string;
  createdAt: string | null;
  updatedAt: string | null;
  dueAt: string | null;
  nextStep: string;
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

export declare function mergeTaskInboxSources<T>(...sources: Array<T[] | null | undefined>): T[];
