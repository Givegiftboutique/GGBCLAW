import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-daily-usability-checklist.json");

const checklist = {
  checklistId: `operator-daily-usability-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-daily-dashboard-usability",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  productionReady: false,
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  productionEntryGateStatus: "review-required",
  operatorRecommendedUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
  expectedRealAgentCount: 1,
  dailyChecks: [
    "開 Dashboard 要見到 Operator Home。",
    "確認 source 是 local-ingest single-agent snapshot。",
    "確認 agent count = 1。",
    "確認 Local Real Agent Health panel 可見。",
    "確認 Local Health Evidence Review panel 可見。",
    "確認 Reviewed Health Input Assistant panel 可見。",
    "確認 Production Entry Gate panel 可見。",
    "確認 productionReady = false。",
    "確認 productionStatus = no-go-for-production。",
    "確認 Restart disabled、Mutation disabled、Production gateway disabled。",
    "使用 start-operator-dashboard.ps1 開啟 recommended operator view。"
  ],
  warningSigns: [
    "如果見到 8 agents，通常是 mock / fixture，不是每日 operator view。",
    "如果 source badge 顯示 mock，請開 recommended operator URL。",
    "如果 source badge 顯示 gateway-stub，這只是 contract fixture。",
    "如果 health unknown / stale，請看 runbook，不要 restart。",
    "如果 evidence fallback，請檢查 reviewed JSON。",
    "如果 production gate 是 blocked / review-required，這是預期 guardrail，不是 Dashboard 錯誤。",
    "Production no-go 是正常狀態。"
  ],
  doNotDo: [
    "不可建立 restart / stop / start agent action。",
    "不可建立 mutation action。",
    "不可 connect production gateway。",
    "不可 deploy。",
    "不可使用 auth token 作 production entry。",
    "不可加入 auth / token / cookie / secrets。",
    "不可把 mock / gateway-stub 當 operator daily truth。"
  ],
  troubleshooting: [
    "Open recommended operator URL.",
    "Rerun local health and evidence report generators.",
    "Review production entry gate report.",
    "Confirm no production adapter is enabled.",
    "Check reviewed-local-agent-health.example.json.",
    "If port 5173 is busy, run start-operator-dashboard.ps1 -Port 5174.",
    "Read the operator runbook."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator daily usability checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
