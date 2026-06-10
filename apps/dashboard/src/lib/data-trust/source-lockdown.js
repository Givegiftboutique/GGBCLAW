(function () {
const OPERATOR_RECOMMENDED_DATA = "./data/generated/real-local-dashboard-export.single-agent.generated.json";
const OPERATOR_RECOMMENDED_URL = `?source=local-ingest&data=${OPERATOR_RECOMMENDED_DATA}`;

const SOURCE_LOCKDOWN_POLICY = {
  operatorRecommendedSource: "local-ingest",
  operatorRecommendedData: OPERATOR_RECOMMENDED_DATA,
  operatorRecommendedUrl: OPERATOR_RECOMMENDED_URL,
  fixtureSources: ["mock", "gateway-stub"],
  reviewRequiredSources: ["json", "artifact"],
  devOnlySources: ["dev-gateway"],
  defaultEntryBehavior: "operator-safe-notice",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  expectedRealAgentCount: 1
};

const SOURCE_LOCKDOWN_RULES = {
  mock: {
    source: "mock",
    operatorRecommended: false,
    requiresExplicitSelection: true,
    requiresDemoAcknowledgement: true,
    defaultAllowed: false,
    warningLevel: "high",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "Demo fixture data only. Not real agents. 8 agents are lifecycle test fixtures.",
    expectedAgentCount: 8,
    operatorTruth: false,
    fixtureData: true
  },
  "gateway-stub": {
    source: "gateway-stub",
    operatorRecommended: false,
    requiresExplicitSelection: true,
    requiresDemoAcknowledgement: true,
    defaultAllowed: false,
    warningLevel: "high",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "Contract fixture data only. Not real production agents.",
    expectedAgentCount: 8,
    operatorTruth: false,
    fixtureData: true
  },
  json: {
    source: "json",
    operatorRecommended: false,
    requiresExplicitSelection: true,
    requiresDemoAcknowledgement: false,
    defaultAllowed: false,
    warningLevel: "medium",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "External JSON import requires review before operator use.",
    expectedAgentCount: null,
    operatorTruth: false,
    fixtureData: false,
    requiresReview: true
  },
  artifact: {
    source: "artifact",
    operatorRecommended: false,
    requiresExplicitSelection: true,
    requiresDemoAcknowledgement: false,
    defaultAllowed: false,
    warningLevel: "medium",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "Artifact source requires review before operator use.",
    expectedAgentCount: null,
    operatorTruth: false,
    fixtureData: false,
    requiresReview: true
  },
  "local-ingest": {
    source: "local-ingest",
    operatorRecommended: true,
    requiresExplicitSelection: false,
    requiresDemoAcknowledgement: false,
    defaultAllowed: true,
    warningLevel: "low",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "",
    expectedAgentCount: 1,
    operatorTruth: true,
    fixtureData: false,
    requiresReview: true
  },
  "dev-gateway": {
    source: "dev-gateway",
    operatorRecommended: false,
    requiresExplicitSelection: true,
    requiresDemoAcknowledgement: false,
    defaultAllowed: false,
    warningLevel: "medium",
    recommendedUrl: OPERATOR_RECOMMENDED_URL,
    blockedReason: "Development read-only source only. Not operator truth.",
    expectedAgentCount: null,
    operatorTruth: false,
    fixtureData: false,
    devOnly: true
  }
};

function getSourceLockdownRule(source) {
  return { ...(SOURCE_LOCKDOWN_RULES[source] ?? SOURCE_LOCKDOWN_RULES.mock) };
}

function getOperatorRecommendedUrl(origin = "") {
  const prefix = origin ? origin.replace(/\/$/, "") : "";
  return `${prefix}/${OPERATOR_RECOMMENDED_URL}`;
}

function hasExplicitSourceSelection(search = "") {
  return new URLSearchParams(search).has("source");
}

function getDefaultEntryNotice(search = "") {
  const explicit = hasExplicitSourceSelection(search);
  return {
    defaultEntryBehavior: SOURCE_LOCKDOWN_POLICY.defaultEntryBehavior,
    explicitSourceSelected: explicit,
    showOperatorSafeNotice: !explicit,
    operatorRecommendedSource: SOURCE_LOCKDOWN_POLICY.operatorRecommendedSource,
    operatorRecommendedData: SOURCE_LOCKDOWN_POLICY.operatorRecommendedData,
    operatorRecommendedUrl: OPERATOR_RECOMMENDED_URL,
    warningLevel: explicit ? "none" : "high",
    messageEn: explicit
      ? "Explicit source selected."
      : "No source query was provided. Use the operator recommended single-agent local-ingest URL before treating data as operator truth.",
    messageZhHant: explicit
      ? "已明確選擇資料來源。"
      : "未指定 source query；請先使用 Operator 建議的 single-agent local-ingest URL，才可視為 operator truth candidate。"
  };
}

window.OpenClawSourceLockdown = {
  SOURCE_LOCKDOWN_POLICY,
  SOURCE_LOCKDOWN_RULES,
  getSourceLockdownRule,
  getOperatorRecommendedUrl,
  hasExplicitSourceSelection,
  getDefaultEntryNotice
};
})();
