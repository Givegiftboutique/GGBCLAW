export interface DashboardSourceStatus {
  currentSource: "mock" | "json" | "artifact";
  requestedSource: string;
  health: "ok" | "warning" | "error";
  validation: "passed" | "failed";
  fallback: "none" | "mock";
  fallbackReason: string;
  lastLoadedAt: string;
  dataUrl: string;
}

export declare function createSourceStatus(overrides?: Partial<DashboardSourceStatus>): DashboardSourceStatus;
