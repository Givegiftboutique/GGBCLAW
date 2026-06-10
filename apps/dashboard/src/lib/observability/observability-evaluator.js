(function () {
function parseDate(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function minutesOld(value, nowMs) {
  const time = parseDate(value);
  if (time === null) return 999999;
  return Math.max(0, Math.round((nowMs - time) / 60000));
}

function createAlert(type, overrides, nowIso) {
  const rule = window.OpenClawObservabilityRules.getAlertRule(type);
  const entityId = overrides.entityId || "local-preview";
  return {
    alertId: `alert-${type}-${String(entityId).replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`,
    type,
    severity: overrides.severity || rule.severity,
    status: "open",
    title: overrides.title || rule.title,
    description: overrides.description || "Local preview only.",
    entityType: overrides.entityType || rule.entityType,
    entityId,
    detectedAt: nowIso,
    recommendedAction: overrides.recommendedAction || "Review related records locally.",
    notificationSent: false,
    localOnly: true,
    mutationEnabled: false,
    productionWiring: "disabled"
  };
}

function evaluateObservability(input = {}) {
  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const alerts = [];
  const sourceStatus = input.sourceStatus || {};
  const qualityGateReport = input.qualityGateReport || {};
  const safetyScanReport = input.safetyScanReport || {};
  const releaseManifest = input.releaseManifest || null;

  if (sourceStatus.validation === "failed") {
    alerts.push(createAlert("source_validation_failed", {
      entityId: sourceStatus.currentSource || "source",
      recommendedAction: "Inspect local source validation errors and fallback reason."
    }, nowIso));
  }
  if (sourceStatus.health === "warning" || sourceStatus.health === "error") {
    alerts.push(createAlert("source_stale", {
      entityId: sourceStatus.currentSource || "source",
      description: sourceStatus.fallbackReason || "Source status is not healthy.",
      recommendedAction: "Refresh local source data or switch to mock/gateway-stub."
    }, nowIso));
  }
  if (sourceStatus.requestedSource === "dev-gateway" && sourceStatus.currentSource !== "dev-gateway") {
    alerts.push(createAlert("dev_gateway_blocked", {
      entityId: "dev-gateway",
      description: sourceStatus.fallbackReason || "Dev gateway source fell back safely.",
      recommendedAction: "Use only safe local dev gateway URLs or continue with fixtures."
    }, nowIso));
  }

  for (const agent of input.agents || []) {
    const age = minutesOld(agent.lastHeartbeat, nowMs);
    if (agent.status === "offline") {
      alerts.push(createAlert("agent_lost", {
        entityId: agent.id,
        title: `${agent.name} is offline`,
        recommendedAction: "Review agent status locally; do not restart production services."
      }, nowIso));
    } else if (age > 60 || agent.status === "degraded") {
      alerts.push(createAlert("agent_heartbeat_stale", {
        entityId: agent.id,
        title: `${agent.name} heartbeat stale`,
        description: `Heartbeat age is approximately ${age} minutes. Local preview only.`,
        recommendedAction: "Review local logs and source freshness."
      }, nowIso));
    }
  }

  for (const task of input.tasks || []) {
    const age = minutesOld(task.updatedAt, nowMs);
    if (task.status === "running" && age > 60) {
      alerts.push(createAlert("task_stuck_running", {
        entityId: task.id,
        description: `Task has been running/stale for approximately ${age} minutes.`,
        recommendedAction: "Review task logs locally."
      }, nowIso));
    }
    if (task.status === "review_pending" && age > 60) {
      alerts.push(createAlert("task_review_pending", {
        entityId: task.id,
        description: `Task has waited for review for approximately ${age} minutes.`,
        recommendedAction: "Generate a review draft if appropriate; do not submit mutations."
      }, nowIso));
    }
    if (task.status === "failed") alerts.push(createAlert("task_failed", { entityId: task.id, recommendedAction: "Inspect local failure logs." }, nowIso));
    if (task.status === "timed_out") alerts.push(createAlert("task_timed_out", { entityId: task.id, recommendedAction: "Review timeout evidence locally." }, nowIso));
    if (task.status === "lost") alerts.push(createAlert("task_failed", { entityId: task.id, title: "Task lost", recommendedAction: "Review monitor records locally." }, nowIso));
  }

  for (const backup of input.backups || []) {
    const age = minutesOld(backup.createdAt, nowMs);
    if (backup.verifyStatus === "failed") {
      alerts.push(createAlert("backup_verification_failed", { entityId: backup.id, recommendedAction: "Review backup evidence chain locally." }, nowIso));
    } else if (backup.verifyStatus === "pending" || age > 1440) {
      alerts.push(createAlert("backup_stale", {
        entityId: backup.id,
        description: `Backup verification is pending or stale. Age is approximately ${age} minutes.`,
        recommendedAction: "Generate backup verification draft only."
      }, nowIso));
    }
  }

  if (qualityGateReport.result && qualityGateReport.result !== "pass") {
    alerts.push(createAlert("quality_gate_failed", { entityId: "quality-gate-report", recommendedAction: "Run local quality gate and inspect report." }, nowIso));
  }
  if (safetyScanReport.result && safetyScanReport.result !== "pass") {
    alerts.push(createAlert("safety_scan_failed", { entityId: "safety-scan-report", recommendedAction: "Run local safety scan and fix findings." }, nowIso));
  }
  if (!releaseManifest) {
    alerts.push(createAlert("release_manifest_missing", { entityId: "release-manifest", recommendedAction: "Generate local release manifest." }, nowIso));
  } else if (minutesOld(releaseManifest.generatedAt, nowMs) > 1440) {
    alerts.push(createAlert("release_manifest_stale", { entityId: releaseManifest.releaseId || "release-manifest", recommendedAction: "Regenerate release manifest before handoff." }, nowIso));
  }

  if ((sourceStatus.productionWiring && sourceStatus.productionWiring !== "disabled") || releaseManifest?.dashboard?.productionWiring !== "disabled") {
    alerts.push(createAlert("production_wiring_violation", { entityId: "production-wiring", recommendedAction: "Disable production wiring before continuing." }, nowIso));
  }
  if (sourceStatus.mutationEnabled === true || releaseManifest?.dashboard?.mutationEnabled === true) {
    alerts.push(createAlert("mutation_guardrail_violation", { entityId: "mutation-guardrail", recommendedAction: "Disable mutation before continuing." }, nowIso));
  }

  return {
    generatedAt: nowIso,
    safetyMode: "read-only",
    notificationMode: "local-preview-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    summary: window.OpenClawObservabilitySummary.summarizeAlerts(alerts),
    alerts
  };
}

window.OpenClawObservabilityEvaluator = {
  evaluateObservability
};
})();
