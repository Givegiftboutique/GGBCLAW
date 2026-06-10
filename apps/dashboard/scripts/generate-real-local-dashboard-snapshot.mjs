import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mapRealLocalRecordsToDashboardExport } from "./lib/real-local-data-mapper.mjs";
import { parseLocalFile, summarizeLogLines, readTextFileLimited } from "./lib/real-local-data-parsers.mjs";
import { assertNoUnsafeValues, sanitizeValue } from "./lib/real-local-data-sanitizer.mjs";
import { validateDashboardSnapshotShape } from "./lib/real-local-data-validation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const discoveryPath = join(dashboardRoot, "data", "generated", "real-local-data-discovery-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.generated.json");

async function loadJsonIfExists(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const discovery = await loadJsonIfExists(discoveryPath, { sourcesFound: [] });
const inputs = {};
const warnings = [];

for (const source of discovery.sourcesFound ?? []) {
  const displayPath = source.displayPath;
  if (!displayPath || displayPath.startsWith("[REDACTED_PATH]")) continue;
  const absolute = resolve(repoRoot, displayPath);
  try {
    if (source.extension === ".log" || source.extension === ".txt") {
      const text = await readTextFileLimited(absolute);
      inputs.logSummaries = summarizeLogLines(text.split(/\r?\n/).filter(Boolean));
    } else {
      const parsed = await parseLocalFile(absolute, source.role);
      inputs[source.role] = parsed.records;
    }
  } catch (error) {
    warnings.push(`Skipped ${source.role}: ${error.message}`);
  }
}

if (!Object.keys(inputs).length) {
  inputs.crawlerJson = (await parseLocalFile(join(dashboardRoot, "data", "local-ingest", "local-dashboard-ingest.sample.json"), "crawlerJson")).records;
  inputs.agentLogs = (await parseLocalFile(join(dashboardRoot, "data", "local-ingest", "agent-run-log.sample.json"), "agentLogs")).records;
  inputs.taskMemory = (await parseLocalFile(join(dashboardRoot, "data", "local-ingest", "task-memory-index.sample.json"), "taskMemory")).records;
  inputs.artifactIndex = (await parseLocalFile(join(dashboardRoot, "data", "local-ingest", "artifact-index.sample.json"), "artifactIndex")).records;
}

const snapshot = mapRealLocalRecordsToDashboardExport(assertNoUnsafeValues(sanitizeValue(inputs), "real local inputs"));
snapshot.pilot = {
  scope: "local-real-data-pilot",
  discoveryReportPath: "apps/dashboard/data/generated/real-local-data-discovery-report.json",
  absolutePathsRedacted: true,
  secretsRedacted: true,
  productionEndpointsBlocked: true,
  warnings
};

const validation = validateDashboardSnapshotShape(snapshot);
if (!validation.ok) {
  throw new Error(`Real local dashboard snapshot failed validation: ${validation.issues.join("; ")}`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(assertNoUnsafeValues(snapshot, "real local snapshot"), null, 2)}\n`, "utf8");
console.log("OpenClaw real local dashboard snapshot generated.");
