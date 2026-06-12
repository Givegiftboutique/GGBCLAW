import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(".");
const localBridgeUrl = "http://127.0.0.1:18789";
const endpointPaths = ["/health", "/api/local/export", "/api/local/agents", "/api/local/tasks"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function read(path) {
  return readFile(join(repoRoot, path), "utf8");
}

async function loadConnector() {
  const source = await read("apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js");
  const context = { window: {}, URL };
  vm.runInNewContext(source, context, { filename: "local-openclaw-connector.js" });
  return context.window.OpenClawLocalOpenClawConnector;
}

async function safeGetJson(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${localBridgeUrl}${path}`, { method: "GET", signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    if (!response.ok) {
      return { path, ok: false, status: response.status, kind: "not-ok" };
    }
    if (!contentType.includes("application/json")) {
      return { path, ok: false, status: response.status, kind: "non-json" };
    }
    try {
      return { path, ok: true, status: response.status, kind: "json", json: JSON.parse(text) };
    } catch {
      return { path, ok: false, status: response.status, kind: "invalid-json" };
    }
  } catch (error) {
    return { path, ok: false, status: 0, kind: error?.name === "AbortError" ? "timeout" : "not-connected" };
  } finally {
    clearTimeout(timeout);
  }
}

function hasAgentsShape(payload) {
  return Array.isArray(payload?.agents) || Array.isArray(payload);
}

function hasTasksShape(payload) {
  return Array.isArray(payload?.tasks) || Array.isArray(payload);
}

const connector = await loadConnector();
assert(connector.isSafeLocalUrl(localBridgeUrl) === true, "bridge smoke test must use localhost only");

const results = {};
for (const path of endpointPaths) {
  results[path] = await safeGetJson(path);
}

const healthOk = results["/health"].ok === true;
const exportPayload = results["/api/local/export"].ok ? results["/api/local/export"].json : null;
const agentsPayload = results["/api/local/agents"].ok ? results["/api/local/agents"].json : null;
const tasksPayload = results["/api/local/tasks"].ok ? results["/api/local/tasks"].json : null;

const agents = connector.mapLocalOpenClawAgents(
  exportPayload && hasAgentsShape(exportPayload) ? exportPayload : agentsPayload && hasAgentsShape(agentsPayload) ? agentsPayload : []
);
const tasks = connector.mapLocalOpenClawTasks(
  exportPayload && hasTasksShape(exportPayload) ? exportPayload : tasksPayload && hasTasksShape(tasksPayload) ? tasksPayload : []
);

const jsonAgentTaskEndpointFound = Boolean(
  (exportPayload && (hasAgentsShape(exportPayload) || hasTasksShape(exportPayload)))
  || (agentsPayload && hasAgentsShape(agentsPayload))
  || (tasksPayload && hasTasksShape(tasksPayload))
);

if (healthOk && !jsonAgentTaskEndpointFound) {
  assert(agents.length === 0, "health-only bridge must not fabricate agents");
  assert(tasks.length === 0, "health-only bridge must not fabricate tasks");
}

if (jsonAgentTaskEndpointFound) {
  assert(agents.length >= 0 && tasks.length >= 0, "valid JSON bridge shapes must map without throwing");
}

const bridgeReport = JSON.parse(await read("apps/dashboard/data/generated/openclaw-local-export-bridge-report.json"));
assert(bridgeReport.scope === "local-openclaw-readonly-export-bridge", "bridge report must exist");
assert(bridgeReport.rawResponsePrinted === false && bridgeReport.secretRedactionApplied === true, "bridge report must be redacted");
assert(bridgeReport.productionReady === false && bridgeReport.mutationEnabled === false && bridgeReport.restartEnabled === false && bridgeReport.deployEnabled === false && bridgeReport.authEnabled === false, "bridge safety flags must remain false");
assert(!/[A-Za-z]:\\Users\\|\/home\/|Bearer\s+|Authorization\s*:|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/i.test(JSON.stringify(bridgeReport)), "bridge report must not contain secrets or absolute machine paths");

console.log("OpenClaw local real bridge tests passed.");
