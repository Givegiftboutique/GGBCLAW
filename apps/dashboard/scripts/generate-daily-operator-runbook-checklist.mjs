import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const summaryPath = join(dashboardRoot, "data", "generated", "daily-operator-summary-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "daily-operator-runbook-checklist.json");

let summary;
try {
  summary = JSON.parse(await readFile(summaryPath, "utf8"));
} catch {
  summary = {
    dailyStatus: "unknown",
    reviewedHealthInputReadiness: "missing-local-input",
    reviewedHealthInputAssistantStatus: "missing-dry-run-report",
    productionEntryGateStatus: "not-evaluated",
    productionGateSummary: "Generate daily operator summary report.",
    safeNextSteps: ["Generate daily operator summary report."],
    blockedActions: ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy", "auth-token-use"]
  };
}

const checklist = {
  checklistId: `daily-operator-runbook-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "daily-operator-runbook",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  productionReady: false,
  dailyStatus: summary.dailyStatus,
  reviewedHealthDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  reviewedHealthInputReadiness: summary.reviewedHealthInputReadiness || "missing-local-input",
  reviewedHealthInputAssistantStatus: summary.reviewedHealthInputAssistantStatus || "missing-dry-run-report",
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  productionEntryGateStatus: summary.productionEntryGateStatus || "not-evaluated",
  productionGateSummary: summary.productionGateSummary || "Production entry gate must be reviewed before any future production work.",
  operatorChecks: [
    "確認 Operator Home 可見。",
    "確認 source = local-ingest。",
    "確認 agent count = 1。",
    "確認 Local Real Agent Health panel 可見。",
    "確認 Local Health Evidence Review panel 可見。",
    "確認 Daily Runbook panel 可見。",
    "確認 Reviewed Health Input Assistant panel 可見。",
    "確認 Production Entry Gate panel 可見。",
    "確認 productionReady = false。",
    "確認 production entry gate status 已顯示。",
    "確認 reviewed-local-agent-health.json 只作本地使用，不 commit。",
    "確認 production no-go 是預期狀態，不是錯誤。"
  ],
  reviewRequiredChecks: [
    "如果 health unknown / stale / review-required，查看 local runbook，不要在 Dashboard restart。",
    "如果 evidence fallback，檢查 reviewed local health JSON example。",
    "如果 reviewed health input missing-local-input，先 copy template 再乾跑 validator。",
    "如果 reviewed health input unsafe-rejected，移除 unsafe fields；raw values 不應打印。",
    "如果 production entry gate 是 review-required，先檢查 production gate report。",
    "不要把 secrets / token / cookie 寫入 reviewed JSON 或 generated reports。"
  ],
  blockedChecks: [
    "如果 agent count 不是 1，停止每日判讀並審查 snapshot。",
    "如果 production status 不是 no-go-for-production，停止並審查。",
    "如果 productionReady 不是 false，立即停止並審查。",
    "如果 mutation / restart / production gateway 被啟用，停止並審查。",
    "如果 reviewed health input 需要修改，保持 sample fallback，不要接 production。"
  ],
  safeNextSteps: summary.safeNextSteps || [],
  notAllowed: [
    "restart-agent",
    "stop-agent",
    "start-agent",
    "mutation",
    "production-gateway-connect",
    "deploy",
    "auth-token-use",
    "auth-token-secrets"
  ],
  fixtureModeChecks: [
    "如果看到 8 agents，通常是 mock / gateway fixture。",
    "如果 source 是 mock 或 gateway-stub，開 recommended operator URL。",
    "mock / gateway-stub 不可當 daily operator truth。"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw daily operator runbook checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
