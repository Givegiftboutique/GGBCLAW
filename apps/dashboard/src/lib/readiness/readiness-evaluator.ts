import type { ReadinessCheck } from "./readiness-checklist";
import type { ReadinessSummary } from "./readiness-summary";

export interface ProductionReadinessReport {
  reportId: string;
  generatedAt: string;
  scope: "internal-operator-beta";
  productionDeploy: false;
  internalOperatorBetaStatus: "allowed-review-required";
  safetyMode: "read-only";
  mutationEnabled: false;
  productionWiring: "disabled";
  recommendation: "no-go-for-production";
  summary: ReadinessSummary;
  checks: ReadinessCheck[];
  knownBlockers: string[];
  requiredBeforeProduction: string[];
}

export declare function evaluateProductionReadiness(input?: Record<string, unknown>): ProductionReadinessReport;
