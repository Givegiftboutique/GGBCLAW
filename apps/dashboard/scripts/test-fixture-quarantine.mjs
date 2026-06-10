import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function exists(relativePath) {
  try {
    await stat(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function runNode(args) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`node ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

async function loadSourceTrust() {
  const source = await readText("apps/dashboard/src/lib/data-trust/source-trust.js");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "source-trust.js" });
  return context.window.OpenClawSourceTrust;
}

for (const file of [
  "apps/dashboard/src/lib/data-trust/source-trust.js",
  "apps/dashboard/src/lib/data-trust/source-trust.ts",
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "apps/dashboard/scripts/generate-fixture-quarantine-report.mjs",
  "apps/dashboard/scripts/test-fixture-quarantine.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-single-agent-truth-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-fixture-quarantine-report.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/single-agent-truth-report.json",
  "apps/dashboard/data/generated/fixture-quarantine-report.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const trust = await loadSourceTrust();
const mock = trust.getSourceTrustClassification("mock");
const gatewayStub = trust.getSourceTrustClassification("gateway-stub");
const localIngest = trust.getSourceTrustClassification("local-ingest", { validationPassed: true });
const singleAgentTruth = await readJson("apps/dashboard/data/generated/single-agent-truth-report.json");
const fixtureQuarantine = await readJson("apps/dashboard/data/generated/fixture-quarantine-report.json");

check(mock.trustLevel === "fixture-demo", "mock must be classified as fixture-demo.");
check(gatewayStub.trustLevel === "fixture-contract", "gateway-stub must be classified as fixture-contract.");
check(localIngest.trustLevel === "operator-truth-candidate", "local-ingest must be classified as operator-truth-candidate.");
check(mock.operatorTruth === false, "mock operatorTruth must be false.");
check(gatewayStub.operatorTruth === false, "gateway-stub operatorTruth must be false.");
check(mock.fixtureData === true && gatewayStub.fixtureData === true, "mock and gateway-stub must be fixture data.");
check(localIngest.expectedAgentCount === 1, "local-ingest expected real agent count must be 1.");
check(singleAgentTruth.expectedRealAgentCount === 1, "single-agent truth report must expect 1 real agent.");
check(singleAgentTruth.fixtureAgentCount === 8, "single-agent truth report must keep fixture agent count 8.");
check(singleAgentTruth.mockIsOperatorTruth === false, "mock must not be operator truth.");
check(singleAgentTruth.gatewayStubIsOperatorTruth === false, "gateway-stub must not be operator truth.");
check(fixtureQuarantine.fixtureSources?.some((source) => source.source === "mock" && source.expectedAgentCount === 8), "fixture quarantine report must include mock fixture source.");
check(fixtureQuarantine.fixtureSources?.some((source) => source.source === "gateway-stub" && source.expectedAgentCount === 8), "fixture quarantine report must include gateway-stub fixture source.");
check(fixtureQuarantine.operatorTruthSources?.some((source) => source.source === "local-ingest" && source.expectedAgentCount === 1), "fixture quarantine report must include local-ingest truth candidate.");

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Data trust / 資料可信分類",
  "Demo Fixture Data / 示範測試資料",
  "Contract Fixture Data / 合約測試資料",
  "Operator Truth Candidate / Operator 真實資料候選",
  "Expected real agent count: 1 / 預期真實 agent 數量：1",
  "8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試"
]) {
  check(app.includes(marker), `UI must contain marker: ${marker}`);
}

for (const file of [
  "docs/dashboard/openclaw-dashboard-fixture-quarantine.md",
  "docs/dashboard/openclaw-dashboard-single-agent-truth.md"
]) {
  check(await exists(file), `${file} must exist.`);
}
const docsText = [
  await readText("docs/dashboard/openclaw-dashboard-fixture-quarantine.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-single-agent-truth.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-production-track-plan.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-production-entry-gates.md").catch(() => "")
].join("\n");
for (const marker of [
  "8 agents are fixture only",
  "single real agent",
  "Fixture Quarantine + Single Agent Truth Alignment",
  "production still no-go"
]) {
  check(docsText.includes(marker), `docs must contain marker: ${marker}`);
}

const qualityGate = await readText("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
for (const marker of [
  "generate-single-agent-truth-report.mjs",
  "generate-fixture-quarantine-report.mjs",
  "test-fixture-quarantine.mjs",
  "singleAgentTruthReport",
  "fixtureQuarantineReport",
  "fixtureQuarantineTests"
]) {
  check(qualityGate.includes(marker), `quality gate must reference ${marker}.`);
}

const productionTrackReports = JSON.stringify({
  plan: await readJson("apps/dashboard/data/generated/production-track-plan-report.json"),
  gates: await readJson("apps/dashboard/data/generated/production-entry-gates-report.json")
});
check(productionTrackReports.includes("only 1 real agent"), "production track reports must include single-agent blocker.");
check(productionTrackReports.includes("8-agent data is mock"), "production track reports must include 8-agent fixture blocker.");

const sourceConfig = await readText("apps/dashboard/src/lib/adapters/source-config.js");
for (const sourceMode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  check(sourceConfig.includes(sourceMode), `source mode must remain present: ${sourceMode}`);
}
for (const route of ["/dashboard", "/dashboard/agents", "/dashboard/tasks", "/dashboard/reviews", "/dashboard/logs", "/dashboard/backups", "/dashboard/settings", "/dashboard/rbac", "/dashboard/help", "/dashboard/observability"]) {
  check(app.includes(route), `route must remain present: ${route}`);
}

const generatedReportsText = JSON.stringify({ singleAgentTruth, fixtureQuarantine });
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedReportsText), "fixture reports must not contain absolute machine paths.");
check(!/(password|api[_-]?key|private[_-]?key)\s*[:=]/i.test(generatedReportsText), "fixture reports must not contain secret-like assignments.");
check(!/\bAuthorization\b|credentials\s*:\s*["']include["']|document\.cookie|localStorage|sessionStorage/i.test(generatedReportsText), "fixture reports must not contain auth/token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedReportsText.replace(/\s+/g, "")), "fixture reports must not enable mutation or deploy.");
check(!/production-ready/i.test(generatedReportsText), "fixture reports must not mark production ready.");

if (failures.length) {
  console.error("OpenClaw fixture quarantine tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw fixture quarantine tests passed.");
