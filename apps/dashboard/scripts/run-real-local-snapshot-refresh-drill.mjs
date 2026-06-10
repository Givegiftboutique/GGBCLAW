import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertGeneratedFileSafe, validateDashboardSnapshotShape, validatePilotEnvelope } from "./lib/real-local-data-validation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const commands = [
  ["apps/dashboard/scripts/discover-real-local-data.mjs"],
  ["apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs"],
  ["apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs"]
];

for (const args of commands) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Refresh drill command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
}

const snapshot = await assertGeneratedFileSafe(resolve(repoRoot, "apps/dashboard/data/generated/real-local-dashboard-export.generated.json"));
const report = await assertGeneratedFileSafe(resolve(repoRoot, "apps/dashboard/data/generated/real-local-data-pilot-report.json"));
for (const [label, result] of [["snapshot", validateDashboardSnapshotShape(snapshot)], ["pilot report", validatePilotEnvelope(report)]]) {
  if (!result.ok) throw new Error(`${label} validation failed: ${result.issues.join("; ")}`);
}

console.log("OpenClaw real local snapshot refresh drill passed.");
