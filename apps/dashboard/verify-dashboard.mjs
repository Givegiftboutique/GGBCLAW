import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

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
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/data/dashboard-export.sample.json",
  "apps/dashboard/data/agent-registry.sample.json",
  "apps/dashboard/data/task-runs.sample.json",
  "apps/dashboard/data/audit-events.sample.json",
  "apps/dashboard/data/backup-manifests.sample.json",
  "apps/dashboard/data/dashboard-artifact-manifest.sample.json",
  "docs/dashboard/openclaw-dashboard-design.md",
  "docs/dashboard/openclaw-dashboard-roadmap.md",
  "docs/dashboard/openclaw-dashboard-data-model.md",
  "docs/dashboard/openclaw-dashboard-api-contract.md",
  "docs/dashboard/openclaw-dashboard-ui-spec.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/specs/dashboard-agent-registry-v1.md",
  "ops/specs/dashboard-task-workflow-v1.md",
  "ops/specs/dashboard-md-memory-v1.md",
  "artifacts/TASK-20260609-OC-DASH-001/README.md"
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

if (!app.includes("parseDashboardSourceConfig") || !app.includes("sourceStatus") || !app.includes("Data source")) {
  throw new Error("app.js must support source query strings and source status UI.");
}

const requiredRoutes = [
  "/dashboard",
  "/dashboard/agents",
  "/dashboard/tasks",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac"
];

for (const route of requiredRoutes) {
  if (!app.includes(route)) {
    throw new Error(`Missing route: ${route}`);
  }
}

const requiredRouteLabels = ["Overview", "Agents", "Tasks", "Reviews", "Logs", "Backups", "Settings", "RBAC"];
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
  "Production mutations disabled",
  "read-only",
  "mock-only scaffold",
  "Data source",
  "Health",
  "Validation",
  "Fallback",
  "Fallback reason",
  "Last loaded"
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

const forbiddenActiveMutations = ["approveReview", "rejectReview", "runBackup", "restoreBackup", "updateSettings"];
const activeMutationSources = new Map([
  ["app.js", app],
  ["types.js", adapterTypes],
  ["mock-adapter.js", mockAdapterModule],
  ["json-adapter.js", jsonAdapterModule],
  ["artifact-adapter.js", artifactAdapterModule],
  ["source-config.js", sourceConfigModule],
  ["source-status.js", sourceStatusModule],
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

const context = vm.createContext({
  window: {
    location: { hash: "", search: "" },
    addEventListener() {}
  },
  document: fakeDocument,
  history: {
    replaceState() {}
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
vm.runInContext(adapterRegistryModule, context, { filename: "adapter-registry.js" });
vm.runInContext(app, context, { filename: "app.js" });
await new Promise((resolve) => setTimeout(resolve, 0));

const adapter = context.window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
for (const method of ["getMetrics", "getAgents", "getAgentById", "getTasks", "getTaskById", "getReviews", "getLogs", "getBackups", "getSettings", "getRbacSummary"]) {
  if (typeof adapter[method] !== "function") {
    throw new Error(`Rendered adapter missing method: ${method}`);
  }
}

if (!elements.navList.innerHTML.includes("Overview") || !elements.navList.innerHTML.includes("RBAC")) {
  throw new Error("Dashboard nav did not render required labels.");
}

const renderedOverview = elements.routeView.innerHTML;
for (const marker of ["Gateway status", "Active agents", "Running tasks", "Failed / lost", "Backup verification", "Recent activity"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Overview did not render marker: ${marker}`);
  }
}

for (const marker of ["Data source", "Health", "Validation", "Fallback", "Fallback reason", "Last loaded"]) {
  if (!elements.statusStrip.innerHTML.includes(marker) && !renderedOverview.includes(marker)) {
    throw new Error(`Source status UI missing marker: ${marker}`);
  }
}

const dashboardExport = JSON.parse(await readFile(join(here, "data/dashboard-export.sample.json"), "utf8"));
const artifactManifest = JSON.parse(await readFile(join(here, "data/dashboard-artifact-manifest.sample.json"), "utf8"));
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

const renderedShellAndOverview = `${html}\n${renderedOverview}`;
for (const marker of ["mock-only", "read-only", "Production OpenClaw disconnected"]) {
  if (!renderedShellAndOverview.includes(marker)) {
    throw new Error(`Rendered dashboard is missing safety marker: ${marker}`);
  }
}

console.log("OpenClaw dashboard scaffold verification passed.");
