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
  const sourceConfigResult = validation.validateSourceConfig(config);
  if (!sourceConfigResult.ok) {
    return mockAdapter.withSourceStatus(sourceStatus.createSourceStatus({
      currentSource: "mock",
      requestedSource: config?.requestedSource ?? "unknown",
      health: "warning",
      validation: "passed",
      fallback: "mock",
      fallbackReason: sourceConfigResult.issues.join("; "),
      dataUrl: config?.dataUrl ?? ""
    }));
  }

  if (config.source === "mock") {
    return mockAdapter.withSourceStatus(sourceStatus.createSourceStatus({
      currentSource: "mock",
      requestedSource: config.requestedSource,
      health: "ok",
      validation: "passed",
      fallback: "none",
      dataUrl: "inline mock data"
    }));
  }

  try {
    if (config.source === "json") {
      return await window.OpenClawJsonAdapter.createJsonDashboardAdapter(config);
    }
    if (config.source === "artifact") {
      return await window.OpenClawArtifactAdapter.createArtifactDashboardAdapter(config);
    }
  } catch (error) {
    return mockAdapter.withSourceStatus(sourceStatus.createSourceStatus({
      currentSource: "mock",
      requestedSource: config.requestedSource,
      health: "warning",
      validation: "passed",
      fallback: "mock",
      fallbackReason: `${config.source} failed, using mock adapter: ${error.message}`,
      dataUrl: config.dataUrl
    }));
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
