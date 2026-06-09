import {
  createBaselineSummary,
  gatewayBaselinePath,
  readGatewayFixtures,
  validateGatewayContractFixtures,
  listGatewayFixtureFileNames,
  writeJson,
  toRepoPath
} from "./gateway-contract-utils.mjs";

const { fixtures, parseIssues } = await readGatewayFixtures();
if (parseIssues.length) {
  console.error("Gateway baseline generation failed.");
  parseIssues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

const { validationResult, dashboardResult, exportPayload } = await validateGatewayContractFixtures(fixtures);
const issues = [...validationResult.issues, ...dashboardResult.issues];
if (!validationResult.ok || !dashboardResult.ok || issues.length) {
  console.error("Gateway baseline generation failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

const summary = createBaselineSummary({
  fixtures,
  exportPayload,
  fixtureFileNames: await listGatewayFixtureFileNames(),
  generatedAt: "2026-06-09T16:00:00+08:00"
});

await writeJson(gatewayBaselinePath, summary);
console.log(`OpenClaw gateway contract baseline generated: ${toRepoPath(gatewayBaselinePath)}`);
