import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const contractReviewPath = join(dashboardRoot, "data", "generated", "read-only-adapter-contract-review-report.json");
const disabledDraftPath = join(dashboardRoot, "data", "generated", "disabled-read-only-adapter-draft-report.json");
const outputPath = join(dashboardRoot, "data", "generated", "read-only-adapter-contract-checklist.json");

async function readJson(path, fallback = {}) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const contractReview = await readJson(contractReviewPath, { contractReviewStatus: "not-evaluated" });
const disabledDraft = await readJson(disabledDraftPath, { disabledAdapterDraftStatus: "not-evaluated" });

const checklist = {
  checklistId: `read-only-adapter-contract-checklist-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "read-only-adapter-contract",
  language: "zh-Hant",
  productionStatus: "no-go-for-production",
  productionReady: false,
  adapterEnabled: false,
  connected: false,
  endpointConfigured: false,
  authEnabled: false,
  simulatorOnly: true,
  mutationEnabled: false,
  restartEnabled: false,
  productionGatewayEnabled: false,
  deployEnabled: false,
  dataReturned: false,
  contractReviewReportPath: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  disabledReadOnlyAdapterDraftReportPath: "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  contractReviewStatus: contractReview.contractReviewStatus || "not-evaluated",
  disabledAdapterDraftStatus: disabledDraft.disabledAdapterDraftStatus || "not-evaluated",
  operatorChecks: [
    "確認 contract is draft-only。",
    "確認 disabled adapter draft only returns disabled status。",
    "確認 adapterEnabled = false。",
    "確認 connected = false。",
    "確認 endpointConfigured = false。",
    "確認 authEnabled = false。",
    "確認 productionReady = false。",
    "確認 dataReturned = false。",
    "確認 no endpoint。",
    "確認 no token/cookie/auth。",
    "確認 no Authorization header。",
    "確認 no credentials include。",
    "確認 no mutation。",
    "確認 no restart。",
    "確認 no deploy。"
  ],
  futureApprovalChecks: [
    "Future real adapter requires separate approval.",
    "Manual security design is required outside Dashboard.",
    "Future adapter must be reviewed separately and must not reuse this disabled draft as live wiring."
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
    "production-connect-button"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");

console.log("OpenClaw read-only adapter contract checklist generated.");
console.log(`Checklist: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
