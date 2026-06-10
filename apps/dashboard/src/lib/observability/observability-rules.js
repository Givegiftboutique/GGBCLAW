(function () {
const ALERT_RULES = {
  source_stale: { severity: "warning", title: "Source data appears stale", entityType: "source" },
  source_validation_failed: { severity: "critical", title: "Source validation failed", entityType: "source" },
  agent_heartbeat_stale: { severity: "warning", title: "Agent heartbeat stale", entityType: "agent" },
  agent_lost: { severity: "critical", title: "Agent appears offline or lost", entityType: "agent" },
  task_stuck_running: { severity: "warning", title: "Task running longer than expected", entityType: "task" },
  task_failed: { severity: "critical", title: "Task failed", entityType: "task" },
  task_timed_out: { severity: "critical", title: "Task timed out", entityType: "task" },
  task_review_pending: { severity: "warning", title: "Task waiting for review", entityType: "task" },
  backup_stale: { severity: "warning", title: "Backup verification stale", entityType: "backup" },
  backup_verification_failed: { severity: "critical", title: "Backup verification failed", entityType: "backup" },
  quality_gate_failed: { severity: "critical", title: "Quality gate failed or missing", entityType: "quality" },
  safety_scan_failed: { severity: "critical", title: "Safety scan failed or missing", entityType: "quality" },
  release_manifest_missing: { severity: "warning", title: "Release manifest missing", entityType: "release" },
  release_manifest_stale: { severity: "warning", title: "Release manifest stale", entityType: "release" },
  dev_gateway_blocked: { severity: "info", title: "Dev gateway blocked or unavailable", entityType: "source" },
  production_wiring_violation: { severity: "critical", title: "Production wiring violation detected", entityType: "safety" },
  mutation_guardrail_violation: { severity: "critical", title: "Mutation guardrail violation detected", entityType: "safety" }
};

function getAlertRule(type) {
  return ALERT_RULES[type] ?? { severity: "info", title: type, entityType: "unknown" };
}

window.OpenClawObservabilityRules = {
  ALERT_RULES,
  getAlertRule
};
})();
