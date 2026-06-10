import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "single-agent-truth-report.json");
const realSnapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.generated.json");
const singleAgentSnapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");
const sourceTrustPath = join(dashboardRoot, "src", "lib", "data-trust", "source-trust.js");

function parseDataPath(argv) {
  const dataIndex = argv.indexOf("--data");
  if (dataIndex >= 0 && argv[dataIndex + 1]) {
    return resolve(repoRoot, argv[dataIndex + 1]);
  }
  return null;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadSourceTrust() {
  const source = await readFile(sourceTrustPath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "source-trust.js" });
  return context.window.OpenClawSourceTrust;
}

function countAgents(snapshot) {
  if (Array.isArray(snapshot.agents)) return snapshot.agents.length;
  if (Array.isArray(snapshot.data?.agents)) return snapshot.data.agents.length;
  if (Array.isArray(snapshot.dashboard?.agents)) return snapshot.dashboard.agents.length;
  return 0;
}

const expectedRealAgentCount = 1;
const fixtureAgentCount = 8;
const warnings = [];
const requiredFollowups = [
  "Fixture Quarantine + Single Agent Truth Alignment must be reviewed before any read-only production gateway implementation.",
  "Do not treat mock or gateway-stub lifecycle fixtures as operator truth."
];
const requestedDataPath = parseDataPath(process.argv.slice(2));
const selectedSnapshotPath = requestedDataPath
  ?? (await exists(singleAgentSnapshotPath) ? singleAgentSnapshotPath : realSnapshotPath);
const operatorTruthSnapshot = relative(repoRoot, selectedSnapshotPath).replaceAll("\\", "/");

let snapshot = {};
let snapshotLoaded = true;
try {
  snapshot = await readJson(selectedSnapshotPath);
} catch (error) {
  snapshotLoaded = false;
  warnings.push(`Real local snapshot could not be read: ${error.message}`);
}

const actualRealAgentCount = snapshotLoaded ? countAgents(snapshot) : 0;
if (actualRealAgentCount !== expectedRealAgentCount) {
  warnings.push(`Expected 1 real operator agent, but selected local snapshot currently contains ${actualRealAgentCount}.`);
  requiredFollowups.push("Review the real local snapshot source and align it to the single-agent operator truth before production track entry.");
}

const trust = await loadSourceTrust();
const mockTrust = trust.getSourceTrustClassification("mock");
const gatewayTrust = trust.getSourceTrustClassification("gateway-stub");
const localIngestTrust = trust.getSourceTrustClassification("local-ingest", { validationPassed: snapshotLoaded });
const fixtureDataSeparated = mockTrust.fixtureData === true
  && gatewayTrust.fixtureData === true
  && mockTrust.operatorTruth === false
  && gatewayTrust.operatorTruth === false
  && mockTrust.expectedAgentCount === fixtureAgentCount
  && gatewayTrust.expectedAgentCount === fixtureAgentCount
  && localIngestTrust.expectedAgentCount === expectedRealAgentCount;

if (!fixtureDataSeparated) {
  warnings.push("Fixture source classification is incomplete or unsafe.");
  requiredFollowups.push("Fix source trust classification before relying on any source as operator truth.");
}

const report = {
  reportId: `single-agent-truth-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-truth-alignment",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  expectedRealAgentCount,
  actualRealAgentCount,
  fixtureAgentCount,
  fixtureDataSeparated,
  operatorTruthSource: "local-ingest",
  operatorTruthSnapshot,
  mockIsOperatorTruth: false,
  gatewayStubIsOperatorTruth: false,
  status: !fixtureDataSeparated || !snapshotLoaded ? "fail" : actualRealAgentCount === expectedRealAgentCount ? "pass" : "warning",
  warnings,
  requiredFollowups
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw single agent truth report generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
