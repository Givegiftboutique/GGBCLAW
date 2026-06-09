(function () {
const DEFAULT_TIME = "2026-06-09T17:00:00+08:00";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function mapAgent(agent, index) {
  const id = safeText(agent.id, `local-agent-${index + 1}`);
  return {
    id,
    name: safeText(agent.name, `Local Agent ${index + 1}`),
    role: safeText(agent.role, "Local ingest participant"),
    runtime: safeText(agent.runtime, "local ingest runtime"),
    model: safeText(agent.model, "local model label"),
    workspace: safeText(agent.workspace, "local workspace"),
    sandbox: safeText(agent.sandbox, "read-only local ingest"),
    toolsProfile: safeText(agent.toolsProfile, "local ingest, mapping, validation"),
    status: safeText(agent.status, "online"),
    lastHeartbeat: safeText(agent.lastHeartbeat, DEFAULT_TIME),
    riskLevel: safeText(agent.riskLevel, "medium"),
    responsibilities: asArray(agent.responsibilities).length ? clone(agent.responsibilities) : ["Map local source data"],
    allowedActions: asArray(agent.allowedActions).length ? clone(agent.allowedActions) : ["Read local ingest file", "Create dashboard summary"],
    deniedActions: asArray(agent.deniedActions).length ? clone(agent.deniedActions) : ["Call production endpoint", "Read secrets", "Mutate gateway state"]
  };
}

function mapTask(task, index, defaultOwner) {
  return {
    id: safeText(task.id, `LOCAL-TASK-${String(index + 1).padStart(3, "0")}`),
    workflow: safeText(task.workflow, "FLOW-local-ingest"),
    status: safeText(task.status, "queued"),
    priority: safeText(task.priority, "P3"),
    attempt: typeof task.attempt === "number" ? task.attempt : 1,
    ownerAgent: safeText(task.ownerAgent, defaultOwner),
    reviewer: safeText(task.reviewer, "agent-reviewer"),
    createdAt: safeText(task.createdAt, DEFAULT_TIME),
    updatedAt: safeText(task.updatedAt, task.createdAt || DEFAULT_TIME),
    summary: safeText(task.summary, "Local ingest task mapped with safe defaults.")
  };
}

function mapLog(event, index, defaultActor) {
  return {
    id: safeText(event.id, `local-audit-${index + 1}`),
    timestamp: safeText(event.timestamp, DEFAULT_TIME),
    severity: safeText(event.severity, "info"),
    actor: safeText(event.actor, defaultActor),
    event: safeText(event.event, "Local ingest event mapped with safe defaults."),
    redacted: typeof event.redacted === "boolean" ? event.redacted : false,
    taskId: event.taskId,
    agentId: event.agentId
  };
}

function mapArtifactToBackup(artifact, index) {
  return {
    id: safeText(artifact.id, `local-backup-${index + 1}`),
    taskId: safeText(artifact.taskId, `LOCAL-TASK-${String(index + 1).padStart(3, "0")}`),
    verifyStatus: safeText(artifact.verifyStatus, "pending"),
    checksum: safeText(artifact.checksum, `local-sha256-placeholder-${index + 1}`),
    storageUri: safeText(artifact.uri, `local://artifact/${index + 1}`),
    createdAt: safeText(artifact.createdAt, DEFAULT_TIME),
    restoreTestedAt: null,
    evidenceChain: [
      `artifact: ${safeText(artifact.id, `local-artifact-${index + 1}`)}`,
      `kind: ${safeText(artifact.kind, "local-ingest")}`,
      `checksum: ${safeText(artifact.checksum, `local-sha256-placeholder-${index + 1}`)}`
    ]
  };
}

function createMetrics(agents, tasks, backups, kind) {
  const running = tasks.filter((task) => task.status === "running").length;
  const failedLost = tasks.filter((task) => task.status === "failed" || task.status === "lost").length;
  const verified = backups.filter((backup) => backup.verifyStatus === "verified").length;
  return [
    { id: "metric-local-source", label: "Gateway status", value: "Local ingest", trend: `${kind} source`, status: "healthy", description: "Local files are mapped without production wiring." },
    { id: "metric-local-agents", label: "Active agents", value: String(agents.length), trend: "local records", status: "watch", description: "Agents discovered or defaulted from local ingest records." },
    { id: "metric-local-running", label: "Running tasks", value: String(running), trend: "local task states", status: "healthy", description: "Running local task count from ingest data." },
    { id: "metric-local-failed", label: "Failed / lost", value: String(failedLost), trend: "local task states", status: failedLost ? "blocked" : "healthy", description: "Failed or lost local tasks remain visible for review." },
    { id: "metric-local-backups", label: "Backup verification", value: `${verified} verified`, trend: "local artifacts", status: "watch", description: "Local artifacts are shown as evidence-only backup manifests." }
  ];
}

function detectKind(payload) {
  return payload.metadata?.ingestKind || (payload.crawlerOutput ? "crawlerOutput" : payload.agentRuns ? "agentRunLog" : payload.taskMemory ? "taskMemoryIndex" : payload.artifactIndex ? "artifactIndex" : "dashboardExport");
}

function mapLocalIngestToDashboardExport(payload, dataUrl = "./data/local-ingest/local-dashboard-ingest.sample.json") {
  const kind = detectKind(payload);
  const agents = asArray(payload.agents).map(mapAgent);
  if (!agents.length && kind === "agentRunLog") {
    const run = asArray(payload.agentRuns)[0] || {};
    agents.push(mapAgent({ id: run.agentId, name: run.agentName, role: "Local agent run parser", status: "online" }, 0));
  }
  if (!agents.length) {
    agents.push(mapAgent({ id: "local-ingest-agent", name: "Local Ingest Agent", role: "Local ingest parser", status: "online" }, 0));
  }

  const defaultOwner = agents[0].id;
  let rawTasks = asArray(payload.tasks);
  if (!rawTasks.length && kind === "crawlerOutput") {
    rawTasks = asArray(payload.crawlerOutput?.pages).map((page, index) => ({
      id: `CRAWLER-PAGE-${index + 1}`,
      workflow: "FLOW-crawler-output",
      status: page.status === "succeeded" ? "succeeded" : "queued",
      priority: "P3",
      ownerAgent: defaultOwner,
      summary: `Crawler page mapped: ${safeText(page.title, page.id || "local page")}`
    }));
  }
  if (!rawTasks.length && kind === "agentRunLog") {
    rawTasks = asArray(payload.agentRuns).map((run, index) => ({
      id: `AGENT-RUN-${index + 1}`,
      workflow: "FLOW-agent-run-log",
      status: safeText(run.status, "queued"),
      priority: "P2",
      ownerAgent: safeText(run.agentId, defaultOwner),
      createdAt: run.startedAt,
      updatedAt: run.endedAt,
      summary: safeText(run.summary, "Local agent run mapped.")
    }));
  }
  if (!rawTasks.length && kind === "taskMemoryIndex") rawTasks = asArray(payload.taskMemory);
  if (!rawTasks.length && kind === "artifactIndex") {
    rawTasks = asArray(payload.artifactIndex).map((artifact) => ({
      id: safeText(artifact.taskId, artifact.id),
      workflow: "FLOW-artifact-index",
      status: "queued",
      ownerAgent: defaultOwner,
      summary: `Artifact indexed: ${safeText(artifact.kind, "local artifact")}`
    }));
  }
  const tasks = rawTasks.map((task, index) => mapTask(task, index, defaultOwner));

  const logs = asArray(payload.logs || payload.auditEvents).map((event, index) => mapLog(event, index, defaultOwner));
  const artifacts = asArray(payload.artifacts || payload.artifactIndex);
  const backups = artifacts.length ? artifacts.map(mapArtifactToBackup) : [
    mapArtifactToBackup({ id: "local-ingest-evidence", taskId: tasks[0]?.id, kind, uri: "local://ingest/evidence", checksum: "local-sha256-placeholder-evidence" }, 0)
  ];

  return {
    metadata: {
      schemaVersion: "local-ingest-v1",
      generatedAt: safeText(payload.metadata?.generatedAt, DEFAULT_TIME),
      source: "local-ingest",
      ingestKind: kind,
      safetyMode: "read-only",
      mutationEnabled: false
    },
    agents,
    tasks,
    reviews: asArray(payload.reviews).length ? clone(payload.reviews) : [
      { id: "local-review-001", taskId: tasks[0]?.id || "LOCAL-TASK-001", reviewer: "agent-reviewer", verdict: "pending", policyChecks: ["local ingest read-only", "no production endpoint", "no secrets"], notes: "Local ingest review is mock-only.", createdAt: DEFAULT_TIME }
    ],
    auditEvents: logs.length ? logs : [
      mapLog({ id: "local-log-default", actor: defaultOwner, event: "Local ingest file mapped with safe defaults." }, 0, defaultOwner)
    ],
    backups,
    metrics: createMetrics(agents, tasks, backups, kind),
    settings: {
      gatewayAuthMode: "read-only local ingest",
      retentionPolicy: "local sample retention only",
      modelRouting: "local labels only",
      mcpServers: ["filesystem local ingest", "gateway disabled"],
      secretRefsHealth: "not connected; no secret refs loaded",
      productionMutation: "disabled"
    },
    rbac: agents.map((agent) => ({
      agentId: agent.id,
      name: agent.name,
      riskLevel: agent.riskLevel,
      allowedActions: agent.allowedActions,
      deniedActions: agent.deniedActions
    })),
    sourceStatus: {
      currentSource: "local-ingest",
      requestedSource: "local-ingest",
      health: "ok",
      validation: "passed",
      fallback: "none",
      fallbackReason: "",
      lastLoadedAt: safeText(payload.sourceStatus?.lastLoadedAt, DEFAULT_TIME),
      dataUrl,
      safetyMode: "read-only",
      productionWiring: "disabled",
      mutationEnabled: false
    },
    artifacts
  };
}

window.OpenClawLocalIngestMapper = {
  mapLocalIngestToDashboardExport,
  detectKind
};
})();
