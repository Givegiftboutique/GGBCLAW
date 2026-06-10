import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const inputPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.generated.json");
const outputPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const allowedAgentStatuses = new Set(["online", "busy", "degraded", "offline"]);
const singleAgentDataUrl = "./data/generated/real-local-dashboard-export.single-agent.generated.json";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function chooseAgent(agents) {
  const candidates = agents
    .map((agent, index) => ({ agent, index }))
    .filter(({ agent }) => allowedAgentStatuses.has(agent.status));
  const selected = candidates.find(({ agent }) => agent.id === "local-orchestrator") ?? candidates[0];
  if (!selected) {
    throw new Error("No validation-safe real local agent candidate could be selected.");
  }
  return selected;
}

function remapOwner(value, selectedAgentId) {
  return typeof value === "string" && value.trim() ? value : selectedAgentId;
}

const source = JSON.parse(await readFile(inputPath, "utf8"));
const originalAgents = Array.isArray(source.agents) ? source.agents : [];
const { agent: selectedAgent, index: selectedIndex } = chooseAgent(originalAgents);
const selectedAgentId = selectedAgent.id;
const rejectedCandidates = originalAgents
  .map((agent, index) => ({ agent, index }))
  .filter(({ index }) => index !== selectedIndex)
  .map(({ agent }) => ({
    id: agent.id,
    name: agent.name,
    status: agent.status,
    reason: allowedAgentStatuses.has(agent.status)
      ? "Excluded from operator truth snapshot to enforce expected real agent count 1."
      : `Excluded because status ${agent.status} is not valid for Dashboard agent inventory.`
  }));

const snapshot = clone(source);
snapshot.generatedAt = new Date().toISOString();
snapshot.metadata = {
  ...(snapshot.metadata ?? {}),
  generatedAt: new Date().toISOString(),
  source: "local-ingest",
  ingestKind: "single-agent-operator-truth-candidate",
  safetyMode: "read-only",
  mutationEnabled: false
};
snapshot.source = {
  ...(snapshot.source ?? {}),
  mode: "local-real-data-pilot",
  trustLevel: "operator-truth-candidate",
  operatorTruthCandidate: true,
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled"
};
snapshot.agents = [clone(selectedAgent)];
snapshot.tasks = (Array.isArray(snapshot.tasks) ? snapshot.tasks : []).map((task) => ({
  ...task,
  ownerAgent: remapOwner(task.ownerAgent, selectedAgentId)
}));
snapshot.auditEvents = (Array.isArray(snapshot.auditEvents) ? snapshot.auditEvents : []).map((event) => ({
  ...event,
  actor: remapOwner(event.actor, selectedAgentId),
  agentId: event.agentId && originalAgents.some((agent) => agent.id === event.agentId) ? selectedAgentId : event.agentId
}));
snapshot.logs = Array.isArray(snapshot.auditEvents) ? clone(snapshot.auditEvents) : [];
snapshot.rbac = [
  {
    agentId: selectedAgentId,
    name: selectedAgent.name,
    riskLevel: selectedAgent.riskLevel,
    allowedActions: selectedAgent.allowedActions,
    deniedActions: selectedAgent.deniedActions
  }
];
snapshot.metrics = (Array.isArray(snapshot.metrics) ? snapshot.metrics : []).map((metric) =>
  metric.id === "metric-real-local-agents" || metric.id === "metric-local-agents" || metric.label === "Active agents"
    ? { ...metric, value: "1", trend: "single-agent operator truth candidate", description: "Exactly one real local agent candidate is loaded after cleanup." }
    : metric
);
snapshot.sourceStatus = {
  ...(snapshot.sourceStatus ?? {}),
  currentSource: "local-ingest",
  requestedSource: "local-ingest",
  health: "ok",
  validation: "passed",
  fallback: "none",
  fallbackReason: "",
  lastLoadedAt: new Date().toISOString(),
  dataUrl: singleAgentDataUrl,
  safetyMode: "read-only",
  productionWiring: "disabled",
  mutationEnabled: false,
  trustLevel: "operator-truth-candidate",
  expectedRealAgentCount: 1,
  actualRealAgentCount: 1,
  singleAgentSnapshot: "loaded"
};
snapshot.singleAgentCleanup = {
  expectedRealAgentCount: 1,
  actualRealAgentCount: 1,
  originalAgentCount: originalAgents.length,
  selectedAgentId,
  selectionReason: "Deterministic cleanup selected the validation-safe local orchestrator candidate for operator truth review.",
  rejectedCandidates,
  reviewRequired: true,
  fixtureSourcesUnchanged: ["mock", "gateway-stub"],
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled"
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log("OpenClaw single-agent local dashboard snapshot generated.");
console.log(`Snapshot: ${relative(repoRoot, outputPath)}`);
