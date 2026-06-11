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
    safeNextSteps: ["Generate daily operator summary report."],
    blockedActions: ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"]
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
  dailyStatus: summary.dailyStatus,
  operatorChecks: [
    "確認 Operator Home 可見。",
    "確認 source = local-ingest。",
    "確認 agent count = 1。",
    "確認 Local Real Agent Health panel 可見。",
    "確認 Local Health Evidence Review panel 可見。",
    "確認 Daily Runbook panel 可見。",
    "確認 production no-go 是預期狀態，不是錯誤。"
  ],
  reviewRequiredChecks: [
    "如果 health unknown / stale / review-required，請看 local runbook，不要在 Dashboard restart。",
    "如果 evidence fallback，請檢查 reviewed local health JSON example。",
    "不要把 secrets / token / cookie 放入 reviewed JSON 或 generated reports。"
  ],
  blockedChecks: [
    "如果 agent count 不是 1，請停止每日判讀並審查 snapshot。",
    "如果 production status 不是 no-go-for-production，請停止並回報。",
    "如果 mutation / restart / production gateway 被啟用，請停止並回報。"
  ],
  safeNextSteps: summary.safeNextSteps || [],
  notAllowed: [
    "restart-agent",
    "stop-agent",
    "start-agent",
    "mutation",
    "production-gateway-connect",
    "deploy",
    "auth-token-secrets"
  ],
  fixtureModeChecks: [
    "如果看到 8 agents，通常是 mock / gateway fixture。",
    "如果 source 是 mock 或 gateway-stub，請開 recommended operator URL。",
    "mock / gateway-stub 不可視為 daily operator truth。"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw daily operator runbook checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
