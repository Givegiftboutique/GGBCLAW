import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const checklistRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-manual-approval-checklist.js";
const reportRel = "apps/dashboard/data/generated/whatsapp-manual-approval-go-no-go-report.json";

const evidencePaths = {
  preflightGateAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-real-api-preflight-gate.md",
  configGateAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-readonly-sandbox-config-gate.md",
  dryRunGateAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-readonly-sandbox-dry-run.md",
  safetyDesignAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-sync-safety-design.md",
  secretManagerDesignAvailable: "docs/dashboard/openclaw-dashboard-whatsapp-secret-manager-design.md"
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
vm.runInNewContext(await readFile(join(repoRoot, checklistRel), "utf8"), sandbox, { filename: checklistRel });
const checklistApi = sandbox.window.OpenClawWhatsAppManualApprovalChecklist;

const input = { checklistSource: "committed-docs-only" };
for (const [key, relPath] of Object.entries(evidencePaths)) {
  input[key] = await exists(relPath);
}
input.documentationAvailable = Object.values(input).some((value) => value === true);

const checklist = checklistApi.buildWhatsAppManualApprovalChecklist(input);
const generatedAt = new Date().toISOString();
const report = {
  reportId: `whatsapp-manual-approval-go-no-go-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  scope: "whatsapp-manual-approval-checklist",
  language: "zh-Hant",
  ...checklist,
  evidencePaths,
  rawSecretPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
};

const reportPath = join(repoRoot, reportRel);
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw WhatsApp manual approval go/no-go completed.");
console.log(`Report: ${relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
