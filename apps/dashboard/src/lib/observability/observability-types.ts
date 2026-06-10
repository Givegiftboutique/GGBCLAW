export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged_local_only" | "resolved_by_data_refresh";
export type AlertType =
  | "source_stale"
  | "source_validation_failed"
  | "agent_heartbeat_stale"
  | "agent_lost"
  | "task_stuck_running"
  | "task_failed"
  | "task_timed_out"
  | "task_review_pending"
  | "backup_stale"
  | "backup_verification_failed"
  | "quality_gate_failed"
  | "safety_scan_failed"
  | "release_manifest_missing"
  | "release_manifest_stale"
  | "dev_gateway_blocked"
  | "production_wiring_violation"
  | "mutation_guardrail_violation";

export interface ObservabilityAlert {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  detectedAt: string;
  recommendedAction: string;
  notificationSent: false;
  localOnly: true;
  mutationEnabled: false;
  productionWiring: "disabled";
}
