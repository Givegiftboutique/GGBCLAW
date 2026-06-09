(function () {
const GATEWAY_STUB_FIXTURE_BASE = "./data/gateway-stub";
const FIXTURE_FILES = {
  metrics: "metrics.json",
  agents: "agents.json",
  agentDetail: "agent-detail.json",
  tasks: "tasks.json",
  taskDetail: "task-detail.json",
  reviews: "reviews.json",
  logs: "logs.json",
  backups: "backups.json",
  settings: "settings.json",
  rbac: "rbac.json",
  sourceStatus: "source-status.json"
};

async function readFixture(baseUrl, fileName) {
  const response = await fetch(`${baseUrl}/${fileName}`);
  if (!response.ok) {
    throw new Error(`Gateway stub fixture fetch failed: ${fileName} ${response.status}`);
  }
  return response.json();
}

async function loadGatewayStubFixtures(baseUrl = GATEWAY_STUB_FIXTURE_BASE) {
  const entries = await Promise.all(
    Object.entries(FIXTURE_FILES).map(async ([key, fileName]) => [key, await readFixture(baseUrl, fileName)])
  );
  return Object.fromEntries(entries);
}

async function createGatewayStubDashboardAdapter(config) {
  const sourceStatus = window.OpenClawSourceStatus;
  const jsonAdapter = window.OpenClawJsonAdapter;
  const mapper = window.OpenClawGatewayContractMapper;
  const gatewayValidation = window.OpenClawGatewayContractValidation;
  const fixtureBase = config.dataUrl || GATEWAY_STUB_FIXTURE_BASE;
  const fixtures = await loadGatewayStubFixtures(fixtureBase);
  const result = gatewayValidation.validateGatewayFixtureSet(fixtures);
  if (!result.ok) {
    throw new Error(`Gateway stub validation failed: ${result.issues.join("; ")}`);
  }
  const data = mapper.mapGatewayFixturesToDashboardData(fixtures);
  const fixtureStatus = fixtures.sourceStatus.data.sourceStatus;
  const status = sourceStatus.createSourceStatus({
    ...fixtureStatus,
    currentSource: "gateway-stub",
    requestedSource: config.requestedSource,
    health: "ok",
    validation: "passed",
    fallback: "none",
    fallbackReason: "",
    dataUrl: fixtureBase,
    safetyMode: "read-only",
    productionWiring: "disabled"
  });
  return jsonAdapter.createAdapterFromNormalizedData(data, "gateway-stub", status);
}

window.OpenClawGatewayStubAdapter = {
  GATEWAY_STUB_FIXTURE_BASE,
  FIXTURE_FILES,
  loadGatewayStubFixtures,
  createGatewayStubDashboardAdapter
};
})();
