import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function text(relPath) {
  return readFile(join(repoRoot, relPath), "utf8");
}

async function json(relPath) {
  return JSON.parse(await text(relPath));
}

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
  assert(result.status === 0, `${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

const paths = {
  provider: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-fake-provider.js",
  providerTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-fake-provider.ts",
  contract: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js",
  fakeRunner: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-fake-webhook-runner.js",
  fixture: "apps/dashboard/tests/fixtures/whatsapp-readonly-fake-provider-events.json",
  runner: "apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs",
  report: "apps/dashboard/data/generated/whatsapp-readonly-fake-provider-sandbox-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

for (const file of [paths.provider, paths.providerTs, paths.fixture, paths.runner]) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const sandbox = { window: {} };
vm.runInNewContext(await text(paths.contract), sandbox, { filename: paths.contract });
vm.runInNewContext(await text(paths.fakeRunner), sandbox, { filename: paths.fakeRunner });
vm.runInNewContext(await text(paths.provider), sandbox, { filename: paths.provider });

const providerApi = sandbox.window.OpenClawWhatsAppReadonlyFakeProvider;
const fixture = await json(paths.fixture);
const provider = providerApi.createWhatsAppReadonlyFakeProvider({ fixtureData: fixture });
assert(provider.readOnly === true, "provider must be readOnly true.");
assert(provider.providerMode === "offline-fixture-only", "providerMode must be offline-fixture-only.");
assert(provider.networkCallsMade === false, "networkCallsMade must be false.");
assert(provider.webhookRouteAdded === false, "webhookRouteAdded must be false.");
assert(provider.apiClientAdded === false, "apiClientAdded must be false.");
assert(provider.authEnabled === false, "authEnabled must be false.");
assert(provider.productionReady === false, "productionReady must be false.");

const listed = await providerApi.listWhatsAppFakeProviderEvents(provider, { limit: 10 });
assert(listed.events.length >= 1, "provider must list committed fake fixture events.");
const mapped = providerApi.mapFakeProviderEventToMockContract(listed.events[0]);
assert(mapped.schemaVersion === "whatsapp-sync-mock-event.v1", "event must map to 28D mock contract.");
assert(mapped.source === "offline-whatsapp-contract-mock", "mapped event must use 28D normalized source.");
const fakeRunnerResult = sandbox.window.OpenClawWhatsAppFakeWebhookRunner.buildWhatsAppFakeWebhookRunnerReport([{ events: [mapped] }], sandbox.window.OpenClawWhatsAppSyncMockContract);
assert(fakeRunnerResult.mockOnly === true && fakeRunnerResult.fixtureOnly === true, "mapped events must pass through 28E fake runner logic.");

run([paths.runner]);
const report = await json(paths.report);
for (const [key, expected] of Object.entries({
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
  rawPayloadPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true
})) {
  assert(report[key] === expected, `sandbox report ${key} must be ${expected}.`);
}

assert(report.eventCount >= 1, "sandbox report must include fake provider events.");
assert(report.mappedContractEventCount === report.eventCount, "sandbox report must map every provider event.");
assert(report.fakeWebhookScenarioCount >= 1, "sandbox report must include 28E fake runner pass-through.");

const fixtureText = await text(paths.fixture);
const phoneLikeRe = /(?:^|[^A-Za-z0-9])(?:\+\d[\d\s().-]{7,}|\d{8,}|\d{3}[-. ]\d{3}[-. ]\d{4})(?:[^A-Za-z0-9]|$)/;
assert(!phoneLikeRe.test(fixtureText), "committed fake provider fixtures must not contain phone numbers.");
assert(!/Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/i.test(fixtureText), "committed fake provider fixtures must not contain credentials.");

const bannedInProvider = /\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|listen\s*\(|app\.(get|post|use)|router\.(get|post|use)|qr\s*login|scan\s*qr|document\.cookie|localStorage|sessionStorage|Authorization\s*:|credentials\s*:\s*["']include["']|process\.env|dotenv|readFile\([^)]*\.env|\b(?:sendMessage|autoReply|replyMessage|deleteMessage|restart|deploy)\s*\(/i;
for (const file of [paths.provider, paths.runner]) {
  const body = await text(file);
  assert(!bannedInProvider.test(body), `${file} must not add API client, endpoint, listener, network, sign-in, cookie/session, env, send/reply, mutation, restart, or deploy behavior.`);
}

const app = await text(paths.app);
for (const marker of ["WhatsApp Read-only Fake Provider", "offline-fixture-only", "whatsapp-readonly-fake-provider-sandbox-report.json", "sendMessageEnabled", "autoReplyEnabled"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}
assert(!/WhatsApp Read-only Fake Provider[\s\S]{0,1200}<button/i.test(app), "fake provider panel must not include a connect/setup button.");
assert(!/WhatsApp Read-only Fake Provider[\s\S]{0,1200}<input/i.test(app), "fake provider panel must not include endpoint or credential input.");

for (const [file, markers] of [
  [paths.quality, ["run-whatsapp-readonly-fake-provider-sandbox.mjs", "test-whatsapp-readonly-fake-provider-sandbox.mjs", "whatsappReadonlyFakeProviderSandboxReport"]],
  [paths.safety, ["whatsapp-readonly-fake-provider-sandbox", "whatsapp-readonly-fake-provider.js"]],
  [paths.verifier, ["whatsapp-readonly-fake-provider-sandbox", "whatsapp-readonly-fake-provider.js"]]
]) {
  const body = await text(file);
  for (const marker of markers) assert(body.includes(marker), `${file} missing ${marker}`);
}

console.log("OpenClaw WhatsApp read-only fake provider sandbox tests passed.");
