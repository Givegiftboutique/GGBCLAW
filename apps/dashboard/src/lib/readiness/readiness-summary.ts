import type { ReadinessCheck } from "./readiness-checklist";

export interface ReadinessSummary {
  pass: number;
  warning: number;
  blocker: number;
  notApplicable: number;
}

export declare function summarizeReadiness(checks: ReadinessCheck[]): ReadinessSummary;
