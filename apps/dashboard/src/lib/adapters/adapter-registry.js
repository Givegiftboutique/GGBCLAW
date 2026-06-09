(function () {
const adapters = new Map();

function registerDashboardDataAdapter(name, adapter) {
  const typeInfo = window.OpenClawAdapterTypes;
  if (!typeInfo) {
    throw new Error("Adapter types are not loaded.");
  }
  for (const method of typeInfo.READ_ONLY_METHODS) {
    if (typeof adapter?.[method] !== "function") {
      throw new Error(`Dashboard adapter is missing read-only method: ${method}`);
    }
  }
  adapters.set(name, adapter);
}

function getDashboardDataAdapter(name = "mock") {
  const adapter = adapters.get(name);
  if (!adapter) {
    throw new Error(`Dashboard adapter is not registered: ${name}`);
  }
  return adapter;
}

async function resolveDashboardDataAdapter(config) {
  const sourceStatus = window.OpenClawSourceStatus;
  const validation = window.OpenClawDashboardValidation;
  const mockAdapter = getDashboardDataAdapter("mock");

  function mockFallback(reason, requestedSource = config?.requestedSource ?? "unknown", dataUrl = config?.dataUrl ?? "") {
    return mockAdapter.withSourceStatus(sourceStatus.createSourceStatus({
      currentSource: "mock",
      requestedSource,
      health: "warning",
      validation: "passed",
      fallback: "mock",
      fallbackReason: reason,
      dataUrl,
      safetyMode: "read-only",
      productionWiring: "disabled",
      mutationEnabled: false
    }));
  }

  async function generatedSnapshotFallback(reason) {
    try {
      const adapter = await window.OpenClawJsonAdapter.createJsonDashboardAdapter({
        requestedSource: config.requestedSource,
        source: "json",
        dataUrl: "./data/generated/dashboard-export.generated.json",
        fallbackSource: "mock"
      });
      adapter.sourceStatus = sourceStatus.createSourceStatus({
        ...adapter.sourceStatus,
        currentSource: "json",
        requestedSource: config.requestedSource,
        health: "warning",
        fallback: "json",
        fallbackReason: reason,
        safetyMode: "read-only",
        productionWiring: "disabled",
        mutationEnabled: false
      });
      return adapter;
    } catch {
      return mockFallback(`${reason}; generated snapshot fallback unavailable`);
    }
  }

  async function gatewayStubFallback(reason) {
    try {
      const adapter = await window.OpenClawGatewayStubAdapter.createGatewayStubDashboardAdapter({
        requestedSource: config.requestedSource,
        source: "gateway-stub",
        dataUrl: "./data/gateway-stub",
        fallbackSource: "mock"
      });
      adapter.sourceStatus = sourceStatus.createSourceStatus({
        ...adapter.sourceStatus,
        currentSource: "gateway-stub",
        requestedSource: config.requestedSource,
        health: "warning",
        fallback: "gateway-stub",
        fallbackReason: reason,
        safetyMode: "read-only",
        productionWiring: "disabled",
        mutationEnabled: false
      });
      return adapter;
    } catch {
      return generatedSnapshotFallback(`${reason}; gateway-stub fallback unavailable`);
    }
  }

  const sourceConfigResult = validation.validateSourceConfig(config);
  if (!sourceConfigResult.ok) {
    return mockFallback(sourceConfigResult.issues.join("; "));
  }

  if (config.source === "mock") {
    return mockAdapter.withSourceStatus(sourceStatus.createSourceStatus({
      currentSource: "mock",
      requestedSource: config.requestedSource,
      health: "ok",
      validation: "passed",
      fallback: "none",
      dataUrl: "inline mock data",
      safetyMode: "read-only",
      productionWiring: "disabled",
      mutationEnabled: false
    }));
  }

  try {
    if (config.source === "json") {
      return await window.OpenClawJsonAdapter.createJsonDashboardAdapter(config);
    }
    if (config.source === "artifact") {
      return await window.OpenClawArtifactAdapter.createArtifactDashboardAdapter(config);
    }
    if (config.source === "gateway-stub") {
      return await window.OpenClawGatewayStubAdapter.createGatewayStubDashboardAdapter(config);
    }
    if (config.source === "local-ingest") {
      return await window.OpenClawLocalIngestAdapter.createLocalIngestDashboardAdapter(config);
    }
    if (config.source === "dev-gateway") {
      return await window.OpenClawDevGatewayAdapter.createDevGatewayDashboardAdapter(config);
    }
  } catch (error) {
    const reason = `${config.source} failed: ${error.message}`;
    if (config.source === "local-ingest") {
      return generatedSnapshotFallback(reason);
    }
    if (config.source === "dev-gateway") {
      return gatewayStubFallback(reason);
    }
    return mockFallback(reason, config.requestedSource, config.dataUrl);
  }

  return mockAdapter;
}

const source = window.OpenClawMockData;
const factory = window.OpenClawMockAdapter;
if (!source || !factory) {
  throw new Error("Mock dashboard data source or adapter factory is missing.");
}

registerDashboardDataAdapter("mock", factory.createMockDashboardAdapter(source));

window.OpenClawDashboardAdapters = {
  registerDashboardDataAdapter,
  getDashboardDataAdapter,
  resolveDashboardDataAdapter,
  listDashboardDataAdapters() {
    return Array.from(adapters.keys());
  }
};
})();
