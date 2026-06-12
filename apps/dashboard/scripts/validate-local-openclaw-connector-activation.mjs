import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const configRel = "apps/dashboard/data/local/local-openclaw-connector.json";
const connectorReportRel = "apps/dashboard/data/generated/local-openclaw-connector-report.json";
const outputRel = "apps/dashboard/data/generated/local-openclaw-activation-report.json";
const defaultExportRel = "apps/dashboard/data/local/openclaw-local-export.json";
const generatedAt = new Date().toISOString();
const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function exists(relPath) {
  try {
    await access(join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

async function readJsonRel(relPath, fallback = null) {
  try {
    return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

async function loadModule(relPath, globalName) {
  const source = await readFile(join(dashboardRoot, relPath), "utf8");
  const context = { window: {}, URL };
  vm.runInNewContext(source, context, { filename: relPath });
  return context.window[globalName];
}

function reportId() {
  return `local-openclaw-activation-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`;
}

const connector = await loadModule("src/lib/local-openclaw/local-openclaw-connector.js", "OpenClawLocalOpenClawConnector");
const assistant = await loadModule("src/lib/local-openclaw/local-openclaw-activation-assistant.js", "OpenClawLocalOpenClawActivationAssistant");
const localConfigPresent = await exists(configRel);
const config = localConfigPresent ? await readJsonRel(configRel, {}) : {};
const connectorReport = await readJsonRel(connectorReportRel, {});
const validation = localConfigPresent ? connector.validateLocalOpenClawConnectorConfig(config) : { valid: false, issues: ["local-config-missing"], normalizedBaseUrl: null };
const localExportPath = typeof config.localExportPath === "string" ? config.localExportPath.replaceAll("\\", "/").replace(/^\.\//, "") : defaultExportRel;
const exportValidation = assistant.validateLocalOpenClawExportCandidate({ localExportPath });
const endpointValidation = config.baseUrl ? assistant.validateLocalOpenClawEndpointCandidate({ baseUrl: config.baseUrl }) : { valid: false, safeLabel: "not-configured" };
const activationInput = {
  localConfigPresent,
  connectorEnabled: config.connectorEnabled === true,
  connectionStatus: connectorReport.connectionStatus || "not-connected",
  readinessStatus: connectorReport.readinessStatus || (localConfigPresent ? "needs-openclaw-running" : "needs-local-config"),
  baseUrlSafeLabel: validation.normalizedBaseUrl ? "localhost" : "not-configured",
  localExportPath
};
const summary = assistant.buildLocalOpenClawActivationSummary(activationInput);
const activationStatus = validation.valid ? summary.activationStatus : localConfigPresent ? "unsafe-rejected" : "needs-local-config";
const report = {
  reportId: reportId(),
  generatedAt,
  scope: "local-openclaw-connector-activation",
  language: "zh-Hant",
  activationStatus,
  localConfigPresent,
  connectorEnabled: config.connectorEnabled === true,
  setupMode: config.setupMode || (localConfigPresent ? "review-required" : "not-configured"),
  baseUrlSafeLabel: validation.normalizedBaseUrl ? "localhost" : "not-configured",
  baseUrlRedacted: true,
  localExportPath,
  localExportCandidateValid: exportValidation.valid,
  endpointCandidateValid: endpointValidation.valid,
  allowedMethods: ["GET"],
  externalNetworkAllowed: false,
  productionReady: false,
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  productionGatewayEnabled: false,
  authEnabled: false,
  credentialRequired: false,
  rawConfigPrinted: false,
  secretRedactionApplied: true,
  validationIssues: validation.valid ? [] : validation.issues,
  operatorSteps: summary.operatorSteps,
  safeNextSteps: summary.safeNextSteps,
  blockedActions,
  configPath: configRel,
  localExportTemplatePath: "apps/dashboard/data/local/openclaw-local-export.template.json",
  connectorReportPath: connectorReportRel
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw local connector activation validation completed.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
