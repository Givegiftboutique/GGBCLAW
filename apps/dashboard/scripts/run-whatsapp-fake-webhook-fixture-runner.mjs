import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const fixtureRel = "apps/dashboard/tests/fixtures/whatsapp-fake-webhook-runner-scenarios.json";
const contractRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js";
const runnerRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-fake-webhook-runner.js";
const runnerReportRel = "apps/dashboard/data/generated/whatsapp-fake-webhook-fixture-runner-report.json";
const reviewQueueReportRel = "apps/dashboard/data/generated/whatsapp-fake-webhook-review-queue-report.json";

async function readJson(relPath) {
  return JSON.parse((await readFile(join(repoRoot, relPath), "utf8")).replace(/^\uFEFF/, ""));
}

const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(repoRoot, contractRel), "utf8"), sandbox, { filename: contractRel });
vm.runInNewContext(await readFile(join(repoRoot, runnerRel), "utf8"), sandbox, { filename: runnerRel });

const scenarios = await readJson(fixtureRel);
const contract = sandbox.window.OpenClawWhatsAppSyncMockContract;
const runner = sandbox.window.OpenClawWhatsAppFakeWebhookRunner;
const summary = runner.buildWhatsAppFakeWebhookRunnerReport(scenarios, contract);
const generatedAt = new Date().toISOString();

const runnerReport = {
  reportId: "whatsapp-fake-webhook-fixture-runner-safe",
  generatedAt,
  scope: "whatsapp-fake-webhook-fixture-runner",
  language: "zh-Hant",
  ...summary,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  fixturePath: fixtureRel,
  safeNextSteps: [
    "Review fake webhook fixture results offline only.",
    "Do not add a webhook route, HTTP listener, API client, or network call in this phase."
  ]
};

const reviewQueueReport = {
  reportId: "whatsapp-fake-webhook-review-queue-safe",
  generatedAt,
  scope: "whatsapp-fake-webhook-review-queue",
  language: "zh-Hant",
  mockOnly: true,
  fixtureOnly: true,
  reviewQueueCount: summary.reviewQueueCount,
  reviewQueue: summary.reviewQueue,
  networkCallsMade: false,
  webhookRouteAdded: false,
  httpListenerStarted: false,
  apiClientAdded: false,
  authEnabled: false,
  productionReady: false,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false,
  rawPayloadPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  safeNextSteps: [
    "Keep review queue items as offline mock candidates.",
    "Use local import/helper flow for real operator tasks until a future approved sync sprint."
  ]
};

for (const [relPath, report] of [[runnerReportRel, runnerReport], [reviewQueueReportRel, reviewQueueReport]]) {
  const outputPath = join(repoRoot, relPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log("OpenClaw WhatsApp fake webhook fixture runner completed.");
console.log(`Report: ${relative(repoRoot, join(repoRoot, runnerReportRel)).replaceAll("\\", "/")}`);
console.log(`Review queue: ${relative(repoRoot, join(repoRoot, reviewQueueReportRel)).replaceAll("\\", "/")}`);
