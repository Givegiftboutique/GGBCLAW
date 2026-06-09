import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const sampleFiles = [
  "local-dashboard-ingest.sample.json",
  "crawler-output.sample.json",
  "agent-run-log.sample.json",
  "task-memory-index.sample.json",
  "artifact-index.sample.json"
];

const context = vm.createContext({ window: {}, console });
for (const file of [
  "src/lib/adapters/validation.js",
  "src/lib/adapters/local-ingest-mapper.js",
  "src/lib/adapters/local-ingest-validation.js"
]) {
  vm.runInContext(await readFile(join(dashboardRoot, file), "utf8"), context, { filename: file });
}

const issues = [];
for (const file of sampleFiles) {
  const path = join(dashboardRoot, "data/local-ingest", file);
  let payload;
  try {
    payload = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    issues.push(`${file} is not parseable JSON: ${error.message}`);
    continue;
  }
  const localResult = context.window.OpenClawLocalIngestValidation.validateLocalIngestPayload(payload);
  if (!localResult.ok) issues.push(...localResult.issues.map((issue) => `${file}: ${issue}`));
  const exportPayload = context.window.OpenClawLocalIngestMapper.mapLocalIngestToDashboardExport(payload, `./data/local-ingest/${file}`);
  const mappedResult = context.window.OpenClawLocalIngestValidation.validateMappedLocalIngestExport(exportPayload);
  if (!mappedResult.ok) issues.push(...mappedResult.issues.map((issue) => `${file}: ${issue}`));
}

if (issues.length) {
  console.error("OpenClaw local ingest tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw local ingest tests passed.");
