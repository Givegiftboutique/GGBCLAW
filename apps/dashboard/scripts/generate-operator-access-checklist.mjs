import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "operator-access-checklist.json");

const checklist = {
  checklistId: `operator-access-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  recommendedUrls: [
    "http://127.0.0.1:5180/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json",
    "http://127.0.0.1:5180/?source=gateway-stub#/dashboard/help",
    "http://127.0.0.1:5180/?source=gateway-stub#/dashboard/observability"
  ],
  operatorChecks: [
    "確認只使用 internal / local URL，例如 http://127.0.0.1:5180/。",
    "確認 source badge 顯示預期 source mode。",
    "確認安全模式顯示 read-only。",
    "確認 mutationEnabled false。",
    "確認 productionWiring disabled。",
    "確認 production 狀態仍是 no-go-for-production。",
    "確認沒有 auth、token、cookie、password 或 API key 要求。",
    "確認沒有 webhook、email、Slack 或 SMS external alert delivery。",
    "確認 operator 知道 rollback 以 Git tag 為準並需手動執行。",
    "確認 evidence manifest 可由本地 script 生成。",
    "確認 incident drill 可由本地 script 生成。"
  ],
  accessRisks: [
    "Public hosting is not approved in this sprint.",
    "Production gateway is not connected.",
    "Real auth is not implemented.",
    "External alert delivery is disabled.",
    "Production remains no-go-for-production."
  ],
  beforeInternalHosting: [
    "Run node apps/dashboard/scripts/run-dashboard-quality-gates.mjs.",
    "Run node apps/dashboard/scripts/safety-scan-dashboard.mjs.",
    "Run node apps/dashboard/verify-dashboard.mjs.",
    "Run node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs.",
    "Run node apps/dashboard/scripts/generate-operator-access-checklist.mjs.",
    "Review Git status and changed files manually before commit or tag.",
    "Confirm operator sign-off owner and rollback owner."
  ],
  notAllowed: [
    "production deploy",
    "public production hosting",
    "production API or Gateway connection",
    "mutation endpoint",
    "auth header",
    "credentials include",
    "token, cookie, password, or API key handling",
    "GitHub Actions or CI deployment",
    "webhook, email, Slack, or SMS delivery"
  ]
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw operator access checklist generated.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
