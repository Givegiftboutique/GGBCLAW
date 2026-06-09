(function () {
async function createArtifactDashboardAdapter(config) {
  const validation = window.OpenClawDashboardValidation;
  const sourceStatus = window.OpenClawSourceStatus;
  const jsonAdapter = window.OpenClawJsonAdapter;
  const response = await fetch(config.dataUrl);
  if (!response.ok) {
    throw new Error(`Artifact manifest fetch failed: ${response.status}`);
  }
  const manifest = await response.json();
  const manifestResult = validation.validateArtifactManifest(manifest);
  if (!manifestResult.ok) {
    throw new Error(`Artifact manifest validation failed: ${manifestResult.issues.join("; ")}`);
  }
  const data = validation.normalizeDashboardData(manifest.dashboardData);
  const status = sourceStatus.createSourceStatus({
    currentSource: "artifact",
    requestedSource: config.requestedSource,
    health: "ok",
    validation: "passed",
    fallback: "none",
    dataUrl: config.dataUrl,
    artifactRefs: manifest.artifactRefs,
    checksum: manifest.checksum,
    verifyStatus: manifest.verifyStatus
  });
  return jsonAdapter.createAdapterFromNormalizedData(data, "artifact", status);
}

window.OpenClawArtifactAdapter = {
  createArtifactDashboardAdapter
};
})();
