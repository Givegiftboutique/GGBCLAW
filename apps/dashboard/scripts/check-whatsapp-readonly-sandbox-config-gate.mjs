import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const moduleRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js";
const exampleRel = "apps/dashboard/config/whatsapp-readonly-sandbox.example.json";
const localRel = "apps/dashboard/config/whatsapp-readonly-sandbox.local.json";
const reportRel = "apps/dashboard/data/generated/whatsapp-readonly-sandbox-config-gate-report.json";

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
vm.runInNewContext(await readFile(join(repoRoot, moduleRel), "utf8"), sandbox, { filename: moduleRel });
const configApi = sandbox.window.OpenClawWhatsAppReadonlySandboxConfig;
const configInput = await loadConfigSource();
const summary = configApi.buildWhatsAppReadonlySandboxConfigSummary(configInput);
const generatedAt = new Date().toISOString();
const report = {
  reportId: `whatsapp-readonly-sandbox-config-gate-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  scope: "whatsapp-readonly-sandbox-config-gate",
  language: "zh-Hant",
  ...summary,
  rawSecretPrinted: false,
  rawConfigPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
};

const reportPath = join(repoRoot, reportRel);
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw WhatsApp read-only sandbox config gate completed.");
console.log(`Report: ${relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
