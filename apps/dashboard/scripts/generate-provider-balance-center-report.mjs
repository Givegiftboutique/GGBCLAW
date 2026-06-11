import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const localInputRel = "apps/dashboard/data/local/provider-balance-center.json";
const templateRel = "apps/dashboard/data/local/provider-balance-center.template.json";
const exampleRel = "apps/dashboard/data/local/provider-balance-center.example.json";
const outputRel = "apps/dashboard/data/generated/provider-balance-center-report.json";

const defaultProviders = [
  { providerId: "qweapi", displayName: "QWE API", consoleUrlLabel: "QWE API 充值/餘額頁" },
  { providerId: "huawei-llm-agent", displayName: "Huawei LLM Agent", consoleUrlLabel: "Huawei LLM Agent 查詢頁" },
  { providerId: "intenext-codex", displayName: "Intenext Codex", consoleUrlLabel: "Intenext Wallet" }
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function sanitize(provider, fallback) {
  return {
    providerId: fallback.providerId,
    displayName: fallback.displayName,
    balanceStatus: ["ok", "low", "unknown", "review-required"].includes(provider?.balanceStatus) ? provider.balanceStatus : "unknown",
    balanceText: String(provider?.balanceText || "請在本機填寫餘額"),
    lastCheckedAt: provider?.lastCheckedAt || null,
    consoleUrlLabel: fallback.consoleUrlLabel,
    credentialStoredInRepo: false,
    apiKeyStoredInRepo: false,
    passwordStoredInRepo: false,
    notes: Array.isArray(provider?.notes) ? provider.notes.map(String).slice(0, 5) : ["目前只支援本地手動填寫或本地匯入。"]
  };
}

const generatedAt = new Date().toISOString();
const inputExists = await exists(join(repoRoot, localInputRel));
let input = null;
let balanceCenterStatus = "missing";
if (inputExists) {
  try {
    input = JSON.parse(await readFile(join(repoRoot, localInputRel), "utf8"));
    balanceCenterStatus = "loaded";
  } catch {
    balanceCenterStatus = "invalid";
  }
}

const providers = defaultProviders.map((provider) => {
  const found = Array.isArray(input?.providers) ? input.providers.find((item) => item.providerId === provider.providerId) : null;
  return sanitize(found, provider);
});

const report = {
  reportId: `provider-balance-center-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt,
  scope: "local-provider-balance-center",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  balanceCenterStatus,
  localInputPath: localInputRel,
  templatePath: templateRel,
  examplePath: exampleRel,
  redactionApplied: true,
  rawSecretsPrinted: false,
  externalLoginUsed: false,
  remoteFetchUsed: false,
  externalLoginEnabled: false,
  externalFetchEnabled: false,
  productionFetchEnabled: false,
  providers,
  warnings: balanceCenterStatus === "missing" ? ["餘額需要你在本機填寫或匯入，不會儲存密碼。"] : []
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw provider balance center report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
