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
  ["apps/dashboard/scripts/test-local-ingest.mjs"],
  ["apps/dashboard/scripts/test-dev-gateway-config.mjs"],
  ["apps/dashboard/scripts/test-rbac-policy.mjs"],
  ["apps/dashboard/scripts/generate-action-draft-samples.mjs"],
  ["apps/dashboard/scripts/test-action-drafts.mjs"],
  ["apps/dashboard/scripts/generate-release-manifest.mjs"],
  ["apps/dashboard/scripts/create-local-release-bundle.mjs"],
  ["apps/dashboard/scripts/verify-local-release.mjs"],
  ["apps/dashboard/scripts/generate-observability-report.mjs"],
  ["apps/dashboard/scripts/test-observability.mjs"],
  ["apps/dashboard/scripts/generate-production-readiness-report.mjs"],
  ["apps/dashboard/scripts/test-production-readiness.mjs"],
  ["apps/dashboard/scripts/generate-final-beta-audit.mjs"],
  ["apps/dashboard/scripts/verify-final-beta.mjs"],
  ["apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs"],
  ["apps/dashboard/scripts/test-real-local-data-pilot.mjs"],
  ["apps/dashboard/scripts/test-dashboard-localization.mjs"],
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
  "apps/dashboard/src/lib/adapters/local-ingest-mapper.js",
  "apps/dashboard/src/lib/adapters/local-ingest-validation.js",
  "apps/dashboard/src/lib/adapters/local-ingest-adapter.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-config.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.js",
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/src/lib/rbac/roles.js",
  "apps/dashboard/src/lib/rbac/permissions.js",
  "apps/dashboard/src/lib/rbac/rbac-policy.js",
  "apps/dashboard/src/lib/rbac/rbac-state.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.js",
  "apps/dashboard/src/lib/observability/observability-types.js",
  "apps/dashboard/src/lib/observability/observability-rules.js",
  "apps/dashboard/src/lib/observability/observability-evaluator.js",
  "apps/dashboard/src/lib/observability/observability-summary.js",
  "apps/dashboard/src/lib/readiness/readiness-types.js",
  "apps/dashboard/src/lib/readiness/readiness-checklist.js",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.js",
  "apps/dashboard/src/lib/readiness/readiness-summary.js",
  "apps/dashboard/scripts/generate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/validate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/gateway-contract-utils.mjs",
  "apps/dashboard/scripts/generate-gateway-contract-baseline.mjs",
  "apps/dashboard/scripts/test-gateway-contract.mjs",
  "apps/dashboard/scripts/diff-gateway-fixtures.mjs",
  "apps/dashboard/scripts/test-local-ingest.mjs",
  "apps/dashboard/scripts/test-dev-gateway-config.mjs",
  "apps/dashboard/scripts/test-rbac-policy.mjs",
  "apps/dashboard/scripts/generate-action-draft-samples.mjs",
  "apps/dashboard/scripts/test-action-drafts.mjs",
  "apps/dashboard/scripts/generate-release-manifest.mjs",
  "apps/dashboard/scripts/create-local-release-bundle.mjs",
  "apps/dashboard/scripts/verify-local-release.mjs",
  "apps/dashboard/scripts/generate-observability-report.mjs",
  "apps/dashboard/scripts/test-observability.mjs",
  "apps/dashboard/scripts/generate-production-readiness-report.mjs",
  "apps/dashboard/scripts/test-production-readiness.mjs",
  "apps/dashboard/scripts/generate-final-beta-audit.mjs",
  "apps/dashboard/scripts/verify-final-beta.mjs",
  "apps/dashboard/scripts/discover-real-local-data.mjs",
  "apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs",
  "apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
  "apps/dashboard/scripts/test-real-local-data-pilot.mjs",
  "apps/dashboard/scripts/test-dashboard-localization.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
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
  "apps/dashboard/scripts/test-local-ingest.mjs",
  "apps/dashboard/scripts/test-dev-gateway-config.mjs",
  "apps/dashboard/scripts/test-rbac-policy.mjs",
  "apps/dashboard/scripts/generate-action-draft-samples.mjs",
  "apps/dashboard/scripts/test-action-drafts.mjs",
  "apps/dashboard/scripts/generate-release-manifest.mjs",
  "apps/dashboard/scripts/create-local-release-bundle.mjs",
  "apps/dashboard/scripts/verify-local-release.mjs",
  "apps/dashboard/scripts/generate-observability-report.mjs",
  "apps/dashboard/scripts/test-observability.mjs",
  "apps/dashboard/scripts/generate-production-readiness-report.mjs",
  "apps/dashboard/scripts/test-production-readiness.mjs",
  "apps/dashboard/scripts/generate-final-beta-audit.mjs",
  "apps/dashboard/scripts/verify-final-beta.mjs",
  "apps/dashboard/scripts/discover-real-local-data.mjs",
  "apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs",
  "apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
  "apps/dashboard/scripts/test-real-local-data-pilot.mjs",
  "apps/dashboard/scripts/test-dashboard-localization.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
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
  "apps/dashboard/src/lib/adapters/local-ingest-mapper.js",
  "apps/dashboard/src/lib/adapters/local-ingest-validation.js",
  "apps/dashboard/src/lib/adapters/local-ingest-adapter.js",
  "apps/dashboard/src/lib/adapters/local-ingest-mapper.ts",
  "apps/dashboard/src/lib/adapters/local-ingest-validation.ts",
  "apps/dashboard/src/lib/adapters/local-ingest-adapter.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-config.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-config.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.ts",
  "apps/dashboard/src/lib/rbac/roles.js",
  "apps/dashboard/src/lib/rbac/permissions.js",
  "apps/dashboard/src/lib/rbac/rbac-policy.js",
  "apps/dashboard/src/lib/rbac/rbac-state.js",
  "apps/dashboard/src/lib/rbac/roles.ts",
  "apps/dashboard/src/lib/rbac/permissions.ts",
  "apps/dashboard/src/lib/rbac/rbac-policy.ts",
  "apps/dashboard/src/lib/rbac/rbac-state.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.ts",
  "apps/dashboard/src/lib/observability/observability-types.js",
  "apps/dashboard/src/lib/observability/observability-rules.js",
  "apps/dashboard/src/lib/observability/observability-evaluator.js",
  "apps/dashboard/src/lib/observability/observability-summary.js",
  "apps/dashboard/src/lib/observability/observability-types.ts",
  "apps/dashboard/src/lib/observability/observability-rules.ts",
  "apps/dashboard/src/lib/observability/observability-evaluator.ts",
  "apps/dashboard/src/lib/observability/observability-summary.ts",
  "apps/dashboard/src/lib/readiness/readiness-types.js",
  "apps/dashboard/src/lib/readiness/readiness-checklist.js",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.js",
  "apps/dashboard/src/lib/readiness/readiness-summary.js",
  "apps/dashboard/src/lib/readiness/readiness-types.ts",
  "apps/dashboard/src/lib/readiness/readiness-checklist.ts",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.ts",
  "apps/dashboard/src/lib/readiness/readiness-summary.ts",
  "apps/dashboard/src/lib/i18n/zh-hant.js",
  "apps/dashboard/src/lib/i18n/i18n.js",
  "apps/dashboard/data/generated/action-drafts.sample.json",
  "apps/dashboard/data/generated/release-manifest.json",
  "apps/dashboard/data/generated/observability-report.json",
  "apps/dashboard/data/generated/production-readiness-report.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/data/generated/real-local-data-discovery-report.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  "apps/dashboard/data/generated/real-local-data-pilot-report.json",
  "apps/dashboard/release/README.md",
  "apps/dashboard/release/local-release-index.json",
  "apps/dashboard/data/local-ingest/local-dashboard-ingest.sample.json",
  "apps/dashboard/data/local-ingest/crawler-output.sample.json",
  "apps/dashboard/data/local-ingest/agent-run-log.sample.json",
  "apps/dashboard/data/local-ingest/task-memory-index.sample.json",
  "apps/dashboard/data/local-ingest/artifact-index.sample.json",
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
  "docs/dashboard/openclaw-dashboard-local-ingest.md",
  "docs/dashboard/openclaw-dashboard-dev-gateway.md",
  "docs/dashboard/openclaw-dashboard-rbac.md",
  "docs/dashboard/openclaw-dashboard-action-drafts.md",
  "docs/dashboard/openclaw-dashboard-internal-deployment-plan.md",
  "docs/dashboard/openclaw-dashboard-operator-release-workflow.md",
  "docs/dashboard/openclaw-dashboard-observability.md",
  "docs/dashboard/openclaw-dashboard-production-readiness.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "docs/dashboard/openclaw-dashboard-real-local-data-pilot.md",
  "docs/dashboard/openclaw-dashboard-snapshot-refresh-drill.md",
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
  "ops/tasks/TASK-20260609-OC-DASH-09A.md",
  "ops/tasks/TASK-20260609-OC-DASH-11A.md",
  "ops/tasks/TASK-20260609-OC-DASH-12A.md",
  "ops/tasks/TASK-20260609-OC-DASH-14A.md",
  "ops/tasks/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT.md",
  "ops/tasks/TASK-20260609-OC-DASH-15A.md",
  "ops/tasks/TASK-20260609-OC-DASH-15B.md",
  "artifacts/TASK-20260609-OC-DASH-006/README.md",
  "artifacts/TASK-20260609-OC-DASH-007/README.md",
  "artifacts/TASK-20260609-OC-DASH-008/README.md",
  "artifacts/TASK-20260609-OC-DASH-09A/README.md",
  "artifacts/TASK-20260609-OC-DASH-11A/README.md",
  "artifacts/TASK-20260609-OC-DASH-12A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-14A/README.md",
  "artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-15A/README.md",
  "artifacts/TASK-20260609-OC-DASH-15B/README.md"
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
const localIngestTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-ingest.mjs")?.exitCode === 0 ? "pass" : "fail";
const devGatewayConfigTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-dev-gateway-config.mjs")?.exitCode === 0 ? "pass" : "fail";
const rbacPolicyTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-rbac-policy.mjs")?.exitCode === 0 ? "pass" : "fail";
const actionDraftSampleGeneration = results.find((result) => result.command === "node apps/dashboard/scripts/generate-action-draft-samples.mjs")?.exitCode === 0 ? "pass" : "fail";
const actionDraftTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-action-drafts.mjs")?.exitCode === 0 ? "pass" : "fail";
const releaseManifest = results.find((result) => result.command === "node apps/dashboard/scripts/generate-release-manifest.mjs")?.exitCode === 0 ? "pass" : "fail";
const localReleaseBundle = results.find((result) => result.command === "node apps/dashboard/scripts/create-local-release-bundle.mjs")?.exitCode === 0 ? "pass" : "fail";
const releaseVerification = results.find((result) => result.command === "node apps/dashboard/scripts/verify-local-release.mjs")?.exitCode === 0 ? "pass" : "fail";
const observabilityReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-observability-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const observabilityTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-observability.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionReadinessReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-readiness-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionReadinessTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-production-readiness.mjs")?.exitCode === 0 ? "pass" : "fail";
const finalBetaAudit = results.find((result) => result.command === "node apps/dashboard/scripts/generate-final-beta-audit.mjs")?.exitCode === 0 ? "pass" : "fail";
const finalBetaVerification = results.find((result) => result.command === "node apps/dashboard/scripts/verify-final-beta.mjs")?.exitCode === 0 ? "pass" : "fail";
const realLocalSnapshotRefreshDrill = results.find((result) => result.command === "node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs")?.exitCode === 0 ? "pass" : "fail";
const realLocalDataPilotTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-real-local-data-pilot.mjs")?.exitCode === 0 ? "pass" : "fail";
const dashboardLocalization = results.find((result) => result.command === "node apps/dashboard/scripts/test-dashboard-localization.mjs")?.exitCode === 0 ? "pass" : "fail";

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
  localIngestTests,
  devGatewayConfigTests,
  rbacPolicyTests,
  actionDraftSampleGeneration,
  actionDraftTests,
  releaseManifest,
  localReleaseBundle,
  releaseVerification,
  observabilityReport,
  observabilityTests,
  productionReadinessReport,
  productionReadinessTests,
  finalBetaAudit,
  finalBetaVerification,
  realLocalSnapshotRefreshDrill,
  realLocalDataPilotTests,
  dashboardLocalization,
  releaseManifestPath: "apps/dashboard/data/generated/release-manifest.json",
  localReleaseIndexPath: "apps/dashboard/release/local-release-index.json",
  observabilityReportPath: "apps/dashboard/data/generated/observability-report.json",
  productionReadinessReportPath: "apps/dashboard/data/generated/production-readiness-report.json",
  finalBetaAuditReportPath: "apps/dashboard/data/generated/final-beta-audit-report.json",
  realLocalSnapshotPath: "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  realLocalPilotReportPath: "apps/dashboard/data/generated/real-local-data-pilot-report.json",
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
