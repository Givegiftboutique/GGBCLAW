import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const reportPath = join(repoRoot, "apps/dashboard/data/generated/operator-console-visual-audit-checklist.json");

const checklist = {
  checklistId: `operator-console-visual-audit-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-console-visual-redesign",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  visualChecks: [
    "每頁都有中文主標題。",
    "第一屏不懂 coding 的 operator 都能理解。",
    "主卡片不顯示 raw enum 或 raw key。",
    "右側卡片不可窄到爆字。",
    "今日任務不可只是舊式 spreadsheet table。",
    "權限頁不可在主畫面顯示 permission key dump。",
    "技術詳情預設 collapsed。",
    "Provider cards 要像用量與餘額中心。",
    "自動刷新卡片可見。",
    "Production guardrails 清楚可見。",
    "沒有 production connect / endpoint / auth / mutation / restart / deploy 按鈕。"
  ],
  blockedActions: [
    "production-gateway-connect",
    "endpoint-input",
    "auth-token-input",
    "mutation",
    "restart-agent",
    "deploy"
  ],
  requiredManualRoutes: [
    "/",
    "#/dashboard/agents",
    "#/dashboard/tasks",
    "#/dashboard/reviews",
    "#/dashboard/logs",
    "#/dashboard/backups",
    "#/dashboard/observability",
    "#/dashboard/settings",
    "#/dashboard/rbac",
    "#/dashboard/help",
    "?source=mock",
    "?source=gateway-stub"
  ],
  status: "review-required"
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator console visual audit checklist generated.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
