import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const taskReportRel = "apps/dashboard/data/generated/local-task-inbox-report.json";
const outputRel = "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json";

let taskReport = null;
try {
  taskReport = JSON.parse(await readFile(join(repoRoot, taskReportRel), "utf8"));
} catch {
  taskReport = null;
}

const generatedAt = new Date().toISOString();
const checklist = {
  checklistId: "local-task-visibility-checklist",
  generatedAt,
  scope: "whatsapp-task-visibility-local-only",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  whatsappApiConnected: false,
  whatsappWebhookEnabled: false,
  webhookConfigured: false,
  localTaskInboxPath: "apps/dashboard/data/local/operator-task-inbox.json",
  localTaskInboxReportPath: taskReportRel,
  whatsappTaskSyncStatus: taskReport?.whatsappTaskSyncStatus || "not-synced",
  whatsappTaskCount: taskReport?.whatsappTaskCount || 0,
  operatorChecks: [
    "WhatsApp 真 API 未接入。",
    "local task inbox 是目前安全入口。",
    "未見 WhatsApp 任務不代表 Dashboard 壞。",
    "現階段請先由中轉工具把 WhatsApp 任務寫入本地 task inbox。"
  ],
  futureRequirements: [
    "未來如接 WhatsApp，需獨立 sprint。",
    "Webhook/security approval 必須先完成。",
    "不可在 Dashboard 儲存 WhatsApp token 或 phone credential。"
  ],
  notAllowed: [
    "whatsapp-api-connect",
    "whatsapp-token",
    "webhook-send",
    "production-gateway-connect",
    "mutation"
  ]
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");
console.log("OpenClaw WhatsApp task visibility checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
