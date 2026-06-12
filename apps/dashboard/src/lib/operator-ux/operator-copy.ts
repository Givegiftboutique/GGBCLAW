export type OperatorCopyKey =
  | "productionReady"
  | "no-go-for-production"
  | "disabled"
  | "enabled"
  | "false"
  | "true"
  | "passed"
  | "warning"
  | "adapterEnabled"
  | "connected"
  | "endpointConfigured"
  | "authEnabled"
  | "dataReturned"
  | "mutationEnabled"
  | "restartEnabled"
  | "deployEnabled"
  | "productionAdapterEnabled"
  | "productionAdapterConnected"
  | "productionAdapterSimulator"
  | "requiresHumanApproval"
  | "notSubmitted"
  | "dryRun"
  | "local-ingest"
  | "mock"
  | "gateway-stub"
  | "review-required"
  | "missing-fallback"
  | "missing-reviewed-input"
  | "missing-fallback-to-sample"
  | "blocked"
  | "not-evaluated"
  | "local-operator-rc"
  | "unknown"
  | "stale"
  | "fresh"
  | "fixture-mode";

export interface OperatorCopyApi {
  COPY: Record<OperatorCopyKey, string>;
  TASK_NEXT_STEPS: Record<string, string>;
  PERMISSION_LABELS: Record<string, string>;
  label(key: string, fallback?: string): string;
  explainPanel(panelId: string): string;
  actionFor(status: string): string;
  formatOperatorLabel(key: string): string;
  formatOperatorValue(value: unknown): string;
  formatOperatorStatus(status: string): string;
  formatOperatorBoolean(value: boolean): string;
  formatOperatorTechnicalDetail(key: string, value: unknown): string;
  taskNextStep(status: string): string;
  permissionLabel(permission: string): string;
}
