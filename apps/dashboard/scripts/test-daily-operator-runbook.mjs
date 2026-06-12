import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const repoRoot = resolve(dashboardRoot, "../..");

const validStatuses = new Set(["ok", "review-required", "blocked", "fixture-mode", "unknown"]);
const blockedActions = ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"];
const sourceModes = ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"];
const routeValues = [
  "#/dashboard",
  "#/dashboard/agents",
  "#/dashboard/tasks",
  "#/dashboard/reviews",
  "#/dashboard/logs",
  "#/dashboard/backups",
  "#/dashboard/settings",
  "#/dashboard/rbac",
  "#/dashboard/help",
  "#/dashboard/observability"
];

const requiredFiles = [
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.ts",
  "apps/dashboard/scripts/generate-daily-operator-summary-report.mjs",
  "apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs",
  "apps/dashboard/scripts/test-daily-operator-runbook.mjs",
  "docs/dashboard/openclaw-dashboard-daily-operator-runbook-mode.md"
];

async function exists(path) {
  try {
    await access(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

async function readRepo(path) {
  return readFile(join(repoRoot, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runNode(script) {
  const result = spawnSync(process.execPath, [join(repoRoot, script)], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert(result.status === 0, `${script} failed: ${result.stderr || result.stdout}`);
}

for (const file of requiredFiles) {
  assert(await exists(file), `${file} must exist`);
}

runNode("apps/dashboard/scripts/generate-daily-operator-summary-report.mjs");
runNode("apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs");

const summary = JSON.parse(await readRepo("apps/dashboard/data/generated/daily-operator-summary-report.json"));
const checklist = JSON.parse(await readRepo("apps/dashboard/data/generated/daily-operator-runbook-checklist.json"));
const runbookModule = await readRepo("apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js");
const app = await readRepo("apps/dashboard/src/app.js");
const i18n = await readRepo("apps/dashboard/src/lib/i18n/zh-hant.js");
const index = await readRepo("apps/dashboard/index.html");
const qualityGate = await readRepo("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
const safetyScan = await readRepo("apps/dashboard/scripts/safety-scan-dashboard.mjs");
const sourceConfig = await readRepo("apps/dashboard/src/lib/adapters/source-config.js");
const docs = await readRepo("docs/dashboard/openclaw-dashboard-daily-operator-runbook-mode.md");
const generatedText = `${JSON.stringify(summary)}\n${JSON.stringify(checklist)}`;

for (const marker of [
  "buildDailyOperatorRunbook",
  "classifyDailyOperatorStatus",
  "buildSafeNextSteps",
  "buildBlockedActionSummary",
  "buildRunbookCards",
  "fixture-mode",
  "review-required",
  "production-gateway-connect"
]) {
  assert(runbookModule.includes(marker), `daily operator runbook module missing ${marker}`);
}
assert(!/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(runbookModule), "daily runbook module must not fetch, notify, or expose restart/start/stop functions");

assert(validStatuses.has(summary.dailyStatus), "daily summary status must be a valid enum");
assert(summary.expectedRealAgentCount === 1, "daily summary expectedRealAgentCount must be 1");
assert(summary.actualRealAgentCount === 1, "daily summary actualRealAgentCount must be 1");
assert(summary.operatorRecommendedSource === "local-ingest", "daily summary must recommend local-ingest");
assert(summary.operatorRecommendedData === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "daily summary must use the single-agent snapshot");
assert(summary.productionStatus === "no-go-for-production", "daily summary productionStatus must remain no-go-for-production");
assert(summary.mutationEnabled === false && summary.restartEnabled === false && summary.productionGatewayEnabled === false, "daily summary safety toggles must remain disabled");
assert(!["mock", "gateway-stub"].includes(summary.operatorRecommendedSource), "daily truth must not use fixture sources");
for (const blocked of blockedActions) {
  assert(summary.blockedActions.includes(blocked), `daily summary must block ${blocked}`);
}

assert(validStatuses.has(checklist.dailyStatus), "daily checklist status must be a valid enum");
assert(checklist.scope === "daily-operator-runbook", "daily checklist scope must match");
assert(checklist.language === "zh-Hant", "daily checklist must be zh-Hant");
for (const blocked of [...blockedActions, "auth-token-secrets"]) {
  assert(checklist.notAllowed.includes(blocked), `daily checklist must block ${blocked}`);
}
assert(checklist.operatorChecks.some((item) => item.includes("source = local-ingest")), "daily checklist must ask operator to confirm local-ingest");
assert(checklist.operatorChecks.some((item) => item.includes("agent count = 1")), "daily checklist must ask operator to confirm one agent");

for (const marker of [
  "每日操作手冊",
  "今日狀態",
  "狀態原因",
  "安全下一步",
  "已封鎖操作",
  "本地 Agent 健康狀態",
  "本地健康證據審查",
  "營運首頁",
  "This is not the daily operator view",
  "重啟",
  "修改",
  "Production gateway"
]) {
  assert(app.includes(marker), `app.js missing ${marker}`);
}

for (const marker of ["每日操作手冊", "今日狀態", "狀態原因", "安全下一步", "已封鎖操作"]) {
  assert(i18n.includes(marker) || app.includes(marker), `i18n/app missing ${marker}`);
}

assert(index.includes("daily-operator-runbook.js?v=23B"), "index must load the daily runbook module");
assert(index.includes("sprint-23b-daily-operator-runbook-mode") || index.includes("sprint-23c-reviewed-health-input-assistant") || index.includes("sprint-24a-production-entry-gate-hardening") || index.includes("sprint-24b-production-adapter-simulator") || index.includes("sprint-25a-read-only-adapter-contract-disabled-draft") || index.includes("sprint-25b-local-operator-rc-audit") || index.includes("sprint-25c-operator-ux-task-refresh-balance") || index.includes("sprint-25d-chinese-operator-ux-copy-hardening") || index.includes("sprint-25e-operator-console-visual-redesign") || index.includes("sprint-26a-local-openclaw-readonly-connector"), "index app cache marker must be Sprint 23B or later");

for (const marker of [
  "generate-daily-operator-summary-report.mjs",
  "generate-daily-operator-runbook-checklist.mjs",
  "test-daily-operator-runbook.mjs",
  "dailyOperatorSummaryReport",
  "dailyOperatorRunbookChecklist",
  "dailyOperatorRunbookTests",
  "dailyOperatorSummaryReportPath",
  "dailyOperatorRunbookChecklistPath"
]) {
  assert(qualityGate.includes(marker), `quality gate missing ${marker}`);
}

for (const marker of [
  "daily-operator-runbook.js",
  "generate-daily-operator-summary-report.mjs",
  "generate-daily-operator-runbook-checklist.mjs",
  "test-daily-operator-runbook.mjs",
  "daily-operator-summary-report.json",
  "daily-operator-runbook-checklist.json",
  "openclaw-dashboard-daily-operator-runbook-mode.md",
  "daily-truth-fixture-source"
]) {
  assert(safetyScan.includes(marker), `safety scan missing ${marker}`);
}

assert(docs.includes("Sprint 23B"), "daily runbook docs must mention Sprint 23B");
assert(docs.includes("Review Required"), "daily runbook docs must explain Review Required");
assert(docs.includes("restart-agent"), "daily runbook docs must list blocked restart action");

for (const sourceMode of sourceModes) {
  assert(app.includes(`"${sourceMode}"`) || app.includes(sourceMode), `source mode ${sourceMode} must remain present`);
}

for (const route of routeValues) {
  const hashlessRoute = route.replace(/^#/, "");
  assert(app.includes(route) || app.includes(hashlessRoute) || sourceConfig.includes(route) || sourceConfig.includes(hashlessRoute), `route ${route} must remain present`);
}

assert(!/C:\\Users\\/i.test(generatedText), "daily generated reports must not include absolute Windows user paths");
assert(!/\/home\/[^/\s"]+/i.test(generatedText), "daily generated reports must not include POSIX home paths");
assert(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedText), "daily generated reports must not include external URLs");
assert(!/Authorization\s*:/i.test(generatedText), "daily generated reports must not include Authorization headers");
assert(!/credentials\s*:\s*["']include["']/i.test(generatedText), "daily generated reports must not include credentials include");
assert(!/(api[_-]?key|secret|password|accessToken|refreshToken)\s*[:=]/i.test(generatedText), "daily generated reports must not include secret-like values");

console.log("OpenClaw daily operator runbook tests passed.");
