import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const nodeExe = process.execPath;

const dashboardFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "src/lib/mock-data.js",
  "src/lib/mock-data.ts",
  "src/lib/adapters/types.js",
  "src/lib/adapters/mock-adapter.js",
  "src/lib/adapters/adapter-registry.js",
  "src/lib/adapters/validation.js",
  "src/lib/adapters/json-adapter.js",
  "src/lib/adapters/artifact-adapter.js",
  "src/lib/adapters/gateway-contract-mapper.js",
  "src/lib/adapters/gateway-contract-validation.js",
  "src/lib/adapters/gateway-stub-adapter.js",
  "src/lib/adapters/source-config.js",
  "src/lib/adapters/source-status.js"
];

const requiredRepoFiles = [
  "apps/dashboard/index.html",
  "apps/dashboard/README.md",
  "apps/dashboard/src/lib/mock-data.ts",
  "apps/dashboard/src/lib/adapters/types.js",
  "apps/dashboard/src/lib/adapters/mock-adapter.js",
  "apps/dashboard/src/lib/adapters/adapter-registry.js",
  "apps/dashboard/src/lib/adapters/validation.js",
  "apps/dashboard/src/lib/adapters/json-adapter.js",
  "apps/dashboard/src/lib/adapters/artifact-adapter.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.js",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.js",
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/data/gateway-stub/metrics.json",
  "apps/dashboard/data/gateway-stub/agents.json",
  "apps/dashboard/data/gateway-stub/agent-detail.json",
  "apps/dashboard/data/gateway-stub/tasks.json",
  "apps/dashboard/data/gateway-stub/task-detail.json",
  "apps/dashboard/data/gateway-stub/reviews.json",
  "apps/dashboard/data/gateway-stub/logs.json",
  "apps/dashboard/data/gateway-stub/backups.json",
  "apps/dashboard/data/gateway-stub/settings.json",
  "apps/dashboard/data/gateway-stub/rbac.json",
  "apps/dashboard/data/gateway-stub/source-status.json",
  "apps/dashboard/data/gateway-stub/gateway-export.sample.json",
  "apps/dashboard/data/dashboard-export.sample.json",
  "apps/dashboard/data/agent-registry.sample.json",
  "apps/dashboard/data/task-runs.sample.json",
  "apps/dashboard/data/audit-events.sample.json",
  "apps/dashboard/data/backup-manifests.sample.json",
  "apps/dashboard/data/dashboard-artifact-manifest.sample.json",
  "apps/dashboard/schema/dashboard-export.schema.json",
  "apps/dashboard/schema/artifact-manifest.schema.json",
  "apps/dashboard/schema/README.md",
  "apps/dashboard/scripts/generate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/validate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/gateway-contract-utils.mjs",
  "apps/dashboard/scripts/generate-gateway-contract-baseline.mjs",
  "apps/dashboard/scripts/test-gateway-contract.mjs",
  "apps/dashboard/scripts/diff-gateway-fixtures.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
  "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
  "docs/dashboard/openclaw-dashboard-design.md",
  "docs/dashboard/openclaw-dashboard-roadmap.md",
  "docs/dashboard/openclaw-dashboard-data-model.md",
  "docs/dashboard/openclaw-dashboard-api-contract.md",
  "docs/dashboard/openclaw-dashboard-gateway-contract.md",
  "docs/dashboard/openclaw-dashboard-ui-spec.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-006.md",
  "ops/tasks/TASK-20260609-OC-DASH-007.md",
  "ops/tasks/TASK-20260609-OC-DASH-008.md",
  "ops/specs/dashboard-agent-registry-v1.md",
  "ops/specs/dashboard-task-workflow-v1.md",
  "ops/specs/dashboard-md-memory-v1.md",
  "artifacts/TASK-20260609-OC-DASH-001/README.md",
  "artifacts/TASK-20260609-OC-DASH-006/README.md",
  "artifacts/TASK-20260609-OC-DASH-007/README.md",
  "artifacts/TASK-20260609-OC-DASH-008/README.md"
];

for (const file of dashboardFiles) {
  const body = await readFile(join(here, file), "utf8");
  if (!body.trim()) {
    throw new Error(`${file} is empty`);
  }
}

for (const file of requiredRepoFiles) {
  const body = await readFile(join(root, file), "utf8");
  if (!body.trim()) {
    throw new Error(`${file} is missing or empty`);
  }
}

