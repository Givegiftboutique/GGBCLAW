(function () {
const REQUIRED_PERMISSIONS = [
  "dashboard:view",
  "agents:view",
  "tasks:view",
  "reviews:view",
  "logs:view",
  "backups:view",
  "settings:view",
  "rbac:view",
  "runbook:view",
  "reviews:draft_decision",
  "backups:draft_verification",
  "exports:generate_local_snapshot",
  "quality:run_local_gate",
  "admin:view_config"
];

const FORBIDDEN_MUTATION_PERMISSIONS = [
  "reviews:approve",
  "reviews:reject",
  "backups:restore",
  "settings:update",
  "gateway:write",
  "production:mutate"
];

const PERMISSION_DESCRIPTIONS = {
  "dashboard:view": "View overview KPIs and source status.",
  "agents:view": "View agent registry records.",
  "tasks:view": "View task queue and lifecycle examples.",
  "reviews:view": "View review gates.",
  "logs:view": "View local audit traces.",
  "backups:view": "View backup evidence chain.",
  "settings:view": "View read-only settings.",
  "rbac:view": "View simulated RBAC policy.",
  "runbook:view": "View local operator runbook.",
  "reviews:draft_decision": "Generate review decision drafts only.",
  "backups:draft_verification": "Generate backup verification drafts only.",
  "exports:generate_local_snapshot": "Generate local snapshot artifacts by script only.",
  "quality:run_local_gate": "Run local quality gate scripts.",
  "admin:view_config": "View configuration guardrails."
};

window.OpenClawRbacPermissions = {
  REQUIRED_PERMISSIONS,
  FORBIDDEN_MUTATION_PERMISSIONS,
  PERMISSION_DESCRIPTIONS
};
})();
