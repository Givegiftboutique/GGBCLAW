import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const localImportRel = "apps/dashboard/data/local/whatsapp-task-import.json";
const templateRel = "apps/dashboard/data/local/whatsapp-task-import.template.json";
const exampleRel = "apps/dashboard/data/local/whatsapp-task-import.example.json";
const outputRel = "apps/dashboard/data/generated/whatsapp-local-task-import-report.json";
const schemaVersion = "whatsapp-local-task-import.v1";
const safeStatuses = ["todo", "in-progress", "review_pending", "done", "failed", "cancelled"];
const safePriorities = ["low", "normal", "high", "urgent"];
const sensitiveTextRe = /\b(api\s*key|password|token|cookie|authorization|credential|secret)\b/i;
const phoneRe = /(?:\+?\d[\s().-]?){8,}/;
const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const unsafeUrlRe = /https?:\/\/\S*[?&](?:token|key|password|auth|credential)=/i;

async function exists(relPath) {
  try {
    await access(join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relPath) {
  return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
}

function redactText(input) {
  return String(input ?? "")
    .replace(sensitiveTextRe, "[redacted-sensitive-word]")
    .replace(phoneRe, "[redacted-phone]")
    .replace(emailRe, "[redacted-email]")
    .replace(unsafeUrlRe, "[redacted-url]");
}

function hasUnsafeText(input) {
  const text = String(input ?? "");
  return sensitiveTextRe.test(text) || phoneRe.test(text) || emailRe.test(text) || unsafeUrlRe.test(text);
}

function validateImport(input) {
  const warnings = [];
  const unsafeReasons = [];
  if (!input || typeof input !== "object") {
    return { importStatus: "unsafe-rejected", warnings: ["input-not-object"], unsafeReasons: ["input-not-object"], tasks: [] };
  }
  if (input.schemaVersion !== schemaVersion) warnings.push("schema-version-mismatch");
  if (!Array.isArray(input.tasks)) unsafeReasons.push("tasks-not-array");
  if (input.rawChatIncluded === true || input.safety?.containsRawChat === true) warnings.push("raw-chat-review-required");
  if (input.safety?.containsCredentials === true) unsafeReasons.push("credential-flag-present");
  if (input.safety?.containsPhoneNumbers === true) warnings.push("phone-number-review-required");
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  tasks.forEach((task, index) => {
    if (!task?.title) unsafeReasons.push(`task-${index + 1}-missing-title`);
    if (task?.status && !safeStatuses.includes(task.status)) warnings.push(`task-${index + 1}-status-normalized`);
    if (task?.priority && !safePriorities.includes(task.priority)) warnings.push(`task-${index + 1}-priority-normalized`);
    for (const field of ["externalId", "title", "summary", "sourceLabel", "nextStep"]) {
      if (hasUnsafeText(task?.[field])) warnings.push(`task-${index + 1}-${field}-review-required`);
    }
  });
  const importStatus = unsafeReasons.length
    ? "unsafe-rejected"
    : warnings.some((warning) => warning.includes("review-required") || warning.includes("raw-chat"))
      ? "review-required"
      : "ready";
  return { importStatus, warnings, unsafeReasons, tasks };
}

function mapTasks(input, validation) {
  if (validation.importStatus !== "ready") return [];
  return validation.tasks.map((task, index) => ({
    taskId: `WA-LOCAL-${String(index + 1).padStart(3, "0")}`,
    externalId: redactText(task.externalId || `wa-local-${String(index + 1).padStart(3, "0")}`),
    title: redactText(task.title || "WhatsApp 本地匯入任務"),
    summary: redactText(task.summary || task.title || "已整理的 WhatsApp 任務摘要"),
    source: "whatsapp",
    sourceLabel: "WhatsApp 本地匯入",
    status: safeStatuses.includes(task.status) ? task.status : "todo",
    priority: safePriorities.includes(task.priority) ? task.priority : "normal",
    createdAt: task.createdAt || null,
    updatedAt: task.updatedAt || task.createdAt || null,
    dueAt: null,
    nextStep: redactText(task.nextStep || "請人工確認內容後處理"),
    notes: ["WhatsApp local-only sanitized task"]
  }));
}

const generatedAt = new Date().toISOString();
const localImportExists = await exists(localImportRel);
let input = null;
let importStatus = "needs-local-import";
let warnings = ["whatsapp-local-import-missing"];
let unsafeReasons = [];
let tasks = [];
let taskCount = 0;
let containsCredentials = false;
let containsPhoneNumbers = false;

if (localImportExists) {
  try {
    input = await readJson(localImportRel);
    const validation = validateImport(input);
    importStatus = validation.importStatus;
    warnings = validation.warnings;
    unsafeReasons = validation.unsafeReasons;
    tasks = mapTasks(input, validation);
    taskCount = Array.isArray(input.tasks) ? input.tasks.length : 0;
    containsCredentials = input.safety?.containsCredentials === true || validation.warnings.some((warning) => warning.includes("credential"));
    containsPhoneNumbers = input.safety?.containsPhoneNumbers === true || validation.warnings.some((warning) => warning.includes("phone"));
  } catch {
    importStatus = "unsafe-rejected";
    warnings = ["whatsapp-local-import-invalid-json"];
    unsafeReasons = ["invalid-json"];
  }
}

const report = {
  reportId: "whatsapp-local-task-import-safe",
  generatedAt,
  scope: "whatsapp-local-task-import",
  language: "zh-Hant",
  importStatus,
  taskCount,
  safeTaskCount: tasks.length,
  reviewRequiredCount: importStatus === "review-required" ? taskCount : 0,
  unsafeRejectedCount: importStatus === "unsafe-rejected" ? Math.max(taskCount, 1) : 0,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  containsCredentials,
  containsPhoneNumbers,
  localOnly: true,
  whatsappApiConnected: false,
  webhookEnabled: false,
  authEnabled: false,
  productionReady: false,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  externalFetchEnabled: false,
  credentialsIncluded: false,
  authorizationHeaderUsed: false,
  localImportPath: localImportRel,
  templatePath: templateRel,
  examplePath: exampleRel,
  tasks,
  warnings,
  unsafeReasons,
  safeNextSteps: localImportExists
    ? ["確認匯入內容已由人工整理，避免電話、credential 或完整私人對話。"]
    : ["建立 apps/dashboard/data/local/whatsapp-task-import.json，並只填寫已整理的任務摘要。"]
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw WhatsApp local task import report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
