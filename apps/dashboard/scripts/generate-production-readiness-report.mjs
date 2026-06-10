import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "production-readiness-report.json");

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/readiness/readiness-types.js",
  "src/lib/readiness/readiness-checklist.js",
  "src/lib/readiness/readiness-summary.js",
  "src/lib/readiness/readiness-evaluator.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

async function readJson(relPath, fallback = null) {
  try {
    return JSON.parse(await readFile(join(dashboardRoot, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

const report = context.window.OpenClawReadinessEvaluator.evaluateProductionReadiness({
  observabilityReport: await readJson("data/generated/observability-report.json", null),
  releaseManifest: await readJson("data/generated/release-manifest.json", null),
  qualityGateReport: await readJson("data/generated/quality-gate-report.json", null),
  safetyScanReport: await readJson("data/generated/safety-scan-report.json", null)
});

const body = `${JSON.stringify(report, null, 2)}\n`;
const issues = [];
if (report.recommendation === "production-ready") issues.push("recommendation must not be production-ready");
if (report.productionDeploy !== false) issues.push("productionDeploy must be false");
if (report.safetyMode !== "read-only") issues.push("safetyMode must be read-only");
if (report.mutationEnabled !== false) issues.push("mutationEnabled must be false");
if (report.productionWiring !== "disabled") issues.push("productionWiring must be disabled");
if (!report.knownBlockers.length) issues.push("knownBlockers must be listed");
if (!report.requiredBeforeProduction.length) issues.push("requiredBeforeProduction must be listed");
if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("production endpoint detected");

if (issues.length) {
  console.error("OpenClaw production readiness report generation failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");
console.log("OpenClaw production readiness report generated.");
