import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "observability-report.json");

const context = vm.createContext({ window: {}, console, Date });
for (const file of [
  "src/lib/mock-data.js",
  "src/lib/observability/observability-types.js",
  "src/lib/observability/observability-rules.js",
  "src/lib/observability/observability-summary.js",
  "src/lib/observability/observability-evaluator.js"
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

const qualityGateReport = await readJson("data/generated/quality-gate-report.json", { result: "unknown" });
const safetyScanReport = await readJson("data/generated/safety-scan-report.json", { result: "unknown" });
const releaseManifest = await readJson("data/generated/release-manifest.json", null);

const report = context.window.OpenClawObservabilityEvaluator.evaluateObservability({
  metrics: context.window.OpenClawMockData.metrics,
  agents: context.window.OpenClawMockData.agents,
  tasks: context.window.OpenClawMockData.tasks,
  reviews: context.window.OpenClawMockData.reviews,
  logs: context.window.OpenClawMockData.auditEvents,
  backups: context.window.OpenClawMockData.backups,
  settings: context.window.OpenClawMockData.settings,
  sourceStatus: {
    currentSource: "mock",
    requestedSource: "mock",
    health: "ok",
    validation: "passed",
    fallback: "none",
    safetyMode: "read-only",
    productionWiring: "disabled",
    mutationEnabled: false
  },
  qualityGateReport,
  safetyScanReport,
  releaseManifest
});

const body = `${JSON.stringify(report, null, 2)}\n`;
const issues = [];
if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("production-like endpoint detected");
if (/C:\\Users\\/i.test(body)) issues.push("absolute machine path detected");
if (/"notificationSent": true/.test(body)) issues.push("notificationSent must remain false");
if (/"localOnly": false/.test(body)) issues.push("localOnly must remain true");
if (/"mutationEnabled": true/.test(body)) issues.push("mutationEnabled must remain false");
if (/"productionWiring": "(?!disabled)/.test(body)) issues.push("productionWiring must remain disabled");

if (issues.length) {
  console.error("OpenClaw observability report generation failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");
console.log("OpenClaw observability report generated.");
