import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "quality-gate-report.json");
const nodeExe = process.execPath;

const commands = [
  ["apps/dashboard/scripts/generate-dashboard-snapshot.mjs"],
  ["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/dashboard-export.sample.json"],
  ["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/generated/dashboard-export.generated.json"],
  ["apps/dashboard/scripts/test-gateway-contract.mjs"],
  ["apps/dashboard/scripts/diff-gateway-fixtures.mjs"],
  ["apps/dashboard/scripts/safety-scan-dashboard.mjs"],
  ["apps/dashboard/verify-dashboard.mjs"]
];

const syntaxFiles = [
  "apps/dashboard/src/app.js",
  "apps/dashboard/src/lib/mock-data.js",
  "apps/dashboard/src/lib/adapters/types.js",
  "apps/dashboard/src/lib/adapters/mock-adapter.js",
  "apps/dashboard/src/lib/adapters/adapter-registry.js",
  "apps/dashboard/src/lib/adapters/validation.js",
  "apps/dashboard/src/lib/adapters/json-adapter.js",
  "apps/dashboard/src/lib/adapters/artifact-adapter.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.js",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.js",
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/scripts/generate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/validate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/gateway-contract-utils.mjs",
  "apps/dashboard/scripts/generate-gateway-contract-baseline.mjs",
  "apps/dashboard/scripts/test-gateway-contract.mjs",
  "apps/dashboard/scripts/diff-gateway-fixtures.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs"
];

for (const file of syntaxFiles) {
  commands.push(["--check", file]);
}

const requiredFiles = [
  "AGENTS.md",
  "apps/dashboard/README.md",
  "apps/dashboard/verify-dashboard.mjs",
  "apps/dashboard/scripts/generate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/validate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/gateway-contract-utils.mjs",
  "apps/dashboard/scripts/generate-gateway-contract-baseline.mjs",
  "apps/dashboard/scripts/test-gateway-contract.mjs",
  "apps/dashboard/scripts/diff-gateway-fixtures.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  "apps/dashboard/schema/README.md",
  "apps/dashboard/schema/dashboard-export.schema.json",
  "apps/dashboard/schema/artifact-manifest.schema.json",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.js",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.ts",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.ts",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.ts",
  "apps/dashboard/data/gateway-stub/metrics.json",
  "apps/dashboard/data/gateway-stub/agents.json",
  "apps/dashboard/data/gateway-stub/agent-detail.json",
  "apps/dashboard/data/gateway-stub/tasks.json",
  "apps/dashboard/data/gateway-stub/task-detail.json",
  "apps/dashboard/data/gateway-stub/reviews.json",
  "apps/dashboard/data/gateway-stub/logs.json",
  "apps/dashboard/data/gateway-stub/backups.json",
  "apps/dashboard/data/gateway-stub/settings.json",
  "apps/dashboard/data/gateway-stub/rbac.json",
  "apps/dashboard/data/gateway-stub/source-status.json",
  "apps/dashboard/data/gateway-stub/gateway-export.sample.json",
  "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
  "docs/dashboard/openclaw-dashboard-gateway-contract.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "docs/phase-log.md",
  "tests/manual-smoke-tests.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-002.md",
  "ops/tasks/TASK-20260609-OC-DASH-003.md",
  "ops/tasks/TASK-20260609-OC-DASH-004.md",
  "ops/tasks/TASK-20260609-OC-DASH-005.md",
  "ops/tasks/TASK-20260609-OC-DASH-006.md",
  "ops/tasks/TASK-20260609-OC-DASH-007.md",
  "ops/tasks/TASK-20260609-OC-DASH-008.md",
  "artifacts/TASK-20260609-OC-DASH-006/README.md",
  "artifacts/TASK-20260609-OC-DASH-007/README.md",
  "artifacts/TASK-20260609-OC-DASH-008/README.md"
];

const results = [];

function runNode(args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(nodeExe, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const record = {
    command: `node ${args.join(" ")}`,
    startedAt,
    endedAt: new Date().toISOString(),
    exitCode: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
  results.push(record);
  if (record.exitCode !== 0) {
    console.error(`FAILED: ${record.command}`);
    if (record.stdout) console.error(record.stdout);
    if (record.stderr) console.error(record.stderr);
    return false;
  }
  console.log(`PASS: ${record.command}`);
  return true;
}

let failed = false;
for (const file of requiredFiles) {
  try {
    const body = await readFile(join(repoRoot, file), "utf8");
    if (!body.trim()) throw new Error("empty file");
  } catch (error) {
    failed = true;
    results.push({
      command: `required-file ${file}`,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      exitCode: 1,
      stdout: "",
      stderr: error.message
    });
    console.error(`FAILED: required file ${file} (${error.message})`);
  }
}

for (const args of commands) {
  if (!runNode(args)) failed = true;
}

let safetyReport = null;
try {
  safetyReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "safety-scan-report.json"), "utf8"));
} catch {
  safetyReport = { result: "missing" };
}

let gatewayDiffReport = null;
try {
  gatewayDiffReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "gateway-fixture-diff-report.json"), "utf8"));
} catch {
  gatewayDiffReport = { result: "missing" };
}

const gatewayContractTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-gateway-contract.mjs")?.exitCode === 0 ? "pass" : "fail";
const gatewayFixtureDiff = results.find((result) => result.command === "node apps/dashboard/scripts/diff-gateway-fixtures.mjs")?.exitCode === 0 ? "pass" : "fail";

const report = {
  generatedAt: new Date().toISOString(),
  result: failed ? "fail" : "pass",
  checksPassed: results.filter((result) => result.exitCode === 0).length,
  checksFailed: results.filter((result) => result.exitCode !== 0).length,
  commandsExecuted: results.map((result) => result.command),
  filesChecked: requiredFiles,
  safetyScanSummary: safetyReport,
  gatewayContractTests,
  gatewayFixtureDiff,
  gatewayBaselinePath: "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
  gatewayDiffReportPath: "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
  gatewayFixtureDiffSummary: gatewayDiffReport,
  snapshotValidationSummary: {
    sample: results.find((result) => result.command.includes("dashboard-export.sample.json"))?.exitCode === 0 ? "pass" : "fail",
    generated: results.find((result) => result.command.includes("dashboard-export.generated.json"))?.exitCode === 0 ? "pass" : "fail"
  },
  schemaValidationSummary: {
    schemaFilesPresent: requiredFiles.filter((file) => file.includes("schema/")).length >= 3
  }
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failed) {
  console.error(`OpenClaw Dashboard quality gates failed. Report: ${relative(repoRoot, reportPath)}`);
  process.exit(1);
}

console.log("OpenClaw Dashboard quality gates passed.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
