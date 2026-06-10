export interface DashboardSourceStatus {
  currentSource: "mock" | "json" | "artifact" | "gateway-stub" | "local-ingest" | "dev-gateway";
  requestedSource: string;
  health: "ok" | "warning" | "error";
  validation: "passed" | "failed";
  fallback: "none" | "mock";
  fallbackReason: string;
  lastLoadedAt: string;
  dataUrl: string;
  safetyMode?: "read-only";
  productionWiring?: "disabled";
  mutationEnabled?: false;
  baseUrlState?: string;
  ingestKind?: string;
}

export declare function createSourceStatus(overrides?: Partial<DashboardSourceStatus>): DashboardSourceStatus;
