import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const outputRel = "apps/dashboard/data/generated/hourly-refresh-policy-report.json";
const generatedAt = new Date().toISOString();

const watchedReports = [
  "apps/dashboard/data/generated/local-task-inbox-report.json",
  "apps/dashboard/data/generated/daily-operator-summary-report.json",
  "apps/dashboard/data/generated/local-real-agent-health-report.json",
  "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
  "apps/dashboard/data/generated/provider-balance-center-report.json",
  "apps/dashboard/data/generated/local-openclaw-connector-report.json",
  "apps/dashboard/data/generated/local-openclaw-activation-report.json",
  "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
  "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json"
];

const report = {
  reportId: `hourly-refresh-policy-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt,
  scope: "operator-hourly-local-refresh",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  refreshIntervalMinutes: 60,
  externalFetchEnabled: false,
  productionFetchEnabled: false,
  localReportsOnly: true,
  manualRefreshEnabled: true,
  refreshSources: ["manual", "hourly", "initial-load"],
  watchedReports,
  operatorMessageZhHant: "每 1 小時自動刷新一次，只重新讀取本地報告，不會連接 Production。"
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw hourly refresh policy report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
