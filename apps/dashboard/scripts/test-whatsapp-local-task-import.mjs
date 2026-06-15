import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");

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
  return result;
}

function git(args) {
  return spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
}

const paths = {
  module: "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.js",
  moduleTs: "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.ts",
  template: "apps/dashboard/data/local/whatsapp-task-import.template.json",
  example: "apps/dashboard/data/local/whatsapp-task-import.example.json",
  generator: "apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs",
  report: "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
  localTaskInboxGenerator: "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
  localTaskInboxReport: "apps/dashboard/data/generated/local-task-inbox-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs",
  localIgnore: "apps/dashboard/data/local/.gitignore"
};

for (const file of Object.values(paths)) {
  if (!file.endsWith(".json")) assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const ignoreText = await text(paths.localIgnore);
for (const marker of ["whatsapp-task-import.json", "whatsapp-task-import.*.local.json", "whatsapp-task-import.txt"]) {
  assert(ignoreText.includes(marker), `${marker} must be ignored.`);
}
for (const localOnly of [
  "apps/dashboard/data/local/whatsapp-task-import.json",
  "apps/dashboard/data/local/whatsapp-task-import.txt"
]) {
  assert(!git(["ls-files", localOnly]), `${localOnly} must not be tracked.`);
}

run([paths.generator]);
const missingReport = await json(paths.report);
assert(missingReport.scope === "whatsapp-local-task-import", "WhatsApp import report scope invalid.");
assert(missingReport.importStatus === "needs-local-import" || ["ready", "review-required", "unsafe-rejected"].includes(missingReport.importStatus), "importStatus invalid.");
assert(missingReport.rawChatPrinted === false, "raw chat must not be printed.");
assert(missingReport.secretRedactionApplied === true, "secret redaction must be applied.");
assert(missingReport.whatsappApiConnected === false, "WhatsApp API must not be connected.");
assert(missingReport.webhookEnabled === false, "Webhook must not be enabled.");
assert(missingReport.authEnabled === false, "Auth must not be enabled.");
assert(missingReport.productionReady === false, "Production must not be ready.");

const tmp = await mkdtemp(join(tmpdir(), "oc-wa-import-"));
try {
  const tmpInput = join(tmp, "whatsapp-task-import.json");
  const safeExample = await json(paths.example);
  await writeFile(tmpInput, JSON.stringify(safeExample), "utf8");
  const moduleText = await text(paths.module);
  assert(moduleText.includes("validateWhatsAppLocalTaskImport"), "module must expose validator.");
  assert(moduleText.includes("mapWhatsAppImportToTaskInbox"), "module must map to task inbox.");
  assert(moduleText.includes("redactWhatsAppTaskText"), "module must expose redaction helper.");
} finally {
  await rm(tmp, { recursive: true, force: true });
}

run([paths.localTaskInboxGenerator]);
const taskInboxReport = await json(paths.localTaskInboxReport);
assert(taskInboxReport.whatsappLocalImportReportPath === paths.report, "task inbox must reference WhatsApp import report.");
assert(taskInboxReport.whatsappApiConnected === false && taskInboxReport.webhookEnabled === false, "task inbox must keep WhatsApp API/webhook disabled.");
assert(taskInboxReport.rawChatPrinted === false && taskInboxReport.rawSecretsPrinted === false, "task inbox must not print raw chat or secrets.");

const app = await text(paths.app);
for (const marker of ["WhatsApp 任務匯入", "尚未匯入 WhatsApp 任務", "whatsapp-local-task-import-report.json", "WhatsApp 本地匯入"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}

const quality = await text(paths.quality);
for (const marker of ["generate-whatsapp-local-task-import-report.mjs", "test-whatsapp-local-task-import.mjs", "whatsappLocalTaskImportReport"]) {
  assert(quality.includes(marker), `quality gate missing ${marker}`);
}

const safety = await text(paths.safety);
for (const marker of ["whatsapp-local-task-import", "whatsapp-task-import.json", "phone", "QR"]) {
  assert(safety.includes(marker), `safety scan missing ${marker}`);
}

const verifier = await text(paths.verifier);
for (const marker of ["whatsapp-local-task-import-report.json", "whatsapp-local-task-import.js", "test-whatsapp-local-task-import.mjs"]) {
  assert(verifier.includes(marker), `verifier missing ${marker}`);
}

const combined = [
  await text(paths.module),
  await text(paths.generator),
  await text(paths.localTaskInboxGenerator),
  await text(paths.app)
].join("\n");
assert(!/credentials\s*:\s*["']include["']/i.test(combined), "credentials include must not be used.");
assert(!/Authorization\s*:/i.test(combined), "Authorization header must not be used.");
assert(!/connect\s*\(\s*["']?whatsapp|connectWhatsApp|whatsappApiConnected\s*:\s*true/i.test(combined), "WhatsApp API connect must not be added.");
assert(!/webhookEnabled\s*:\s*true|productionReady\s*:\s*true|mutationEnabled\s*:\s*true|restartEnabled\s*:\s*true|deployEnabled\s*:\s*true/i.test(combined), "unsafe flags must remain false.");

console.log("OpenClaw WhatsApp local task import tests passed.");
