export type OperatorCopyKey =
  | "productionReady"
  | "no-go-for-production"
  | "adapterEnabled"
  | "connected"
  | "endpointConfigured"
  | "authEnabled"
  | "dataReturned"
  | "mutationEnabled"
  | "restartEnabled"
  | "deployEnabled"
  | "local-ingest"
  | "mock"
  | "gateway-stub"
  | "review-required"
  | "blocked"
  | "unknown"
  | "fixture-mode";

export interface OperatorCopyApi {
  COPY: Record<OperatorCopyKey, string>;
  label(key: string, fallback?: string): string;
  explainPanel(panelId: string): string;
  actionFor(status: string): string;
}
