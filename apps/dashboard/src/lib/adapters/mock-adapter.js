(function () {
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function matchesFilters(record, filters) {
  if (!filters) {
    return true;
  }
  for (const [key, value] of Object.entries(filters)) {
    if (!value || value === "all") {
      continue;
    }
    if (record[key] !== value) {
      return false;
    }
  }
  return true;
}

function createMockDashboardAdapter(source) {
  const validation = window.OpenClawDashboardValidation;
  if (!validation) {
    throw new Error("Dashboard validation is not loaded.");
  }

  const data = validation.normalizeDashboardData(source);

  const mockDashboardAdapter = {
    source: "mock",
    readOnly: true,
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

  return mockDashboardAdapter;
}

window.OpenClawMockAdapter = {
  createMockDashboardAdapter
};
})();
