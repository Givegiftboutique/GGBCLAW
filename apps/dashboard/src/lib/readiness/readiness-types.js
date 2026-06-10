(function () {
const READINESS_CATEGORIES = [
  "source_safety",
  "gateway_contract",
  "local_ingest",
  "dev_gateway",
  "rbac_auth",
  "action_drafts",
  "release_workflow",
  "rollback",
  "observability",
  "backup_evidence",
  "security_guardrails",
  "operator_runbook",
  "manual_acceptance",
  "known_blockers"
];

const READINESS_STATUSES = ["pass", "warning", "blocker", "not_applicable"];

window.OpenClawReadinessTypes = {
  READINESS_CATEGORIES,
  READINESS_STATUSES
};
})();
