import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = join(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "dashboard-export.generated.json");
const mockDataPath = join(dashboardRoot, "src", "lib", "mock-data.js");

function checksum(value) {
  return createHash("sha256").update(value).digest("hex");
}

function createRbacSummary(agents) {
  return agents.map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    riskLevel: agent.riskLevel,
    allowedActions: agent.allowedActions,
    deniedActions: agent.deniedActions
  }));
}

const context = vm.createContext({ window: {} });
const mockDataScript = await readFile(mockDataPath, "utf8");
vm.runInContext(mockDataScript, context, { filename: "mock-data.js" });

const source = context.window.OpenClawMockData;
if (!source) {
  throw new Error("Mock dashboard data source did not load.");
}

const generatedAt = new Date().toISOString();
const snapshot = {
  metadata: {
    schemaVersion: "dashboard-export-v1",
    generatedAt,
    source: "generated",
    generatorVersion: "phase-04-local-snapshot-v1",
    safetyMode: "read-only",
    mutationEnabled: false
  },
  metrics: source.metrics,
  agents: source.agents,
  tasks: source.tasks,
  reviews: source.reviews,
  auditEvents: source.auditEvents,
  backups: source.backups,
  settings: source.settings,
  rbac: createRbacSummary(source.agents),
  sourceStatus: {
    currentSource: "generated",
    requestedSource: "generated",
    health: "ok",
    validation: "passed",
    fallback: "none",
    fallbackReason: "none",
    lastLoadedAt: generatedAt,
    dataUrl: "./data/generated/dashboard-export.generated.json"
  },
  artifacts: [
    {
      id: "dashboard-export-generated",
      path: "apps/dashboard/data/generated/dashboard-export.generated.json",
      kind: "dashboard-export",
      checksum: "computed-after-write",
      createdAt: generatedAt
    }
  ]
};

const serializedWithoutChecksum = JSON.stringify(snapshot, null, 2);
snapshot.artifacts[0].checksum = checksum(serializedWithoutChecksum);
const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialized, "utf8");

console.log(`Generated dashboard snapshot: ${outputPath}`);
