import type { ObservabilityAlert } from "./observability-types";
import type { ObservabilitySummary } from "./observability-summary";

export interface ObservabilityReport {
  generatedAt: string;
  safetyMode: "read-only";
  notificationMode: "local-preview-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  summary: ObservabilitySummary;
  alerts: ObservabilityAlert[];
}

export declare function evaluateObservability(input?: Record<string, unknown>): ObservabilityReport;
