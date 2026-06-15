(function () {
  const TASK_STATUSES = ["todo", "in-progress", "blocked", "done", "unknown", "review_pending", "failed", "cancelled"];
  const TASK_SOURCES = ["manual", "whatsapp", "codex", "openclaw", "other"];

  function normalizeTask(task, index) {
    const status = TASK_STATUSES.includes(task?.status) ? task.status : "unknown";
    const source = TASK_SOURCES.includes(task?.source) ? task.source : "other";
    return {
      taskId: String(task?.taskId || `TASK-LOCAL-${String(index + 1).padStart(3, "0")}`),
      title: String(task?.title || "未命名任務"),
      source,
      status,
      priority: String(task?.priority || "normal"),
      createdAt: task?.createdAt || null,
      dueAt: task?.dueAt || null,
      summary: String(task?.summary || task?.title || "本地任務摘要"),
      sourceLabel: String(task?.sourceLabel || (source === "whatsapp" ? "WhatsApp 本地匯入" : "本地任務收件箱")),
      updatedAt: task?.updatedAt || task?.createdAt || null,
      nextStep: String(task?.nextStep || "請人工確認內容後處理"),
      notes: Array.isArray(task?.notes) ? task.notes.map(String) : []
    };
  }

  function summarizeTaskInbox(input) {
    const tasks = Array.isArray(input?.tasks) ? input.tasks.map(normalizeTask) : [];
    const byStatus = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));
    const bySource = Object.fromEntries(TASK_SOURCES.map((source) => [source, 0]));
    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      bySource[task.source] = (bySource[task.source] || 0) + 1;
    }
    const whatsappTaskCount = bySource.whatsapp || 0;
    return {
      taskInboxStatus: tasks.length ? "loaded" : "missing",
      taskCount: tasks.length,
      tasksByStatus: byStatus,
      tasksBySource: bySource,
      whatsappTaskCount,
      whatsappTaskSyncStatus: whatsappTaskCount > 0 ? "local-whatsapp-tasks-present" : "not-synced",
      latestTaskUpdateAt: tasks.map((task) => task.createdAt).filter(Boolean).sort().at(-1) || null,
      tasks
    };
  }

  function mergeTaskInboxSources(...sources) {
    return sources.flatMap((source) => Array.isArray(source) ? source : []);
  }

  window.OpenClawLocalTaskInbox = { TASK_STATUSES, TASK_SOURCES, normalizeTask, summarizeTaskInbox, mergeTaskInboxSources };
})();
