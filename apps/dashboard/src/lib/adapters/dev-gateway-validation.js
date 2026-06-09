(function () {
function validateDevGatewayFixtures(fixtures) {
  const gatewayValidation = window.OpenClawGatewayContractValidation;
  const result = gatewayValidation.validateGatewayFixtureSet(fixtures);
  const issues = [...result.issues];
  const status = fixtures?.sourceStatus?.data?.sourceStatus;
  if (status?.safetyMode !== "read-only") issues.push("Dev gateway safetyMode must be read-only.");
  if (status?.productionWiring !== "disabled") issues.push("Dev gateway production wiring must be disabled.");
  if (status?.mutationEnabled !== false) issues.push("Dev gateway mutationEnabled must be false.");
  return { ok: result.ok && issues.length === 0, issues };
}

window.OpenClawDevGatewayValidation = {
  validateDevGatewayFixtures
};
})();
