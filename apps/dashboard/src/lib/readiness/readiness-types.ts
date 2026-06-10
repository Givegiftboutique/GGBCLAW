export type ReadinessCategory =
  | "source_safety"
  | "gateway_contract"
  | "local_ingest"
  | "dev_gateway"
  | "rbac_auth"
  | "action_drafts"
  | "release_workflow"
  | "rollback"
  | "observability"
  | "backup_evidence"
  | "security_guardrails"
  | "operator_runbook"
  | "manual_acceptance"
  | "known_blockers";

export type ReadinessStatus = "pass" | "warning" | "blocker" | "not_applicable";
