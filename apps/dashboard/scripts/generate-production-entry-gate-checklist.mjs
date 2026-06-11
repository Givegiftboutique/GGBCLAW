import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const gateReportPath = join(dashboardRoot, "data", "generated", "production-entry-gate-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "production-entry-gate-checklist.json");

let gateReport;
try {
  gateReport = JSON.parse(await readFile(gateReportPath, "utf8"));
} catch {
  gateReport = {
    gateStatus: "not-evaluated",
    productionStatus: "no-go-for-production",
    productionReady: false,
    productionBlockers: ["Production entry gate report missing."],
    reviewRequiredItems: ["Generate production entry gate report."],
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]
  };
}

const checklist = {
  checklistId: `production-entry-gate-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "production-entry-gate",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  gateStatus: gateReport.gateStatus,
  preflightChecks: [
    "確認 source 是 local-ingest single-agent snapshot。",
    "確認 agent count = 1。",
    "確認 Daily Runbook 不是 blocked。",
    "確認 local health report 已生成。",
    "確認 local health evidence review report 已生成。",
    "確認 reviewed health dry-run report 已生成。",
    "確認 productionStatus = no-go-for-production。",
    "確認 productionReady = false。",
    "確認 production gateway / mutation / restart / deploy 全部 disabled。",
    "確認 production adapter 仍然 disabled。"
  ],
  reviewRequiredChecks: [
    "如果 reviewed input missing 或 fallback，Production gate 必須保持 review-required。",
    "如果 health unknown / stale / review-required，先做本地人工 runbook。",
    "如果 evidence fallback active，先審查 reviewed local health JSON。",
    "人工 production approval 必須在 Dashboard 外完成，Dashboard 不可提供 approve button。"
  ],
  blockedChecks: [
    "如果 productionReady 不是 false，停止並審查。",
    "如果 productionStatus 不是 no-go-for-production，停止並審查。",
    "如果 source 是 mock 或 gateway-stub，不可作 production readiness source。",
    "如果 agent count 不是 1，停止 production entry 判讀。",
    "如果 mutation / restart / production gateway / deploy / auth-token-use 啟用，停止並審查。"
  ],
  manualApprovalChecks: [
    "operator-owner 外部人工確認。",
    "technical-owner 外部人工確認。",
    "security-reviewer 外部人工確認。",
    "business-owner 外部人工確認。",
    "Dashboard 只顯示 checklist，不自動批准。"
  ],
  notAllowed: [
    "production-gateway-connect",
    "mutation",
    "restart-agent",
    "stop-agent",
    "start-agent",
    "deploy",
    "auth-token-use",
    "approve-button",
    "token-auth-secrets"
  ],
  productionBlockers: gateReport.productionBlockers || [],
  reviewRequiredItems: gateReport.reviewRequiredItems || []
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw production entry gate checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
