import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const repoRoot = resolve(".");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

async function loadBrowserModule(path, globalName) {
  const source = await read(path);
  const context = { window: {}, URL };
  const connectorSource = await read("apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js");
  vm.runInNewContext(connectorSource, context, { filename: "local-openclaw-connector.js" });
  vm.runInNewContext(source, context, { filename: path });
  return context.window[globalName];
}

const assistant = await loadBrowserModule(
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.js",
  "OpenClawLocalOpenClawActivationAssistant"
);
const report = await readJson("apps/dashboard/data/generated/local-openclaw-activation-report.json");
const setupBody = await read("apps/dashboard/scripts/setup-local-openclaw-connector.mjs");
const validatorBody = await read("apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs");
const psBody = await read("apps/dashboard/scripts/setup-local-openclaw-connector.ps1");
const appBody = await read("apps/dashboard/src/app.js");
const qualityBody = await read("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
const safetyBody = await read("apps/dashboard/scripts/safety-scan-dashboard.mjs");
const rcAuditBody = await read("apps/dashboard/scripts/run-local-operator-rc-audit.mjs");

for (const path of [
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.js",
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.ts",
  "apps/dashboard/scripts/setup-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs",
  "apps/dashboard/scripts/setup-local-openclaw-connector.ps1",
  "apps/dashboard/data/local/openclaw-local-export.template.json",
  "apps/dashboard/data/local/openclaw-local-export.example.json"
]) {
  assert(await read(path), `${path} must exist`);
}

for (const target of [
  "apps/dashboard/data/local/local-openclaw-connector.json",
  "apps/dashboard/data/local/openclaw-local-export.json"
]) {
  const tracked = spawnSync("git", ["ls-files", target], { cwd: repoRoot, encoding: "utf8" });
  assert(!(tracked.stdout || "").trim(), `${target} must not be tracked`);
}

assert(assistant.validateLocalOpenClawEndpointCandidate({ baseUrl: "http://127.0.0.1:8787" }).valid === true, "127.0.0.1 endpoint should be accepted");
assert(assistant.validateLocalOpenClawEndpointCandidate({ baseUrl: "http://localhost:8787" }).valid === true, "localhost endpoint should be accepted");
assert(assistant.validateLocalOpenClawEndpointCandidate({ baseUrl: ["ht", "tps", "://", "example", ".com"].join("") }).valid === false, "external URL must be rejected");
assert(assistant.validateLocalOpenClawEndpointCandidate({ baseUrl: ["http://127.0.0.1:8787?", "token", "=x"].join("") }).valid === false, "secret-like URL must be rejected");
assert(assistant.validateLocalOpenClawExportCandidate({ localExportPath: "apps/dashboard/data/local/openclaw-local-export.json" }).valid === true, "local export path should be accepted");
assert(assistant.validateLocalOpenClawExportCandidate({ localExportPath: "../openclaw-local-export.json" }).valid === false, "outside export path must be rejected");

assert(["needs-local-config", "needs-openclaw-running", "ready-to-test", "connected-readonly", "unsafe-rejected", "review-required"].includes(report.activationStatus), "activationStatus must be valid");
assert(report.rawConfigPrinted === false && report.secretRedactionApplied === true, "activation report must be redacted");
assert(report.productionReady === false && report.productionStatus === "no-go-for-production", "production must remain disabled");
assert(report.mutationEnabled === false && report.restartEnabled === false && report.deployEnabled === false, "mutation/restart/deploy must stay false");
assert(report.productionGatewayEnabled === false && report.authEnabled === false && report.credentialRequired === false, "production/auth/credential flags must stay false");
assert(Array.isArray(report.allowedMethods) && report.allowedMethods.every((method) => method === "GET"), "activation report must allow GET only");
assert(report.externalNetworkAllowed === false, "external network must stay disabled");

assert(!/process\.env|\.env\b/.test(setupBody + validatorBody), "activation scripts must not read .env");
assert(!/credentials\s*:\s*["']include["']/.test(setupBody + validatorBody + appBody), "credentials include must be absent");
assert(!/Authorization\s*:|authorization\s*:/.test(setupBody + validatorBody + appBody), "Authorization header must be absent");
assert(!/<input[^>]+(?:endpoint|token|password|auth)/i.test(appBody), "UI must not add endpoint/auth/token/password input");
assert(!/connectProductionGateway|restartAgent|stopAgent|startAgent|deployProduction|mutateGateway/.test(appBody), "forbidden production/mutation functions must be absent");
assert(appBody.includes("本機 OpenClaw 連接設定助手"), "UI setup assistant marker must exist");
assert(appBody.includes("setup-local-openclaw-connector.ps1"), "UI must show PowerShell helper command");
assert(rcAuditBody.includes("validate-local-openclaw-connector-activation.mjs"), "RC audit must reference activation validation");
assert(qualityBody.includes("validate-local-openclaw-connector-activation.mjs") && qualityBody.includes("test-local-openclaw-activation-assistant.mjs"), "quality gate must include activation scripts");
assert(safetyBody.includes("local-openclaw-activation") || safetyBody.includes("setup-local-openclaw-connector"), "safety scan must cover activation files");

const generatedText = await read("apps/dashboard/data/generated/local-openclaw-activation-report.json");
assert(!/[A-Za-z]:\\Users\\|\/home\/|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(generatedText), "activation report must not contain paths or secret-like values");

console.log("OpenClaw local activation assistant tests passed.");
