import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const inputPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.generated.json");
const outputPath = join(dashboardRoot, "data", "generated", "real-local-agent-inventory-inspection.json");
const allowedAgentStatuses = new Set(["online", "busy", "degraded", "offline"]);
const fixtureIdRe = /mock|fixture|gateway|stub|demo/i;

function safeAgentRecord(agent, index) {
  return {
    index,
    id: typeof agent.id === "string" ? agent.id : `agent-${index + 1}`,
    name: typeof agent.name === "string" ? agent.name : `Agent ${index + 1}`,
    role: typeof agent.role === "string" ? agent.role : "unknown",
    status: typeof agent.status === "string" ? agent.status : "unknown",
    workspace: typeof agent.workspace === "string" ? agent.workspace : "unknown",
    runtime: typeof agent.runtime === "string" ? agent.runtime : "unknown",
    lastHeartbeat: typeof agent.lastHeartbeat === "string" ? agent.lastHeartbeat : "unknown",
    sourceFields: {
      hasFixtureLikeId: fixtureIdRe.test(`${agent.id ?? ""} ${agent.name ?? ""} ${agent.role ?? ""}`),
      validationSafeStatus: allowedAgentStatuses.has(agent.status)
    }
  };
}

function classifyAgent(agent, allAgents) {
  const duplicateNameCount = allAgents.filter((item) => item.name === agent.name).length;
  const reasons = [];
  let classification = "actual-real-candidate";

  if (agent.sourceFields.hasFixtureLikeId) {
    classification = "fixture-remnant-review";
    reasons.push("Agent id, name, or role has fixture-like wording.");
  }
  if (!agent.sourceFields.validationSafeStatus) {
    classification = "stale-sample-record";
    reasons.push(`Agent status ${agent.status} is not supported by Dashboard agent validation.`);
  }
  if (duplicateNameCount > 1 && classification === "actual-real-candidate") {
    classification = "duplicated-generated-record-review";
    reasons.push("Agent name appears more than once in the generated local snapshot.");
  }
  if (!reasons.length) {
    reasons.push("Validation-safe local candidate; human review still required before treating as operator truth.");
  }

  return {
    agentId: agent.id,
    name: agent.name,
    classification,
    reasons
  };
}

const snapshot = JSON.parse(await readFile(inputPath, "utf8"));
const agents = (Array.isArray(snapshot.agents) ? snapshot.agents : []).map(safeAgentRecord);
const classification = agents.map((agent) => classifyAgent(agent, agents));
const validCandidates = classification.filter((item, index) =>
  item.classification === "actual-real-candidate"
  && agents[index]?.sourceFields.validationSafeStatus
);

const report = {
  reportId: `real-local-agent-inventory-inspection-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "real-local-agent-inventory-inspection",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  productionStatus: "no-go-for-production",
  expectedRealAgentCount: 1,
  actualAgentCountBeforeCleanup: agents.length,
  agents,
  classification,
  recommendedCleanup: [
    "Generate a separate single-agent operator truth candidate snapshot.",
    "Keep the original multi-agent real local snapshot for review evidence only.",
    "Do not delete mock or gateway-stub fixture data.",
    "Do not treat duplicate or validation-unsafe generated records as real operator inventory."
  ],
  selectedCandidatePreview: validCandidates[0]?.agentId ?? null,
  rejectedCandidateCount: Math.max(agents.length - 1, 0),
  status: agents.length === 1 ? "pass" : "review-required"
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw real local agent inventory inspection generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
