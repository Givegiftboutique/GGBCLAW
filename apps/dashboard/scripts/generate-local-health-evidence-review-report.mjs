import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const healthReportPath = join(dashboardRoot, "data", "generated", "local-real-agent-health-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "local-health-evidence-review-report.json");
const evidenceModulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-health-evidence.js");
const dryRunReportPath = join(dashboardRoot, "data", "generated", "reviewed-local-health-input-dry-run-report.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadEvidenceModule() {
  const source = await readFile(evidenceModulePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-health-evidence.js" });
  return context.window.OpenClawLocalHealthEvidence;
}

function normalizeRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

const healthReport = await readJson(healthReportPath);
let dryRunReport = null;
try {
  dryRunReport = await readJson(dryRunReportPath);
} catch {
  dryRunReport = null;
}
const evidence = await loadEvidenceModule();
const review = evidence.buildLocalHealthEvidenceReview({
  ...healthReport,
  reviewedHealthInputReadiness: dryRunReport?.readinessStatus || "missing-local-input",
  reviewedHealthInputAssistantStatus: dryRunReport?.readinessStatus || "missing-local-input",
  reviewedHealthDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json"
});

const report = {
  reportId: `local-health-evidence-review-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  ...review,
  reviewedInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  reviewedInputExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  reviewedHealthDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  reviewedHealthInputReadiness: dryRunReport?.readinessStatus || "missing-local-input",
  reviewedHealthInputAssistantStatus: dryRunReport ? "available" : "missing-dry-run-report",
  healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json"
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw local health evidence review report generated.");
console.log(`Report: ${normalizeRelative(outputPath)}`);
