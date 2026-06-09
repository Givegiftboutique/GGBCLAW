(function () {
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesFilters(record, filters) {
  if (!filters) return true;
  for (const [key, value] of Object.entries(filters)) {
    if (!value || value === "all") continue;
    if (record[key] !== value) return false;
  }
  return true;
}

function createAdapterFromNormalizedData(data, sourceName, status) {
  return {
    source: sourceName,
    readOnly: true,
    sourceStatus: status,
    getMetrics() {
      return clone(data.metrics);
    },
    getAgents() {
      return clone(data.agents);
    },
    getAgentById(id) {
      return clone(data.agents.find((agent) => agent.id === id) ?? null);
    },
    getTasks(filters) {
      return clone(data.tasks.filter((task) => matchesFilters(task, filters)));
    },
    getTaskById(id) {
      return clone(data.tasks.find((task) => task.id === id) ?? null);
    },
    getReviews(filters) {
      return clone(data.reviews.filter((review) => matchesFilters(review, filters)));
    },
    getLogs(filters) {
      return clone(data.logs.filter((event) => matchesFilters(event, filters)));
    },
    getBackups() {
      return clone(data.backups);
    },
    getSettings() {
      return clone(data.settings);
    },
    getRbacSummary() {
      return clone(data.rbacSummary);
    }
  };
}

async function createJsonDashboardAdapter(config) {
  const validation = window.OpenClawDashboardValidation;
  const sourceStatus = window.OpenClawSourceStatus;
  const response = await fetch(config.dataUrl);
  if (!response.ok) {
    throw new Error(`JSON source fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  const exportResult = validation.validateDashboardExport(payload);
  if (!exportResult.ok) {
    throw new Error(`JSON source validation failed: ${exportResult.issues.join("; ")}`);
  }
  const data = validation.normalizeDashboardData(payload);
  const status = sourceStatus.createSourceStatus({
    currentSource: "json",
    requestedSource: config.requestedSource,
    health: "ok",
    validation: "passed",
    fallback: "none",
    dataUrl: config.dataUrl
  });
  return createAdapterFromNormalizedData(data, "json", status);
}

window.OpenClawJsonAdapter = {
  createJsonDashboardAdapter,
  createAdapterFromNormalizedData
};
})();
