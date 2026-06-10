(function () {
function evaluateProductionReadiness(input = {}) {
  const nowIso = new Date().toISOString();
  const checks = window.OpenClawReadinessChecklist.READINESS_CHECKLIST.map((check) => ({ ...check }));
  const knownBlockers = [
    "real auth design review required",
    "production gateway security review required",
    "secrets management plan required",
    "operator signoff required",
    "backup restore drill required",
    "incident response plan required",
    "deployment owner required",
    "rollback owner required",
    "monitoring owner required"
  ];

  const observabilityReport = input.observabilityReport;
  if (!observabilityReport || observabilityReport.productionWiring !== "disabled" || observabilityReport.mutationEnabled !== false) {
    checks.push({
      category: "observability",
      title: "Observability report guardrails",
      status: "blocker",
      evidence: "Observability report missing or guardrails are not disabled/read-only."
    });
  }

  if (input.releaseManifest?.dashboard?.productionWiring !== "disabled" || input.releaseManifest?.dashboard?.mutationEnabled !== false) {
    checks.push({
      category: "release_workflow",
      title: "Release manifest guardrails",
      status: "blocker",
      evidence: "Release manifest must keep production wiring disabled and mutation disabled."
    });
  }

  return {
    reportId: `dashboard-readiness-${nowIso.replace(/[:.]/g, "-")}`,
    generatedAt: nowIso,
    scope: "internal-operator-beta",
    productionDeploy: false,
    internalOperatorBetaStatus: "allowed-review-required",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    recommendation: "no-go-for-production",
    summary: window.OpenClawReadinessSummary.summarizeReadiness(checks),
    checks,
    knownBlockers,
    requiredBeforeProduction: window.OpenClawReadinessChecklist.REQUIRED_BEFORE_PRODUCTION
  };
}

window.OpenClawReadinessEvaluator = {
  evaluateProductionReadiness
};
})();
