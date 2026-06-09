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
  "src/lib/mock-data.ts"
];

const requiredRepoFiles = [
  "apps/dashboard/index.html",
  "apps/dashboard/README.md",
  "apps/dashboard/src/lib/mock-data.ts",
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
  "mock-only scaffold"
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
  pageTitle: new FakeElement("h1", "pageTitle")
};

const fakeDocument = {
  title: "OpenClaw Dashboard",
  querySelector(selector) {
    if (selector === "#navList") return elements.navList;
    if (selector === "#routeView") return elements.routeView;
    if (selector === "#pageTitle") return elements.pageTitle;
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
    location: { hash: "" },
    addEventListener() {}
  },
  document: fakeDocument,
  history: {
    replaceState() {}
  },
  console
});

vm.runInContext(runtimeModule, context, { filename: "mock-data.js" });
vm.runInContext(app, context, { filename: "app.js" });

if (!elements.navList.innerHTML.includes("Overview") || !elements.navList.innerHTML.includes("RBAC")) {
  throw new Error("Dashboard nav did not render required labels.");
}

const renderedOverview = elements.routeView.innerHTML;
for (const marker of ["Gateway status", "Active agents", "Running tasks", "Failed / lost", "Backup verification", "Recent activity"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Overview did not render marker: ${marker}`);
  }
}

const renderedShellAndOverview = `${html}\n${renderedOverview}`;
for (const marker of ["mock-only", "read-only", "Production OpenClaw disconnected"]) {
  if (!renderedShellAndOverview.includes(marker)) {
    throw new Error(`Rendered dashboard is missing safety marker: ${marker}`);
  }
}

console.log("OpenClaw dashboard scaffold verification passed.");
