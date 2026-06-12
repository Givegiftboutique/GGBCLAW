import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const generatedAt = new Date().toISOString();
const outputReportRel = "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json";
const localExportRel = "apps/dashboard/data/local/openclaw-local-export.json";
const templateRel = "apps/dashboard/data/local/openclaw-local-export.template.json";
const writeLocalExport = process.argv.includes("--write-local-export");

const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function readJsonRel(relPath) {
  try {
    return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
  } catch {
    return null;
  }
}

function safeCount(value) {
  return Array.isArray(value) ? value.length : 0;
}

function buildEmptyExport() {
  return {
    schemaVersion: "openclaw-local-export.v1",
    generatedAt,
    source: "local-openclaw-readonly-export-bridge",
    agents: [],
    tasks: [],
    safety: {
      readOnly: true,
      mutationEnabled: false,
      restartEnabled: false,
      deployEnabled: false,
      productionGatewayEnabled: false,
      authEnabled: false,
      credentialRequired: false
    },
    warnings: ["no-safe-agent-task-source-found"]
  };
}

const template = await readJsonRel(templateRel);
const templateHasShape = template?.schemaVersion === "openclaw-local-export.v1"
  && Array.isArray(template.agents)
  && Array.isArray(template.tasks);

const localExport = buildEmptyExport();

if (writeLocalExport) {
  const exportPath = join(repoRoot, localExportRel);
  await mkdir(dirname(exportPath), { recursive: true });
  await writeFile(exportPath, `${JSON.stringify(localExport, null, 2)}\n`, "utf8");
}

const report = {
  reportId: `openclaw-local-export-bridge-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt,
  scope: "local-openclaw-readonly-export-bridge",
  language: "zh-Hant",
  bridgeMode: "local-export-adapter",
  runtimeDiscoveryStatus: "runtime-code-not-found",
  exportStatus: "no-safe-agent-task-source-found",
  preferredEndpoint: "/api/local/export",
  supportedReadOnlyEndpoints: ["/api/local/export", "/api/local/agents", "/api/local/tasks"],
  localExportPath: localExportRel,
  templatePath: templateRel,
  localExportWritten: writeLocalExport,
  templateShapeValid: templateHasShape,
  agentCount: safeCount(localExport.agents),
  taskCount: safeCount(localExport.tasks),
  agents: [],
  tasks: [],
  rawRuntimeStatePrinted: false,
  rawResponsePrinted: false,
  secretRedactionApplied: true,
  externalNetworkAllowed: false,
  productionReady: false,
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  productionGatewayEnabled: false,
  authEnabled: false,
  credentialRequired: false,
  endpointAuthRequired: false,
  bridgeFindings: [
    {
      category: "runtime-discovery",
      status: "not-found-in-repo",
      note: "No safe repo-local runtime route for 127.0.0.1:18789 was found during Sprint 26D discovery."
    },
    {
      category: "dashboard-compatibility",
      status: "ready",
      note: "Dashboard connector already accepts /api/local/export, /api/local/agents, and /api/local/tasks JSON shapes."
    },
    {
      category: "real-data-source",
      status: "missing",
      note: "No safe agent/task source was found; bridge does not fabricate real agents or tasks."
    }
  ],
  safeNextSteps: [
    "Add a localhost-only GET /api/local/export route to the local OpenClaw service.",
    "Or generate apps/dashboard/data/local/openclaw-local-export.json locally from a reviewed safe source.",
    "Keep local export files ignored and never commit real task or agent data."
  ],
  blockedActions
};

const outputPath = join(repoRoot, outputReportRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw local export bridge report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
