import { sanitizeValue } from "./real-local-data-sanitizer.mjs";

const DEFAULT_TIME = "2026-06-10T00:00:00Z";
const LIFECYCLE = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];

function safeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapAgent(raw, index) {
  return {
    id: safeText(raw.id || raw.agentId, `real-local-agent-${index + 1}`),
    name: safeText(raw.name || raw.agentName, `Real Local Agent ${index + 1}`),
    role: safeText(raw.role, "Real local data pilot participant"),
    runtime: safeText(raw.runtime, "local static parser"),
    model: safeText(raw.model, "local label only"),
    workspace: safeText(raw.workspace, "local pilot workspace"),
    sandbox: "read-only local pilot",
    toolsProfile: "local parsing, sanitization, snapshot generation",
    status: safeText(raw.status, "online"),
    lastHeartbeat: safeText(raw.lastHeartbeat || raw.updatedAt, DEFAULT_TIME),
    riskLevel: safeText(raw.riskLevel, "medium"),
    responsibilities: asArray(raw.responsibilities).length ? raw.responsibilities : ["Review sanitized local pilot data"],
    allowedActions: asArray(raw.allowedActions).length ? raw.allowedActions : ["Read local files", "Generate sanitized snapshot"],
    deniedActions: asArray(raw.deniedActions).length ? raw.deniedActions : ["Read secrets", "Call production API", "Mutate production"]
  };
}

function mapTask(raw, index, ownerAgent) {
  return {
    id: safeText(raw.id || raw.taskId, `REAL-LOCAL-TASK-${String(index + 1).padStart(3, "0")}`),
    workflow: safeText(raw.workflow, "FLOW-real-local-data-pilot"),
    status: LIFECYCLE.includes(raw.status) ? raw.status : "queued",
    priority: safeText(raw.priority, "P3"),
    attempt: typeof raw.attempt === "number" ? raw.attempt : 1,
    ownerAgent: safeText(raw.ownerAgent || raw.agentId, ownerAgent),
    reviewer: safeText(raw.reviewer, "agent-reviewer"),
    createdAt: safeText(raw.createdAt || raw.startedAt, DEFAULT_TIME),
    updatedAt: safeText(raw.updatedAt || raw.endedAt, DEFAULT_TIME),
    summary: safeText(raw.summary || raw.title || raw.url, "Sanitized real local pilot task.")
  };
}

function mapLog(raw, index, actor) {
  return {
    id: safeText(raw.id, `real-local-audit-${index + 1}`),
    timestamp: safeText(raw.timestamp || raw.createdAt, DEFAULT_TIME),
    severity: ["info", "warning", "error", "critical"].includes(raw.severity) ? raw.severity : "info",
    actor: safeText(raw.actor || raw.agentId, actor),
    event: safeText(raw.event || raw.summary || raw.message, "Sanitized real local pilot event."),
    redacted: true,
    taskId: raw.taskId,
    agentId: raw.agentId
  };
}

function mapBackup(raw, index, taskId) {
  return {
    id: safeText(raw.id, `real-local-evidence-${index + 1}`),
    taskId: safeText(raw.taskId, taskId),
    verifyStatus: ["verified", "pending", "failed"].includes(raw.verifyStatus) ? raw.verifyStatus : "pending",
    checksum: safeText(raw.checksum, `real-local-sha256-placeholder-${index + 1}`),
    storageUri: safeText(raw.uri || raw.storageUri, `local://real-local-pilot/${index + 1}`),
    createdAt: safeText(raw.createdAt, DEFAULT_TIME),
    restoreTestedAt: null,
    evidenceChain: [
      `source: ${safeText(raw.kind, "real-local-pilot")}`,
      "absolute paths redacted",
      "secrets redacted",
      "production endpoints blocked"
    ]
  };
}

