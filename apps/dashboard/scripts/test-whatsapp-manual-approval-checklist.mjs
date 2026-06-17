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
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-manual-approval-checklist.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-manual-approval-checklist.ts",
  script: "apps/dashboard/scripts/check-whatsapp-manual-approval-go-no-go.mjs",
  report: "apps/dashboard/data/generated/whatsapp-manual-approval-go-no-go-report.json",
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
const api = sandbox.window.OpenClawWhatsAppManualApprovalChecklist;
const checklist = api.buildWhatsAppManualApprovalChecklist({ documentationAvailable: true });

for (const [key, expected] of Object.entries({
  manualApprovalOnly: true,
  goNoGoStatus: "no-go",
  realApiConnected: false,
  webhookEnabled: false,
  networkCallsMade: false,
  tokenConfigured: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  rawSecretPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
})) {
  assert(checklist[key] === expected, `checklist ${key} must be ${expected}.`);
}

for (const blocker of [
  "operator approval missing",
  "privacy policy approval missing",
  "account/data deletion path missing",
  "legal review missing",
  "user consent model missing",
  "abuse/spam handling missing",
  "incident rollback runbook missing",
  "real secret manager not implemented",
  "webhook verification not implemented",
  "real provider credentials not approved",
  "production data retention not approved",
  "send/reply approval missing",
  "auto-reply approval missing"
]) {
  assert(checklist.blockers.includes(blocker), `required blocker missing: ${blocker}`);
}

const unsafe = api.buildWhatsAppManualApprovalChecklist({
  realApiConnected: true,
  webhookEnabled: true,
  networkCallsMade: true,
  tokenConfigured: true,
  sendMessageEnabled: true,
  autoReplyEnabled: true,
  mutationEnabled: true,
  productionReady: true
});
for (const blocker of [
  "real API connection must remain disabled",
  "webhook must remain disabled",
  "network calls must remain disabled",
  "token configuration must remain disabled",
  "send message must remain disabled",
  "auto-reply must remain disabled",
  "mutation must remain disabled",
  "productionReady true is forbidden"
]) {
  assert(unsafe.blockers.includes(blocker), `unsafe blocker missing: ${blocker}`);
}
assert(api.evaluateWhatsAppGoNoGo({ documentationAvailable: true }).goNoGoStatus === "no-go", "go/no-go must remain no-go.");

run([paths.script]);
const report = await json(paths.report);
for (const [key, expected] of Object.entries({
  manualApprovalOnly: true,
  goNoGoStatus: "no-go",
  realApiConnected: false,
  webhookEnabled: false,
  networkCallsMade: false,
  tokenConfigured: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  rawSecretPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
})) {
  assert(report[key] === expected, `go/no-go report ${key} must be ${expected}.`);
}
assert(report.scope === "whatsapp-manual-approval-checklist", "report scope must be manual approval checklist.");
assert(report.blockerCount >= 13 && Array.isArray(report.blockers), "report must document required blockers.");

const bannedRuntime = /\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|net\.createServer|listen\s*\(|app\.(get|post|put|patch|delete|use)|router\.(get|post|put|patch|delete|use)|polling|qr\s*login|scan\s*qr|whatsapp web|document\.cookie|localStorage|sessionStorage|Authorization\s*:|credentials\s*:\s*["']include["']|process\.env|dotenv|readFile\([^)]*\.env|secretManagerImplemented\s*:\s*true|\b(?:sendMessage|autoReply|replyMessage|deleteMessage|restart|deploy)\s*\(/i;
for (const file of [paths.module, paths.script]) {
  const body = await text(file);
  assert(!bannedRuntime.test(body), `${file} must not add real API, webhook, listener, network, polling, auth, env, QR, cookie/session, secret manager, send/reply, mutation, restart, or deploy behavior.`);
}

for (const file of [paths.report]) {
  const body = await text(file);
  const phoneLikeRe = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;
  assert(!phoneLikeRe.test(body), `${file} must not contain phone numbers.`);
  assert(!/Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|raw whatsapp chat|chat export|message history/i.test(body), `${file} must not contain credentials or raw chat.`);
}

const app = await text(paths.app);
for (const marker of ["WhatsApp Manual Approval Gate", "whatsapp-manual-approval-go-no-go-report.json", "manualApprovalOnly", "goNoGoStatus", "blockerCount"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
assert(!/WhatsApp Manual Approval Gate[\s\S]{0,1200}<button/i.test(app), "manual approval panel must not include a connect/setup button.");
assert(!/WhatsApp Manual Approval Gate[\s\S]{0,1200}<input/i.test(app), "manual approval panel must not include endpoint or credential input.");

for (const [file, markers] of [
  [paths.quality, ["check-whatsapp-manual-approval-go-no-go.mjs", "test-whatsapp-manual-approval-checklist.mjs", "whatsappManualApprovalGoNoGoReport"]],
  [paths.safety, ["whatsapp-manual-approval-checklist", "goNoGoStatus", "whatsapp-manual-approval-checklist.js"]],
  [paths.verifier, ["whatsapp-manual-approval-checklist", "whatsapp-manual-approval-checklist.js"]]
]) {
  const body = await text(file);
  for (const marker of markers) assert(body.includes(marker), `${file} missing ${marker}`);
}

console.log("OpenClaw WhatsApp manual approval checklist tests passed.");
