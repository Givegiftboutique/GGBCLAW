(function () {
const READ_ONLY_ADAPTER_CONTRACT_STATUSES = [
  "draft-only",
  "review-required",
  "blocked",
  "not-evaluated"
];

const READ_ONLY_ADAPTER_ALLOWED_FIELDS = [
  "schemaVersion",
  "generatedAt",
  "scope",
  "adapterName",
  "adapterEnabled",
  "connected",
  "productionReady",
  "productionStatus",
  "simulatorOnly",
  "safetyMode",
  "mutationEnabled",
  "restartEnabled",
  "productionGatewayEnabled",
  "deployEnabled",
  "authEnabled",
  "endpointConfigured",
  "expectedRealAgentCount",
  "actualRealAgentCount",
  "source",
  "adapterStatus",
  "contractShape",
  "blockedActions",
  "warnings",
  "requiredFollowups"
];

const READ_ONLY_ADAPTER_FORBIDDEN_FIELDS = [
  "endpoint",
  "productionEndpoint",
  "url",
  "host",
  "hostname",
  "Authorization",
  "authorization",
  "token",
  "cookie",
  "password",
  "secret",
  "apiKey",
  "privateKey",
  "credentials",
  "session",
  "webhook",
  "email",
  "phone",
  "mutationUrl",
  "restartUrl",
  "deployUrl"
];

const REQUIRED_FALSE_FLAGS = [
  "adapterEnabled",
  "connected",
  "productionReady",
  "endpointConfigured",
  "authEnabled",
  "mutationEnabled",
  "restartEnabled",
  "productionGatewayEnabled",
  "deployEnabled"
];

const BLOCKED_ADAPTER_ACTIONS = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

function buildReadOnlyAdapterContract(input = {}) {
  return {
    schemaVersion: "read-only-adapter-contract.v1",
    generatedAt: input.generatedAt || new Date().toISOString(),
    scope: "read-only-adapter-contract-review",
    adapterName: "disabled-read-only-production-adapter-draft",
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    simulatorOnly: true,
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false,
    expectedRealAgentCount: 1,
    actualRealAgentCount: Number(input.actualRealAgentCount ?? 1),
    source: "local-ingest-single-agent-snapshot",
    adapterStatus: input.adapterStatus || "draft-only",
    contractShape: {
      mode: "disabled-draft",
      dataSource: "local-ingest-single-agent-snapshot",
      allowedMethods: ["GET"],
      mutationMethods: [],
      returnsData: false,
      requiresSeparateApproval: true
    },
    blockedActions: BLOCKED_ADAPTER_ACTIONS,
    warnings: [
      "Draft contract only. No production connection is made.",
      "Future real adapter requires separate approval outside Dashboard."
    ],
    requiredFollowups: [
      "Complete manual security design before any future real adapter.",
      "Keep endpoint and auth configuration outside this disabled draft."
    ]
  };
}

function walkKeys(value, path = "") {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => walkKeys(item, `${path}[${index}]`));
  }
  return Object.entries(value).flatMap(([key, child]) => {
    const currentPath = path ? `${path}.${key}` : key;
    return [{ key, path: currentPath }, ...walkKeys(child, currentPath)];
  });
}

function buildForbiddenAdapterFieldPolicy() {
  return {
    allowedFields: READ_ONLY_ADAPTER_ALLOWED_FIELDS,
    forbiddenFields: READ_ONLY_ADAPTER_FORBIDDEN_FIELDS,
    requiredFalseFlags: REQUIRED_FALSE_FLAGS,
    blockedActions: BLOCKED_ADAPTER_ACTIONS
  };
}

function validateReadOnlyAdapterContractShape(input = {}) {
  const policy = buildForbiddenAdapterFieldPolicy();
  const topLevelFields = Object.keys(input);
  const unexpectedFields = topLevelFields.filter((field) => !policy.allowedFields.includes(field));
  const forbiddenFieldHits = walkKeys(input)
    .filter((item) => policy.forbiddenFields.some((forbidden) => forbidden.toLowerCase() === item.key.toLowerCase()))
    .map((item) => item.path);
  const unsafeFlags = policy.requiredFalseFlags.filter((field) => input[field] !== false);
  const warnings = [];
  if (input.productionStatus !== "no-go-for-production") warnings.push("productionStatus must remain no-go-for-production.");
  if (input.simulatorOnly !== true) warnings.push("simulatorOnly must remain true.");
  if (input.safetyMode !== "read-only") warnings.push("safetyMode must remain read-only.");
  if (input.source === "mock" || input.source === "gateway-stub") warnings.push("mock and gateway-stub cannot be adapter production sources.");
  const blocked = forbiddenFieldHits.length > 0 || unsafeFlags.length > 0 || warnings.some((warning) => warning.includes("must remain") || warning.includes("cannot"));
  const reviewRequired = unexpectedFields.length > 0 || !input.contractShape;
  return {
    valid: !blocked,
    status: blocked ? "blocked" : reviewRequired ? "review-required" : "draft-only",
    unexpectedFields,
    forbiddenFieldHits,
    unsafeFlags,
    warnings
  };
}

function buildAdapterContractReview(input = {}) {
  const contract = buildReadOnlyAdapterContract(input);
  const validation = validateReadOnlyAdapterContractShape({ ...contract, ...input });
  return {
    ...contract,
    adapterStatus: validation.status,
    contractReviewStatus: validation.status,
    validation,
    warnings: [...contract.warnings, ...validation.warnings],
    requiredFollowups: validation.status === "draft-only"
      ? contract.requiredFollowups
      : [...contract.requiredFollowups, "Resolve contract review warnings before any future adapter work."]
  };
}

function buildReadOnlyAdapterContractCards(input = {}) {
  const review = buildAdapterContractReview(input);
  return [
    { id: "contract-status", label: "Contract status / 合約狀態", value: review.contractReviewStatus },
    { id: "adapter-enabled", label: "Adapter enabled / Adapter 已啟用", value: "No / false" },
    { id: "connected", label: "Connected / 已連線", value: "No / false" },
    { id: "endpoint-configured", label: "Endpoint configured / Endpoint 已設定", value: "No / false" },
    { id: "auth-enabled", label: "Auth enabled / Auth 已啟用", value: "No / false" },
    { id: "production-ready", label: "Production ready / Production ready", value: "No / false" },
    { id: "simulator-only", label: "Simulator only / 只限模擬", value: "Yes / true" },
    { id: "future-approval", label: "Future adapter approval / 未來 adapter 批准", value: "separate manual approval required" }
  ];
}

window.OpenClawReadOnlyAdapterContract = {
  READ_ONLY_ADAPTER_CONTRACT_STATUSES,
  READ_ONLY_ADAPTER_ALLOWED_FIELDS,
  READ_ONLY_ADAPTER_FORBIDDEN_FIELDS,
  REQUIRED_FALSE_FLAGS,
  BLOCKED_ADAPTER_ACTIONS,
  buildReadOnlyAdapterContract,
  validateReadOnlyAdapterContractShape,
  buildAdapterContractReview,
  buildForbiddenAdapterFieldPolicy,
  buildReadOnlyAdapterContractCards
};
})();
