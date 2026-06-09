(function () {
const DEFAULT_JSON_PATH = "./data/dashboard-export.sample.json";
const DEFAULT_ARTIFACT_PATH = "./data/dashboard-artifact-manifest.sample.json";
const DEFAULT_GATEWAY_STUB_PATH = "./data/gateway-stub";
const DEFAULT_LOCAL_INGEST_PATH = "./data/local-ingest/local-dashboard-ingest.sample.json";
const ALLOWED_SOURCES = new Set(["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]);

function parseDashboardSourceConfig(search) {
  const params = new URLSearchParams(search || "");
  const requestedSource = params.get("source") || "mock";
  const source = ALLOWED_SOURCES.has(requestedSource) ? requestedSource : "mock";
  const data = params.get("data");
  const devGateway = window.OpenClawDevGatewayConfig?.parseDevGatewayConfig(params) ?? {
    baseUrl: "",
    normalizedBaseUrl: "",
    devGatewayEnabled: false,
    devGatewayReason: "dev gateway config unavailable",
    allowedHosts: []
  };
  return {
    requestedSource,
    source,
    dataUrl: data || (source === "artifact" ? DEFAULT_ARTIFACT_PATH : source === "gateway-stub" ? DEFAULT_GATEWAY_STUB_PATH : source === "local-ingest" ? DEFAULT_LOCAL_INGEST_PATH : source === "dev-gateway" ? devGateway.normalizedBaseUrl : DEFAULT_JSON_PATH),
    fallbackSource: "mock",
    devGateway
  };
}

window.OpenClawSourceConfig = {
  DEFAULT_JSON_PATH,
  DEFAULT_ARTIFACT_PATH,
  DEFAULT_GATEWAY_STUB_PATH,
  DEFAULT_LOCAL_INGEST_PATH,
  ALLOWED_SOURCES: Array.from(ALLOWED_SOURCES),
  parseDashboardSourceConfig
};
})();
