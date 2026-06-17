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
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-real-api-preflight-gate.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-real-api-preflight-gate.ts",
  script: "apps/dashboard/scripts/check-whatsapp-real-api-preflight-gate.mjs",
  report: "apps/dashboard/data/generated/whatsapp-real-api-preflight-gate-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

for (const file of [paths.module, paths.moduleTs, paths.script]) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const sandbox = { window: {} };
vm.runInNewContext(await text(paths.module), sandbox, { filename: paths.module });
const api = sandbox.window.OpenClawWhatsAppRealApiPreflightGate;
const directGate = api.buildWhatsAppRealApiPreflightGate({
  localFallbackAvailable: true,
  fakeProviderAvailable: true,
  mockContractAvailable: true,
  safetyDesignAvailable: true,
  secretManagerDesignAvailable: true
});
assert(directGate.preflightOnly === true, "module gate must be preflight only.");
assert(directGate.productionReady === false, "module gate must not be production ready.");
assert(directGate.blockers.length >= 9, "module gate must document required blockers.");

run([paths.script]);
const report = await json(paths.report);
for (const [key, expected] of Object.entries({
  preflightOnly: true,
  realApiConnected: false,
  webhookEnabled: false,
  networkCallsMade: false,
  apiClientAdded: false,
  authEnabled: false,
  tokenConfigured: false,
  secretManagerImplemented: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  rawSecretPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  localFallbackAvailable: true,
  fakeProviderAvailable: true,
  mockContractAvailable: true,
  safetyDesignAvailable: true
})) {
  assert(report[key] === expected, `preflight report ${key} must be ${expected}.`);
}

assert(report.scope === "whatsapp-real-api-preflight-gate", "report scope must be preflight gate.");
assert(report.eligibleFor28IPlanning === false, "28H report must not enable 28I execution.");
assert(report.blockerCount >= 9 && Array.isArray(report.blockers), "blockers must be documented.");
for (const blocker of [
  "no real secret manager implementation",
  "no approved real provider credentials",
  "no webhook verification implementation",
  "no privacy / deletion production approval",
  "no legal / consent approval",
  "no production data-retention policy implementation",
  "no abuse/spam handling implementation",
  "no operator approval workflow for real inbound events",
  "no incident rollback runbook for real WhatsApp sync"
]) {
  assert(report.blockers.includes(blocker), `missing blocker: ${blocker}`);
}

const bannedRuntime = /\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|net\.createServer|listen\s*\(|app\.(get|post|put|patch|delete|use)|router\.(get|post|put|patch|delete|use)|polling|qr\s*login|scan\s*qr|whatsapp web|document\.cookie|localStorage|sessionStorage|Authorization\s*:|credentials\s*:\s*["']include["']|process\.env|dotenv|readFile\([^)]*\.env|secretManagerImplemented\s*:\s*true|tokenConfigured\s*:\s*true|\b(?:sendMessage|autoReply|replyMessage|deleteMessage|restart|deploy)\s*\(/i;
for (const file of [paths.module, paths.script]) {
  const body = await text(file);
  assert(!bannedRuntime.test(body), `${file} must not add real API, webhook, listener, network, polling, auth, token, env, QR, cookie/session, secret manager, send/reply, mutation, restart, or deploy behavior.`);
}

const docsAndFixtures = [
  "apps/dashboard/tests/fixtures/whatsapp-readonly-fake-provider-events.json",
  "docs/dashboard/openclaw-dashboard-whatsapp-real-api-preflight-gate.md"
];
for (const file of docsAndFixtures) {
  if (!existsSync(join(repoRoot, file))) continue;
  const body = await text(file);
  const phoneLikeRe = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;
  assert(!phoneLikeRe.test(body), `${file} must not contain phone numbers.`);
  assert(!/Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|raw whatsapp chat|chat export|message history|end-to-end encrypted|media omitted/i.test(body), `${file} must not contain credentials or raw chat.`);
}

const app = await text(paths.app);
for (const marker of ["WhatsApp 真 API Preflight", "whatsapp-real-api-preflight-gate-report.json", "realApiConnected", "tokenConfigured", "blockerCount"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
assert(!/WhatsApp 真 API Preflight[\s\S]{0,1200}<button/i.test(app), "preflight panel must not include a connect/setup button.");
assert(!/WhatsApp 真 API Preflight[\s\S]{0,1200}<input/i.test(app), "preflight panel must not include endpoint or credential input.");

for (const [file, markers] of [
  [paths.quality, ["check-whatsapp-real-api-preflight-gate.mjs", "test-whatsapp-real-api-preflight-gate.mjs", "whatsappRealApiPreflightGateReport"]],
  [paths.safety, ["whatsapp-real-api-preflight-gate", "whatsapp-real-api-preflight-gate.js"]],
  [paths.verifier, ["whatsapp-real-api-preflight-gate", "whatsapp-real-api-preflight-gate.js"]]
]) {
  const body = await text(file);
  for (const marker of markers) assert(body.includes(marker), `${file} missing ${marker}`);
}

console.log("OpenClaw WhatsApp real API preflight gate tests passed.");
