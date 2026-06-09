(function () {
async function createDevGatewayDashboardAdapter(config) {
  const devConfig = config.devGateway || {};
  if (!devConfig.devGatewayEnabled) {
    throw new Error(`dev gateway disabled: ${devConfig.devGatewayReason || "missing baseUrl"}`);
  }
  const fixtures = await window.OpenClawDevGatewayClient.readDevGatewayFixtures(devConfig.normalizedBaseUrl);
  const result = window.OpenClawDevGatewayValidation.validateDevGatewayFixtures(fixtures);
  if (!result.ok) {
    throw new Error(`Dev gateway validation failed: ${result.issues.join("; ")}`);
  }
  const data = window.OpenClawGatewayContractMapper.mapGatewayFixturesToDashboardData(fixtures);
  const status = window.OpenClawSourceStatus.createSourceStatus({
    currentSource: "dev-gateway",
    requestedSource: config.requestedSource,
    health: "ok",
    validation: "passed",
    fallback: "none",
    fallbackReason: "",
    dataUrl: devConfig.normalizedBaseUrl,
    baseUrlState: "allowed",
    safetyMode: "read-only",
    productionWiring: "disabled",
    mutationEnabled: false
  });
  return window.OpenClawJsonAdapter.createAdapterFromNormalizedData(data, "dev-gateway", status);
}

window.OpenClawDevGatewayAdapter = {
  createDevGatewayDashboardAdapter
};
})();
