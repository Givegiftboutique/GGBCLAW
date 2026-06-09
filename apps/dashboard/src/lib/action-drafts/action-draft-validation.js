(function () {
const SECRET_VALUE_RE = /(password|token|cookie|api[_-]?key)\s*[:=]/i;
const PRODUCTION_ENDPOINT_RE = /^https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i;
const ACTIVE_MUTATION_RE = /\b(approveReview|rejectReview|runBackup|restoreBackup|updateSettings|mutateGateway|writeGateway)\b/i;
const FORBIDDEN_INTENT_METHOD_RE = /\b(POST|PUT|PATCH|DELETE)\b/;

function walk(value, path, issues, predicate, label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, issues, predicate, label));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`, issues, predicate, label));
    return;
  }
  if (typeof value === "string" && predicate(value)) {
    issues.push(`${label} at ${path}`);
  }
}

function requireField(draft, field, issues) {
  if (draft[field] === undefined || draft[field] === null || draft[field] === "") {
    issues.push(`missing ${field}`);
  }
}

function validateActionDraft(draft) {
  const issues = [];
  if (!draft || typeof draft !== "object") {
    return { ok: false, issues: ["draft must be an object"] };
  }
  for (const field of ["draftId", "draftType", "createdAt", "createdByRole", "intent", "payload", "riskNotes", "auditNotes"]) {
    requireField(draft, field, issues);
  }
  if (!window.OpenClawActionDraftTypes.ACTION_DRAFT_TYPES.includes(draft.draftType)) issues.push(`unsupported draftType ${draft.draftType}`);
  if (!window.OpenClawActionDraftTypes.ACTION_DRAFT_INTENTS.includes(draft.intent)) issues.push(`unsupported intent ${draft.intent}`);
  if (draft.dryRun !== true) issues.push("dryRun must be true");
  if (draft.mutationEnabled !== false) issues.push("mutationEnabled must be false");
  if (draft.productionWiring !== "disabled") issues.push("productionWiring must be disabled");
  if (draft.requiresHumanApproval !== true) issues.push("requiresHumanApproval must be true");
  if (draft.notSubmitted !== true) issues.push("notSubmitted must be true");
  if (!Array.isArray(draft.riskNotes)) issues.push("riskNotes must be an array");
  if (!Array.isArray(draft.auditNotes)) issues.push("auditNotes must be an array");
  walk(draft, "draft", issues, (value) => SECRET_VALUE_RE.test(value), "secret-like value");
  walk(draft, "draft", issues, (value) => PRODUCTION_ENDPOINT_RE.test(value.trim()), "production endpoint value");
  walk(draft, "draft", issues, (value) => ACTIVE_MUTATION_RE.test(value), "active mutation method name");
  walk(draft, "draft", issues, (value) => FORBIDDEN_INTENT_METHOD_RE.test(value), "mutation HTTP method");
  const requiredPermission = window.OpenClawActionDraftTypes.INTENT_PERMISSION_MAP[draft.intent];
  if (requiredPermission && !window.OpenClawRbacPolicy.hasPermission(draft.createdByRole, requiredPermission)) {
    issues.push(`role ${draft.createdByRole} lacks draft permission ${requiredPermission}`);
  }
  return { ok: issues.length === 0, issues };
}

function validateActionDraftList(drafts) {
  if (!Array.isArray(drafts)) return { ok: false, issues: ["draft list must be an array"] };
  const issues = [];
  drafts.forEach((draft, index) => {
    const result = validateActionDraft(draft);
    issues.push(...result.issues.map((issue) => `draft[${index}]: ${issue}`));
  });
  return { ok: issues.length === 0, issues };
}

window.OpenClawActionDraftValidation = {
  validateActionDraft,
  validateActionDraftList
};
})();
