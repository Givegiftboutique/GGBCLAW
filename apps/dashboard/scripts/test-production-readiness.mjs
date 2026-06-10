import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const requiredCategories = [
  "source_safety",
  "gateway_contract",
  "local_ingest",
  "dev_gateway",
  "rbac_auth",
  "action_drafts",
  "release_workflow",
  "rollback",
  "observability",
  "backup_evidence",
  "security_guardrails",
  "operator_runbook",
  "manual_acceptance",
  "known_blockers"
];

const issues = [];
for (const file of [
  "src/lib/readiness/readiness-types.js",
  "src/lib/readiness/readiness-checklist.js",
  "src/lib/readiness/readiness-evaluator.js",
  "src/lib/readiness/readiness-summary.js"
]) {
  try {
    const body = await readFile(join(dashboardRoot, file), "utf8");
    if (!body.trim()) issues.push(`${file} is empty`);
  } catch (error) {
    issues.push(`${file} missing: ${error.message}`);
  }
}

spawnSync(nodeExe, ["apps/dashboard/scripts/generate-observability-report.mjs"], { cwd: repoRoot, encoding: "utf8" });
const generator = spawnSync(nodeExe, ["apps/dashboard/scripts/generate-production-readiness-report.mjs"], { cwd: repoRoot, encoding: "utf8" });
if (generator.status !== 0) {
  issues.push(generator.stdout.trim() || "readiness report generator failed");
  if (generator.stderr.trim()) issues.push(generator.stderr.trim());
}

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/readiness/readiness-types.js",
  "src/lib/readiness/readiness-checklist.js",
  "src/lib/readiness/readiness-summary.js",
  "src/lib/readiness/readiness-evaluator.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

for (const category of requiredCategories) {
  if (!context.window.OpenClawReadinessTypes.READINESS_CATEGORIES.includes(category)) issues.push(`missing readiness category ${category}`);
}

const report = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "production-readiness-report.json"), "utf8"));
if (report.recommendation === "production-ready") issues.push("recommendation must not be production-ready");
if (report.recommendation !== "no-go-for-production") issues.push("recommendation must be no-go-for-production");
if (report.productionDeploy !== false) issues.push("productionDeploy must be false");
if (report.safetyMode !== "read-only") issues.push("safetyMode must be read-only");
if (report.mutationEnabled !== false) issues.push("mutationEnabled must be false");
if (report.productionWiring !== "disabled") issues.push("productionWiring must be disabled");
if (!report.knownBlockers?.length) issues.push("knownBlockers must be listed");
if (!report.requiredBeforeProduction?.includes("real auth design review")) issues.push("real auth design review blocker missing");
if (!report.requiredBeforeProduction?.includes("backup restore drill")) issues.push("backup restore drill blocker missing");

const body = [
  await readFile(join(dashboardRoot, "src/lib/readiness/readiness-evaluator.js"), "utf8"),
  JSON.stringify(report)
].join("\n");
if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("production endpoint detected");
if (/\.github\/workflows|productionDeploy:\s*true|mutationEnabled:\s*true/.test(body)) issues.push("deploy or mutation workflow detected");

if (issues.length) {
  console.error("OpenClaw production readiness tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw production readiness tests passed.");
