(function () {
const ACTION_DRAFT_TYPES = [
  "review_decision_draft",
  "backup_verification_draft",
  "settings_change_request_draft",
  "export_snapshot_draft"
];

const ACTION_DRAFT_INTENTS = [
  "approve",
  "reject",
  "needs_changes",
  "verify_backup",
  "request_settings_change",
  "export_snapshot"
];

const INTENT_PERMISSION_MAP = {
  approve: "reviews:draft_decision",
  reject: "reviews:draft_decision",
  needs_changes: "reviews:draft_decision",
  verify_backup: "backups:draft_verification",
  request_settings_change: "admin:view_config",
  export_snapshot: "exports:generate_local_snapshot"
};

window.OpenClawActionDraftTypes = {
  ACTION_DRAFT_TYPES,
  ACTION_DRAFT_INTENTS,
  INTENT_PERMISSION_MAP
};
})();
