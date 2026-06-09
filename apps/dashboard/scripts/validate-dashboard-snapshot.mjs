import { readFile } from "node:fs/promises";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node apps/dashboard/scripts/validate-dashboard-snapshot.mjs <snapshot.json>");
  process.exit(1);
}

const TASK_STATUSES = new Set(["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"]);
const AGENT_STATUSES = new Set(["online", "busy", "degraded", "offline"]);
const RISK_LEVELS = new Set(["low", "medium", "high"]);
const REVIEW_VERDICTS = new Set(["pending", "approved", "rejected", "needs_changes"]);
const SECRET_VALUE_RE = /(password|token|cookie|api[_-]?key)\s*[:=]/i;
const PRODUCTION_ENDPOINT_RE = /^https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i;

function walk(value, path, visit) {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`, visit));
  }
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function validate(snapshot) {
  const issues = [];
  const requiredSections = ["metadata", "metrics", "agents", "tasks", "reviews", "auditEvents", "backups", "settings", "rbac", "sourceStatus", "artifacts"];
  for (const section of requiredSections) {
    assert(Object.hasOwn(snapshot, section), `Missing required section: ${section}`, issues);
  }

  if (snapshot.metadata) {
    assert(snapshot.metadata.schemaVersion === "dashboard-export-v1", "metadata.schemaVersion must be dashboard-export-v1", issues);
    assert(typeof snapshot.metadata.generatedAt === "string", "metadata.generatedAt must be a timestamp string", issues);
    assert(snapshot.metadata.safetyMode === "read-only", "metadata.safetyMode must be read-only", issues);
    assert(snapshot.metadata.mutationEnabled === false, "metadata.mutationEnabled must be false", issues);
  }

  assert(Array.isArray(snapshot.agents) && snapshot.agents.length >= 8, "agents must include at least 8 records", issues);
  assert(Array.isArray(snapshot.tasks) && snapshot.tasks.length >= 8, "tasks must include lifecycle examples", issues);
  assert(Array.isArray(snapshot.metrics) && snapshot.metrics.length > 0, "metrics must be non-empty", issues);

  snapshot.agents?.forEach((agent, index) => {
    for (const field of ["id", "name", "role", "runtime", "model", "workspace", "sandbox", "toolsProfile", "lastHeartbeat"]) {
      assert(typeof agent[field] === "string" && agent[field].length > 0, `agents[${index}].${field} is required`, issues);
    }
    assert(AGENT_STATUSES.has(agent.status), `agents[${index}].status is invalid`, issues);
    assert(RISK_LEVELS.has(agent.riskLevel), `agents[${index}].riskLevel is invalid`, issues);
    for (const field of ["responsibilities", "allowedActions", "deniedActions"]) {
      assert(Array.isArray(agent[field]) && agent[field].length > 0, `agents[${index}].${field} must be a non-empty array`, issues);
    }
  });

  const taskStatuses = new Set(snapshot.tasks?.map((task) => task.status));
  for (const status of TASK_STATUSES) {
    assert(taskStatuses.has(status), `Missing task lifecycle status: ${status}`, issues);
  }

  snapshot.tasks?.forEach((task, index) => {
    assert(TASK_STATUSES.has(task.status), `tasks[${index}].status is invalid`, issues);
    for (const field of ["id", "workflow", "priority", "ownerAgent", "reviewer", "createdAt", "updatedAt", "summary"]) {
      assert(typeof task[field] === "string" && task[field].length > 0, `tasks[${index}].${field} is required`, issues);
    }
  });

  snapshot.reviews?.forEach((review, index) => {
    assert(REVIEW_VERDICTS.has(review.verdict), `reviews[${index}].verdict is invalid`, issues);
  });

  walk(snapshot, "snapshot", (value, path) => {
    if (typeof value !== "string") return;
    if (SECRET_VALUE_RE.test(value)) issues.push(`Secret-like assignment at ${path}`);
    if (PRODUCTION_ENDPOINT_RE.test(value.trim())) issues.push(`Production endpoint at ${path}`);
  });

  return issues;
}

try {
  const snapshot = JSON.parse(await readFile(filePath, "utf8"));
  const issues = validate(snapshot);
  if (issues.length) {
    console.error(`Snapshot validation failed: ${filePath}`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log(`Snapshot validation passed: ${filePath}`);
} catch (error) {
  console.error(`Snapshot validation error: ${error.message}`);
  process.exit(1);
}
