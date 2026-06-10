import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "operator-security-checklist.json");

const checklist = {
  checklistId: `operator-security-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  operatorChecks: [
    "每日先跑 quality gate、safety scan、verifier。",
    "確認 generated reports 沒有 secrets、production endpoint、absolute path 或未遮蔽私隱資料。",
    "確認 UI 顯示 read-only、mutationEnabled false、productionWiring disabled。",
    "確認 production 仍是 no-go-for-production。",
    "確認沒有外部 notification delivery。"
  ],
  notAllowed: [
    "不要分享未審查 raw generated data。",
    "不要 commit runtime config files。",
    "不要 commit secrets。",
    "不要 commit absolute path。",
    "不要把 dashboard 放 public hosting。",
    "不要接 production Gateway。",
    "不要開 mutation。",
    "不要加 auth/token/cookie 到 frontend。"
  ],
  beforeSharing: [
    "Run node apps/dashboard/scripts/generate-security-privacy-audit.mjs.",
    "Run node apps/dashboard/scripts/test-generated-report-sanitization.mjs.",
    "Review apps/dashboard/data/generated/security-privacy-audit-report.json.",
    "Review apps/dashboard/data/generated/data-retention-review-report.json."
  ],
  beforeInternalHosting: [
    "Run node apps/dashboard/scripts/run-dashboard-quality-gates.mjs.",
    "Run node apps/dashboard/scripts/safety-scan-dashboard.mjs.",
    "Run node apps/dashboard/verify-dashboard.mjs.",
    "Run node apps/dashboard/scripts/test-security-privacy-audit.mjs.",
    "Review Git status manually outside the current PowerShell PATH if needed."
  ],
  beforeProduction: [
    "Formal security review required.",
    "Formal privacy review required.",
    "Real auth design review required.",
    "Production gateway security review required.",
    "Secrets management plan required.",
    "Operator signoff required.",
    "Production deployment owner required."
  ]
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator security checklist generated.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
