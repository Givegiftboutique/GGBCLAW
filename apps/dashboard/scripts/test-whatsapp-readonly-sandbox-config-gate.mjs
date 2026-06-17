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
  example: "apps/dashboard/config/whatsapp-readonly-sandbox.example.json",
  ignore: "apps/dashboard/config/.gitignore",
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.ts",
  script: "apps/dashboard/scripts/check-whatsapp-readonly-sandbox-config-gate.mjs",
  report: "apps/dashboard/data/generated/whatsapp-readonly-sandbox-config-gate-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

for (const file of [paths.example, paths.ignore, paths.module, paths.moduleTs, paths.script]) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const ignoreBody = await text(paths.ignore);
assert(ignoreBody.includes("whatsapp-readonly-sandbox.local.json"), "local sandbox config must be ignored.");
assert(ignoreBody.includes("whatsapp-readonly-sandbox.*.local.json"), "pattern local sandbox config must be ignored.");
const trackedLocal = spawnSync("git", ["ls-files", "apps/dashboard/config/whatsapp-readonly-sandbox.local.json", "apps/dashboard/config/whatsapp-readonly-sandbox.*.local.json"], { cwd: repoRoot, encoding: "utf8" });
assert(trackedLocal.status === 0 && trackedLocal.stdout.trim() === "", "real local sandbox configs must not be tracked.");

const sandbox = { window: {} };
vm.runInNewContext(await text(paths.module), sandbox, { filename: paths.module });
const api = sandbox.window.OpenClawWhatsAppReadonlySandboxConfig;
const exampleConfig = await json(paths.example);
const exampleResult = api.validateWhatsAppReadonlySandboxConfig({ config: exampleConfig, rawText: await text(paths.example), configSource: "example" });
assert(exampleResult.blockers.includes("sandbox_disabled"), "example config must fail closed.");
assert(exampleResult.sandboxEligible === false, "example config must not be sandbox eligible.");
assert(api.validateWhatsAppReadonlySandboxConfig({ config: {}, configSource: "missing" }).blockers.includes("config_missing"), "missing config must fail closed.");
assert(api.validateWhatsAppReadonlySandboxConfig({ config: { ...exampleConfig, enabled: true }, configSource: "local-ignored" }).blockers.includes("network_not_allowed"), "enabled without network approval must be blocked.");

for (const [key, blocker] of [
  ["allowWebhook", "unsafe_webhook_enabled"],
  ["allowSendMessage", "unsafe_send_message_enabled"],
  ["allowAutoReply", "unsafe_auto_reply_enabled"],
  ["allowProduction", "unsafe_production_enabled"],
  ["productionReady", "unsafe_production_ready_true"],
  ["tokenConfigured", "unsafe_token_configured"]
]) {
  const result = api.validateWhatsAppReadonlySandboxConfig({ config: { ...exampleConfig, [key]: true }, rawText: JSON.stringify({ [key]: true }), configSource: "example" });
  assert(result.blockers.includes(blocker), `${key} must be rejected.`);
}
assert(api.validateWhatsAppReadonlySandboxConfig({ config: exampleConfig, rawText: "password=SHOULD_NOT_PRINT", configSource: "example" }).blockers.includes("unsafe_secret_or_phone_like_value"), "raw secret-like config must be rejected.");

run([paths.script]);
const report = await json(paths.report);
for (const [key, expected] of Object.entries({
  preflightOnly: true,
  sandboxEligible: false,
  enabled: false,
  networkCallsMade: false,
  allowNetworkCalls: false,
  webhookEnabled: false,
  allowWebhook: false,
  apiClientAdded: false,
  authEnabled: false,
  tokenConfigured: false,
  secretReferenceConfigured: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  rawSecretPrinted: false,
  rawConfigPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
})) {
  assert(report[key] === expected, `config gate report ${key} must be ${expected}.`);
}
assert(report.scope === "whatsapp-readonly-sandbox-config-gate", "report scope must be config gate.");
assert(report.configSource === "example", "default report must read example config.");
assert(report.blockerCount >= 1 && report.blockers.includes("sandbox_disabled"), "report must document fail-closed blockers.");

const bannedRuntime = /\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|net\.createServer|listen\s*\(|app\.(get|post|put|patch|delete|use)|router\.(get|post|put|patch|delete|use)|polling|qr\s*login|scan\s*qr|whatsapp web|document\.cookie|localStorage|sessionStorage|Authorization\s*:|credentials\s*:\s*["']include["']|process\.env|dotenv|readFile\([^)]*\.env|secretManagerImplemented\s*:\s*true|\b(?:sendMessage|autoReply|replyMessage|deleteMessage|restart|deploy)\s*\(/i;
for (const file of [paths.module, paths.script]) {
  const body = await text(file);
  assert(!bannedRuntime.test(body), `${file} must not add real API, webhook, listener, network, polling, auth, env, QR, cookie/session, secret manager, send/reply, mutation, restart, or deploy behavior.`);
}

for (const file of [paths.example, paths.report]) {
  const body = await text(file);
  const phoneLikeRe = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;
  assert(!phoneLikeRe.test(body), `${file} must not contain phone numbers.`);
  assert(!/Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|raw whatsapp chat|chat export|message history/i.test(body), `${file} must not contain credentials or raw chat.`);
}

const app = await text(paths.app);
for (const marker of ["WhatsApp Read-only Sandbox Gate", "whatsapp-readonly-sandbox-config-gate-report.json", "sandboxEligible", "allowNetworkCalls", "blockerCount"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
assert(!/WhatsApp Read-only Sandbox Gate[\s\S]{0,1200}<button/i.test(app), "config gate panel must not include a connect/setup button.");
assert(!/WhatsApp Read-only Sandbox Gate[\s\S]{0,1200}<input/i.test(app), "config gate panel must not include endpoint or credential input.");

for (const [file, markers] of [
  [paths.quality, ["check-whatsapp-readonly-sandbox-config-gate.mjs", "test-whatsapp-readonly-sandbox-config-gate.mjs", "whatsappReadonlySandboxConfigGateReport"]],
  [paths.safety, ["whatsapp-readonly-sandbox-config-gate", "whatsapp-readonly-sandbox-config.js"]],
  [paths.verifier, ["whatsapp-readonly-sandbox-config-gate", "whatsapp-readonly-sandbox-config.js"]]
]) {
  const body = await text(file);
  for (const marker of markers) assert(body.includes(marker), `${file} missing ${marker}`);
}

console.log("OpenClaw WhatsApp read-only sandbox config gate tests passed.");
