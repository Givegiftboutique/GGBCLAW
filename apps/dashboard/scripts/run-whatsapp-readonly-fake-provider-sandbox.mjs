import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const fixtureRel = "apps/dashboard/tests/fixtures/whatsapp-readonly-fake-provider-events.json";
const contractRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js";
const fakeWebhookRunnerRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-fake-webhook-runner.js";
const providerRel = "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-fake-provider.js";
const reportRel = "apps/dashboard/data/generated/whatsapp-readonly-fake-provider-sandbox-report.json";

async function readJson(relPath) {
  return JSON.parse((await readFile(join(repoRoot, relPath), "utf8")).replace(/^\uFEFF/, ""));
}

const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(repoRoot, contractRel), "utf8"), sandbox, { filename: contractRel });
vm.runInNewContext(await readFile(join(repoRoot, fakeWebhookRunnerRel), "utf8"), sandbox, { filename: fakeWebhookRunnerRel });
vm.runInNewContext(await readFile(join(repoRoot, providerRel), "utf8"), sandbox, { filename: providerRel });

const fixture = await readJson(fixtureRel);
const providerApi = sandbox.window.OpenClawWhatsAppReadonlyFakeProvider;
const contract = sandbox.window.OpenClawWhatsAppSyncMockContract;
const fakeWebhookRunner = sandbox.window.OpenClawWhatsAppFakeWebhookRunner;

const provider = providerApi.createWhatsAppReadonlyFakeProvider({ fixtureData: fixture });
const result = await providerApi.listWhatsAppFakeProviderEvents(provider, { limit: 50 });
const summary = providerApi.buildWhatsAppFakeProviderSummary(result);
const fakeWebhookReport = fakeWebhookRunner.buildWhatsAppFakeWebhookRunnerReport([
  {
    scenarioId: "wa-readonly-fake-provider-sandbox",
    description: "Read-only fake provider sandbox mapped into the offline mock contract.",
    expectedAction: "quarantine-review-required",
    events: summary.mappedEvents
  }
], contract);
const generatedAt = new Date().toISOString();

const report = {
  reportId: `whatsapp-readonly-fake-provider-sandbox-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  scope: "whatsapp-readonly-fake-provider-sandbox",
  language: "zh-Hant",
  providerName: provider.providerName,
  providerMode: provider.providerMode,
  readOnly: true,
  mockOnly: true,
  fixtureOnly: true,
  networkCallsMade: false,
  webhookRouteAdded: false,
  httpListenerStarted: false,
  apiClientAdded: false,
  authEnabled: false,
  sendMessageEnabled: false,
  autoReplyEnabled: false,
  mutationEnabled: false,
  productionReady: false,
  eventCount: summary.eventCount,
  safeCandidateCount: summary.safeCandidateCount,
  reviewRequiredCount: summary.reviewRequiredCount + fakeWebhookReport.reviewRequiredCount,
  unsafeRejectedCount: summary.unsafeRejectedCount,
  rawPayloadPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  mappedContractEventCount: summary.mappedEvents.length,
  fakeWebhookScenarioCount: fakeWebhookReport.scenarioCount,
  fakeWebhookReviewQueueCount: fakeWebhookReport.reviewQueueCount,
  warnings: [...new Set([...(summary.warnings || []), ...(fakeWebhookReport.warnings || [])])],
  safeNextSteps: [
    "Review sanitized fake provider candidates offline only.",
    "Keep WhatsApp integration work fixture-only until Sprint 28H preflight is approved.",
    "Do not add a real API client, endpoint, listener, sign-in flow, or send/reply action in this phase."
  ]
};

const reportPath = join(repoRoot, reportRel);
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw WhatsApp read-only fake provider sandbox completed.");
console.log(`Report: ${relative(repoRoot, reportPath).replaceAll("\\", "/")}`);
