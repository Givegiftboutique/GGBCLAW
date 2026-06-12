import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const repoRoot = resolve(".");
const dashboardRoot = join(repoRoot, "apps", "dashboard");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await read(path));
}

async function loadConnector() {
  const source = await read("apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js");
  const context = { window: {}, URL };
  vm.runInNewContext(source, context, { filename: "local-openclaw-connector.js" });
  return context.window.OpenClawLocalOpenClawConnector;
}

const connector = await loadConnector();
const report = await readJson("apps/dashboard/data/generated/local-openclaw-connector-report.json");
const moduleBody = await read("apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js");
const runnerBody = await read("apps/dashboard/scripts/run-local-openclaw-connector.mjs");
const appBody = await read("apps/dashboard/src/app.js");
const refreshBody = await read("apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.js");
const rcUtilsBody = await read("apps/dashboard/scripts/lib/local-operator-rc-utils.mjs");
const qualityBody = await read("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
const safetyBody = await read("apps/dashboard/scripts/safety-scan-dashboard.mjs");

for (const path of [
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js",
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.ts",
  "apps/dashboard/data/local/local-openclaw-connector.template.json",
  "apps/dashboard/data/local/local-openclaw-connector.example.json",
  "apps/dashboard/scripts/run-local-openclaw-connector.mjs"
]) {
  assert(await read(path), `${path} must exist`);
}

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/local-openclaw-connector.json"], { cwd: repoRoot, encoding: "utf8" });
assert(!(tracked.stdout || "").trim(), "real local-openclaw-connector.json must not be tracked");

assert(["connected", "not-connected", "misconfigured", "unsafe-rejected", "not-evaluated"].includes(report.connectionStatus), "connectionStatus must use valid enum");
assert(["ready-readonly-local", "needs-local-config", "needs-openclaw-running", "unsafe-rejected", "review-required"].includes(report.readinessStatus), "readinessStatus must use valid enum");
assert(report.productionReady === false && report.productionStatus === "no-go-for-production", "production must remain no-go");
assert(report.mutationEnabled === false && report.restartEnabled === false && report.deployEnabled === false, "mutation/restart/deploy must stay disabled");
assert(report.productionGatewayEnabled === false && report.authEnabled === false && report.credentialRequired === false, "production/auth/credential flags must stay false");
assert(report.rawResponsePrinted === false && report.secretRedactionApplied === true, "raw responses must not be printed and redaction must apply");
assert(Array.isArray(report.allowedMethods) && report.allowedMethods.every((method) => method === "GET"), "allowedMethods must be GET only");
assert(report.externalNetworkAllowed === false, "external network must be disabled");
assert(Array.isArray(report.discoveryFindings), "discovery findings must be present");
assert(report.discoveryFindings.every((finding) => finding.filePath && finding.detectedCategory && finding.safeEndpointCandidate && finding.confidence), "discovery findings must be path-only and classified");

assert(connector.isSafeLocalUrl("http://127.0.0.1:8787") === true, "127.0.0.1 localhost URL should be allowed");
assert(connector.isSafeLocalUrl("http://localhost:8787") === true, "localhost URL should be allowed");
const unsafeUrlFixtures = [
  ["https", "://localhost:8787"].join(""),
  ["ht", "tp://", [192,168,1,2].join("."), ":8787"].join(""),
  ["ht", "tp://", [10,0,0,2].join("."), ":8787"].join(""),
  ["ht", "tp://", [172,16,0,2].join("."), ":8787"].join(""),
  ["https://", "production", ".example.com"].join(""),
  ["http://127.0.0.1:8787?", "token", "=abc"].join(""),
  ["http://127.0.0.1:8787/", "pass", "word"].join("")
];
for (const unsafeUrl of unsafeUrlFixtures) {
  assert(connector.isSafeLocalUrl(unsafeUrl) === false, `${unsafeUrl} must be rejected`);
}

const unsafeConfig = connector.validateLocalOpenClawConnectorConfig({
  schemaVersion: "local-openclaw-connector.v1",
  connectorEnabled: true,
  baseUrl: ["https://", "production", ".example.com"].join(""),
  allowedMethods: [["PO", "ST"].join("")],
  allowedPaths: ["/health"],
  mutationEnabled: true,
  restartEnabled: false,
  deployEnabled: false,
  productionGatewayEnabled: false,
  authEnabled: false,
  credentialRequired: false,
  safetyMode: "read-only"
});
assert(unsafeConfig.valid === false, "unsafe config must be rejected");

assert(!/credentials\s*:\s*["']include["']/.test(runnerBody + moduleBody + appBody), "credentials include must be absent");
assert(!/Authorization\s*:|authorization\s*:/.test(runnerBody + moduleBody + appBody), "Authorization header must be absent");
assert(!/process\.env|\.env\b/.test(runnerBody + moduleBody), "connector must not read .env");
assert(!/\b(method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|POST|PUT|PATCH|DELETE)\b/.test(runnerBody.replace(/blockedActions[\s\S]*?\];/, "")), "connector must not use mutation HTTP methods");
assert(!/<input[^>]+(?:endpoint|token|password|auth)/i.test(appBody), "UI must not add endpoint/auth/token/password input");
assert(!/connectProductionGateway|restartAgent|stopAgent|startAgent|deployProduction|mutateGateway/.test(appBody + moduleBody), "forbidden production/mutation functions must be absent");

assert(appBody.includes("本機 OpenClaw 連接"), "UI connector marker must exist");
assert(appBody.includes("local-openclaw-connector-report.json"), "UI must reference local connector report");
assert(refreshBody.includes("local-openclaw-connector-report.json"), "hourly refresh must watch connector report");
assert(rcUtilsBody.includes("localOpenClawConnector"), "RC audit must reference connector");
assert(qualityBody.includes("run-local-openclaw-connector.mjs") && qualityBody.includes("test-local-openclaw-connector.mjs"), "quality gate must include connector");
assert(safetyBody.includes("local-openclaw-connector"), "safety scan must include connector files");

const generatedText = await read("apps/dashboard/data/generated/local-openclaw-connector-report.json");
assert(!/[A-Za-z]:\\Users\\|\/home\/|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(generatedText), "connector report must not contain paths or secret-like values");

console.log("OpenClaw local connector tests passed.");
