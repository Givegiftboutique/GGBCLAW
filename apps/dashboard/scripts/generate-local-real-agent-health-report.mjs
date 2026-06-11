import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const defaultHealthInputPath = join(dashboardRoot, "data", "local-agent-health", "local-agent-health.sample.json");
const reviewedHealthInputPath = join(dashboardRoot, "data", "local", "reviewed-local-agent-health.json");
const singleAgentSnapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const outputPath = join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json");
const localAgentHealthModulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-agent-health.js");
const localHealthEvidenceModulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-health-evidence.js");

function parseDataPath(argv) {
  const dataIndex = argv.indexOf("--data");
  return dataIndex >= 0 && argv[dataIndex + 1] ? resolve(repoRoot, argv[dataIndex + 1]) : null;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadLocalAgentHealth() {
  const source = await readFile(localAgentHealthModulePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-agent-health.js" });
  return context.window.OpenClawLocalAgentHealth;
}

async function loadLocalHealthEvidence() {
  const source = await readFile(localHealthEvidenceModulePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-health-evidence.js" });
  return context.window.OpenClawLocalHealthEvidence;
}

function countAgents(snapshot) {
  return Array.isArray(snapshot.agents) ? snapshot.agents.length : 0;
}

function normalizeRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

const warnings = [];
const requiredFollowups = [];
const explicitInputPath = parseDataPath(process.argv.slice(2));

if (!await exists(singleAgentSnapshotPath)) {
  throw new Error("Single-agent operator truth snapshot is missing.");
}

const singleAgentSnapshot = await readJson(singleAgentSnapshotPath);
const actualRealAgentCount = countAgents(singleAgentSnapshot);
if (actualRealAgentCount !== 1) {
  throw new Error(`Single-agent operator truth snapshot must contain exactly 1 agent; found ${actualRealAgentCount}.`);
}
const snapshotAgent = singleAgentSnapshot.agents[0];
const snapshotAgentId = snapshotAgent?.id ?? "unknown-agent";

const health = await loadLocalAgentHealth();
const evidence = await loadLocalHealthEvidence();
let inputPath = defaultHealthInputPath;
let healthInput = await readJson(defaultHealthInputPath);
let healthSource = "local-file-only";
let reviewedInputStatus = "missing-fallback-to-sample";
let validationErrors = [];
let fallbackUsed = true;
let fallbackReason = "missing-reviewed-input";

const candidateReviewedPath = explicitInputPath || reviewedHealthInputPath;
const candidateIsExplicit = Boolean(explicitInputPath);
if (await exists(candidateReviewedPath)) {
  const reviewedInput = await readJson(candidateReviewedPath);
  const validation = health.validateReviewedLocalAgentHealth(reviewedInput);
  inputPath = candidateReviewedPath;
  if (validation.valid) {
    healthInput = health.reviewedHealthToLocalInput(reviewedInput);
    healthSource = "local-reviewed-json";
    reviewedInputStatus = "valid";
    fallbackUsed = false;
    fallbackReason = "none";
  } else {
    healthInput = await readJson(defaultHealthInputPath);
    healthSource = "local-file-only";
    reviewedInputStatus = "invalid-review-required";
    validationErrors = validation.errors.map((error) => ({
      path: error.path,
      key: error.key,
      category: /apiKey|api_key|authorization|bearer|token|cookie|secret|password|credential|privateKey|accessToken|refreshToken/i.test(error.key) ? "unsafe-key" : "schema-validation",
      ruleId: /apiKey|api_key|authorization|bearer|token|cookie|secret|password|credential|privateKey|accessToken|refreshToken/i.test(error.key) ? "unsafe-key-rejected" : "reviewed-health-contract",
      message: error.message,
      rawValuePrinted: false
    }));
    fallbackUsed = true;
    fallbackReason = validationErrors.some((error) => error.category === "unsafe-key") ? "unsafe-keys" : "invalid-reviewed-input";
    warnings.push("Reviewed local health input was rejected; report is review-required and fell back to local-file-only sample behavior.");
    requiredFollowups.push("Inspect sanitized local health JSON and run manual runbook.");
  }
} else if (candidateIsExplicit) {
  warnings.push("Explicit reviewed local health input path was missing; falling back to sample health input.");
  requiredFollowups.push("Create a sanitized reviewed local health JSON file before trusting live health status.");
  fallbackUsed = true;
  fallbackReason = "missing-reviewed-input";
}

const evaluation = health.evaluateLocalAgentHealth(healthInput);
const healthAgentIds = evaluation.agents.map((agent) => agent.agentId);

if (!healthAgentIds.includes(snapshotAgentId)) {
  warnings.push(`Health input does not include the single real agent id ${snapshotAgentId}.`);
  requiredFollowups.push("Review the local health JSON and align it with the single-agent operator truth snapshot.");
}
if (evaluation.agents.some((agent) => agent.source === "mock" || agent.source === "gateway-stub")) {
  warnings.push("Local health report must not use mock or gateway-stub as health truth.");
  requiredFollowups.push("Replace fixture health input with local-readonly-health-snapshot records.");
}
if (evaluation.overallHealthStatus === "unknown" || evaluation.overallHealthStatus === "review-required") {
  requiredFollowups.push("Health requires local operator review; use the runbook, not dashboard restart actions.");
}
if (evaluation.overallHealthStatus === "stale") {
  requiredFollowups.push("Stale health must be investigated manually outside the dashboard.");
}

const report = {
  reportId: `local-real-agent-health-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "local-readonly-agent-health",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorTruthSource: "local-ingest",
  operatorTruthSnapshot: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: 1,
  actualRealAgentCount,
  healthSource,
  healthInput: normalizeRelative(inputPath),
  reviewedHealthInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  reviewedHealthExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  reviewedInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  reviewedInputExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  reviewedInputStatus,
  validationEvidenceStatus: validationErrors.length ? "review-required" : reviewedInputStatus === "valid" ? "pass" : "missing-fallback",
  fallbackUsed,
  fallbackReason,
  redactionApplied: true,
  rawValuesPrinted: false,
  validationErrors,
  healthConnectionStatus: "local-file-only",
  overallHealthStatus: warnings.length ? "review-required" : evaluation.overallHealthStatus,
  agents: evaluation.agents,
  blockedActions: evaluation.blockedActions,
  warnings,
  requiredFollowups
};

const evidenceReview = evidence.buildLocalHealthEvidenceReview({
  ...report,
  healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json"
});
report.evidenceStatus = evidenceReview.evidenceStatus;
report.acceptedHealthSource = evidenceReview.acceptedHealthSource;
report.validationEvidence = evidenceReview.validationEvidence;
report.rejectedEvidence = evidenceReview.rejectedEvidence;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw local real agent health report generated.");
console.log(`Report: ${normalizeRelative(outputPath)}`);
