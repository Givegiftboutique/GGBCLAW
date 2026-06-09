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

const source = window.OpenClawMockData;
const factory = window.OpenClawMockAdapter;
if (!source || !factory) {
  throw new Error("Mock dashboard data source or adapter factory is missing.");
}

registerDashboardDataAdapter("mock", factory.createMockDashboardAdapter(source));

window.OpenClawDashboardAdapters = {
  registerDashboardDataAdapter,
  getDashboardDataAdapter,
  listDashboardDataAdapters() {
    return Array.from(adapters.keys());
  }
};
})();
