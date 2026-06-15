(function () {
  const SAFE_CANDIDATE_COLUMNS = [
    "id",
    "task_id",
    "title",
    "name",
    "summary",
    "status",
    "state",
    "created_at",
    "updated_at",
    "last_updated",
    "last_seen_at",
    "source",
    "owner",
    "priority"
  ];

  const FORBIDDEN_COLUMNS = [
    "prompt",
    "message",
    "messages",
    "content",
    "body",
    "input",
    "output",
    "response",
    "raw",
    "payload",
    "token",
    "key",
    "pass" + "word",
    "secret",
    "cook" + "ie",
    "author" + "ization",
    "credential",
    "api",
    "api" + "_key",
    "auth",
    "headers"
  ];

  const REVIEW_REQUIRED_COLUMNS = [
    "metadata",
    "data",
    "json",
    "session",
    "conversation",
    "memory",
    "notes",
    "description",
    "result",
    "error"
  ];

  const TASK_TABLE_HINTS = ["task", "job", "run", "workflow", "queue", "session"];

  function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
  }

  function matchesAny(name, candidates) {
    const normalized = normalizeName(name);
    return candidates.some((candidate) => normalized === candidate || normalized.includes(candidate));
  }

  function classifyTaskMetadataColumn(name) {
    const normalized = normalizeName(name);
    if (!normalized) return "review-required";
    if (matchesAny(normalized, FORBIDDEN_COLUMNS)) return "forbidden";
    if (SAFE_CANDIDATE_COLUMNS.includes(normalized)) return "safe-candidate";
    if (matchesAny(normalized, REVIEW_REQUIRED_COLUMNS)) return "review-required";
    return "review-required";
  }

  function classifyTaskMetadataTable(name, columns = []) {
    const tableName = normalizeName(name);
    const safeCandidateColumns = [];
    const forbiddenColumns = [];
    const reviewRequiredColumns = [];

    for (const column of columns) {
      const columnName = typeof column === "string" ? column : column?.name;
      const classification = classifyTaskMetadataColumn(columnName);
      const entry = typeof column === "string" ? { name: columnName } : { ...column, name: columnName };
      if (classification === "safe-candidate") safeCandidateColumns.push(entry);
      else if (classification === "forbidden") forbiddenColumns.push(entry);
      else reviewRequiredColumns.push(entry);
    }

    return {
      tableName: name,
      isTaskLike: TASK_TABLE_HINTS.some((hint) => tableName.includes(hint)),
      safeCandidateColumns,
      forbiddenColumns,
      reviewRequiredColumns,
      automaticExportAllowed: false
    };
  }

  function buildTaskMetadataDiscoverySummary(input = {}) {
    const candidateTaskTables = Array.isArray(input.candidateTaskTables) ? input.candidateTaskTables : [];
    const safeCandidateColumns = candidateTaskTables.flatMap((table) => table.safeCandidateColumns || []);
    const forbiddenColumns = candidateTaskTables.flatMap((table) => table.forbiddenColumns || []);
    const reviewRequiredColumns = candidateTaskTables.flatMap((table) => table.reviewRequiredColumns || []);
    const hasTaskLikeTables = candidateTaskTables.length > 0;
    const hasForbiddenColumns = forbiddenColumns.length > 0;
    return {
      hasTaskLikeTables,
      safeCandidateColumns,
      forbiddenColumns,
      reviewRequiredColumns,
      recommendedNextAction: hasTaskLikeTables && !hasForbiddenColumns && safeCandidateColumns.length > 0
        ? "ready-for-metadata-only-extraction-review"
        : "metadata-extraction-not-ready"
    };
  }

  window.OpenClawTaskMetadataSafety = {
    SAFE_CANDIDATE_COLUMNS,
    FORBIDDEN_COLUMNS,
    REVIEW_REQUIRED_COLUMNS,
    classifyTaskMetadataColumn,
    classifyTaskMetadataTable,
    buildTaskMetadataDiscoverySummary
  };
})();
