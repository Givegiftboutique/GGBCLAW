import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relPath) {
  return readFile(join(repoRoot, relPath), "utf8");
}

async function json(relPath) {
  return JSON.parse(await text(relPath));
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
  assert(result.status === 0, `${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

const paths = {
  configModule: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js",
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-dry-run.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-dry-run.ts",
  script: "apps/dashboard/scripts/run-whatsapp-readonly-sandbox-dry-run.mjs",
  report: "apps/dashboard/data/generated/whatsapp-readonly-sandbox-dry-run-report.json",
  example: "apps/dashboard/config/whatsapp-readonly-sandbox.example.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

for (const file of [paths.configModule, paths.module, paths.moduleTs, paths.script, paths.example]) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const sandbox = { window: {} };
vm.runInNewContext(await text(paths.configModule), sandbox, { filename: paths.configModule });
vm.runInNewContext(await text(paths.module), sandbox, { filename: paths.module });
const api = sandbox.window.OpenClawWhatsAppReadonlySandboxDryRun;
const exampleConfig = await json(paths.example);
const missing = api.runWhatsAppReadonlySandboxDryRun({ config: {}, configSource: "missing" });
assert(missing.blockers.includes("config_missing"), "missing config must fail closed.");
const example = api.runWhatsAppReadonlySandboxDryRun({ config: exampleConfig, rawText: await text(paths.example), configSource: "example" });
assert(example.dryRunOnly === true, "dry-run must be dryRunOnly.");
assert(example.blockers.includes("sandbox_disabled"), "example config must fail closed.");
assert(example.blockers.includes("future_explicit_approval_missing"), "future approval must remain missing.");
const unsafe = api.runWhatsAppReadonlySandboxDryRun({
  config: {
    ...exampleConfig,
    enabled: true,
    allowNetworkCalls: true,
    allowWebhook: true,
    allowSendMessage: true,
    allowAutoReply: true,
    allowProduction: true,
    productionReady: true,
    tokenConfigured: true
  },
  rawText: "password=SHOULD_NOT_PRINT",
  configSource: "local-ignored"
});
for (const blocker of [
  "network_requires_future_approval",
  "unsafe_webhook_enabled",
  "unsafe_send_message_enabled",
  "unsafe_auto_reply_enabled",
  "unsafe_production_enabled",
  "unsafe_production_ready_true",
  "unsafe_token_configured",
  "unsafe_secret_or_phone_like_value"
]) {
  assert(unsafe.blockers.includes(blocker), `unsafe local config sample missing blocker: ${blocker}`);
}
assert(unsafe.rawConfigPrinted === false && unsafe.rawSecretPrinted === false, "unsafe samples must not print raw values.");

run([paths.script]);
const report = await json(paths.report);
for (const [key, expected] of Object.entries({
  dryRunOnly: true,
  sandboxEligible: false,
  realApiConnected: false,
  networkCallsMade: false,
  webhookEnabled: false,
  apiClientAdded: false,
  authEnabled: false,
  tokenConfigured: false,
  secretManagerImplemented: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  rawSecretPrinted: false,
  rawConfigPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
})) {
  assert(report[key] === expected, `dry-run report ${key} must be ${expected}.`);
}
assert(report.scope === "whatsapp-readonly-sandbox-dry-run", "report scope must be dry-run.");
assert(report.blockerCount >= 1 && Array.isArray(report.blockers), "report must document blockers.");
assert(report.blockers.includes("sandbox_disabled"), "report must include sandbox_disabled blocker.");

const bannedRuntime = /\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|net\.createServer|listen\s*\(|app\.(get|post|put|patch|delete|use)|router\.(get|post|put|patch|delete|use)|polling|qr\s*login|scan\s*qr|whatsapp web|document\.cookie|localStorage|sessionStorage|Authorization\s*:|credentials\s*:\s*["']include["']|process\.env|dotenv|readFile\([^)]*\.env|secretManagerImplemented\s*:\s*true|\b(?:sendMessage|autoReply|replyMessage|deleteMessage|restart|deploy)\s*\(/i;
for (const file of [paths.module, paths.script]) {
  const body = await text(file);
  assert(!bannedRuntime.test(body), `${file} must not add real API, webhook, listener, network, polling, auth, env, QR, cookie/session, secret manager, send/reply, mutation, restart, or deploy behavior.`);
}
assert((await text(paths.module)).includes("OpenClawWhatsAppReadonlySandboxConfig"), "dry-run module must use 28I config validator.");
assert((await text(paths.script)).includes("whatsapp-readonly-sandbox-config.js"), "dry-run script must load the 28I config validator.");

for (const file of [paths.example, paths.report]) {
  const body = await text(file);
  const phoneLikeRe = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;
  assert(!phoneLikeRe.test(body), `${file} must not contain phone numbers.`);
  assert(!/Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|raw whatsapp chat|chat export|message history/i.test(body), `${file} must not contain credentials or raw chat.`);
}

const app = await text(paths.app);
for (const marker of ["WhatsApp Read-only Sandbox Dry-run", "whatsapp-readonly-sandbox-dry-run-report.json", "dryRunOnly", "realApiConnected", "blockerCount"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
assert(!/WhatsApp Read-only Sandbox Dry-run[\s\S]{0,1200}<button/i.test(app), "dry-run panel must not include a connect/setup button.");
assert(!/WhatsApp Read-only Sandbox Dry-run[\s\S]{0,1200}<input/i.test(app), "dry-run panel must not include endpoint or credential input.");

for (const [file, markers] of [
  [paths.quality, ["run-whatsapp-readonly-sandbox-dry-run.mjs", "test-whatsapp-readonly-sandbox-dry-run.mjs", "whatsappReadonlySandboxDryRunReport"]],
  [paths.safety, ["whatsapp-readonly-sandbox-dry-run", "whatsapp-readonly-sandbox-dry-run.js"]],
  [paths.verifier, ["whatsapp-readonly-sandbox-dry-run", "whatsapp-readonly-sandbox-dry-run.js"]]
]) {
  const body = await text(file);
  for (const marker of markers) assert(body.includes(marker), `${file} missing ${marker}`);
}

console.log("OpenClaw WhatsApp read-only sandbox dry-run tests passed.");
