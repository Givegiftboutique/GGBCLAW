(function () {
const SOURCE_TRUST_CLASSIFICATIONS = {
  mock: {
    source: "mock",
    trustLevel: "fixture-demo",
    operatorTruth: false,
    expectedAgentCount: 8,
    fixtureData: true,
    requiresReview: false,
    warningZhHant: "示範測試資料，不是真實 agents。8 agents 只作生命週期測試。",
    warningEn: "Demo fixture data only. Not real agents. 8 agents are lifecycle test fixtures.",
    allowedForProductionPlanning: false
  },
  "gateway-stub": {
    source: "gateway-stub",
    trustLevel: "fixture-contract",
    operatorTruth: false,
    expectedAgentCount: 8,
    fixtureData: true,
    requiresReview: false,
    warningZhHant: "合約測試資料，並非真實 production agents。",
    warningEn: "Contract fixture data only. Not real production agents.",
    allowedForProductionPlanning: false
  },
  json: {
    source: "json",
    trustLevel: "external-import-review-required",
    operatorTruth: false,
    expectedAgentCount: null,
    fixtureData: false,
    requiresReview: true,
    warningZhHant: "外部 JSON 匯入需要人工審核，不會自動成為 operator truth。",
    warningEn: "External JSON import requires review and is not automatically operator truth.",
    allowedForProductionPlanning: false
  },
  artifact: {
    source: "artifact",
    trustLevel: "artifact-review-required",
    operatorTruth: false,
    expectedAgentCount: null,
    fixtureData: false,
    requiresReview: true,
    warningZhHant: "Artifact 資料需要人工審核，不會自動成為 operator truth。",
    warningEn: "Artifact data requires review and is not automatically operator truth.",
    allowedForProductionPlanning: false
  },
  "local-ingest": {
    source: "local-ingest",
    trustLevel: "operator-truth-candidate",
    operatorTruth: true,
    expectedAgentCount: 1,
    fixtureData: false,
    requiresReview: true,
    warningZhHant: "Operator 真實資料候選；預期真實 agent 數量：1。需要驗證通過。",
    warningEn: "Operator truth candidate. Expected real agent count: 1. Validation must pass.",
    allowedForProductionPlanning: true
  },
  "dev-gateway": {
    source: "dev-gateway",
    trustLevel: "dev-readonly-test",
    operatorTruth: false,
    expectedAgentCount: null,
    fixtureData: false,
    requiresReview: true,
    warningZhHant: "開發 read-only 測試來源，不是真實 production operator truth。",
    warningEn: "Development read-only test source. Not production operator truth.",
    allowedForProductionPlanning: false
  }
};

function getSourceTrustClassification(source, options = {}) {
  const base = SOURCE_TRUST_CLASSIFICATIONS[source] ?? SOURCE_TRUST_CLASSIFICATIONS.mock;
  const validationPassed = options.validationPassed !== false;
  if (base.source === "local-ingest") {
    return {
      ...base,
      operatorTruth: validationPassed,
      warningZhHant: validationPassed ? base.warningZhHant : "未載入真實本地 agent snapshot，或驗證未通過。",
      warningEn: validationPassed ? base.warningEn : "No real local agent snapshot loaded, or validation has not passed."
    };
  }
  return { ...base };
}

function sourceTrustToRows(trust) {
  return [
    ["Data trust / 資料可信分類", trust.trustLevel],
    ["Operator truth", String(trust.operatorTruth)],
    ["Fixture data", String(trust.fixtureData)],
    ["Expected agent count", trust.expectedAgentCount === null ? "review required" : String(trust.expectedAgentCount)],
    ["Requires review", String(trust.requiresReview)],
    ["Production planning", trust.allowedForProductionPlanning ? "candidate only" : "not allowed as truth"],
    ["Warning", trust.warningEn]
  ];
}

window.OpenClawSourceTrust = {
  SOURCE_TRUST_CLASSIFICATIONS,
  getSourceTrustClassification,
  sourceTrustToRows
};
})();
