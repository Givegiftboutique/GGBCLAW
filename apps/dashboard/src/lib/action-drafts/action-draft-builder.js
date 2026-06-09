(function () {
let draftCounter = 0;

function safeText(value, fallback = "n/a") {
  const text = value === undefined || value === null ? fallback : String(value);
  return text.replace(/[<>]/g, "").slice(0, 240);
}

function nextDraftId(type) {
  draftCounter += 1;
  return `${type}-${String(draftCounter).padStart(3, "0")}`;
}

function baseDraft(type, role, intent, payload) {
  return {
    draftId: nextDraftId(type),
    draftType: type,
    createdAt: new Date().toISOString(),
    createdByRole: role,
    taskId: payload.taskId ? safeText(payload.taskId) : undefined,
    reviewId: payload.reviewId ? safeText(payload.reviewId) : undefined,
    intent,
    dryRun: true,
    mutationEnabled: false,
    productionWiring: "disabled",
    requiresHumanApproval: true,
    notSubmitted: true,
    payload,
    riskNotes: [
      "Draft only; not submitted.",
      "Production mutation disabled.",
      "Requires human approval before any external workflow."
    ],
    auditNotes: [
      "Generated inside local dashboard memory.",
      "No network request was made by draft generation."
    ]
  };
}

function buildReviewDecisionDraft(review, intent, role) {
  const safeIntent = ["approve", "reject", "needs_changes"].includes(intent) ? intent : "needs_changes";
  return baseDraft("review_decision_draft", role, safeIntent, {
    reviewId: safeText(review?.id, "review-local-draft"),
    taskId: safeText(review?.taskId, "task-local-draft"),
    requestedVerdict: safeIntent,
    reviewer: safeText(review?.reviewer, "simulated-reviewer"),
    policyChecks: Array.isArray(review?.policyChecks) ? review.policyChecks.map((item) => safeText(item)) : ["local draft policy check"],
    notes: safeText(review?.notes, "Draft generated for local review simulation."),
    notSubmitted: true
  });
}

function buildBackupVerificationDraft(backup, role) {
  return baseDraft("backup_verification_draft", role, "verify_backup", {
    backupId: safeText(backup?.id, "backup-local-draft"),
    taskId: safeText(backup?.taskId, "task-local-draft"),
    verifyStatus: safeText(backup?.verifyStatus, "pending"),
    checksum: safeText(backup?.checksum, "mock-sha256-draft"),
    storageUri: safeText(backup?.storageUri, "mock://artifact-bundle/local-draft"),
    evidenceChain: Array.isArray(backup?.evidenceChain) ? backup.evidenceChain.map((item) => safeText(item)) : ["local evidence draft"],
    notSubmitted: true
  });
}

function buildSettingsChangeRequestDraft(settings, role) {
  return baseDraft("settings_change_request_draft", role, "request_settings_change", {
    requestedChange: "local settings change request draft",
    currentGatewayAuthMode: safeText(settings?.gatewayAuthMode, "read-only mock"),
    currentRetentionPolicy: safeText(settings?.retentionPolicy, "local retention policy"),
    productionMutation: "disabled",
    notSubmitted: true
  });
}

function buildExportSnapshotDraft(role) {
  return baseDraft("export_snapshot_draft", role, "export_snapshot", {
    outputPath: "apps/dashboard/data/generated/dashboard-export.generated.json",
    generatedByScriptOnly: true,
    notSubmitted: true
  });
}

window.OpenClawActionDraftBuilder = {
  buildReviewDecisionDraft,
  buildBackupVerificationDraft,
  buildSettingsChangeRequestDraft,
  buildExportSnapshotDraft
};
})();
