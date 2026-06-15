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
  return JSON.parse((await text(relPath)).replace(/^\uFEFF/, ""));
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: repoRoot, encoding: "utf8" });
  assert(result.status === 0, `${args.join(" ")} failed: ${result.stderr || result.stdout}`);
}

function git(args) {
  for (const command of ["git", "C:\\Program Files\\Git\\cmd\\git.exe"]) {
    const result = spawnSync(command, args, { cwd: repoRoot, encoding: "utf8" });
    if (!result.error) return (result.stdout || "").trim();
  }
  return "";
}

const paths = {
  module: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js",
  moduleTs: "apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.ts",
  safeFixture: "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.safe.json",
  reviewFixture: "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.review-required.json",
  unsafeFixture: "apps/dashboard/tests/fixtures/whatsapp-sync-mock-events.unsafe.json",
  generator: "apps/dashboard/scripts/generate-whatsapp-sync-mock-contract-report.mjs",
  report: "apps/dashboard/data/generated/whatsapp-sync-mock-contract-report.json",
  quality: "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  safety: "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  verifier: "apps/dashboard/verify-dashboard.mjs",
  app: "apps/dashboard/src/app.js"
};

for (const file of Object.values(paths)) {
  if (file !== paths.report) assert(existsSync(join(repoRoot, file)), `${file} missing.`);
}

const source = await text(paths.module);
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: paths.module });
const contract = sandbox.window.OpenClawWhatsAppSyncMockContract;
assert(contract, "mock contract module must register on window.");

const safeFixture = await json(paths.safeFixture);
const reviewFixture = await json(paths.reviewFixture);
const unsafeFixture = await json(paths.unsafeFixture);

const safe = contract.validateWhatsAppMockEvent(safeFixture[0]);
assert(safe.contractStatus === "safe-candidate", "safe fixture should be accepted.");
assert(contract.mapWhatsAppMockEventToTaskCandidate(safeFixture[0]), "safe fixture should map to a task candidate.");

const review = contract.validateWhatsAppMockEvent(reviewFixture[0]);
assert(review.contractStatus === "review-required", "media fixture should require review.");
assert(review.warnings.includes("media-review-required"), "media review warning missing.");

const updated = contract.validateWhatsAppMockEvent(reviewFixture[1]);
assert(updated.contractStatus === "ignored-non-task-event", "non-create events should not auto-create tasks.");
assert(contract.mapWhatsAppMockEventToTaskCandidate(reviewFixture[1]) === null, "non-create events must not create task candidates.");

const unsafe = contract.validateWhatsAppMockEvent(unsafeFixture[0]);
assert(unsafe.contractStatus === "unsafe-rejected", "unsafe fixture should be rejected.");
assert(unsafe.unsafeReasons.includes("credential-or-secret-like-text"), "unsafe reason missing.");

for (const fixturePath of [paths.safeFixture, paths.reviewFixture, paths.unsafeFixture]) {
  const body = await text(fixturePath);
  assert(!/\+\d{7,}|\b\d{8,}\b/.test(body), `${fixturePath} must not contain phone numbers.`);
  assert(!/Bearer\s+|ghp_|xox[baprs]-|sk-[A-Za-z0-9_-]{20,}/i.test(body), `${fixturePath} must not contain credential-like values.`);
}

const moduleAndGenerator = `${source}\n${await text(paths.generator)}`;
assert(!/fetch\s*\(/i.test(moduleAndGenerator), "mock contract must not perform network fetches.");
assert(!/createServer|express|fastify|hono|app\.get|router\.get/i.test(moduleAndGenerator), "mock contract must not add a server route.");
assert(!/credentials\s*:\s*["']include["']/i.test(moduleAndGenerator), "credentials include must not be used.");
assert(!/Authorization\s*:/i.test(moduleAndGenerator), "Authorization header must not be used.");
assert(!/process\.env|dotenv|\.env/i.test(await text(paths.generator)), "generator must not read environment secret files.");
assert(!/(scan\s*qr|qr-code|qr code|whatsappWebLogin)/i.test(moduleAndGenerator), "QR login wiring must not be added.");

runNode([paths.generator]);
const report = await json(paths.report);
assert(report.scope === "whatsapp-sync-mock-contract", "report scope invalid.");
assert(report.mockOnly === true, "mockOnly must be true.");
assert(report.networkCallsMade === false, "networkCallsMade must be false.");
assert(report.webhookRouteAdded === false, "webhookRouteAdded must be false.");
assert(report.apiClientAdded === false, "apiClientAdded must be false.");
assert(report.authEnabled === false, "authEnabled must be false.");
assert(report.productionReady === false, "productionReady must be false.");
assert(report.rawChatPrinted === false, "rawChatPrinted must be false.");
assert(report.secretRedactionApplied === true, "secretRedactionApplied must be true.");
assert(report.safeCandidateCount >= 1, "safe candidate count expected.");
assert(report.reviewRequiredCount >= 1, "review-required count expected.");
assert(report.unsafeRejectedCount >= 1, "unsafe rejected count expected.");

const app = await text(paths.app);
for (const marker of ["whatsapp-sync-mock-contract-report.json", "WhatsApp future sync mock contract", "networkCallsMade", "webhookRouteAdded", "apiClientAdded"]) {
  assert(app.includes(marker), `UI marker missing: ${marker}`);
}

const quality = await text(paths.quality);
for (const marker of ["generate-whatsapp-sync-mock-contract-report.mjs", "test-whatsapp-sync-mock-contract.mjs", "whatsappSyncMockContractReport"]) {
  assert(quality.includes(marker), `quality gate missing ${marker}`);
}

const safety = await text(paths.safety);
for (const marker of ["whatsapp-sync-mock-contract", "whatsapp-sync-mock-events.safe.json", "whatsapp-sync-mock-contract-report.json"]) {
  assert(safety.includes(marker), `safety scan missing ${marker}`);
}

const verifier = await text(paths.verifier);
for (const marker of ["whatsapp-sync-mock-contract.js", "generate-whatsapp-sync-mock-contract-report.mjs", "test-whatsapp-sync-mock-contract.mjs", "whatsapp-sync-mock-contract-report.json"]) {
  assert(verifier.includes(marker), `verifier missing ${marker}`);
}

assert(!git(["ls-files", "apps/dashboard/data/local/whatsapp-task-helper-input.txt"]), "local helper input must not be tracked.");
assert(!git(["ls-files", "apps/dashboard/data/local/whatsapp-task-import.json"]), "local import must not be tracked.");

console.log("OpenClaw WhatsApp sync mock contract tests passed.");
