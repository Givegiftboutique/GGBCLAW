(function () {
const DISABLED_READ_ONLY_ADAPTER_STATUS = {
  adapterName: "disabled-read-only-production-adapter-draft",
  adapterEnabled: false,
  connected: false,
  productionReady: false,
  productionStatus: "no-go-for-production",
  endpointConfigured: false,
  authEnabled: false,
  simulatorOnly: true,
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false,
  dataReturned: false,
  reason: "disabled-by-default"
};

function cloneStatus(extra = {}) {
  return { ...DISABLED_READ_ONLY_ADAPTER_STATUS, ...extra };
}

function assertAdapterDisabled(input = {}) {
  const status = cloneStatus(input);
  const unsafeFlags = [
    "adapterEnabled",
    "connected",
    "productionReady",
    "endpointConfigured",
    "authEnabled",
    "mutationEnabled",
    "restartEnabled",
    "productionGatewayEnabled",
    "deployEnabled",
    "dataReturned"
  ].filter((field) => status[field] !== false);
  if (status.productionStatus !== "no-go-for-production") unsafeFlags.push("productionStatus");
  if (status.safetyMode !== "read-only") unsafeFlags.push("safetyMode");
  if (status.simulatorOnly !== true) unsafeFlags.push("simulatorOnly");
  return {
    disabled: unsafeFlags.length === 0,
    unsafeFlags,
    status: cloneStatus()
  };
}

function getDisabledReadOnlyAdapterStatus() {
  return cloneStatus();
}

function buildDisabledAdapterResponse(input = {}) {
  const assertion = assertAdapterDisabled(input);
  return {
    ok: false,
    data: null,
    dataReturned: false,
    adapterStatus: assertion.disabled ? "disabled" : "blocked",
    reason: assertion.disabled ? "disabled-by-default" : "unsafe-flags-detected",
    unsafeFlags: assertion.unsafeFlags,
    status: cloneStatus()
  };
}

function readDisabledAdapterSnapshot() {
  return buildDisabledAdapterResponse();
}

function createDisabledReadOnlyProductionAdapter() {
  return {
    name: "disabled-read-only-production-adapter-draft",
    getStatus: getDisabledReadOnlyAdapterStatus,
    readSnapshot: readDisabledAdapterSnapshot,
    buildResponse: buildDisabledAdapterResponse,
    assertDisabled: assertAdapterDisabled
  };
}

window.OpenClawDisabledReadOnlyProductionAdapter = {
  DISABLED_READ_ONLY_ADAPTER_STATUS,
  createDisabledReadOnlyProductionAdapter,
  getDisabledReadOnlyAdapterStatus,
  readDisabledAdapterSnapshot,
  buildDisabledAdapterResponse,
  assertAdapterDisabled
};
})();
