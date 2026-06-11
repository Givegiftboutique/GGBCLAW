import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "production-adapter-simulator-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "production-adapter-simulator-checklist.json");

let simulatorReport;
try {
  simulatorReport = JSON.parse(await readFile(reportPath, "utf8"));
} catch {
  simulatorReport = {
    adapterStatus: "not-configured",
    productionReady: false,
    adapterEnabled: false,
    connected: false,
    simulatorOnly: true,
    productionWiring: "disabled",
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]
  };
}

const checklist = {
  checklistId: `production-adapter-simulator-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "read-only-production-adapter-simulator",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionWiring: "disabled",
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  simulatorOnly: true,
  adapterStatus: simulatorReport.adapterStatus,
  simulatorChecks: [
    "確認 adapter 是 simulator-only。",
    "確認 adapterEnabled = false。",
    "確認 connected = false。",
    "確認 endpointConfigured = false。",
    "確認 authEnabled = false。",
    "確認 productionReady = false。",
    "確認 production gateway disabled。",
    "確認 mutation disabled。",
    "確認 restart disabled。",
    "確認 deploy disabled。",
    "確認 simulator 沒有 endpoint 或 auth 設定。"
  ],
  futureProductionReadinessChecks: [
    "Future real adapter requires separate architecture approval.",
    "Future real adapter must not reuse simulator as live production source.",
    "Future real adapter needs reviewed endpoint, auth, secrets, monitoring, rollback, and incident ownership outside this sprint.",
    "Production entry gate must remain no-go until separate approval exists."
  ],
  blockedChecks: [
    "Do not configure endpoint.",
    "Do not configure auth.",
    "Do not connect production gateway.",
    "Do not enable adapter.",
    "Do not mark productionReady true.",
    "Do not add mutation, restart, deploy, or approve controls."
  ],
  notAllowed: [
    "production-gateway-connect",
    "mutation",
    "restart-agent",
    "stop-agent",
    "start-agent",
    "deploy",
    "auth-token-use",
    "endpoint-input",
    "auth-token-input",
    "approve-button"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw production adapter simulator checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
