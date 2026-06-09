(function () {
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unwrap(endpointPayload, field) {
  const data = endpointPayload?.data;
  if (!data || typeof data !== "object") {
    throw new Error(`Gateway stub response is missing data for ${field}.`);
  }
  if (!(field in data)) {
    throw new Error(`Gateway stub response is missing field: ${field}.`);
  }
  return clone(data[field]);
}

function createDashboardExportFromGatewayFixtures(fixtures) {
  const settings = unwrap(fixtures.settings, "settings");
  return {
    metadata: {
      schemaVersion: "gateway-read-only-v1",
      generatedAt: fixtures.sourceStatus?.data?.sourceStatus?.lastLoadedAt ?? new Date().toISOString(),
      source: "gateway-stub",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled"
    },
    metrics: unwrap(fixtures.metrics, "metrics"),
    agents: unwrap(fixtures.agents, "agents"),
    tasks: unwrap(fixtures.tasks, "tasks"),
    reviews: unwrap(fixtures.reviews, "reviews"),
    auditEvents: unwrap(fixtures.logs, "auditEvents"),
    backups: unwrap(fixtures.backups, "backups"),
    settings,
    rbac: unwrap(fixtures.rbac, "rbac"),
    sourceStatus: unwrap(fixtures.sourceStatus, "sourceStatus")
  };
}

function mapGatewayFixturesToDashboardData(fixtures) {
  const validation = window.OpenClawDashboardValidation;
  const exportPayload = createDashboardExportFromGatewayFixtures(fixtures);
  return validation.normalizeDashboardData(exportPayload);
}

window.OpenClawGatewayContractMapper = {
  createDashboardExportFromGatewayFixtures,
  mapGatewayFixturesToDashboardData
};
})();
