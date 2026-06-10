import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-incident-drill-report.json");

async function readJson(relPath, fallback = null) {
  try {
    return JSON.parse(await readFile(join(dashboardRoot, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

function scenario(type, title, source, severity = "warning") {
  return {
    scenarioId: `incident-${type}`,
    type,
    title,
    severity,
    source,
    localOnly: true,
    notificationSent: false,
    externalEscalationSent: false,
    notSubmitted: true,
    triageSteps: [
      "Review local dashboard data and generated reports.",
      "Capture evidence refs before changing any local files.",
      "Keep production action disabled.",
      "Record operator notes in task memory or local handoff notes."
    ],
    recommendedOperatorAction: "Triage locally and rerun read-only checks.",
    escalationNote: "External escalation disabled in scaffold; use manual human review outside the dashboard if needed."
  };
}

function assertSafeBody(body) {
  const issues = [];
  if (/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(body)) issues.push("unexpected external endpoint detected");
  if (/[A-Za-z]:\\Users\\|\/home\//i.test(body)) issues.push("absolute machine path detected");
  if (/"notificationSent": true|externalEscalationSent": true|mutationEnabled": true/.test(body)) issues.push("incident drill safety flag violation");
  return issues;
}

const observability = await readJson("data/generated/observability-report.json", { alerts: [], summary: {} });
const qualityGate = await readJson("data/generated/quality-gate-report.json", null);
const safetyScan = await readJson("data/generated/safety-scan-report.json", null);
const readiness = await readJson("data/generated/production-readiness-report.json", null);
const devGateway = await readJson("data/generated/dev-gateway-live-drill-report.json", null);

const scenarios = [
  scenario("source_stale", "Stale source data local drill", "operator-drill"),
  scenario("agent_lost", "Agent lost or heartbeat stale local drill", "operator-drill"),
  scenario("task_stuck_failed_timed_out", "Task stuck, failed, or timed out local drill", "operator-drill"),
  scenario("backup_verification_failed", "Backup verification failed local drill", "operator-drill"),
  scenario("quality_gate_failed_or_stale", "Quality gate failed or stale local drill", qualityGate?.result ?? "missing", qualityGate?.result === "pass" ? "info" : "warning"),
  scenario("safety_scan_failed_or_stale", "Safety scan failed or stale local drill", safetyScan?.result ?? "missing", safetyScan?.result === "pass" ? "info" : "critical"),
  scenario("dev_gateway_blocked_or_unavailable", "Dev gateway blocked or unavailable local drill", devGateway?.summary?.failed === 0 ? "pass" : "warning"),
  scenario("production_readiness_no_go", "Production readiness no-go local drill", readiness?.recommendation ?? "missing", "critical")
];

for (const alert of observability.alerts ?? []) {
  if (["critical", "warning"].includes(alert.severity)) {
    scenarios.push(scenario(alert.type, alert.title, alert.entityId ?? "observability-alert", alert.severity));
  }
}

const report = {
  reportId: `operator-incident-drill-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "local-incident-drill",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  notificationSent: false,
  externalEscalationSent: false,
  scenarios,
  evidenceRefs: [
    "apps/dashboard/data/generated/observability-report.json",
    "apps/dashboard/data/generated/quality-gate-report.json",
    "apps/dashboard/data/generated/safety-scan-report.json",
    "apps/dashboard/data/generated/dev-gateway-live-drill-report.json",
    "apps/dashboard/data/generated/production-readiness-report.json"
  ],
  operatorChecklist: [
    "Confirm safety mode read-only.",
    "Confirm mutationEnabled false.",
    "Confirm productionWiring disabled.",
    "Review alert preview locally.",
    "Capture local evidence manifest.",
    "Do not send external notification.",
    "Do not run production action."
  ],
  productionStatus: "no-go-for-production"
};

const body = `${JSON.stringify(report, null, 2)}\n`;
const issues = assertSafeBody(body);
if (issues.length) {
  console.error("OpenClaw operator incident drill failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");
console.log("OpenClaw operator incident drill passed.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
