import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "fixture-quarantine-report.json");
const sourceTrustPath = join(dashboardRoot, "src", "lib", "data-trust", "source-trust.js");

async function loadSourceTrust() {
  const source = await readFile(sourceTrustPath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "source-trust.js" });
  return context.window.OpenClawSourceTrust;
}

const trust = await loadSourceTrust();
const sourceIds = ["mock", "gateway-stub", "json", "artifact", "local-ingest", "dev-gateway"];
const classifications = sourceIds.map((source) => trust.getSourceTrustClassification(source, { validationPassed: true }));
const fixtureSources = classifications
  .filter((source) => source.fixtureData)
  .map((source) => ({
    source: source.source,
    trustLevel: source.trustLevel,
    operatorTruth: source.operatorTruth,
    expectedAgentCount: source.expectedAgentCount,
    warningEn: source.warningEn,
    warningZhHant: source.warningZhHant
  }));
const operatorTruthSources = classifications
  .filter((source) => source.trustLevel === "operator-truth-candidate")
  .map((source) => ({
    source: source.source,
    trustLevel: source.trustLevel,
    operatorTruth: source.operatorTruth,
    expectedAgentCount: source.expectedAgentCount,
    requiresReview: source.requiresReview,
    warningEn: source.warningEn,
    warningZhHant: source.warningZhHant
  }));

const rules = [
  "mock must be labeled demo fixture",
  "gateway-stub must be labeled contract fixture",
  "8 agents only valid for lifecycle / contract coverage",
  "8 agents must not be displayed as real inventory",
  "local-ingest expected real count = 1",
  "operator docs must mention single real agent expectation",
  "production track remains blocked until source truth is approved",
  "Fixture Quarantine + Single Agent Truth Alignment is required before read-only production gateway implementation"
];

const status = fixtureSources.some((source) => source.operatorTruth)
  || !fixtureSources.some((source) => source.source === "mock" && source.expectedAgentCount === 8)
  || !fixtureSources.some((source) => source.source === "gateway-stub" && source.expectedAgentCount === 8)
  || !operatorTruthSources.some((source) => source.source === "local-ingest" && source.expectedAgentCount === 1)
  ? "fail"
  : "pass";

const report = {
  reportId: `fixture-quarantine-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "fixture-quarantine",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  fixtureSources,
  operatorTruthSources,
  quarantineRules: rules,
  uiWarningsRequired: [
    "Data trust / 資料可信分類",
    "Demo Fixture Data / 示範測試資料",
    "Contract Fixture Data / 合約測試資料",
    "Operator Truth Candidate / Operator 真實資料候選",
    "8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試",
    "Expected real agent count: 1 / 預期真實 agent 數量：1"
  ],
  testCoverageRules: [
    "Keep 8-agent mock and gateway-stub fixtures for lifecycle and contract regression tests.",
    "Run real/operator truth validation separately and expect 1 real agent.",
    "Never promote fixture counts into production inventory evidence."
  ],
  status
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw fixture quarantine report generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
