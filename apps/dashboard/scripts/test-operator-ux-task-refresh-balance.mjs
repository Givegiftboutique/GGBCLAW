import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

const paths = {
  operatorCopy: join(dashboardRoot, "src/lib/operator-ux/operator-copy.js"),
  taskInboxModule: join(dashboardRoot, "src/lib/operator-tasks/local-task-inbox.js"),
  hourlyRefreshModule: join(dashboardRoot, "src/lib/operator-refresh/hourly-refresh-policy.js"),
  providerBalanceModule: join(dashboardRoot, "src/lib/operator-balance/provider-balance-center.js"),
  taskTemplate: join(dashboardRoot, "data/local/operator-task-inbox.template.json"),
  taskExample: join(dashboardRoot, "data/local/operator-task-inbox.example.json"),
  balanceTemplate: join(dashboardRoot, "data/local/provider-balance-center.template.json"),
  balanceExample: join(dashboardRoot, "data/local/provider-balance-center.example.json"),
  gitignore: join(dashboardRoot, "data/local/.gitignore"),
  taskReport: join(dashboardRoot, "data/generated/local-task-inbox-report.json"),
  whatsappChecklist: join(dashboardRoot, "data/generated/whatsapp-task-visibility-checklist.json"),
  refreshReport: join(dashboardRoot, "data/generated/hourly-refresh-policy-report.json"),
  balanceReport: join(dashboardRoot, "data/generated/provider-balance-center-report.json"),
  app: join(dashboardRoot, "src/app.js"),
  i18n: join(dashboardRoot, "src/lib/i18n/zh-hant.js"),
  quality: join(dashboardRoot, "scripts/run-dashboard-quality-gates.mjs"),
  safety: join(dashboardRoot, "scripts/safety-scan-dashboard.mjs"),
  verifier: join(dashboardRoot, "verify-dashboard.mjs"),
  launch: join(dashboardRoot, "scripts/start-operator-dashboard.ps1")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function text(path) {
  return readFile(path, "utf8");
}

async function json(path) {
  return JSON.parse(await text(path));
}

for (const [label, path] of Object.entries(paths)) {
  assert(await exists(path), `${label} missing: ${path}`);
}

const gitignore = await text(paths.gitignore);
for (const marker of [
  "operator-task-inbox.json",
  "provider-balance-center.json",
  "provider-credentials.json",
  "*.key.json",
  "*.token.json"
]) {
  assert(gitignore.includes(marker), `.gitignore missing ${marker}`);
}

for (const localOnly of [
  "apps/dashboard/data/local/operator-task-inbox.json",
  "apps/dashboard/data/local/provider-balance-center.json",
  "apps/dashboard/data/local/provider-credentials.json",
  "apps/dashboard/data/local/reviewed-local-agent-health.json"
]) {
  const tracked = spawnSync("git", ["ls-files", localOnly], { cwd: repoRoot, encoding: "utf8" });
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", localOnly], { cwd: repoRoot, encoding: "utf8" });
  assert(!(tracked.stdout || "").trim(), `${localOnly} must not be tracked.`);
  assert(!(staged.stdout || "").trim(), `${localOnly} must not be staged.`);
}

const taskReport = await json(paths.taskReport);
const whatsappChecklist = await json(paths.whatsappChecklist);
const refreshReport = await json(paths.refreshReport);
const balanceReport = await json(paths.balanceReport);

assert(taskReport.taskInboxStatus, "task inbox status missing.");
assert(taskReport.whatsappTaskSyncStatus, "WhatsApp sync status missing.");
assert(whatsappChecklist.whatsappApiConnected === false, "WhatsApp API must not be connected.");
assert(refreshReport.refreshIntervalMinutes === 60, "refresh interval must be 60 minutes.");
assert(refreshReport.externalFetchEnabled === false && refreshReport.productionFetchEnabled === false && refreshReport.localReportsOnly === true, "refresh must remain local-only.");
assert(balanceReport.redactionApplied === true && balanceReport.rawSecretsPrinted === false, "balance report must be redacted.");
assert(balanceReport.providers?.length === 3, "balance report must include three providers.");

const app = await text(paths.app);
const i18n = await text(paths.i18n);
const quality = await text(paths.quality);
const safety = await text(paths.safety);
const verifier = await text(paths.verifier);
const launch = await text(paths.launch);

for (const marker of [
  "今日總覽",
  "今日任務",
  "WhatsApp 任務",
  "每 1 小時自動刷新",
  "立即刷新",
  "下次刷新時間",
  "用量與餘額中心",
  "QWE API",
  "Huawei LLM Agent",
  "Intenext Codex",
  "不會儲存密碼",
  "不會顯示完整 API key",
  "Production 安全鎖"
]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}

for (const marker of ["operatorUxPolish", "taskInbox", "hourlyRefresh", "providerBalanceCenter"]) {
  assert(i18n.includes(marker), `i18n marker missing: ${marker}`);
}

for (const marker of [
  "generate-local-task-inbox-report.mjs",
  "generate-whatsapp-task-visibility-checklist.mjs",
  "generate-hourly-refresh-policy-report.mjs",
  "generate-provider-balance-center-report.mjs",
  "test-operator-ux-task-refresh-balance.mjs"
]) {
  assert(quality.includes(marker), `quality gate missing ${marker}`);
  assert(safety.includes(marker), `safety scan missing ${marker}`);
  assert(verifier.includes(marker), `verifier missing ${marker}`);
}

const combined = [
  await text(paths.operatorCopy),
  await text(paths.taskInboxModule),
  await text(paths.hourlyRefreshModule),
  await text(paths.providerBalanceModule),
  await text(paths.taskTemplate),
  await text(paths.taskExample),
  await text(paths.balanceTemplate),
  await text(paths.balanceExample),
  JSON.stringify({ taskReport, whatsappChecklist, refreshReport, balanceReport }),
  app,
  launch
].join("\n");

assert(!/"productionReady"\s*:\s*true|"adapterEnabled"\s*:\s*true|"connected"\s*:\s*true|"endpointConfigured"\s*:\s*true|"authEnabled"\s*:\s*true|"dataReturned"\s*:\s*true/i.test(combined), "production flags must remain false.");
assert(!/credentials\s*:\s*["']include["']|Authorization\s*:|Bearer\s+[A-Za-z0-9._-]{8,}|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|document\.cookie|localStorage\.setItem|sessionStorage\.setItem/i.test(combined), "secret/auth/cookie handling detected.");
assert(!/playwright|puppeteer|scrapeWallet|scrapeProvider|loginProvider\s*\(|loginWallet\s*\(|providerLoginEnabled\s*:\s*true|walletLoginEnabled\s*:\s*true|productionGatewayConnected\s*:\s*true|restartAgentEnabled\s*:\s*true/i.test(combined), "external login/scraping/production/restart behavior detected.");
assert(!/[A-Za-z]:\\Users\\|\/home\//i.test(JSON.stringify({ taskReport, whatsappChecklist, refreshReport, balanceReport })), "generated reports must not contain machine paths.");

console.log("OpenClaw operator UX task refresh balance tests passed.");