const runtimeModule = await readFile(join(here, "src/lib/mock-data.js"), "utf8");
const adapterTypes = await readFile(join(here, "src/lib/adapters/types.js"), "utf8");
const validationModule = await readFile(join(here, "src/lib/adapters/validation.js"), "utf8");
const sourceConfigModule = await readFile(join(here, "src/lib/adapters/source-config.js"), "utf8");
const sourceStatusModule = await readFile(join(here, "src/lib/adapters/source-status.js"), "utf8");
const mockAdapterModule = await readFile(join(here, "src/lib/adapters/mock-adapter.js"), "utf8");
const jsonAdapterModule = await readFile(join(here, "src/lib/adapters/json-adapter.js"), "utf8");
const artifactAdapterModule = await readFile(join(here, "src/lib/adapters/artifact-adapter.js"), "utf8");
const gatewayMapperModule = await readFile(join(here, "src/lib/adapters/gateway-contract-mapper.js"), "utf8");
const gatewayValidationModule = await readFile(join(here, "src/lib/adapters/gateway-contract-validation.js"), "utf8");
const gatewayStubAdapterModule = await readFile(join(here, "src/lib/adapters/gateway-stub-adapter.js"), "utf8");
const adapterRegistryModule = await readFile(join(here, "src/lib/adapters/adapter-registry.js"), "utf8");
const requiredAgents = [
  "Orchestrator Agent",
  "Research Agent",
  "Spec Agent",
  "Builder Agent",
  "Reviewer Agent",
  "Release Agent",
  "Monitor Agent",
  "Backup Audit Agent"
];

for (const agent of requiredAgents) {
  if (!runtimeModule.includes(agent)) {
    throw new Error(`Missing mock agent: ${agent}`);
  }
}

const requiredAgentFields = [
  "role",
  "responsibilities",
  "allowedActions",
  "deniedActions",
  "workspace",
  "toolsProfile",
  "riskLevel"
];

for (const field of requiredAgentFields) {
  if (!runtimeModule.includes(`${field}:`)) {
    throw new Error(`Missing agent profile field: ${field}`);
  }
}

const app = await readFile(join(here, "src/app.js"), "utf8");
const html = await readFile(join(here, "index.html"), "utf8");
const qualityGateScript = await readFile(join(here, "scripts/run-dashboard-quality-gates.mjs"), "utf8");
const safetyScanScript = await readFile(join(here, "scripts/safety-scan-dashboard.mjs"), "utf8");
if (!app.includes("getDashboardDataAdapter") || !app.includes("dashboardAdapter.getAgents") || !app.includes("dashboardAdapter.getTasks")) {
  throw new Error("app.js must read dashboard data through the adapter registry.");
}

for (const marker of ["types.js", "validation.js", "mock-adapter.js", "adapter-registry.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load adapter file: ${marker}`);
  }
}

for (const marker of ["json-adapter.js", "artifact-adapter.js", "source-config.js", "source-status.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Phase 03 adapter file: ${marker}`);
  }
}

for (const marker of ["gateway-contract-mapper.js", "gateway-contract-validation.js", "gateway-stub-adapter.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Phase 07 gateway file: ${marker}`);
  }
}

if (!app.includes("parseDashboardSourceConfig") || !app.includes("sourceStatus") || !app.includes("Data source")) {
  throw new Error("app.js must support source query strings and source status UI.");
}

if (!app.includes("gateway-stub") || !app.includes("Production wiring")) {
  throw new Error("app.js must render gateway-stub and production wiring status markers.");
}

