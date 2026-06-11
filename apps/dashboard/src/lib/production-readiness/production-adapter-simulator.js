(function () {
const PRODUCTION_ADAPTER_SIMULATOR_STATUSES = [
  "disabled",
  "not-configured",
  "simulator-only",
  "blocked"
];

const BLOCKED_PRODUCTION_ADAPTER_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

function asFalse(value) {
  return value === false;
}

function buildProductionAdapterSimulatorBlockers(input = {}) {
  const blockers = [];
  if (!asFalse(input.adapterEnabled)) blockers.push("adapterEnabled must remain false.");
  if (!asFalse(input.connected)) blockers.push("connected must remain false.");
  if (!asFalse(input.productionReady)) blockers.push("productionReady must remain false.");
  if (input.productionStatus !== "no-go-for-production") blockers.push("productionStatus must remain no-go-for-production.");
  if (!asFalse(input.productionGatewayEnabled)) blockers.push("productionGatewayEnabled must remain false.");
  if (!asFalse(input.mutationEnabled)) blockers.push("mutationEnabled must remain false.");
  if (!asFalse(input.restartEnabled)) blockers.push("restartEnabled must remain false.");
  if (!asFalse(input.deployEnabled)) blockers.push("deployEnabled must remain false.");
  if (!asFalse(input.authEnabled)) blockers.push("authEnabled must remain false.");
  if (!asFalse(input.endpointConfigured)) blockers.push("endpointConfigured must remain false.");
  if (input.simulatorOnly !== true) blockers.push("simulatorOnly must remain true.");
  if (input.source === "mock" || input.source === "gateway-stub" || input.productionSource === "mock" || input.productionSource === "gateway-stub") {
    blockers.push("mock and gateway-stub cannot be production adapter sources.");
  }
  return blockers;
}

function classifyProductionAdapterSimulatorStatus(input = {}) {
  const blockers = buildProductionAdapterSimulatorBlockers({
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    productionGatewayEnabled: false,
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false,
    simulatorOnly: true,
    ...input
  });
  if (blockers.length > 0) return "blocked";
  if (input.adapterEnabled === false && input.connected === false && input.endpointConfigured === false && input.authEnabled === false) return "disabled";
  if (input.simulatorOnly === true) return "simulator-only";
  return "not-configured";
}

function buildProductionAdapterSimulatorPolicy(input = {}) {
  const policy = {
    adapterName: "read-only-production-adapter-simulator",
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    productionGatewayEnabled: false,
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false,
    simulatorOnly: true,
    safetyMode: "read-only",
    expectedRealAgentCount: 1,
    actualRealAgentCount: Number(input.actualRealAgentCount ?? 1),
    productionSource: "disabled",
    blockedActions: BLOCKED_PRODUCTION_ADAPTER_ACTIONS
  };
  return {
    ...policy,
    adapterStatus: classifyProductionAdapterSimulatorStatus(policy),
    adapterBlockers: buildProductionAdapterSimulatorBlockers(policy)
  };
}

function buildProductionAdapterContractShape(input = {}) {
  return {
    adapterName: "read-only-production-adapter-simulator",
    mode: "disabled-read-only-simulator",
    enabled: false,
    connected: false,
    endpointConfigured: false,
    authConfigured: false,
    credentialMode: "none",
    allowedMethods: ["GET"],
    mutationMethods: [],
    dataSource: input.dataSource || "local-ingest-single-agent-snapshot",
    expectedRealAgentCount: 1,
    actualRealAgentCount: Number(input.actualRealAgentCount ?? 1),
    productionSource: "disabled",
    notes: [
      "Simulator contract shape only.",
      "No production endpoint is configured.",
      "No credentials are configured.",
      "No production connection is made."
    ]
  };
}

function buildProductionAdapterSimulatorCards(input = {}) {
  const policy = buildProductionAdapterSimulatorPolicy(input);
  return [
    { id: "adapter-status", label: "Adapter status / Adapter 狀態", value: policy.adapterStatus },
    { id: "adapter-enabled", label: "Adapter enabled / Adapter 啟用", value: "No / false" },
    { id: "connected", label: "Connected / 已連線", value: "No / false" },
    { id: "simulator-only", label: "Simulator only / 只作模擬", value: "Yes / true" },
    { id: "production-ready", label: "Production ready", value: "No / false" },
    { id: "endpoint-configured", label: "Endpoint configured", value: "No / false" },
    { id: "auth-enabled", label: "Auth enabled", value: "No / false" },
    { id: "gateway", label: "Production gateway", value: "disabled" },
    { id: "mutation", label: "Mutation", value: "disabled" },
    { id: "restart", label: "Restart", value: "disabled" },
    { id: "deploy", label: "Deploy", value: "disabled" }
  ];
}

window.OpenClawProductionAdapterSimulator = {
  PRODUCTION_ADAPTER_SIMULATOR_STATUSES,
  BLOCKED_PRODUCTION_ADAPTER_ACTIONS,
  buildProductionAdapterSimulatorPolicy,
  buildProductionAdapterContractShape,
  classifyProductionAdapterSimulatorStatus,
  buildProductionAdapterSimulatorBlockers,
  buildProductionAdapterSimulatorCards
};
})();
