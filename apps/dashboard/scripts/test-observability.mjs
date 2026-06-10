import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const requiredTypes = [
  "source_stale",
  "source_validation_failed",
  "agent_heartbeat_stale",
  "agent_lost",
  "task_stuck_running",
  "task_failed",
  "task_timed_out",
  "task_review_pending",
  "backup_stale",
  "backup_verification_failed",
  "quality_gate_failed",
  "safety_scan_failed",
  "release_manifest_missing",
  "release_manifest_stale",
  "dev_gateway_blocked",
  "production_wiring_violation",
  "mutation_guardrail_violation"
];

const issues = [];
for (const file of [
  "src/lib/observability/observability-types.js",
  "src/lib/observability/observability-rules.js",
  "src/lib/observability/observability-evaluator.js",
  "src/lib/observability/observability-summary.js"
]) {
  try {
    const body = await readFile(join(dashboardRoot, file), "utf8");
    if (!body.trim()) issues.push(`${file} is empty`);
  } catch (error) {
    issues.push(`${file} missing: ${error.message}`);
  }
}

const generator = spawnSync(nodeExe, ["apps/dashboard/scripts/generate-observability-report.mjs"], { cwd: repoRoot, encoding: "utf8" });
if (generator.status !== 0) {
  issues.push(generator.stdout.trim() || "observability report generator failed");
  if (generator.stderr.trim()) issues.push(generator.stderr.trim());
}

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/observability/observability-types.js",
  "src/lib/observability/observability-rules.js",
  "src/lib/observability/observability-summary.js",
  "src/lib/observability/observability-evaluator.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

for (const type of requiredTypes) {
  if (!context.window.OpenClawObservabilityTypes.ALERT_TYPES.includes(type)) issues.push(`missing alert type ${type}`);
  if (!context.window.OpenClawObservabilityRules.ALERT_RULES[type]) issues.push(`missing alert rule ${type}`);
}

const report = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "observability-report.json"), "utf8"));
if (report.safetyMode !== "read-only") issues.push("report safetyMode must be read-only");
if (report.notificationMode !== "local-preview-only") issues.push("report notificationMode must be local-preview-only");
if (report.mutationEnabled !== false) issues.push("report mutationEnabled must be false");
if (report.productionWiring !== "disabled") issues.push("report productionWiring must be disabled");
if (!Array.isArray(report.alerts)) issues.push("report alerts must be an array");
for (const alert of report.alerts || []) {
  if (alert.notificationSent !== false) issues.push(`${alert.alertId} notificationSent must be false`);
  if (alert.localOnly !== true) issues.push(`${alert.alertId} localOnly must be true`);
  if (alert.mutationEnabled !== false) issues.push(`${alert.alertId} mutationEnabled must be false`);
  if (alert.productionWiring !== "disabled") issues.push(`${alert.alertId} productionWiring must be disabled`);
}

const body = [
  await readFile(join(dashboardRoot, "src/lib/observability/observability-evaluator.js"), "utf8"),
  JSON.stringify(report)
].join("\n");
if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("production endpoint detected");
if (/\b(webhook|slack|email|sms)\s*\(/i.test(body)) issues.push("external notification sending function detected");
if (/notificationSent\s*:\s*true/.test(body)) issues.push("notificationSent true detected");

const emptyReport = context.window.OpenClawObservabilityEvaluator.evaluateObservability({});
if (!Array.isArray(emptyReport.alerts)) issues.push("evaluator must handle empty data safely");
const staleReport = context.window.OpenClawObservabilityEvaluator.evaluateObservability({
  agents: [{ id: "agent-local-stale", name: "Local Stale Agent", status: "offline", lastHeartbeat: "2026-01-01T00:00:00Z" }],
  tasks: [{ id: "task-local-failed", status: "failed", updatedAt: "2026-01-01T00:00:00Z" }],
  backups: [{ id: "backup-local-failed", verifyStatus: "failed", createdAt: "2026-01-01T00:00:00Z" }],
  sourceStatus: { requestedSource: "dev-gateway", currentSource: "mock", productionWiring: "disabled", mutationEnabled: false },
  qualityGateReport: { result: "fail" },
  safetyScanReport: { result: "fail" },
  releaseManifest: null
});
for (const type of ["agent_lost", "task_failed", "backup_verification_failed", "quality_gate_failed", "safety_scan_failed", "release_manifest_missing", "dev_gateway_blocked"]) {
  if (!staleReport.alerts.some((alert) => alert.type === type)) issues.push(`stale sample missing ${type}`);
}

if (issues.length) {
  console.error("OpenClaw observability tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw observability tests passed.");
