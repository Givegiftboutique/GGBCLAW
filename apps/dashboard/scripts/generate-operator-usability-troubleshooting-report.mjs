import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-usability-troubleshooting-report.json");

const report = {
  reportId: `operator-usability-troubleshooting-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "operator-dashboard-usability-troubleshooting",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  commonIssues: [
    {
      issue: "I see 8 agents / 我見到 8 個 agents",
      meaning: "You are likely viewing mock or gateway-stub fixture lifecycle data.",
      safeAction: "Open the recommended operator URL."
    },
    {
      issue: "Source badge says mock / source badge 顯示 mock",
      meaning: "Mock is demo fixture data only.",
      safeAction: "Open local-ingest single-agent snapshot."
    },
    {
      issue: "Health is unknown / health 係 unknown",
      meaning: "Local health needs manual review.",
      safeAction: "Read the runbook. Do not restart from Dashboard."
    },
    {
      issue: "Evidence fallback is active / evidence 正在 fallback",
      meaning: "Reviewed local health JSON is missing, invalid, or requires review.",
      safeAction: "Check the reviewed JSON example and regenerate local reports."
    },
    {
      issue: "Reviewed local JSON rejected / reviewed local JSON 被拒絕",
      meaning: "The sanitized JSON failed contract or safety validation.",
      safeAction: "Fix the sanitized local file without copying raw secret-like values into reports."
    },
    {
      issue: "Dashboard server closed / local server 關咗",
      meaning: "The local static server is not running.",
      safeAction: "Run start-operator-dashboard.ps1 again."
    },
    {
      issue: "Browser cache showing old view / browser cache 顯示舊畫面",
      meaning: "The browser has cached older static files.",
      safeAction: "Refresh the page or open the recommended URL again."
    }
  ],
  safeActions: [
    "open recommended operator URL",
    "rerun local report generators",
    "check reviewed JSON example",
    "use start-operator-dashboard.ps1 -Port 5174",
    "read runbook"
  ],
  blockedActions: [
    "restart-agent",
    "stop-agent",
    "start-agent",
    "mutation",
    "production-gateway-connect",
    "deploy",
    "auth-token-secrets"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw operator usability troubleshooting report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
