import {
  compareArrays,
  createBaselineSummary,
  findUnsafeValues,
  gatewayBaselinePath,
  gatewayDiffReportPath,
  lifecycle,
  listGatewayFixtureFileNames,
  readGatewayFixtures,
  readJsonFile,
  toRepoPath,
  validateGatewayContractFixtures,
  writeJson
} from "./gateway-contract-utils.mjs";

const breakingChanges = [];
const warnings = [];
const { fixtures, parseIssues } = await readGatewayFixtures();
breakingChanges.push(...parseIssues);

let baseline = null;
try {
  baseline = await readJsonFile(gatewayBaselinePath);
} catch (error) {
  breakingChanges.push(`Baseline file missing or unreadable: ${toRepoPath(gatewayBaselinePath)} (${error.message})`);
}

let currentSummary = null;
if (!parseIssues.length) {
  const { validationResult, dashboardResult, exportPayload } = await validateGatewayContractFixtures(fixtures);
  if (!validationResult.ok) breakingChanges.push(...validationResult.issues);
  if (!dashboardResult.ok) breakingChanges.push(...dashboardResult.issues);

  const unsafe = findUnsafeValues(fixtures);
  breakingChanges.push(...unsafe.secretLikeValues.map((path) => `secret-like value at ${path}`));
  breakingChanges.push(...unsafe.productionEndpoints.map((path) => `production endpoint value at ${path}`));

  currentSummary = createBaselineSummary({
    fixtures,
    exportPayload,
    fixtureFileNames: await listGatewayFixtureFileNames(),
    generatedAt: "current"
  });

  if (currentSummary.agentCount !== 8) breakingChanges.push(`Agent count must be 8; found ${currentSummary.agentCount}.`);
  lifecycle.forEach((status) => {
    if (!currentSummary.taskLifecycleCoverage.includes(status)) breakingChanges.push(`Task lifecycle missing: ${status}.`);
  });
  if (currentSummary.mutationEnabled !== false) breakingChanges.push("mutationEnabled must be false.");
  if (currentSummary.safetyMode !== "read-only") breakingChanges.push("safetyMode must be read-only.");
  if (currentSummary.sourceStatus.productionWiring !== "disabled") breakingChanges.push("sourceStatus productionWiring must be disabled.");
}

if (baseline && currentSummary) {
  compareArrays("fixture file", currentSummary.fixtureFiles, baseline.fixtureFiles, breakingChanges, warnings);
  compareArrays("endpoint", currentSummary.endpointNames, baseline.endpointNames, breakingChanges, warnings);
  compareArrays("task lifecycle", currentSummary.taskLifecycleCoverage, baseline.taskLifecycleCoverage, breakingChanges, warnings);
  compareArrays("review verdict", currentSummary.reviewVerdicts, baseline.reviewVerdicts, breakingChanges, warnings);
  compareArrays("log severity", currentSummary.logSeverityCoverage, baseline.logSeverityCoverage, breakingChanges, warnings);
  compareArrays("backup verify status", currentSummary.backupVerifyStatuses, baseline.backupVerifyStatuses, breakingChanges, warnings);

  for (const [key, sections] of Object.entries(baseline.responseSectionKeys ?? {})) {
    if (!currentSummary.responseSectionKeys[key]) {
      breakingChanges.push(`Response section missing fixture key: ${key}`);
      continue;
    }
    compareArrays(`response section ${key}`, currentSummary.responseSectionKeys[key], sections, breakingChanges, warnings);
  }

  if (currentSummary.agentCount !== baseline.agentCount) breakingChanges.push(`Agent count changed from ${baseline.agentCount} to ${currentSummary.agentCount}.`);
  if (currentSummary.taskCount < baseline.taskCount) breakingChanges.push(`Task count decreased from ${baseline.taskCount} to ${currentSummary.taskCount}.`);
  if (currentSummary.checksum !== baseline.checksum) warnings.push("Gateway fixture stable hash changed; review intentional fixture changes.");
}

const report = {
  generatedAt: new Date().toISOString(),
  result: breakingChanges.length ? "fail" : "pass",
  baselinePath: toRepoPath(gatewayBaselinePath),
  currentFixturePath: "apps/dashboard/data/gateway-stub",
  breakingChanges,
  warnings,
  baselineSummary: baseline,
  currentSummary
};

await writeJson(gatewayDiffReportPath, report);

if (breakingChanges.length) {
  console.error("OpenClaw gateway fixture diff failed.");
  breakingChanges.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
console.log("OpenClaw gateway fixture diff passed.");
