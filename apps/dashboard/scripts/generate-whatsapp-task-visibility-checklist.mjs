import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const taskReportRel = "apps/dashboard/data/generated/local-task-inbox-report.json";
const importReportRel = "apps/dashboard/data/generated/whatsapp-local-task-import-report.json";
const helperReportRel = "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json";
const outputRel = "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json";

async function safeRead(relPath) {
  try {
    return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
  } catch {
    return null;
  }
}

const taskReport = await safeRead(taskReportRel);
const importReport = await safeRead(importReportRel);
const helperReport = await safeRead(helperReportRel);

const checklist = {
  checklistId: "whatsapp-task-visibility-local-only",
  generatedAt: new Date().toISOString(),
  scope: "whatsapp-task-visibility-local-only",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  safetyMode: "read-only",
  whatsappApiConnected: false,
  whatsappWebhookEnabled: false,
  webhookConfigured: false,
  qrLoginEnabled: false,
  browserCookieReadEnabled: false,
  localTaskInboxPath: "apps/dashboard/data/local/operator-task-inbox.json",
  localTaskInboxReportPath: taskReportRel,
  whatsappLocalImportReportPath: importReportRel,
  whatsappLocalTaskHelperReportPath: helperReportRel,
  whatsappTaskSyncStatus: taskReport?.whatsappTaskSyncStatus || importReport?.importStatus || "not-synced",
  whatsappTaskCount: taskReport?.whatsappTaskCount || importReport?.safeTaskCount || 0,
  whatsappLocalImportStatus: importReport?.importStatus || "needs-local-import",
  whatsappLocalTaskHelperStatus: helperReport?.helperStatus || "needs-helper-input",
  whatsappLocalTaskHelperSafeTaskCount: Number(helperReport?.safeTaskCount || 0),
  rawChatPrinted: false,
  secretRedactionApplied: true,
  operatorChecks: [
    "WhatsApp real API is not connected.",
    "Local task inbox and local helper are the safe entry points.",
    "No WhatsApp tasks in the Dashboard does not mean the Dashboard is broken.",
    "The helper turns cleaned text blocks into local-only JSON without storing raw chat."
  ],
  futureRequirements: [
    "Real WhatsApp sync requires a separate security-approved sprint.",
    "Webhook, token, cookie, session, QR login, and auto-reply are not enabled.",
    "Do not paste credentials or full private chat logs into Codex or the repo."
  ],
  notAllowed: [
    "whatsapp-api-connect",
    "whatsapp-token",
    "whatsapp-webhook",
    "whatsapp-qr-login",
    "browser-cookie-session-read",
    "production-gateway-connect",
    "mutation"
  ]
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");
console.log("OpenClaw WhatsApp task visibility checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
