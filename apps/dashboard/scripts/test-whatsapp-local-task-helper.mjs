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

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
  assert(result.status === 0, `${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

function git(args) {
  for (const command of ["git", "C:\\Program Files\\Git\\cmd\\git.exe"]) {
    const result = spawnSync(command, args, { cwd: repoRoot, encoding: "utf8" });
    if (!result.error) return (result.stdout || "").trim();
  }
  return "";
}

const paths = {
  helperModule: "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.js",
  helperModuleTs: "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.ts",
  helperScript: "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs",
  helperPs1: "apps/dashboard/scripts/build-whatsapp-local-task-import.ps1",
  template: "apps/dashboard/data/local/whatsapp-task-helper-input.template.txt",
  example: "apps/dashboard/data/local/whatsapp-task-helper-input.example.txt",
  helperReport: "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs",
  localIgnore: "apps/dashboard/data/local/.gitignore"
};

for (const file of Object.values(paths)) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const ignoreText = await text(paths.localIgnore);
assert(ignoreText.includes("whatsapp-task-helper-input.txt"), "helper input must be ignored.");
assert(ignoreText.includes("whatsapp-task-helper-input.*.local.txt"), "helper local input must be ignored.");
assert(ignoreText.includes("whatsapp-task-import.json"), "real import must be ignored.");

assert(!git(["ls-files", "apps/dashboard/data/local/whatsapp-task-helper-input.txt"]), "helper input must not be tracked.");
assert(!git(["ls-files", "apps/dashboard/data/local/whatsapp-task-import.json"]), "real import must not be tracked.");

const helperSource = await text(paths.helperModule);
const helperWindow = { window: {} };
vm.runInNewContext(helperSource, helperWindow, { filename: paths.helperModule });
const helper = helperWindow.window.OpenClawWhatsAppLocalTaskHelper;
assert(helper, "helper module must register on window.");

const parsed = helper.parseWhatsAppTaskHelperInput(await text(paths.example));
assert(parsed.taskCount >= 2, "example helper input should parse at least 2 tasks.");

const validated = helper.validateWhatsAppTaskHelperInput(parsed);
assert(validated.helperStatus === "ready", "safe example should validate as ready.");

const mapped = helper.mapHelperTasksToWhatsAppImport(parsed);
assert(mapped.importStatus === "ready", "safe example should map to ready import.");
assert(mapped.tasks.length >= 2, "safe example should map to import tasks.");

const flagged = helper.validateWhatsAppTaskHelperInput(helper.parseWhatsAppTaskHelperInput(`
TASK:
title: Follow up +852 9123 4567
summary: This text mentions a token and should be flagged.
`));
assert(flagged.helperStatus === "review-required" || flagged.helperStatus === "unsafe-rejected", "phone/credential content must be blocked or reviewed.");
assert(flagged.containsPhoneNumbers === true, "phone number must be detected.");
assert(flagged.warnings.some((warning) => warning.includes("phone-review-required")), "phone review warning missing.");
assert(flagged.warnings.some((warning) => warning.includes("credential-review-required")), "credential review warning missing.");

runNode([paths.helperScript]);
const report = await json(paths.helperReport);
assert(report.scope === "whatsapp-local-task-helper", "helper report scope invalid.");
assert(["needs-helper-input", "ready", "review-required", "unsafe-rejected"].includes(report.helperStatus), "helperStatus invalid.");
assert(report.rawInputPrinted === false, "rawInputPrinted must be false.");
assert(report.rawChatPrinted === false, "rawChatPrinted must be false.");
assert(report.secretRedactionApplied === true, "secretRedactionApplied must be true.");
assert(report.whatsappApiConnected === false, "WhatsApp API must stay disabled.");
assert(report.webhookEnabled === false, "webhook must stay disabled.");
assert(report.authEnabled === false, "auth must stay disabled.");
assert(report.productionReady === false, "productionReady must stay false.");
assert(report.mutationEnabled === false && report.restartEnabled === false && report.deployEnabled === false, "mutation/restart/deploy must stay false.");

const combined = [helperSource, await text(paths.helperScript), await text(paths.helperPs1), await text(paths.app)].join("\n");
assert(!/credentials\s*:\s*["']include["']/i.test(combined), "credentials include must not be used.");
assert(!/Authorization\s*:/i.test(combined), "Authorization header must not be used.");
assert(!/process\.env|dotenv|\.env/i.test(await text(paths.helperScript)), "helper script must not read .env.");
assert(!/(scan\s*qr|qr-code|qr code|enableQr|startQr|whatsappWebLogin)/i.test(combined), "QR login wiring must not be added.");

const app = await text(paths.app);
for (const marker of [
  "WhatsApp local task helper",
  "build-whatsapp-local-task-import.ps1",
  "whatsapp-task-helper-input.txt",
  "whatsapp-local-task-helper-report.json"
]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}

const quality = await text(paths.quality);
for (const marker of ["build-whatsapp-local-task-import.mjs", "test-whatsapp-local-task-helper.mjs", "whatsappLocalTaskHelperReport"]) {
  assert(quality.includes(marker), `quality gate missing ${marker}`);
}

const safety = await text(paths.safety);
for (const marker of ["whatsapp-local-task-helper", "whatsapp-task-helper-input.txt", "raw chat", "phone numbers"]) {
  assert(safety.toLowerCase().includes(marker.toLowerCase()), `safety scan missing ${marker}`);
}

const verifier = await text(paths.verifier);
for (const marker of ["build-whatsapp-local-task-import.mjs", "test-whatsapp-local-task-helper.mjs", "whatsapp-local-task-helper-report.json", "whatsapp-local-task-helper.js"]) {
  assert(verifier.includes(marker), `verifier missing ${marker}`);
}

console.log("OpenClaw WhatsApp local task helper tests passed.");
