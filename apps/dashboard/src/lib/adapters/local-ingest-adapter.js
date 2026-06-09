(function () {
const DEFAULT_LOCAL_INGEST_PATH = "./data/local-ingest/local-dashboard-ingest.sample.json";

async function createLocalIngestDashboardAdapter(config) {
  const sourceStatus = window.OpenClawSourceStatus;
  const jsonAdapter = window.OpenClawJsonAdapter;
  const mapper = window.OpenClawLocalIngestMapper;
  const validation = window.OpenClawLocalIngestValidation;
  const dataUrl = config.dataUrl || DEFAULT_LOCAL_INGEST_PATH;
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Local ingest fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  const ingestResult = validation.validateLocalIngestPayload(payload);
  if (!ingestResult.ok) {
    throw new Error(`Local ingest validation failed: ${ingestResult.issues.join("; ")}`);
  }
  const exportPayload = mapper.mapLocalIngestToDashboardExport(payload, dataUrl);
  const mappedResult = validation.validateMappedLocalIngestExport(exportPayload);
  if (!mappedResult.ok) {
    throw new Error(`Mapped local ingest validation failed: ${mappedResult.issues.join("; ")}`);
  }
  const data = window.OpenClawDashboardValidation.normalizeDashboardData(exportPayload);
  const status = sourceStatus.createSourceStatus({
    currentSource: "local-ingest",
    requestedSource: config.requestedSource,
    health: ingestResult.warnings.length ? "warning" : "ok",
    validation: "passed",
    fallback: "none",
    fallbackReason: ingestResult.warnings.join("; "),
    dataUrl,
    safetyMode: "read-only",
    productionWiring: "disabled",
    mutationEnabled: false,
    ingestKind: exportPayload.metadata.ingestKind
  });
  return jsonAdapter.createAdapterFromNormalizedData(data, "local-ingest", status);
}

window.OpenClawLocalIngestAdapter = {
  DEFAULT_LOCAL_INGEST_PATH,
  createLocalIngestDashboardAdapter
};
})();
