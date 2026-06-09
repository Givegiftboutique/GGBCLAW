(function () {
const DEFAULT_JSON_PATH = "./data/dashboard-export.sample.json";
const DEFAULT_ARTIFACT_PATH = "./data/dashboard-artifact-manifest.sample.json";
const ALLOWED_SOURCES = new Set(["mock", "json", "artifact"]);

function parseDashboardSourceConfig(search) {
  const params = new URLSearchParams(search || "");
  const requestedSource = params.get("source") || "mock";
  const source = ALLOWED_SOURCES.has(requestedSource) ? requestedSource : "mock";
  const data = params.get("data");
  return {
    requestedSource,
    source,
    dataUrl: data || (source === "artifact" ? DEFAULT_ARTIFACT_PATH : DEFAULT_JSON_PATH),
    fallbackSource: "mock"
  };
}

window.OpenClawSourceConfig = {
  DEFAULT_JSON_PATH,
  DEFAULT_ARTIFACT_PATH,
  ALLOWED_SOURCES: Array.from(ALLOWED_SOURCES),
  parseDashboardSourceConfig
};
})();
