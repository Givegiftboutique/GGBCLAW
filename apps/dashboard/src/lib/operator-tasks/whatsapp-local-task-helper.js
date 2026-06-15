(function () {
  const HELPER_STATUSES = ["todo", "in-progress", "review_pending", "done", "failed", "cancelled"];
  const HELPER_PRIORITIES = ["low", "normal", "high", "urgent"];
  const SENSITIVE_TEXT_RE = /\b(api\s*key|password|token|cookie|authorization|credential|secret)\b/i;
  const PHONE_RE = /(?:\+?\d[\s().-]?){8,}/;
  const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const UNSAFE_URL_RE = /https?:\/\/\S*[?&](?:token|key|password|auth|credential)=/i;
  const RAW_CHAT_RE = /\b(chat export|message history|forwarded many times|end-to-end encrypted|<media omitted>|media omitted)\b/i;

  function redactHelperTaskText(input) {
    return String(input ?? "")
      .replace(SENSITIVE_TEXT_RE, "[redacted-sensitive-word]")
      .replace(PHONE_RE, "[redacted-phone]")
      .replace(EMAIL_RE, "[redacted-email]")
      .replace(UNSAFE_URL_RE, "[redacted-url]")
      .replace(RAW_CHAT_RE, "[redacted-raw-chat-marker]")
      .trim();
  }

  function parseWhatsAppTaskHelperInput(text) {
    const source = String(text ?? "").replace(/\r\n/g, "\n");
    const warnings = [];
    const blocks = [];
    let current = null;

    for (const rawLine of source.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      if (/^TASK:\s*$/i.test(line)) {
        if (current) blocks.push(current);
        current = {};
        continue;
      }
      if (!current) {
        warnings.push("content-before-task-block-ignored");
        continue;
      }
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        warnings.push("invalid-line-ignored");
        continue;
      }
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key) {
        warnings.push("empty-key-ignored");
        continue;
      }
      current[key] = value;
    }

    if (current) blocks.push(current);

    const tasks = blocks.map((task, index) => ({
      helperTaskId: `wa-helper-${String(index + 1).padStart(3, "0")}`,
      title: task.title || "",
      summary: task.summary || "",
      priority: task.priority || "normal",
      status: task.status || "todo",
      nextStep: task.nextStep || "Please review manually before import.",
      sourceLabel: "WhatsApp"
    }));

    return {
      inputPresent: source.trim().length > 0,
      taskCount: tasks.length,
      warnings,
      tasks
    };
  }

  function validateWhatsAppTaskHelperInput(input) {
    const parsed = input && typeof input === "object" && Array.isArray(input.tasks)
      ? input
      : parseWhatsAppTaskHelperInput(String(input ?? ""));
    const warnings = [...(parsed.warnings || [])];
    const unsafeReasons = [];
    let containsPhoneNumbers = false;
    let containsCredentials = false;
    let containsRawChatMarkers = false;

    parsed.tasks.forEach((task, index) => {
      if (!task.title) unsafeReasons.push(`task-${index + 1}-missing-title`);
      if (task.status && !HELPER_STATUSES.includes(task.status)) warnings.push(`task-${index + 1}-status-normalized`);
      if (task.priority && !HELPER_PRIORITIES.includes(task.priority)) warnings.push(`task-${index + 1}-priority-normalized`);

      for (const field of ["title", "summary", "nextStep"]) {
        const value = String(task[field] ?? "");
        if (PHONE_RE.test(value)) {
          containsPhoneNumbers = true;
          warnings.push(`task-${index + 1}-${field}-phone-review-required`);
        }
        if (SENSITIVE_TEXT_RE.test(value) || UNSAFE_URL_RE.test(value)) {
          containsCredentials = true;
          warnings.push(`task-${index + 1}-${field}-credential-review-required`);
        }
        if (RAW_CHAT_RE.test(value)) {
          containsRawChatMarkers = true;
          warnings.push(`task-${index + 1}-${field}-raw-chat-review-required`);
        }
        if (EMAIL_RE.test(value)) warnings.push(`task-${index + 1}-${field}-email-review-required`);
      }
    });

    const helperStatus = unsafeReasons.length
      ? "unsafe-rejected"
      : warnings.some((warning) => warning.includes("review-required"))
        ? "review-required"
        : parsed.inputPresent && parsed.taskCount > 0
          ? "ready"
          : "needs-helper-input";

    return {
      ...parsed,
      helperStatus,
      warnings,
      unsafeReasons,
      containsPhoneNumbers,
      containsCredentials,
      containsRawChatMarkers
    };
  }

  function mapHelperTasksToWhatsAppImport(input) {
    const validation = validateWhatsAppTaskHelperInput(input);
    const importStatus = validation.helperStatus === "needs-helper-input"
      ? "needs-local-import"
      : validation.helperStatus === "ready"
        ? "ready"
        : validation.helperStatus;

    const safeTasks = importStatus === "ready"
      ? validation.tasks.map((task, index) => ({
        externalId: `wa-local-${String(index + 1).padStart(3, "0")}`,
        title: redactHelperTaskText(task.title || "WhatsApp task"),
        summary: redactHelperTaskText(task.summary || task.title || "Please review manually before import."),
        status: HELPER_STATUSES.includes(task.status) ? task.status : "todo",
        priority: HELPER_PRIORITIES.includes(task.priority) ? task.priority : "normal",
        sourceLabel: "WhatsApp",
        createdAt: null,
        updatedAt: null,
        nextStep: redactHelperTaskText(task.nextStep || "Please review manually before import.")
      }))
      : [];

    return {
      schemaVersion: "whatsapp-local-task-import.v1",
      generatedAt: new Date().toISOString(),
      source: "manual-whatsapp-local-import",
      rawChatIncluded: false,
      operatorReviewed: false,
      tasks: safeTasks,
      safety: {
        localOnly: true,
        containsRawChat: false,
        containsPhoneNumbers: validation.containsPhoneNumbers,
        containsCredentials: validation.containsCredentials,
        operatorReviewed: false,
        secretRedactionApplied: true
      },
      helperStatus: validation.helperStatus,
      importStatus,
      warnings: validation.warnings,
      unsafeReasons: validation.unsafeReasons,
      inputPresent: validation.inputPresent,
      taskCount: validation.taskCount,
      safeTaskCount: safeTasks.length,
      reviewRequiredCount: validation.helperStatus === "review-required" ? validation.taskCount : 0,
      unsafeRejectedCount: validation.helperStatus === "unsafe-rejected" ? Math.max(validation.taskCount, 1) : 0,
      containsPhoneNumbers: validation.containsPhoneNumbers,
      containsCredentials: validation.containsCredentials
    };
  }

  function buildWhatsAppTaskHelperSummary(input) {
    const mapped = mapHelperTasksToWhatsAppImport(input);
    return {
      helperStatus: mapped.helperStatus,
      importStatus: mapped.importStatus,
      inputPresent: mapped.inputPresent,
      taskCount: mapped.taskCount,
      safeTaskCount: mapped.safeTaskCount,
      reviewRequiredCount: mapped.reviewRequiredCount,
      unsafeRejectedCount: mapped.unsafeRejectedCount,
      warnings: mapped.warnings,
      unsafeReasons: mapped.unsafeReasons,
      containsPhoneNumbers: mapped.containsPhoneNumbers,
      containsCredentials: mapped.containsCredentials,
      rawInputPrinted: false,
      rawChatPrinted: false,
      secretRedactionApplied: true
    };
  }

  window.OpenClawWhatsAppLocalTaskHelper = {
    HELPER_STATUSES,
    HELPER_PRIORITIES,
    parseWhatsAppTaskHelperInput,
    validateWhatsAppTaskHelperInput,
    mapHelperTasksToWhatsAppImport,
    buildWhatsAppTaskHelperSummary,
    redactHelperTaskText
  };
})();
