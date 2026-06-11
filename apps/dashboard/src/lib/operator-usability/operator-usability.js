(function () {
const OPERATOR_RECOMMENDED_DATA = "./data/generated/real-local-dashboard-export.single-agent.generated.json";
const OPERATOR_RECOMMENDED_HASH = "#/dashboard";
const OPERATOR_RECOMMENDED_AGENTS_HASH = "#/dashboard/agents";
const OPERATOR_RECOMMENDED_QUERY = `?source=local-ingest&data=${OPERATOR_RECOMMENDED_DATA}`;

const OPERATOR_USABILITY_CONFIG = {
  operatorHomeEnabled: true,
  operatorRecommendedSource: "local-ingest",
  operatorRecommendedData: OPERATOR_RECOMMENDED_DATA,
  operatorRecommendedHash: OPERATOR_RECOMMENDED_HASH,
  operatorRecommendedAgentsHash: OPERATOR_RECOMMENDED_AGENTS_HASH,
  localHealthReportPath: "./data/generated/local-real-agent-health-report.json",
  localEvidenceReportPath: "./data/generated/local-health-evidence-review-report.json",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  expectedRealAgentCount: 1
};

function cleanBaseUrl(baseUrl = "") {
  return String(baseUrl || "").replace(/[#?].*$/, "").replace(/\/$/, "");
}

function getOperatorRecommendedUrl(baseUrl = "") {
  const prefix = cleanBaseUrl(baseUrl);
  return `${prefix || ""}/${OPERATOR_RECOMMENDED_QUERY}${OPERATOR_RECOMMENDED_HASH}`;
}

function getOperatorLaunchSummary() {
  return {
    title: "OpenClaw Operator Dashboard local preview",
    operatorRecommendedSource: OPERATOR_USABILITY_CONFIG.operatorRecommendedSource,
    operatorRecommendedData: OPERATOR_USABILITY_CONFIG.operatorRecommendedData,
    operatorRecommendedUrl: getOperatorRecommendedUrl("http://localhost:5173"),
    expectedRealAgentCount: 1,
    localHealthReportPath: OPERATOR_USABILITY_CONFIG.localHealthReportPath,
    localEvidenceReportPath: OPERATOR_USABILITY_CONFIG.localEvidenceReportPath,
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false
  };
}

function getOperatorUsabilityWarnings(context = {}) {
  const source = context.source || context.currentSource || "unknown";
  const agentCount = Number(context.agentCount ?? 0);
  const warnings = [];
  if (source === "mock") {
    warnings.push("This is not the daily operator view. Mock shows fixture/demo agents only.");
  }
  if (source === "gateway-stub") {
    warnings.push("This is not the daily operator view. Gateway-stub shows contract fixture agents only.");
  }
  if (agentCount === 8 && (source === "mock" || source === "gateway-stub")) {
    warnings.push("8 agents are fixture lifecycle coverage, not real operator inventory.");
  }
  if (source !== "local-ingest") {
    warnings.push("Open the recommended local-ingest single-agent snapshot before treating data as operator truth.");
  }
  if (context.healthStatus === "unknown" || context.healthStatus === "stale" || context.healthStatus === "review-required") {
    warnings.push("Health needs manual runbook review. Do not restart from Dashboard.");
  }
  if (context.evidenceStatus && context.evidenceStatus !== "reviewed-valid") {
    warnings.push("Evidence fallback or review is active. Inspect sanitized reviewed local health JSON.");
  }
  return warnings;
}

function buildOperatorHomeCards(context = {}) {
  const warnings = getOperatorUsabilityWarnings(context);
  return [
    {
      id: "operator-source",
      label: "Recommended operator view / 建議 Operator 檢視",
      value: "local-ingest single-agent snapshot",
      status: context.source === "local-ingest" ? "ready" : "open-recommended-url",
      detail: OPERATOR_RECOMMENDED_QUERY
    },
    {
      id: "agent-count",
      label: "1 real agent expected / 預期 1 個真實 agent",
      value: String(context.agentCount ?? 1),
      status: Number(context.agentCount ?? 0) === 1 ? "aligned" : "review-required",
      detail: "Mock / gateway-stub 8 agents are fixture only."
    },
    {
      id: "local-health",
      label: "Local real agent health / 本地真實 Agent 健康狀態",
      value: context.healthStatus || "review-required",
      status: context.healthStatus || "review-required",
      detail: OPERATOR_USABILITY_CONFIG.localHealthReportPath
    },
    {
      id: "local-evidence",
      label: "Local health evidence review / 本地健康證據審核",
      value: context.evidenceStatus || "missing-fallback",
      status: context.evidenceStatus || "missing-fallback",
      detail: OPERATOR_USABILITY_CONFIG.localEvidenceReportPath
    },
    {
      id: "production-safety",
      label: "Production status: no-go-for-production / Production 狀態：不可上線",
      value: "restart disabled / mutation disabled / production gateway disabled",
      status: warnings.length ? "review" : "safe-local",
      detail: "Restart: disabled / 重啟：已停用; Mutation: disabled / 修改：已停用; Production gateway: disabled / Production gateway：已停用"
    }
  ];
}

window.OpenClawOperatorUsability = {
  OPERATOR_USABILITY_CONFIG,
  getOperatorRecommendedUrl,
  getOperatorLaunchSummary,
  getOperatorUsabilityWarnings,
  buildOperatorHomeCards
};
})();
