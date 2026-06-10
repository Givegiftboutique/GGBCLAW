import type { ObservabilityAlert } from "./observability-types";

export interface ObservabilitySummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export declare function summarizeAlerts(alerts: ObservabilityAlert[]): ObservabilitySummary;
