(function () {
let latestDraft = null;

function setLatestDraft(draft) {
  const result = window.OpenClawActionDraftValidation.validateActionDraft(draft);
  latestDraft = {
    draft,
    validation: result.ok ? "passed" : "failed",
    issues: result.issues
  };
  return latestDraft;
}

function getLatestDraft() {
  return latestDraft;
}

function clearLatestDraft() {
  latestDraft = null;
}

window.OpenClawActionDraftStore = {
  setLatestDraft,
  getLatestDraft,
  clearLatestDraft
};
})();
