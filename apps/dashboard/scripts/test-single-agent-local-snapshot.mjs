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

async function validateDashboardExport(snapshot) {
  const validationSource = await readText("apps/dashboard/src/lib/adapters/validation.js");
  const context = { window: {} };
  vm.runInNewContext(validationSource, context, { filename: "validation.js" });
  return context.window.OpenClawDashboardValidation.validateDashboardExport(snapshot);
}

for (const file of [
  "apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs",
  "apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs",
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "apps/dashboard/scripts/test-single-agent-local-snapshot.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs"]);
runNode(["apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs"]);
runNode([
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "--data",
  "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json"
]);
runNode(["apps/dashboard/scripts/generate-fixture-quarantine-report.mjs"]);
runNode(["apps/dashboard/scripts/test-gateway-contract.mjs"]);
runNode(["apps/dashboard/scripts/test-fixture-quarantine.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  "apps/dashboard/data/generated/single-agent-truth-report.json",
  "apps/dashboard/data/generated/fixture-quarantine-report.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const inspection = await readJson("apps/dashboard/data/generated/real-local-agent-inventory-inspection.json");
const snapshot = await readJson("apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json");
const truth = await readJson("apps/dashboard/data/generated/single-agent-truth-report.json");
const fixtureQuarantine = await readJson("apps/dashboard/data/generated/fixture-quarantine-report.json");

check(inspection.actualAgentCountBeforeCleanup >= 1, "inventory inspection must record agents before cleanup.");
check(inspection.expectedRealAgentCount === 1, "inventory inspection must expect 1 real agent.");
check(inspection.status === "review-required" || inspection.status === "pass", "inventory inspection must be pass or review-required.");
check(Array.isArray(snapshot.agents) && snapshot.agents.length === 1, "single-agent snapshot must contain exactly 1 agent.");
check(snapshot.source?.productionStatus === "no-go-for-production", "single-agent snapshot must keep production no-go marker.");
check(snapshot.source?.safetyMode === "read-only", "single-agent snapshot source safetyMode must be read-only.");
check(snapshot.source?.mutationEnabled === false, "single-agent snapshot mutationEnabled must be false.");
check(snapshot.source?.productionWiring === "disabled", "single-agent snapshot productionWiring must be disabled.");
check(snapshot.sourceStatus?.dataUrl === "./data/generated/real-local-dashboard-export.single-agent.generated.json", "single-agent snapshot dataUrl marker must point to the single-agent file.");
check(snapshot.sourceStatus?.actualRealAgentCount === 1, "single-agent snapshot sourceStatus must show actual real agent count 1.");
check(snapshot.singleAgentCleanup?.originalAgentCount >= 1, "single-agent snapshot must record original agent count.");
check(snapshot.singleAgentCleanup?.reviewRequired === true, "single-agent cleanup must remain human-review required.");

const validation = await validateDashboardExport(snapshot);
check(validation.ok, `single-agent snapshot must validate: ${validation.issues?.join("; ")}`);

check(truth.status === "pass", "single-agent truth report must pass when using the single-agent snapshot.");
check(truth.actualRealAgentCount === 1, "single-agent truth report must show actual count 1.");
check(truth.operatorTruthSnapshot === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "single-agent truth report must point to the single-agent snapshot.");
check(truth.productionStatus === "no-go-for-production", "single-agent truth report must keep production no-go.");

check(fixtureQuarantine.fixtureSources?.some((source) => source.source === "mock" && source.operatorTruth === false && source.expectedAgentCount === 8), "mock must remain an 8-agent non-truth fixture.");
check(fixtureQuarantine.fixtureSources?.some((source) => source.source === "gateway-stub" && source.operatorTruth === false && source.expectedAgentCount === 8), "gateway-stub must remain an 8-agent non-truth fixture.");
check(fixtureQuarantine.operatorTruthSources?.some((source) => source.source === "local-ingest" && source.expectedAgentCount === 1), "local-ingest must remain expected count 1.");

const generatedText = JSON.stringify({ inspection, snapshot, truth, fixtureQuarantine });
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedText), "generated 21C reports must not contain absolute machine paths.");
check(!/(password|api[_-]?key|private[_-]?key)\s*[:=]/i.test(generatedText), "generated 21C reports must not contain secret-like assignments.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedText), "generated 21C reports must not contain production endpoints.");
check(!/\bAuthorization\b|credentials\s*:\s*["']include["']|document\.cookie|localStorage|sessionStorage/i.test(generatedText), "generated 21C reports must not contain auth/token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedText.replace(/\s+/g, "")), "generated 21C reports must not enable mutation or deploy.");
check(!/production-ready/i.test(generatedText), "generated 21C reports must not mark production ready.");

if (failures.length) {
  console.error("OpenClaw single-agent local snapshot tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw single-agent local snapshot tests passed.");
