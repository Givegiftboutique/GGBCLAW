import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { assertGeneratedFileSafe, validateDashboardSnapshotShape, validatePilotEnvelope } from "./lib/real-local-data-validation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const requiredFiles = [
  "apps/dashboard/scripts/discover-real-local-data.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
  "apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs",
  "apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
  "apps/dashboard/data/local-ingest/real-local-data.sources.sample.json"
];

for (const file of requiredFiles) {
  const body = await readFile(join(repoRoot, file), "utf8");
  if (!body.trim()) throw new Error(`${file} is empty`);
}

const drill = spawnSync(nodeExe, ["apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs"], { cwd: repoRoot, encoding: "utf8" });
if (drill.status !== 0) {
  throw new Error(`Refresh drill failed:\n${drill.stdout}\n${drill.stderr}`);
}

const discovery = await assertGeneratedFileSafe(join(repoRoot, "apps/dashboard/data/generated/real-local-data-discovery-report.json"));
const snapshot = await assertGeneratedFileSafe(join(repoRoot, "apps/dashboard/data/generated/real-local-dashboard-export.generated.json"));
const pilot = await assertGeneratedFileSafe(join(repoRoot, "apps/dashboard/data/generated/real-local-data-pilot-report.json"));

if (discovery.safetyMode !== "read-only" || discovery.mutationEnabled !== false || discovery.productionWiring !== "disabled") throw new Error("Discovery report safety flags are invalid.");
const snapshotValidation = validateDashboardSnapshotShape(snapshot);
if (!snapshotValidation.ok) throw new Error(`Snapshot shape invalid: ${snapshotValidation.issues.join("; ")}`);
const pilotValidation = validatePilotEnvelope(pilot);
if (!pilotValidation.ok) throw new Error(`Pilot report invalid: ${pilotValidation.issues.join("; ")}`);
if (snapshot.sourceStatus?.currentSource !== "local-ingest") throw new Error("Snapshot must be loadable through local-ingest source.");
if (snapshot.sourceStatus?.dataUrl !== "./data/generated/real-local-dashboard-export.generated.json") throw new Error("Snapshot dataUrl marker is missing.");

for (const file of requiredFiles) {
  const body = await readFile(join(repoRoot, file), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)|credentials\s*:\s*["']include["']|Authorization\s*:/.test(body)) {
    throw new Error(`${file} contains forbidden network/env/auth marker.`);
  }
  if (/readFile\s*\([^)]*\.env|open\s*\([^)]*\.env/.test(body)) {
    throw new Error(`${file} contains forbidden .env read marker.`);
  }
}

const parserBody = await readFile(join(repoRoot, "apps/dashboard/scripts/lib/real-local-data-parsers.mjs"), "utf8");
if (!parserBody.includes("MAX_REAL_LOCAL_FILE_BYTES") || !parserBody.includes("summarizeLogLines")) {
  throw new Error("Parser must include file size guard and log summarization behavior.");
}

console.log("OpenClaw real local data pilot tests passed.");
