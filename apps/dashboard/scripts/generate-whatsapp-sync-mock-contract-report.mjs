import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const outputRel = "apps/dashboard/data/generated/whatsapp-sync-mock-contract-report.json";
const fixturePaths = [
  "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.safe.json",
  "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.review-required.json",
  "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.unsafe.json"
];
const moduleRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js";

async function readJson(relPath) {
  return JSON.parse((await readFile(join(repoRoot, relPath), "utf8")).replace(/^\uFEFF/, ""));
}

const source = await readFile(join(repoRoot, moduleRel), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: moduleRel });
const contract = sandbox.window.OpenClawWhatsAppSyncMockContract;

const events = [];
for (const fixturePath of fixturePaths) {
  const fixture = await readJson(fixturePath);
  events.push(...(Array.isArray(fixture) ? fixture : [fixture]));
}

const summary = contract.buildWhatsAppMockContractSummary(events);
const report = {
  reportId: "whatsapp-sync-mock-contract-safe",
  generatedAt: new Date().toISOString(),
  scope: "whatsapp-sync-mock-contract",
  language: "zh-Hant",
  mockOnly: true,
  networkCallsMade: false,
  webhookRouteAdded: false,
  apiClientAdded: false,
  authEnabled: false,
  productionReady: false,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  eventCount: summary.eventCount,
  safeCandidateCount: summary.safeCandidateCount,
  reviewRequiredCount: summary.reviewRequiredCount,
  unsafeRejectedCount: summary.unsafeRejectedCount,
  ignoredEventCount: summary.ignoredEventCount,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  taskCandidates: summary.taskCandidates,
  warnings: [...new Set(summary.warnings)],
  unsafeReasons: [...new Set(summary.unsafeReasons)],
  fixturePaths,
  safeNextSteps: [
    "Use these mock fixtures only for offline contract review.",
    "Do not create a webhook route or API client until a separate approved sprint."
  ]
};

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw WhatsApp sync mock contract report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
