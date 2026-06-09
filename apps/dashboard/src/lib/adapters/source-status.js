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
    ["Safety mode", status.safetyMode || "read-only"],
    ["Production wiring", status.productionWiring || "disabled"],
    ["Mutation enabled", String(status.mutationEnabled ?? false)],
    ["Ingest file", status.currentSource === "local-ingest" ? status.dataUrl : "n/a"],
    ["Base URL", status.currentSource === "dev-gateway" ? status.dataUrl || status.baseUrlState || "missing" : "n/a"],
    ["Last loaded", status.lastLoadedAt]
  ];
}

window.OpenClawSourceStatus = {
  createSourceStatus,
  sourceStatusToRows
};
})();
