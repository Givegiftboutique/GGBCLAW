import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const localInputRel = "apps/dashboard/data/local/operator-task-inbox.json";
const whatsappImportReportRel = "apps/dashboard/data/generated/whatsapp-local-task-import-report.json";
const templateRel = "apps/dashboard/data/local/operator-task-inbox.template.json";
const exampleRel = "apps/dashboard/data/local/operator-task-inbox.example.json";
const outputRel = "apps/dashboard/data/generated/local-task-inbox-report.json";
const statuses = ["todo", "in-progress", "blocked", "done", "unknown", "review_pending", "failed", "cancelled"];
const sources = ["manual", "whatsapp", "codex", "openclaw", "other"];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relPath) {
  return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
}

function countBy(items, keys, field) {
  const output = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const item of items) {
    const value = keys.includes(item[field]) ? item[field] : "unknown";
    output[value] = (output[value] || 0) + 1;
  }
  return output;
}

function normalizeTask(task, index, fallbackSource = "manual") {
  const source = sources.includes(task.source) ? task.source : fallbackSource;
  const status = statuses.includes(task.status) ? task.status : "unknown";
  return {
    taskId: String(task.taskId || `TASK-LOCAL-${String(index + 1).padStart(3, "0")}`),
    externalId: task.externalId ? String(task.externalId) : undefined,
    title: String(task.title || "本地任務"),
    summary: String(task.summary || task.title || "本地任務摘要"),
    source,
    sourceLabel: String(task.sourceLabel || (source === "whatsapp" ? "WhatsApp 本地匯入" : "本地任務收件箱")),
    status,
    priority: String(task.priority || "normal"),
    createdAt: task.createdAt || null,
    updatedAt: task.updatedAt || task.createdAt || null,
    dueAt: task.dueAt || null,
    nextStep: String(task.nextStep || "請人工確認內容後處理"),
    notes: Array.isArray(task.notes) ? task.notes.map(String) : []
  };
}

const generatedAt = new Date().toISOString();
const inputExists = await exists(join(repoRoot, localInputRel));
let operatorInboxTasks = [];
let whatsappImportTasks = [];
let taskInboxStatus = "missing";
let whatsappLocalImportStatus = "not-generated";
const warnings = [];

if (inputExists) {
  try {
    const input = await readJson(localInputRel);
    operatorInboxTasks = Array.isArray(input.tasks)
      ? input.tasks.map((task, index) => normalizeTask(task, index, sources.includes(task.source) ? task.source : "other"))
      : [];
    taskInboxStatus = "loaded";
  } catch {
    taskInboxStatus = "invalid";
    warnings.push("operator-task-inbox-invalid-json");
  }
} else {
  warnings.push("operator-task-inbox-missing");
}

if (await exists(join(repoRoot, whatsappImportReportRel))) {
  try {
    const whatsappImport = await readJson(whatsappImportReportRel);
    whatsappLocalImportStatus = whatsappImport.importStatus || "unknown";
    whatsappImportTasks = Array.isArray(whatsappImport.tasks)
      ? whatsappImport.tasks.map((task, index) => normalizeTask(task, index, "whatsapp"))
      : [];
    if (whatsappLocalImportStatus === "review-required") warnings.push("whatsapp-local-import-review-required");
    if (whatsappLocalImportStatus === "unsafe-rejected") warnings.push("whatsapp-local-import-unsafe-rejected");
  } catch {
    whatsappLocalImportStatus = "invalid";
    warnings.push("whatsapp-local-import-report-invalid");
  }
} else {
  warnings.push("whatsapp-local-import-report-missing");
}

const tasks = [...whatsappImportTasks, ...operatorInboxTasks];
if (tasks.length) taskInboxStatus = "loaded";
const tasksByStatus = countBy(tasks, statuses, "status");
const tasksBySource = countBy(tasks, sources, "source");
const whatsappTaskCount = tasksBySource.whatsapp || 0;

const report = {
  reportId: `local-task-inbox-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt,
  scope: "local-operator-task-inbox",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  productionWiring: "disabled",
  taskInboxStatus,
  taskCount: tasks.length,
  tasksByStatus,
  tasksBySource,
  whatsappTaskSyncStatus: whatsappTaskCount > 0 ? "local-whatsapp-tasks-present" : "not-synced",
  whatsappTaskCount,
  whatsappLocalImportStatus,
  whatsappLocalImportReportPath: whatsappImportReportRel,
  whatsappLocalImportSafeTaskCount: whatsappImportTasks.length,
  operatorTaskInboxTaskCount: operatorInboxTasks.length,
  latestTaskUpdateAt: tasks.map((task) => task.updatedAt || task.createdAt).filter(Boolean).sort().at(-1) || null,
  localInputPath: localInputRel,
  templatePath: templateRel,
  examplePath: exampleRel,
  localOnly: true,
  externalFetchEnabled: false,
  whatsappApiConnected: false,
  webhookEnabled: false,
  authEnabled: false,
  redactionApplied: true,
  rawSecretsPrinted: false,
  rawChatPrinted: false,
  tasks,
  warnings,
  operatorMessageZhHant: whatsappTaskCount > 0
    ? `收到 ${whatsappTaskCount} 個 WhatsApp 本地匯入任務。`
    : "未收到 WhatsApp 任務；Dashboard 暫時未連接 WhatsApp，同步需要另外設定。"
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw local task inbox report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
