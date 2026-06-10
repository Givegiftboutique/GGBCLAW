import type { AlertSeverity, AlertType } from "./observability-types";

export interface AlertRule {
  severity: AlertSeverity;
  title: string;
  entityType: string;
}

export declare const ALERT_RULES: Record<AlertType, AlertRule>;
export declare function getAlertRule(type: AlertType): AlertRule;
