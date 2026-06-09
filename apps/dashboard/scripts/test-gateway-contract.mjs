import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  dashboardRoot,
  findForbiddenActiveMutationText,
  findUnsafeValues,
  lifecycle,
  readGatewayExportSample,
  readGatewayFixtures,
  validateGatewayContractFixtures
} from "./gateway-contract-utils.mjs";

const issues = [];
const { fixtures, parseIssues } = await readGatewayFixtures();
issues.push(...parseIssues);

if (!parseIssues.length) {
  const unsafe = findUnsafeValues(fixtures);
  issues.push(...unsafe.secretLikeValues.map((path) => `secret-like value at ${path}`));
  issues.push(...unsafe.productionEndpoints.map((path) => `production endpoint value at ${path}`));

  const { validationResult, dashboardResult, exportPayload, normalizedData } = await validateGatewayContractFixtures(fixtures);
  if (!validationResult.ok) issues.push(...validationResult.issues);
  if (!dashboardResult.ok) issues.push(...dashboardResult.issues);

  if (normalizedData.agents.length !== 8) {
    issues.push(`Expected 8 agents, found ${normalizedData.agents.length}.`);
  }

  const statuses = new Set(normalizedData.tasks.map((task) => task.status));
  lifecycle.forEach((status) => {
    if (!statuses.has(status)) issues.push(`Missing task lifecycle status: ${status}.`);
  });

  if (exportPayload.metadata.mutationEnabled !== false) {
    issues.push("Gateway mapper metadata mutationEnabled must be false.");
  }
  if (exportPayload.metadata.safetyMode !== "read-only") {
    issues.push("Gateway mapper metadata safetyMode must be read-only.");
  }
  if (exportPayload.sourceStatus?.productionWiring !== "disabled") {
    issues.push("Gateway source status must keep production wiring disabled.");
  }

  const gatewayExport = await readGatewayExportSample();
  if (gatewayExport.metadata?.mutationEnabled !== false) {
    issues.push("gateway-export.sample.json mutationEnabled must be false.");
  }
  if (gatewayExport.metadata?.safetyMode !== "read-only") {
    issues.push("gateway-export.sample.json safetyMode must be read-only.");
  }
}

const activeSources = await Promise.all(
  [
    "src/lib/adapters/gateway-stub-adapter.js",
    "src/lib/adapters/gateway-contract-mapper.js",
    "src/lib/adapters/gateway-contract-validation.js"
  ].map(async (file) => [file, await readFile(join(dashboardRoot, file), "utf8")])
);
issues.push(...findForbiddenActiveMutationText(activeSources).map((finding) => `forbidden active mutation function: ${finding}`));

if (issues.length) {
  console.error("OpenClaw gateway stub contract tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw gateway stub contract tests passed.");
