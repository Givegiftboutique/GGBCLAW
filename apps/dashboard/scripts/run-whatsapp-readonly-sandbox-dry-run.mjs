import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const configModuleRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js";
const dryRunModuleRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-dry-run.js";
const exampleRel = "apps/dashboard/config/whatsapp-readonly-sandbox.example.json";
const localRel = "apps/dashboard/config/whatsapp-readonly-sandbox.local.json";
const reportRel = "apps/dashboard/data/generated/whatsapp-readonly-sandbox-dry-run-report.json";

async function exists(relPath) {
  try {
    await access(join(repoRoot, relPath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadConfigSource() {
  const localExists = await exists(localRel);
  const sourceRel = localExists ? localRel : exampleRel;
  const source = localExists ? "local-ignored" : "example";
  if (!(await exists(sourceRel))) {
    return { config: {}, rawText: "", configSource: "missing" };
  }
  const rawText = await readFile(join(repoRoot, sourceRel), "utf8");
  return { config: JSON.parse(rawText), rawText, configSource: source };
}

const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(repoRoot, configModuleRel), "utf8"), sandbox, { filename: configModuleRel });
vm.runInNewContext(await readFile(join(repoRoot, dryRunModuleRel), "utf8"), sandbox, { filename: dryRunModuleRel });
const dryRunApi = sandbox.window.OpenClawWhatsAppReadonlySandboxDryRun;
const dryRunInput = await loadConfigSource();
const dryRun = dryRunApi.runWhatsAppReadonlySandboxDryRun(dryRunInput);
const generatedAt = new Date().toISOString();
const report = {
  reportId: `whatsapp-readonly-sandbox-dry-run-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  scope: "whatsapp-readonly-sandbox-dry-run",
  language: "zh-Hant",
  ...dryRun,
  rawSecretPrinted: false,
  rawConfigPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
};
delete report.redaction;

const reportPath = join(repoRoot, reportRel);
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw WhatsApp read-only sandbox dry-run completed.");
console.log(`Report: ${relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
