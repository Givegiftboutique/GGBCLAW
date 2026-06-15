import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

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
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-fake-webhook-runner.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-fake-webhook-runner.ts",
  fixture: "apps/dashboard/tests/fixtures/whatsapp-fake-webhook-runner-scenarios.json",
  runner: "apps/dashboard/scripts/run-whatsapp-fake-webhook-fixture-runner.mjs",
  test: "apps/dashboard/scripts/test-whatsapp-fake-webhook-fixture-runner.mjs",
  report: "apps/dashboard/data/generated/whatsapp-fake-webhook-fixture-runner-report.json",
  reviewQueue: "apps/dashboard/data/generated/whatsapp-fake-webhook-review-queue-report.json",
  app: "apps/dashboard/src/app.js",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs"
};

for (const file of [paths.module, paths.moduleTs, paths.fixture, paths.runner]) {
  assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

run([paths.runner]);
const report = await json(paths.report);
const reviewQueue = await json(paths.reviewQueue);

for (const [key, expected] of Object.entries({
  mockOnly: true,
  fixtureOnly: true,
  networkCallsMade: false,
  webhookRouteAdded: false,
  httpListenerStarted: false,
  apiClientAdded: false,
  authEnabled: false,
  productionReady: false,
  rawPayloadPrinted: false,
  rawChatPrinted: false,
  secretRedactionApplied: true,
  mutationEnabled: false,
  restartEnabled: false,
  deployEnabled: false
})) {
  assert(report[key] === expected, `runner report ${key} must be ${expected}.`);
}

assert(report.scenarioCount >= 3, "runner should cover safe, review, and unsafe scenarios.");
assert(report.reviewQueueCount >= 1, "runner should create mock review queue candidates.");
assert(report.unsafeRejectedCount >= 1, "runner should reject unsafe mock fixture.");
assert(reviewQueue.mockOnly === true && reviewQueue.fixtureOnly === true, "review queue must be mock fixture only.");
assert(reviewQueue.rawPayloadPrinted === false && reviewQueue.rawChatPrinted === false, "review queue must not print raw payload or chat.");

const fixtureText = await text(paths.fixture);
assert(!/"phone"\s*:|phoneNumber"\s*:|\+\d{7,}|(?:\d[\s().-]){7,}\d/i.test(fixtureText), "fake webhook fixtures must not contain phone number fields or phone-like values.");

for (const file of [paths.module, paths.runner]) {
  const body = await text(file);
  assert(!/\bfetch\s*\(|XMLHttpRequest|http\.createServer|https\.createServer|listen\s*\(|app\.(get|post|use)|router\.(get|post|use)/i.test(body), `${file} must not add network, server, listener, or route code.`);
  assert(!/Authorization|credentials\s*:\s*["']include["']|process\.env|dotenv|\.env/i.test(body), `${file} must not use auth, credentials include, or env.`);
}

const app = await text(paths.app);
for (const marker of ["whatsapp-fake-webhook-fixture-runner-report.json", "WhatsApp Fake Webhook Runner", "httpListenerStarted"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}

const quality = await text(paths.quality);
for (const marker of ["run-whatsapp-fake-webhook-fixture-runner.mjs", "test-whatsapp-fake-webhook-fixture-runner.mjs"]) {
  assert(quality.includes(marker), `quality gate missing ${marker}`);
}

const safety = await text(paths.safety);
assert(safety.includes("whatsapp-fake-webhook-fixture-runner"), "safety scan missing fake webhook runner markers.");

const verifier = await text(paths.verifier);
assert(verifier.includes("whatsapp-fake-webhook-fixture-runner"), "verifier missing fake webhook runner markers.");

console.log("OpenClaw WhatsApp fake webhook fixture runner tests passed.");
