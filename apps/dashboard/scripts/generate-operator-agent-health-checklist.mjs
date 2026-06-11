import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-agent-health-checklist.json");

const checklist = {
  checklistId: `operator-agent-health-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-local-agent-health",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorRecommendedSource: "local-ingest",
  operatorRecommendedData: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
  operatorChecks: [
    "先確認 source 是 local-ingest single-agent snapshot.",
    "確認 agent count = 1.",
    "確認 health report healthConnectionStatus = local-file-only.",
    "確認 health report 不是 mock / gateway-stub.",
    "如果 health = unknown，要人工檢查 local agent.",
    "如果 health = stale，不要在 dashboard restart，要走人工 runbook.",
    "確認 productionStatus 仍然 no-go-for-production.",
    "確認 safetyMode read-only, mutationEnabled false, productionWiring disabled."
  ],
  notAllowed: [
    "Do not restart agent from Dashboard.",
    "Do not stop agent from Dashboard.",
    "Do not start agent from Dashboard.",
    "Do not connect production gateway.",
    "Do not enable mutation.",
    "Do not add secrets, browser identity material, or request identity headers.",
    "Do not read OS process or service state unless passed as sanitized local file."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator agent health checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath)}`);
