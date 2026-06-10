import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNoUnsafeValues } from "./lib/real-local-data-sanitizer.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = join(here, "..");
const discoveryPath = join(dashboardRoot, "data", "generated", "real-local-data-discovery-report.json");
const snapshotPath = join(dashboardRoot, "data", "generated", "real-local-dashboard-export.generated.json");
const outputPath = join(dashboardRoot, "data", "generated", "real-local-data-pilot-report.json");

const discovery = JSON.parse(await readFile(discoveryPath, "utf8"));
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const recordsParsed = (snapshot.agents?.length ?? 0) + (snapshot.tasks?.length ?? 0) + (snapshot.logs?.length ?? 0) + (snapshot.backups?.length ?? 0);
const warnings = [...(discovery.warnings ?? []), ...(snapshot.pilot?.warnings ?? [])];

const report = {
  reportId: `real-local-data-pilot-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "local-real-data-pilot",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  snapshotPath: "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  discoveryReportPath: "apps/dashboard/data/generated/real-local-data-discovery-report.json",
  summary: {
    sourcesFound: discovery.sourcesFound?.length ?? 0,
    recordsParsed,
    recordsAccepted: recordsParsed,
    recordsRejected: 0,
    warnings: warnings.length
  },
  refreshDrill: {
    status: warnings.length ? "warning" : "pass",
    commands: [
      "node apps/dashboard/scripts/discover-real-local-data.mjs",
      "node apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
      "node apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs"
    ]
  },
  safety: {
    absolutePathsRedacted: true,
    secretsRedacted: true,
    productionEndpointsBlocked: true,
    networkCalls: false
  },
  warnings
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(assertNoUnsafeValues(report, "real local pilot report"), null, 2)}\n`, "utf8");
console.log("OpenClaw real local data pilot report generated.");
