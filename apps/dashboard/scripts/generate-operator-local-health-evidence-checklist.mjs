import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-local-health-evidence-checklist.json");

const checklist = {
  checklistId: `operator-local-health-evidence-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-local-health-evidence-review",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  evidenceReviewReportPath: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  reviewedInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  reviewedInputExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  operatorChecks: [
    "確認 source 是 local-ingest single-agent snapshot。",
    "確認 agent count = 1。",
    "確認 evidenceStatus 是 reviewed-valid、missing-fallback、reviewed-invalid-fallback、sample-fallback、review-required 或 unsafe-rejected。",
    "如果 evidenceStatus = reviewed-valid，確認 accepted source 是 local-reviewed-json。",
    "如果 evidenceStatus = missing-fallback，先建立已去敏 reviewed JSON 再重新產生報告。",
    "如果 evidenceStatus = reviewed-invalid-fallback，先修正已去敏 reviewed JSON。",
    "如果 evidenceStatus = unsafe-rejected，先移除 secret / token / cookie / private endpoint 類型欄位。",
    "如果 fallbackUsed = true，不可把 health 當作 production approval。",
    "unknown / stale / review-required 只可走人工 runbook。",
    "確認 redactionApplied = true。",
    "確認 rawValuesPrinted = false。"
  ],
  fallbackChecks: [
    "fallbackReason = missing-reviewed-input 表示 reviewed-local-agent-health.json 未提供。",
    "fallbackReason = invalid-reviewed-input 表示 reviewed JSON 不符合本地健康 contract。",
    "fallbackReason = unsafe-keys 表示 reviewed JSON 出現不允許的敏感欄位名。",
    "fallback 不可使用 mock 或 gateway-stub 作為 health truth。"
  ],
  notAllowed: [
    "Do not print raw reviewed local health JSON values.",
    "Do not restart agent from Dashboard.",
    "Do not stop agent from Dashboard.",
    "Do not start agent from Dashboard.",
    "Do not connect production gateway.",
    "Do not enable mutation.",
    "Do not add secrets, token, cookie, browser identity material, or request identity headers."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator local health evidence checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
