(function () {
const READINESS_CHECKLIST = [
  { category: "source_safety", title: "Source safety", status: "pass", evidence: "Local/mock/json/artifact/gateway-stub/local-ingest/dev-gateway sources remain read-only." },
  { category: "gateway_contract", title: "Gateway contract", status: "pass", evidence: "Gateway-stub contract tests and fixture diff run locally." },
  { category: "local_ingest", title: "Local ingest", status: "pass", evidence: "Local ingest tests validate JSON-only sample sources." },
  { category: "dev_gateway", title: "Dev gateway", status: "warning", evidence: "Dev gateway is read-only and allowlisted, but no production gateway security review exists." },
  { category: "rbac_auth", title: "RBAC/auth", status: "blocker", evidence: "RBAC is simulated only; real auth design review is required before production." },
  { category: "action_drafts", title: "Action drafts", status: "pass", evidence: "Actions remain draft-only with mutation disabled." },
  { category: "release_workflow", title: "Release workflow", status: "warning", evidence: "Internal release workflow exists; production deploy owner is not assigned." },
  { category: "rollback", title: "Rollback", status: "warning", evidence: "Rollback tag pattern exists; rollback owner and drill are required." },
  { category: "observability", title: "Observability", status: "warning", evidence: "Local alert preview exists; no external notification delivery by design." },
  { category: "backup_evidence", title: "Backup evidence", status: "blocker", evidence: "Backup evidence exists, but a real restore drill is required before production." },
  { category: "security_guardrails", title: "Security guardrails", status: "pass", evidence: "Safety scan checks production endpoints, secrets, active mutation, and deploy patterns." },
  { category: "operator_runbook", title: "Operator runbook", status: "pass", evidence: "Runbook, troubleshooting, and release workflow docs exist." },
  { category: "manual_acceptance", title: "Manual acceptance", status: "warning", evidence: "Manual browser acceptance required for every release candidate." },
  { category: "known_blockers", title: "Known blockers", status: "blocker", evidence: "Real auth, production gateway security review, operator signoff, restore drill, and incident plan remain open." }
];

const REQUIRED_BEFORE_PRODUCTION = [
  "real auth design review",
  "production gateway security review",
  "secrets management plan",
  "operator signoff",
  "backup restore drill",
  "incident response plan",
  "deployment owner",
  "rollback owner",
  "monitoring owner"
];

window.OpenClawReadinessChecklist = {
  READINESS_CHECKLIST,
  REQUIRED_BEFORE_PRODUCTION
};
})();