export function mapRealLocalRecordsToDashboardExport(inputs) {
  const sanitized = sanitizeValue(inputs);
  const rawAgents = [
    ...asArray(sanitized.dashboardExport?.agents),
    ...asArray(sanitized.crawlerJson?.agents),
    ...asArray(sanitized.agentLogs?.agents),
    ...asArray(sanitized.agentLogs?.agentRuns)
  ];
  const agents = (rawAgents.length ? rawAgents : [{ id: "real-local-pilot-agent", name: "Real Local Pilot Agent" }]).slice(0, 12).map(mapAgent);
  const owner = agents[0].id;

  const rawTasks = [
    ...asArray(sanitized.dashboardExport?.tasks),
    ...asArray(sanitized.crawlerJson?.tasks),
    ...asArray(sanitized.crawlerJson?.crawlerOutput?.pages),
    ...asArray(sanitized.crawlerCsv),
    ...asArray(sanitized.agentLogs?.tasks),
    ...asArray(sanitized.agentLogs?.agentRuns),
    ...asArray(sanitized.taskMemory?.tasks),
    ...asArray(sanitized.taskMemory?.taskMemory),
    ...asArray(sanitized.taskMemoryMarkdown)
  ];
  const tasks = (rawTasks.length ? rawTasks : [{ id: "REAL-LOCAL-TASK-001", summary: "Real local pilot placeholder task." }]).slice(0, 50).map((task, index) => mapTask(task, index, owner));

  const rawLogs = [
    ...asArray(sanitized.dashboardExport?.auditEvents),
    ...asArray(sanitized.dashboardExport?.logs),
    ...asArray(sanitized.crawlerJson?.logs),
    ...asArray(sanitized.agentLogs?.logs),
    ...asArray(sanitized.logSummaries)
  ];
  const auditEvents = (rawLogs.length ? rawLogs : [{ event: "Real local data pilot snapshot generated." }]).slice(0, 80).map((log, index) => mapLog(log, index, owner));

  const rawArtifacts = [
    ...asArray(sanitized.dashboardExport?.backups),
    ...asArray(sanitized.dashboardExport?.artifacts),
    ...asArray(sanitized.artifactIndex?.artifacts),
    ...asArray(sanitized.artifactIndex?.artifactIndex),
    ...asArray(sanitized.artifacts)
  ];
  const backups = (rawArtifacts.length ? rawArtifacts : [{ kind: "real-local-data-pilot", taskId: tasks[0].id }]).slice(0, 30).map((item, index) => mapBackup(item, index, tasks[0].id));
  const verified = backups.filter((backup) => backup.verifyStatus === "verified").length;
  const running = tasks.filter((task) => task.status === "running").length;
  const failedLost = tasks.filter((task) => ["failed", "lost"].includes(task.status)).length;

  return {
    schemaVersion: "openclaw.dashboard.export.v1",
    generatedAt: new Date().toISOString(),
    source: {
      mode: "local-real-data-pilot",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled"
    },
    metadata: {
      schemaVersion: "local-ingest-v1",
      generatedAt: new Date().toISOString(),
      source: "local-ingest",
      ingestKind: "local-real-data-pilot",
      safetyMode: "read-only",
      mutationEnabled: false
    },
    metrics: [
      { id: "metric-real-local-status", label: "Gateway status", value: "Real local pilot", trend: "local snapshot", status: "healthy", description: "Sanitized local files mapped without production wiring." },
      { id: "metric-real-local-agents", label: "Active agents", value: String(agents.length), trend: "sanitized local records", status: "watch", description: "Agents from real local pilot inputs." },
      { id: "metric-real-local-running", label: "Running tasks", value: String(running), trend: "local task states", status: "healthy", description: "Running task count from sanitized local pilot." },
      { id: "metric-real-local-failed", label: "Failed / lost", value: String(failedLost), trend: "local task states", status: failedLost ? "blocked" : "healthy", description: "Failed or lost local pilot tasks." },
      { id: "metric-real-local-backups", label: "Backup verification", value: `${verified} verified`, trend: "local evidence only", status: "watch", description: "Artifact evidence remains local and read-only." }
    ],
    agents,
    tasks,
    reviews: [{ id: "real-local-review-001", taskId: tasks[0].id, reviewer: "agent-reviewer", verdict: "pending", policyChecks: ["read-only", "absolute paths redacted", "secrets redacted", "production endpoints blocked"], notes: "Real local pilot review is not submitted.", createdAt: DEFAULT_TIME }],
    logs: auditEvents,
    auditEvents,
    backups,
    settings: {
      gatewayAuthMode: "read-only local pilot",
      retentionPolicy: "local generated snapshot only",
      modelRouting: "local labels only",
      mcpServers: ["filesystem local pilot", "production gateway disabled"],
      secretRefsHealth: "not connected; no secret refs loaded",
      productionMutation: "disabled"
    },
    rbac: agents.map((agent) => ({ agentId: agent.id, name: agent.name, riskLevel: agent.riskLevel, allowedActions: agent.allowedActions, deniedActions: agent.deniedActions })),
    sourceStatus: {
      currentSource: "local-ingest",
      requestedSource: "local-ingest",
      health: "ok",
      validation: "passed",
      fallback: "none",
      fallbackReason: "",
      lastLoadedAt: new Date().toISOString(),
      dataUrl: "./data/generated/real-local-dashboard-export.generated.json",
      safetyMode: "read-only",
      productionWiring: "disabled",
      mutationEnabled: false,
      pilotContext: "local-real-data-pilot",
      redaction: "absolute paths redacted; secrets redacted; production endpoints blocked"
    },
    artifacts: rawArtifacts
  };
}