for (const marker of ["test-gateway-contract.mjs", "diff-gateway-fixtures.mjs", "gatewayContractTests", "gatewayFixtureDiff", "gatewayBaselinePath", "gatewayDiffReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Phase 08 marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/data/gateway-stub", "gateway-fixture-diff-report.json", "secret-like-assignment", "forbiddenMutationFunctions"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Phase 08 marker: ${marker}`);
  }
}

if (!app.includes("Import / Export Contract") || !app.includes("Mutation enabled") || !app.includes("false")) {
  throw new Error("app.js must render the read-only Import / Export Contract section.");
}

const requiredRoutes = [
  "/dashboard",
  "/dashboard/agents",
  "/dashboard/tasks",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/help"
];

for (const route of requiredRoutes) {
  if (!app.includes(route)) {
    throw new Error(`Missing route: ${route}`);
  }
}

const requiredRouteLabels = ["Overview", "Agents", "Tasks", "Reviews", "Logs", "Backups", "Settings", "RBAC", "Runbook"];
for (const label of requiredRouteLabels) {
  if (!app.includes(`label: "${label}"`)) {
    throw new Error(`Missing route label: ${label}`);
  }
}

const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
for (const status of lifecycle) {
  if (!runtimeModule.includes(`"${status}"`) || !app.includes(`"${status}"`)) {
    throw new Error(`Missing task lifecycle status: ${status}`);
  }
}

const safetyChecks = [
  "<button disabled>Approve mock</button>",
  "<button disabled>Reject mock</button>",
  "mutation disabled",
  "Production mutation",
  "read-only",
  "mock evidence"
];

for (const text of safetyChecks) {
  if (!app.includes(text)) {
    throw new Error(`Missing safety UI text: ${text}`);
  }
}

const visibleMarkers = [
  "Overview",
  "Agents",
  "Tasks",
  "Reviews",
  "Logs",
  "Backups",
  "Settings",
  "RBAC",
  "Runbook",
  "Production mutations disabled",
  "read-only",
  "mock-only scaffold",
  "Quality gate status",
  "Data source",
  "Health",
  "Validation",
  "Fallback",
  "Fallback reason",
  "Safety mode",
  "Production wiring",
  "gateway-stub",
  "Last loaded",
  "Import / Export Contract",
  "What this dashboard is",
  "What this dashboard is not",
  "Safe operating rules",
  "do not connect production API",
  "do not enable mutation",
  "do not read secrets",
  "do not commit junk root files"
];

for (const marker of visibleMarkers) {
  if (!html.includes(marker) && !app.includes(marker)) {
    throw new Error(`Missing visible marker: ${marker}`);
  }
}

const forbiddenPatterns = [
  /password\s*[:=]/i,
  /token\s*[:=]/i,
  /cookie\s*[:=]/i,
  /api[_-]?key\s*[:=]/i,
  /https?:\/\/(?!localhost|127\.0\.0\.1)/i
];

const forbiddenActiveMutations = [
  "approveReview",
  "rejectReview",
  "runBackup",
  "restoreBackup",
  "updateSettings",
  "deleteTask",
  "cancelTask",
  "importSnapshot",
  "exportSnapshotToProduction",
  "connectProductionGateway",
  "productionGatewayClient",
  "fetchProduction",
  "writeGateway",
  "mutateGateway"
];
const activeMutationSources = new Map([
  ["app.js", app],
  ["types.js", adapterTypes],
  ["mock-adapter.js", mockAdapterModule],
  ["json-adapter.js", jsonAdapterModule],
  ["artifact-adapter.js", artifactAdapterModule],
  ["source-config.js", sourceConfigModule],
  ["source-status.js", sourceStatusModule],
  ["gateway-contract-mapper.js", gatewayMapperModule],
  ["gateway-contract-validation.js", gatewayValidationModule],
  ["gateway-stub-adapter.js", gatewayStubAdapterModule],
  ["adapter-registry.js", adapterRegistryModule],
  ["validation.js", validationModule]
]);

for (const [file, body] of activeMutationSources) {
  for (const mutation of forbiddenActiveMutations) {
    if (new RegExp(`\\b${mutation}\\s*\\(`).test(body) || new RegExp(`\\b${mutation}\\s*[:=]\\s*function`).test(body)) {
      throw new Error(`Forbidden active mutation function found in ${file}: ${mutation}`);
    }
  }
}

const scannedFiles = new Map();
for (const file of dashboardFiles) {
  scannedFiles.set(file, await readFile(join(here, file), "utf8"));
}

for (const [file, body] of scannedFiles) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(body)) {
      throw new Error(`Secret-like pattern found in ${file}: ${pattern}`);
    }
  }
}

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = tagName;
    this.id = id;
    this.dataset = {};
    this.listeners = {};
    this.value = "";
    this.className = "";
    this.textContent = "";
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
  }
}

const elements = {
  navList: new FakeElement("nav", "navList"),
  routeView: new FakeElement("section", "routeView"),
  pageTitle: new FakeElement("h1", "pageTitle"),
  statusStrip: new FakeElement("div", "statusStrip")
};

const fakeDocument = {
  title: "OpenClaw Dashboard",
  querySelector(selector) {
    if (selector === "#navList") return elements.navList;
    if (selector === "#routeView") return elements.routeView;
    if (selector === "#pageTitle") return elements.pageTitle;
    if (selector === "#statusStrip") return elements.statusStrip;
    if (selector === "#taskStatus" || selector === "#taskPriority" || selector === "#logSearch" || selector === "#logSeverity") return null;
    return null;
  },
  querySelectorAll(selector) {
    if (selector === "[data-route]") {
      return requiredRouteLabels.map((label) => {
        const button = new FakeElement("button");
        button.dataset.route = label.toLowerCase();
        return button;
      });
    }
    if (selector === "[data-agent-id]" || selector === "[data-task-id]") {
      return [];
    }
    return [];
  }
};

const windowEventListeners = new Map();
const context = vm.createContext({
  window: {
    location: { hash: "", search: "" },
    addEventListener(type, callback) {
      windowEventListeners.set(type, callback);
    }
  },
  document: fakeDocument,
  history: {
    replaceState() {}
  },
  fetch: async (url) => {
    const text = await readFile(join(here, String(url).replace(/^\.\//, "")), "utf8");
    return {
      ok: true,
      status: 200,
      async json() {
        return JSON.parse(text);
      }
    };
  },
  URLSearchParams,
  console
});

vm.runInContext(runtimeModule, context, { filename: "mock-data.js" });
vm.runInContext(adapterTypes, context, { filename: "types.js" });
vm.runInContext(validationModule, context, { filename: "validation.js" });
vm.runInContext(sourceConfigModule, context, { filename: "source-config.js" });
vm.runInContext(sourceStatusModule, context, { filename: "source-status.js" });
vm.runInContext(mockAdapterModule, context, { filename: "mock-adapter.js" });
vm.runInContext(jsonAdapterModule, context, { filename: "json-adapter.js" });
vm.runInContext(artifactAdapterModule, context, { filename: "artifact-adapter.js" });
vm.runInContext(gatewayMapperModule, context, { filename: "gateway-contract-mapper.js" });
vm.runInContext(gatewayValidationModule, context, { filename: "gateway-contract-validation.js" });
vm.runInContext(gatewayStubAdapterModule, context, { filename: "gateway-stub-adapter.js" });
vm.runInContext(adapterRegistryModule, context, { filename: "adapter-registry.js" });
vm.runInContext(app, context, { filename: "app.js" });
await new Promise((resolve) => setTimeout(resolve, 0));

const adapter = context.window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
for (const method of ["getMetrics", "getAgents", "getAgentById", "getTasks", "getTaskById", "getReviews", "getLogs", "getBackups", "getSettings", "getRbacSummary"]) {
  if (typeof adapter[method] !== "function") {
    throw new Error(`Rendered adapter missing method: ${method}`);
  }
}

if (!elements.navList.innerHTML.includes("Overview") || !elements.navList.innerHTML.includes("RBAC") || !elements.navList.innerHTML.includes("Runbook")) {
  throw new Error("Dashboard nav did not render required labels.");
}

const renderedOverview = elements.routeView.innerHTML;
for (const marker of ["Gateway status", "Active agents", "Running tasks", "Failed / lost", "Backup verification", "Recent activity", "Quality gate status"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Overview did not render marker: ${marker}`);
  }
}

