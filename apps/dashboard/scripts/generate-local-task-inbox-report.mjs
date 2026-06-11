import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const localInputRel = "apps/dashboard/data/local/operator-task-inbox.json";
const templateRel = "apps/dashboard/data/local/operator-task-inbox.template.json";
const exampleRel = "apps/dashboard/data/local/operator-task-inbox.example.json";
const outputRel = "apps/dashboard/data/generated/local-task-inbox-report.json";

const statuses = ["todo", "in-progress", "blocked", "done", "unknown"];
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

const generatedAt = new Date().toISOString();
const inputExists = await exists(join(repoRoot, localInputRel));
let tasks = [];
let taskInboxStatus = "missing";
let warnings = ["未有任務同步到 Dashboard。"];

if (inputExists) {
  try {
    const input = await readJson(localInputRel);
    tasks = Array.isArray(input.tasks)
      ? input.tasks.map((task, index) => ({
          taskId: String(task.taskId || `TASK-LOCAL-${String(index + 1).padStart(3, "0")}`),
          title: String(task.title || "未命名任務"),
          source: sources.includes(task.source) ? task.source : "other",
          status: statuses.includes(task.status) ? task.status : "unknown",
          priority: String(task.priority || "normal"),
          createdAt: task.createdAt || null,
          dueAt: task.dueAt || null
        }))
      : [];
    taskInboxStatus = "loaded";
    warnings = [];
  } catch {
    taskInboxStatus = "invalid";
    warnings = ["本地任務 inbox JSON 無法讀取，請檢查格式。"];
  }
}

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
  productionWiring: "disabled",
  taskInboxStatus,
  taskCount: tasks.length,
  tasksByStatus,
  tasksBySource,
  whatsappTaskSyncStatus: whatsappTaskCount > 0 ? "local-whatsapp-tasks-present" : "not-synced",
  whatsappTaskCount,
  latestTaskUpdateAt: tasks.map((task) => task.createdAt).filter(Boolean).sort().at(-1) || null,
  localInputPath: localInputRel,
  templatePath: templateRel,
  examplePath: exampleRel,
  localOnly: true,
  externalFetchEnabled: false,
  whatsappApiConnected: false,
  redactionApplied: true,
  rawSecretsPrinted: false,
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
