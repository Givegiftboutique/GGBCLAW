(function () {
  const SCHEMA_VERSION = "whatsapp-local-task-import.v1";
  const SAFE_STATUSES = ["todo", "in-progress", "review_pending", "done", "failed", "cancelled"];
  const SAFE_PRIORITIES = ["low", "normal", "high", "urgent"];
  const SENSITIVE_TEXT_RE = /\b(api\s*key|password|token|cookie|authorization|credential|secret)\b/i;
  const PHONE_RE = /(?:\+?\d[\s().-]?){8,}/;
  const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const UNSAFE_URL_RE = /https?:\/\/\S*[?&](?:token|key|password|auth|credential)=/i;

  function redactWhatsAppTaskText(input) {
    return String(input ?? "")
      .replace(SENSITIVE_TEXT_RE, "[redacted-sensitive-word]")
      .replace(PHONE_RE, "[redacted-phone]")
      .replace(EMAIL_RE, "[redacted-email]")
      .replace(UNSAFE_URL_RE, "[redacted-url]");
  }

  function textHasUnsafeValue(input) {
    const text = String(input ?? "");
    return SENSITIVE_TEXT_RE.test(text) || PHONE_RE.test(text) || EMAIL_RE.test(text) || UNSAFE_URL_RE.test(text);
  }

  function validateWhatsAppLocalTaskImport(input) {
    const warnings = [];
    const unsafeReasons = [];
    if (!input || typeof input !== "object") {
      return { importStatus: "unsafe-rejected", warnings: ["input-not-object"], unsafeReasons: ["input-not-object"], tasks: [] };
    }
    if (input.schemaVersion !== SCHEMA_VERSION) warnings.push("schema-version-mismatch");
    if (!Array.isArray(input.tasks)) unsafeReasons.push("tasks-not-array");
    if (input.rawChatIncluded === true || input.safety?.containsRawChat === true) warnings.push("raw-chat-review-required");
    if (input.safety?.containsCredentials === true) unsafeReasons.push("credential-flag-present");
    if (input.safety?.containsPhoneNumbers === true) warnings.push("phone-number-review-required");
    const tasks = Array.isArray(input.tasks) ? input.tasks : [];
    tasks.forEach((task, index) => {
      if (!task?.title) unsafeReasons.push(`task-${index + 1}-missing-title`);
      if (task?.status && !SAFE_STATUSES.includes(task.status)) warnings.push(`task-${index + 1}-status-normalized`);
      if (task?.priority && !SAFE_PRIORITIES.includes(task.priority)) warnings.push(`task-${index + 1}-priority-normalized`);
      for (const field of ["externalId", "title", "summary", "sourceLabel", "nextStep"]) {
        if (textHasUnsafeValue(task?.[field])) warnings.push(`task-${index + 1}-${field}-review-required`);
      }
    });
    const importStatus = unsafeReasons.length
      ? "unsafe-rejected"
      : warnings.some((warning) => warning.includes("review-required") || warning.includes("raw-chat"))
        ? "review-required"
        : "ready";
    return { importStatus, warnings, unsafeReasons, tasks };
  }

  function normalizeWhatsAppLocalTasks(input) {
    const tasks = Array.isArray(input?.tasks) ? input.tasks : [];
    return tasks.map((task, index) => ({
      externalId: redactWhatsAppTaskText(task.externalId || `wa-local-${String(index + 1).padStart(3, "0")}`),
      title: redactWhatsAppTaskText(task.title || "WhatsApp 本地匯入任務"),
      summary: redactWhatsAppTaskText(task.summary || task.title || "已整理的 WhatsApp 任務摘要"),
      status: SAFE_STATUSES.includes(task.status) ? task.status : "todo",
      priority: SAFE_PRIORITIES.includes(task.priority) ? task.priority : "normal",
      sourceLabel: "WhatsApp",
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || task.createdAt || null,
      nextStep: redactWhatsAppTaskText(task.nextStep || "請人工確認內容後處理")
    }));
  }

  function mapWhatsAppImportToTaskInbox(input) {
    const validation = validateWhatsAppLocalTaskImport(input);
    if (validation.importStatus === "unsafe-rejected" || validation.importStatus === "review-required") {
      return { ...validation, tasks: [] };
    }
    const tasks = normalizeWhatsAppLocalTasks(input).map((task, index) => ({
      taskId: `WA-LOCAL-${String(index + 1).padStart(3, "0")}`,
      externalId: task.externalId,
      title: task.title,
      summary: task.summary,
      source: "whatsapp",
      sourceLabel: "WhatsApp 本地匯入",
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueAt: null,
      nextStep: task.nextStep,
      notes: ["WhatsApp local-only sanitized task"]
    }));
    return { ...validation, tasks };
  }

  function buildWhatsAppImportSummary(input) {
    const mapped = mapWhatsAppImportToTaskInbox(input);
    const validation = validateWhatsAppLocalTaskImport(input);
    return {
      importStatus: validation.importStatus,
      taskCount: Array.isArray(input?.tasks) ? input.tasks.length : 0,
      safeTaskCount: mapped.tasks.length,
      reviewRequiredCount: validation.importStatus === "review-required" ? validation.tasks.length : 0,
      unsafeRejectedCount: validation.importStatus === "unsafe-rejected" ? validation.tasks.length || 1 : 0,
      warnings: validation.warnings,
      unsafeReasons: validation.unsafeReasons,
      tasks: mapped.tasks
    };
  }

  window.OpenClawWhatsAppLocalTaskImport = {
    SCHEMA_VERSION,
    SAFE_STATUSES,
    SAFE_PRIORITIES,
    validateWhatsAppLocalTaskImport,
    normalizeWhatsAppLocalTasks,
    mapWhatsAppImportToTaskInbox,
    buildWhatsAppImportSummary,
    redactWhatsAppTaskText
  };
})();
