import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const gateRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-real-api-preflight-gate.js";
const reportRel = "apps/dashboard/data/generated/whatsapp-real-api-preflight-gate-report.json";

const evidencePaths = {
  safetyDesignAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-sync-safety-design.md",
  secretManagerDesignAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-secret-manager-design.md",
  mockContractAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-sync-mock-contract.md",
  fakeProviderAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-readonly-fake-provider-sandbox.md",
  localFallbackAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-local-task-import.md"
};

async function exists(relPath) {
  try {
    await access(join(repoRoot, relPath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(repoRoot, gateRel), "utf8"), sandbox, { filename: gateRel });
const gateApi = sandbox.window.OpenClawWhatsAppRealApiPreflightGate;

const input = {};
for (const [key, relPath] of Object.entries(evidencePaths)) {
  input[key] = await exists(relPath);
}

const gate = gateApi.buildWhatsAppRealApiPreflightGate(input);
const generatedAt = new Date().toISOString();
const report = {
  reportId: `whatsapp-real-api-preflight-gate-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  scope: "whatsapp-real-api-preflight-gate",
  language: "zh-Hant",
  ...gate,
  eligibleFor28IPlanning: false,
  evidencePaths,
  safeNextSteps: [
    ...gate.safeNextSteps,
    "28H is a preflight gate only. Do not connect a real provider, configure tokens, add webhook routes, or enable production sync."
  ],
  rawSecretPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
};

const reportPath = join(repoRoot, reportRel);
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw WhatsApp real API preflight gate completed.");
console.log(`Report: ${relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