for (const marker of ["Data source", "Health", "Validation", "Fallback", "Fallback reason", "Safety mode", "Last loaded"]) {
  if (!elements.statusStrip.innerHTML.includes(marker) && !renderedOverview.includes(marker)) {
    throw new Error(`Source status UI missing marker: ${marker}`);
  }
}

context.window.location.hash = "#/dashboard/help";
windowEventListeners.get("hashchange")?.();
const renderedRunbook = elements.routeView.innerHTML;
for (const marker of ["Operator runbook", "What this dashboard is", "What this dashboard is not", "Safe operating rules", "Data sources", "How to run local server", "How to run quality gates", "How to generate snapshot", "How to validate snapshot", "What to do if dashboard is blank", "What to do if source validation fails", "What to do if Git has odd root-level files", "What not to do"]) {
  if (!renderedRunbook.includes(marker)) {
    throw new Error(`Runbook route did not render marker: ${marker}`);
  }
}

const dashboardExport = JSON.parse(await readFile(join(here, "data/dashboard-export.sample.json"), "utf8"));
const artifactManifest = JSON.parse(await readFile(join(here, "data/dashboard-artifact-manifest.sample.json"), "utf8"));
const gatewayExport = JSON.parse(await readFile(join(here, "data/gateway-stub/gateway-export.sample.json"), "utf8"));
for (const sample of ["agent-registry.sample.json", "task-runs.sample.json", "audit-events.sample.json", "backup-manifests.sample.json"]) {
  JSON.parse(await readFile(join(here, "data", sample), "utf8"));
}

const exportResult = context.window.OpenClawDashboardValidation.validateDashboardExport(dashboardExport);
if (!exportResult.ok) {
  throw new Error(`Sample dashboard export failed validation: ${exportResult.issues.join("; ")}`);
}

