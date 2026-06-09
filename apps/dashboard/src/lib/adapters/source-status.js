(function () {
function nowIso() {
  return new Date().toISOString();
}

function createSourceStatus(overrides) {
  return {
    currentSource: "mock",
    requestedSource: "mock",
    health: "ok",
    validation: "passed",
    fallback: "none",
    fallbackReason: "",
    lastLoadedAt: nowIso(),
    dataUrl: "",
    ...overrides
  };
}

function sourceStatusToRows(status) {
  return [
    ["Data source", status.currentSource],
    ["Health", status.health],
    ["Validation", status.validation],
    ["Fallback", status.fallback],
    ["Fallback reason", status.fallbackReason || "none"],
    ["Last loaded", status.lastLoadedAt]
  ];
}

window.OpenClawSourceStatus = {
  createSourceStatus,
  sourceStatusToRows
};
})();
