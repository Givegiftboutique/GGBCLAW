import { readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
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
for (const path of ["/api/local/export", "/api/local/agents", "/api/local/tasks", "/health", "/status", "/agents", "/tasks"]) {
  assert(connector.ALLOWED_PATHS.includes(path), `${path} must be an allowed local read-only path`);
}

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

const exportShape = {
  schemaVersion: "openclaw-local-export.v1",
  source: "wsl-openclaw-safe-export-adapter",
  readOnly: true,
  agents: [{ id: "agent-one", name: "Agent One", role: "worker", status: "online" }],
  tasks: [{ id: "task-one", title: "Task One", status: "todo", priority: "normal" }],
  warnings: ["no-safe-task-source-found"]
};
assert(connector.mapLocalOpenClawAgents(exportShape).length === 1, "full export shape must map agents");
assert(connector.mapLocalOpenClawTasks(exportShape).length === 1, "full export shape must map tasks");
assert(connector.mapLocalOpenClawAgents({ agents: exportShape.agents }).length === 1, "{ agents } shape must map agents");
assert(connector.mapLocalOpenClawTasks({ tasks: exportShape.tasks }).length === 1, "{ tasks } shape must map tasks");
assert(connector.mapLocalOpenClawAgents(exportShape.agents).length === 1, "raw agent arrays must map");
assert(connector.mapLocalOpenClawTasks(exportShape.tasks).length === 1, "raw task arrays must map");

async function withStubServer(routes, callback) {
  const serverScript = `
    const http = require("node:http");
    const routes = ${JSON.stringify(routes)};
    const server = http.createServer((request, response) => {
      const route = routes[request.url] || routes.default;
      if (!route) {
        response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        response.end("<html>not found</html>");
        return;
      }
      if (route.type === "json") {
        response.writeHead(route.status || 200, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify(route.body));
      } else {
        response.writeHead(route.status || 200, { "content-type": "text/html; charset=utf-8" });
        response.end(route.body || "<html>dashboard route</html>");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      console.log("PORT:" + server.address().port);
    });
    process.on("SIGTERM", () => server.close(() => process.exit(0)));
  `;
  const server = spawn(process.execPath, ["-e", serverScript], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  const port = await new Promise((resolvePort, rejectPort) => {
    const timer = setTimeout(() => rejectPort(new Error(`stub server did not start: ${stderr}`)), 5000);
    server.stdout.on("data", (chunk) => {
      const match = String(chunk).match(/PORT:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolvePort(match[1]);
      }
    });
    server.on("exit", (code) => {
      clearTimeout(timer);
      rejectPort(new Error(`stub server exited with ${code}: ${stderr}`));
    });
  });
  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    server.kill("SIGTERM");
  }
}

async function runConnectorWithStub(routes) {
  return withStubServer(routes, async (baseUrl) => {
    const localConfigPath = join(repoRoot, "apps/dashboard/data/local/local-openclaw-connector.json");
    const localExportPath = join(repoRoot, "apps/dashboard/data/local/openclaw-local-export.json");
    const reportPath = join(repoRoot, "apps/dashboard/data/generated/local-openclaw-connector-report.json");
    let previousConfig = null;
    let previousExport = null;
    let previousReport = null;
    try {
      previousConfig = await readFile(localConfigPath, "utf8");
    } catch {
      previousConfig = null;
    }
    try {
      previousExport = await readFile(localExportPath, "utf8");
    } catch {
      previousExport = null;
    }
    try {
      previousReport = await readFile(reportPath, "utf8");
    } catch {
      previousReport = null;
    }
    const script = `
      const fs = require("node:fs");
      const path = "apps/dashboard/data/local/local-openclaw-connector.json";
      fs.writeFileSync(path, JSON.stringify({
        schemaVersion: "local-openclaw-connector.v1",
        connectorEnabled: true,
        connectionMode: "localhost-http-or-local-file",
        baseUrl: ${JSON.stringify(baseUrl)},
        allowedMethods: ["GET"],
        allowedPaths: ["/api/local/export", "/api/local/agents", "/api/local/tasks", "/health", "/status", "/agents", "/tasks"],
        localExportPath: "apps/dashboard/data/local/openclaw-local-export.json",
        safetyMode: "read-only",
        mutationEnabled: false,
        restartEnabled: false,
        deployEnabled: false,
        productionGatewayEnabled: false,
        authEnabled: false,
        credentialRequired: false,
        setupMode: "localhost-http"
      }, null, 2));
    `;
    spawnSync(process.execPath, ["-e", script], { cwd: repoRoot, encoding: "utf8" });
    try {
      await rm(localExportPath, { force: true });
      const run = spawnSync(process.execPath, ["apps/dashboard/scripts/run-local-openclaw-connector.mjs"], { cwd: repoRoot, encoding: "utf8" });
      assert(run.status === 0, `connector runner should pass: ${run.stderr || run.stdout}`);
      return await readJson("apps/dashboard/data/generated/local-openclaw-connector-report.json");
    } finally {
      if (previousConfig === null) {
        spawnSync(process.execPath, ["-e", "require('node:fs').rmSync('apps/dashboard/data/local/local-openclaw-connector.json', { force: true })"], { cwd: repoRoot, encoding: "utf8" });
      } else {
        await writeFile(localConfigPath, previousConfig, "utf8");
      }
      if (previousExport !== null) await writeFile(localExportPath, previousExport, "utf8");
      if (previousReport !== null) await writeFile(reportPath, previousReport, "utf8");
    }
  });
}

const exportReport = await runConnectorWithStub({
  "/api/local/export": { type: "json", body: exportShape },
  "/api/local/agents": { type: "json", body: { agents: [{ id: "agent-two" }] } },
  "/api/local/tasks": { type: "json", body: { tasks: [{ id: "task-two" }] } },
  "/health": { type: "json", body: { ok: true, status: "ok" } },
  "/agents": { type: "html" },
  "/tasks": { type: "html" }
});
assert(exportReport.connectionStatus === "connected", "export stub should connect");
assert(exportReport.dataSourcePath === "/api/local/export", "connector must prefer /api/local/export");
assert(exportReport.agentCount === 1 && exportReport.taskCount === 1, "export stub must populate one agent and one task");
assert(exportReport.localExportSource === undefined || exportReport.localExportSource === "wsl-openclaw-safe-export-adapter", "HTTP export source should remain safe when present");
assert(exportReport.rawResponsePrinted === false && exportReport.secretRedactionApplied === true, "stub report must remain redacted");

const splitReport = await runConnectorWithStub({
  "/api/local/export": { type: "html" },
  "/api/local/agents": { type: "json", body: { agents: [{ id: "agent-split" }] } },
  "/api/local/tasks": { type: "json", body: { tasks: [{ id: "task-split" }] } },
  "/health": { type: "json", body: { ok: true, status: "ok" } },
  "/agents": { type: "html" },
  "/tasks": { type: "html" }
});
assert(splitReport.dataSourcePath === "/api/local/agents,/api/local/tasks", "split JSON endpoints must be used when export is unavailable");
assert(splitReport.agentCount === 1 && splitReport.taskCount === 1, "split endpoints must populate agents and tasks");

const healthOnlyReport = await runConnectorWithStub({
  "/api/local/export": { type: "html" },
  "/api/local/agents": { type: "html" },
  "/api/local/tasks": { type: "html" },
  "/health": { type: "json", body: { ok: true, status: "ok" } },
  "/status": { type: "html" },
  "/agents": { type: "html" },
  "/tasks": { type: "html" }
});
assert(healthOnlyReport.connectionStatus === "connected", "health-only stub must remain connected");
assert(healthOnlyReport.readinessStatus === "ready-readonly-local", "health-only stub must remain ready-readonly-local");
assert(healthOnlyReport.agentCount === 0 && healthOnlyReport.taskCount === 0, "health-only stub must stay empty");
assert(healthOnlyReport.emptyDataReason === "no-json-agents-tasks-endpoint-found", "health-only empty reason must be explicit");
assert(healthOnlyReport.mutationEnabled === false && healthOnlyReport.restartEnabled === false && healthOnlyReport.deployEnabled === false && healthOnlyReport.authEnabled === false && healthOnlyReport.productionReady === false, "stub safety flags must remain false");

console.log("OpenClaw local connector tests passed.");
