import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const here = dirname(fileURLToPath(import.meta.url));
export const dashboardRoot = resolve(here, "..");
export const repoRoot = resolve(here, "../../..");
export const gatewayStubRoot = join(dashboardRoot, "data", "gateway-stub");
export const gatewayBaselinePath = join(gatewayStubRoot, "baseline", "gateway-contract-baseline.json");
export const gatewayDiffReportPath = join(dashboardRoot, "data", "generated", "gateway-fixture-diff-report.json");

export const fixtureFiles = {
  metrics: "metrics.json",
  agents: "agents.json",
  agentDetail: "agent-detail.json",
  tasks: "tasks.json",
  taskDetail: "task-detail.json",
  reviews: "reviews.json",
  logs: "logs.json",
  backups: "backups.json",
  settings: "settings.json",
  rbac: "rbac.json",
  sourceStatus: "source-status.json"
};

export const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
export const forbiddenActiveMutationNames = [
  "approveReview",
  "rejectReview",
  "runBackup",
  "restoreBackup",
  "updateSettings",
  "deleteTask",
  "cancelTask",
  "connectProductionGateway",
  "productionGatewayClient",
  "fetchProduction",
  "writeGateway",
  "mutateGateway"
];

const secretLikeRe = /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i;
const productionEndpointRe = /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i;

export function toRepoPath(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stableHash(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function walkValues(value, path, callback) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValues(item, `${path}[${index}]`, callback));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walkValues(item, `${path}.${key}`, callback));
    return;
  }
  callback(path, value);
}

export function findUnsafeValues(payload) {
  const secretLikeValues = [];
  const productionEndpoints = [];
  walkValues(payload, "gateway", (path, value) => {
    if (typeof value !== "string") return;
    if (secretLikeRe.test(value)) secretLikeValues.push(path);
    if (productionEndpointRe.test(value.trim())) productionEndpoints.push(path);
  });
  return { secretLikeValues, productionEndpoints };
}

export async function readJsonFile(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function readGatewayFixtures() {
  const fixtures = {};
  const parseIssues = [];
  for (const [key, fileName] of Object.entries(fixtureFiles)) {
    const path = join(gatewayStubRoot, fileName);
    try {
      fixtures[key] = await readJsonFile(path);
    } catch (error) {
      parseIssues.push(`${toRepoPath(path)}: ${error.message}`);
    }
  }
  return { fixtures, parseIssues };
}

export async function listGatewayFixtureFileNames() {
  const entries = await readdir(gatewayStubRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => entry.name).sort();
}

export async function createGatewayVmContext() {
  const context = vm.createContext({
    window: {},
    console
  });
  const files = [
    "src/lib/adapters/validation.js",
    "src/lib/adapters/gateway-contract-mapper.js",
    "src/lib/adapters/gateway-contract-validation.js"
  ];
  for (const file of files) {
    vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
  }
  return context;
}

export async function validateGatewayContractFixtures(fixtures) {
  const context = await createGatewayVmContext();
  const validationResult = context.window.OpenClawGatewayContractValidation.validateGatewayFixtureSet(fixtures);
  const exportPayload = context.window.OpenClawGatewayContractMapper.createDashboardExportFromGatewayFixtures(fixtures);
  const normalizedData = context.window.OpenClawGatewayContractMapper.mapGatewayFixturesToDashboardData(fixtures);
  const dashboardResult = context.window.OpenClawDashboardValidation.validateDashboardExport(exportPayload);
  return {
    validationResult,
    dashboardResult,
    exportPayload,
    normalizedData
  };
}

export async function readGatewayExportSample() {
  return readJsonFile(join(gatewayStubRoot, "gateway-export.sample.json"));
}

export function createBaselineSummary({ fixtures, exportPayload, fixtureFileNames, generatedAt }) {
  const statuses = [...new Set(exportPayload.tasks.map((task) => task.status))].sort();
  const reviewVerdicts = [...new Set(exportPayload.reviews.map((review) => review.verdict))].sort();
  const logSeverityCoverage = [...new Set(exportPayload.auditEvents.map((event) => event.severity))].sort();
  const backupVerifyStatuses = [...new Set(exportPayload.backups.map((backup) => backup.verifyStatus))].sort();
  const responseSectionKeys = Object.fromEntries(
    Object.entries(fixtures).map(([key, fixture]) => [key, Object.keys(fixture.data ?? {}).sort()])
  );
  return {
    schemaVersion: "gateway-contract-baseline-v1",
    generatedAt,
    fixtureFiles: fixtureFileNames,
    endpointNames: Object.values(fixtures).map((fixture) => fixture.meta.endpoint).sort(),
    responseSectionKeys,
    agentCount: exportPayload.agents.length,
    taskCount: exportPayload.tasks.length,
    taskLifecycleCoverage: statuses,
    reviewVerdicts,
    logSeverityCoverage,
    backupVerifyStatuses,
    sourceStatus: {
      currentSource: exportPayload.sourceStatus.currentSource,
      health: exportPayload.sourceStatus.health,
      validation: exportPayload.sourceStatus.validation,
      fallback: exportPayload.sourceStatus.fallback,
      safetyMode: exportPayload.sourceStatus.safetyMode,
      productionWiring: exportPayload.sourceStatus.productionWiring
    },
    safetyMode: exportPayload.metadata.safetyMode,
    mutationEnabled: exportPayload.metadata.mutationEnabled,
    checksum: stableHash({
      fixtures,
      metadata: {
        safetyMode: exportPayload.metadata.safetyMode,
        mutationEnabled: exportPayload.metadata.mutationEnabled,
        productionWiring: exportPayload.metadata.productionWiring
      }
    })
  };
}

export async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function compareArrays(label, current, baseline, breakingChanges, warnings) {
  const currentSet = new Set(current);
  const baselineSet = new Set(baseline);
  for (const item of baselineSet) {
    if (!currentSet.has(item)) breakingChanges.push(`${label} missing: ${item}`);
  }
  for (const item of currentSet) {
    if (!baselineSet.has(item)) warnings.push(`${label} added: ${item}`);
  }
}

export function findForbiddenActiveMutationText(sources) {
  const findings = [];
  for (const [label, body] of sources) {
    for (const name of forbiddenActiveMutationNames) {
      const patterns = [
        new RegExp(`\\bfunction\\s+${name}\\b`),
        new RegExp(`\\bconst\\s+${name}\\s*=`),
        new RegExp(`\\blet\\s+${name}\\s*=`),
        new RegExp(`\\bvar\\s+${name}\\s*=`),
        new RegExp(`\\b${name}\\s*\\(`)
      ];
      if (patterns.some((pattern) => pattern.test(body))) {
        findings.push(`${label}: ${name}`);
      }
    }
  }
  return findings;
}