const artifactResult = context.window.OpenClawDashboardValidation.validateArtifactManifest(artifactManifest);
if (!artifactResult.ok) {
  throw new Error(`Sample artifact manifest failed validation: ${artifactResult.issues.join("; ")}`);
}

const gatewayFixtureFiles = {
  metrics: "metrics.json",
  agents: "agents.json",
  agentDetail: "agent-detail.json",
  tasks: "tasks.json",
  taskDetail: "task-detail.json",
  reviews: "reviews.json",
  logs: "logs.json",
  backups: "backups.json",
  settings: "settings.json",
  rbac: "rbac.json",
  sourceStatus: "source-status.json"
};
const gatewayFixtures = {};
for (const [key, fileName] of Object.entries(gatewayFixtureFiles)) {
  gatewayFixtures[key] = JSON.parse(await readFile(join(here, "data/gateway-stub", fileName), "utf8"));
}
const gatewayResult = context.window.OpenClawGatewayContractValidation.validateGatewayFixtureSet(gatewayFixtures);
if (!gatewayResult.ok) {
  throw new Error(`Gateway fixture validation failed: ${gatewayResult.issues.join("; ")}`);
}
if (gatewayExport.metadata?.schemaVersion !== "gateway-read-only-v1" || gatewayExport.metadata?.mutationEnabled !== false || gatewayExport.metadata?.productionWiring !== "disabled") {
  throw new Error("Gateway export sample must be read-only with production wiring disabled.");
}

const gatewayAdapter = await context.window.OpenClawDashboardAdapters.resolveDashboardDataAdapter({
  requestedSource: "gateway-stub",
  source: "gateway-stub",
  dataUrl: "./data/gateway-stub",
  fallbackSource: "mock"
});
if (gatewayAdapter.source !== "gateway-stub" || gatewayAdapter.sourceStatus.currentSource !== "gateway-stub") {
  throw new Error("Gateway-stub adapter did not resolve as current source.");
}
if (gatewayAdapter.getAgents().length !== 8) {
  throw new Error("Gateway-stub adapter must expose 8 agents.");
}
for (const status of lifecycle) {
  if (!gatewayAdapter.getTasks().some((task) => task.status === status)) {
    throw new Error(`Gateway-stub adapter missing lifecycle status: ${status}`);
  }
}

function runRequiredCommand(args) {
  const result = spawnSync(nodeExe, args, {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
}

runRequiredCommand(["apps/dashboard/scripts/generate-dashboard-snapshot.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/dashboard-export.sample.json"]);
runRequiredCommand(["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/generated/dashboard-export.generated.json"]);
runRequiredCommand(["apps/dashboard/scripts/test-gateway-contract.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/diff-gateway-fixtures.mjs"]);

const generatedSnapshot = JSON.parse(await readFile(join(here, "data/generated/dashboard-export.generated.json"), "utf8"));
if (generatedSnapshot.metadata?.mutationEnabled !== false || generatedSnapshot.metadata?.safetyMode !== "read-only") {
  throw new Error("Generated snapshot must be read-only with mutationEnabled false.");
}

const gatewayBaseline = JSON.parse(await readFile(join(here, "data/gateway-stub/baseline/gateway-contract-baseline.json"), "utf8"));
if (gatewayBaseline.schemaVersion !== "gateway-contract-baseline-v1" || gatewayBaseline.agentCount !== 8 || gatewayBaseline.mutationEnabled !== false || gatewayBaseline.safetyMode !== "read-only") {
  throw new Error("Gateway baseline summary must be read-only and include 8 agents.");
}
for (const status of lifecycle) {
  if (!gatewayBaseline.taskLifecycleCoverage.includes(status)) {
    throw new Error(`Gateway baseline missing lifecycle status: ${status}`);
  }
}
const gatewayDiffReport = JSON.parse(await readFile(join(here, "data/generated/gateway-fixture-diff-report.json"), "utf8"));
if (gatewayDiffReport.result !== "pass") {
  throw new Error("Gateway fixture diff report must pass.");
}

const renderedShellAndOverview = `${html}\n${renderedOverview}`;
for (const marker of ["mock-only", "read-only", "Production OpenClaw disconnected"]) {
  if (!renderedShellAndOverview.includes(marker)) {
    throw new Error(`Rendered dashboard is missing safety marker: ${marker}`);
  }
}

console.log("OpenClaw dashboard scaffold verification passed.");
