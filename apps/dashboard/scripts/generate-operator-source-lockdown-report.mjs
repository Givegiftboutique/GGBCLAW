import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-source-lockdown-report.json");
const sourceLockdownPath = join(dashboardRoot, "src", "lib", "data-trust", "source-lockdown.js");
const singleAgentSnapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.single-agent.generated.json");

async function loadSourceLockdown() {
  const source = await readFile(sourceLockdownPath, "utf8");
  const context = { window: {}, URLSearchParams };
  vm.runInNewContext(source, context, { filename: "source-lockdown.js" });
  return context.window.OpenClawSourceLockdown;
}

const lockdown = await loadSourceLockdown();
const policy = lockdown.SOURCE_LOCKDOWN_POLICY;
const sourceIds = ["mock", "gateway-stub", "json", "artifact", "local-ingest", "dev-gateway"];
const rules = sourceIds.map((source) => lockdown.getSourceLockdownRule(source));
const snapshot = JSON.parse(await readFile(singleAgentSnapshotPath, "utf8"));
const actualSingleAgentCount = Array.isArray(snapshot.agents) ? snapshot.agents.length : 0;

const fixtureSources = rules
  .filter((rule) => policy.fixtureSources.includes(rule.source))
  .map((rule) => ({
    source: rule.source,
    requiresDemoAcknowledgement: rule.requiresDemoAcknowledgement,
    defaultAllowed: rule.defaultAllowed,
    warningLevel: rule.warningLevel,
    expectedAgentCount: rule.expectedAgentCount,
    operatorTruth: rule.operatorTruth,
    blockedReason: rule.blockedReason
  }));

const reviewRequiredSources = rules
  .filter((rule) => policy.reviewRequiredSources.includes(rule.source))
  .map((rule) => ({
    source: rule.source,
    requiresReview: rule.requiresReview === true,
    defaultAllowed: rule.defaultAllowed,
    warningLevel: rule.warningLevel,
    blockedReason: rule.blockedReason
  }));

const devOnlySources = rules
  .filter((rule) => policy.devOnlySources.includes(rule.source))
  .map((rule) => ({
    source: rule.source,
    devOnly: rule.devOnly === true,
    operatorTruth: rule.operatorTruth,
    defaultAllowed: rule.defaultAllowed,
    blockedReason: rule.blockedReason
  }));

const warnings = [];
if (actualSingleAgentCount !== 1) {
  warnings.push(`single-agent snapshot expected 1 agent, found ${actualSingleAgentCount}`);
}
if (fixtureSources.some((source) => source.operatorTruth || source.defaultAllowed)) {
  warnings.push("fixture sources must not be default operator truth");
}

const report = {
  reportId: `operator-source-lockdown-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-source-selection-lockdown",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorRecommendedSource: policy.operatorRecommendedSource,
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  operatorRecommendedUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: policy.expectedRealAgentCount,
  actualSingleAgentCount,
  fixtureSources,
  reviewRequiredSources,
  devOnlySources,
  defaultBehavior: policy.defaultEntryBehavior,
  lockdownStatus: warnings.length ? "warning" : "pass",
  warnings,
  requiredFollowups: warnings.length
    ? ["Review the single-agent local-ingest snapshot before operator use."]
    : ["Keep mock and gateway-stub as explicit fixture/demo sources only."]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw operator source lockdown report generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
