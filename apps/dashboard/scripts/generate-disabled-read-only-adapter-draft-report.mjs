import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const contractReviewPath = join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "disabled-read-only-adapter-draft-report.json");

const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function readJson(path, fallback = {}) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function reportId(prefix) {
  return `${prefix}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
}

const contractReview = await readJson(contractReviewPath, { contractReviewStatus: "not-evaluated" });

const report = {
  reportId: reportId("disabled-read-only-adapter-draft"),
  generatedAt: new Date().toISOString(),
  scope: "disabled-read-only-production-adapter-draft",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  adapterName: "disabled-read-only-production-adapter-draft",
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  simulatorOnly: true,
  safetyMode: "read-only",
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false,
  dataReturned: false,
  disabledReason: "disabled-by-default",
  disabledAdapterDraftStatus: "disabled-by-default",
  contractReviewReportPath: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  contractReviewStatus: contractReview.contractReviewStatus || "not-evaluated",
  blockedActions,
  warnings: [
    "Disabled draft only. No production data is returned.",
    "No production connection is made."
  ],
  requiredFollowups: [
    "Keep this draft disabled until future real adapter approval.",
    "Use the contract review report before any future implementation work."
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw disabled read-only adapter draft report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
