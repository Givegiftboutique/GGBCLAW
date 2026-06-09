(function () {
let dashboardAdapter = window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
let sourceStatus = dashboardAdapter.sourceStatus;

const routes = [
  { id: "overview", path: "/dashboard", aliases: ["/"], label: "Overview" },
  { id: "agents", path: "/dashboard/agents", aliases: ["/agents"], label: "Agents" },
  { id: "tasks", path: "/dashboard/tasks", aliases: ["/tasks"], label: "Tasks" },
  { id: "reviews", path: "/dashboard/reviews", aliases: ["/reviews"], label: "Reviews" },
  { id: "logs", path: "/dashboard/logs", aliases: ["/logs"], label: "Logs" },
  { id: "backups", path: "/dashboard/backups", aliases: ["/backups"], label: "Backups" },
  { id: "settings", path: "/dashboard/settings", aliases: ["/settings"], label: "Settings" },
  { id: "rbac", path: "/dashboard/rbac", aliases: ["/rbac"], label: "RBAC" },
  { id: "runbook", path: "/dashboard/help", aliases: ["/help", "/runbook"], label: "Runbook" }
];

const routeView = document.querySelector("#routeView");
const navList = document.querySelector("#navList");
const pageTitle = document.querySelector("#pageTitle");
const statusStrip = document.querySelector("#statusStrip");

const state = {
  route: "overview",
  agentId: dashboardAdapter.getAgents()[0].id,
  taskId: dashboardAdapter.getTasks()[0].id,
  taskStatus: "all",
  taskPriority: "all",
  logSearch: "",
  logSeverity: "all"
};

function badge(value, extra = "") {
  return `<span class="badge ${extra}">${value}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderNav() {
  navList.innerHTML = routes
    .map(
      (route) => `
        <button class="nav-item ${state.route === route.id ? "active" : ""}" data-route="${route.id}">
          <span>${route.label}</span>
          <small>${route.path}</small>
        </button>
      `
    )
    .join("");
}

function renderSourceStatus() {
  const rows = window.OpenClawSourceStatus.sourceStatusToRows(sourceStatus);
  statusStrip.innerHTML = `
    <span>Data source: ${escapeHtml(sourceStatus.currentSource)}</span>
    <span>Health: ${escapeHtml(sourceStatus.health)}</span>
    <span>Validation: ${escapeHtml(sourceStatus.validation)}</span>
    <span>Fallback: ${escapeHtml(sourceStatus.fallback)}</span>
    <span>Fallback reason: ${escapeHtml(sourceStatus.fallbackReason || "none")}</span>
    <span>Safety mode: read-only</span>
    <span>Production wiring: ${escapeHtml(sourceStatus.productionWiring || "disabled")}</span>
    <span>Last loaded: ${escapeHtml(sourceStatus.lastLoadedAt)}</span>
  `;
  return rows;
}

function renderShell() {
  renderNav();
  renderSourceStatus();
  const route = routes.find((item) => item.id === state.route) ?? routes[0];
  pageTitle.textContent = route.label;
  const renderers = {
    overview: renderOverview,
    agents: renderAgents,
    tasks: renderTasks,
    reviews: renderReviews,
    logs: renderLogs,
    backups: renderBackups,
    settings: renderSettings,
    rbac: renderRbac,
    runbook: renderRunbook
  };
  routeView.innerHTML = renderRouteStates(route.label) + renderers[route.id]();
  bindRouteEvents();
}

function renderRouteStates(label) {
  return `
    <div class="state-grid" aria-label="${label} scaffold states">
      <div class="state-pill loading">Loading: mock shimmer ready</div>
      <div class="state-pill empty">Empty: no records placeholder ready</div>
      <div class="state-pill error">Error: read-only fallback ready</div>
    </div>
  `;
}

function renderAdapterError(error) {
  return `
    <section class="panel error-panel">
      <div class="panel-heading">
        <h2>Adapter error</h2>
        ${badge("read-only fallback", "blocked")}
      </div>
      <p>${escapeHtml(error.message ?? "Dashboard adapter failed to load mock data.")}</p>
    </section>
  `;
}

function renderOverview() {
  const metrics = dashboardAdapter.getMetrics();
  const recentEvents = dashboardAdapter.getLogs().slice(0, 4);
  const statusRows = window.OpenClawSourceStatus.sourceStatusToRows(sourceStatus);
  return `
    <section class="metric-grid">
      ${metrics.map(renderMetricCard).join("")}
    </section>
    <section class="content-grid two-col">
      <article class="panel">
        <div class="panel-heading">
          <h2>Data source status</h2>
          ${badge(sourceStatus.health, sourceStatus.health === "ok" ? "success" : "warning")}
        </div>
        <dl class="definition-list">
          ${statusRows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>Recent activity</h2>
          ${badge("trace viewer")}
        </div>
        <div class="activity-list">
          ${recentEvents
            .map(
              (event) => `
                <div class="activity-row">
                  <span class="severity ${event.severity}"></span>
                  <div>
                    <strong>${escapeHtml(event.event)}</strong>
                    <span>${event.timestamp} - ${event.actor}</span>
                  </div>
                  ${event.redacted ? badge("redacted", "warning") : ""}
                </div>
              `
            )
            .join("")}
        </div>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>Operations guard</h2>
          ${badge("read-only", "success")}
        </div>
        <dl class="definition-list">
          <div><dt>Runtime</dt><dd>Production OpenClaw disconnected</dd></div>
          <div><dt>Gateway stub</dt><dd>${sourceStatus.currentSource === "gateway-stub" ? "gateway-stub fixture contract active" : "Available through ?source=gateway-stub"}</dd></div>
          <div><dt>Actions</dt><dd>Approve, reject, retry, cancel, export, and restore are mock-only</dd></div>
          <div><dt>Memory</dt><dd>Task changelog stored in Markdown</dd></div>
          <div><dt>Secrets</dt><dd>No secret refs loaded in scaffold</dd></div>
        </dl>
      </article>
      ${renderQualityGateStatus()}
      ${renderImportExportContract()}
    </section>
  `;
}

function renderMetricCard(metric) {
  return `
    <article class="metric-card ${metric.status}">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <small>${escapeHtml(metric.trend)}</small>
      <p>${escapeHtml(metric.description)}</p>
    </article>
  `;
}

function renderAgents() {
  const agents = dashboardAdapter.getAgents();
  const selected = dashboardAdapter.getAgentById(state.agentId) ?? agents[0];
  return `
    <section class="content-grid data-detail">
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Agent registry</h2>
          ${badge(`${agents.length} agents`)}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th><th>Role</th><th>Runtime</th><th>Model</th><th>Workspace</th><th>Sandbox</th><th>Tools</th><th>Status</th><th>Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              ${agents
                .map(
                  (agent) => `
                    <tr class="${agent.id === selected.id ? "selected" : ""}" data-agent-id="${agent.id}">
                      <td><strong>${agent.name}</strong><small>${agent.id}</small></td>
                      <td>${agent.role}</td>
                      <td>${agent.runtime}</td>
                      <td>${agent.model}</td>
                      <td>${agent.workspace}</td>
                      <td>${agent.sandbox}</td>
                      <td>${agent.toolsProfile}</td>
                      <td>${badge(agent.status, agent.status)}</td>
                      <td>${agent.lastHeartbeat}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
      ${renderAgentDetail(selected)}
    </section>
  `;
}

function renderAgentDetail(agent) {
  return `
    <aside class="panel detail-panel">
      <div class="panel-heading">
        <h2>${agent.name}</h2>
        ${badge(agent.riskLevel, agent.riskLevel)}
      </div>
      <dl class="definition-list">
        <div><dt>Role</dt><dd>${agent.role}</dd></div>
        <div><dt>Workspace scope</dt><dd>${agent.workspace}</dd></div>
        <div><dt>Tool profile</dt><dd>${agent.toolsProfile}</dd></div>
      </dl>
      ${renderList("Responsibilities", agent.responsibilities)}
      ${renderList("Allowed actions", agent.allowedActions)}
      ${renderList("Denied actions", agent.deniedActions)}
    </aside>
  `;
}

function renderTasks() {
  const filtered = dashboardAdapter.getTasks({
    status: state.taskStatus,
    priority: state.taskPriority
  });
  const selected = dashboardAdapter.getTaskById(state.taskId) ?? filtered[0] ?? dashboardAdapter.getTasks()[0];
  return `
    <section class="content-grid data-detail">
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Task queue</h2>
          <div class="filters">
            ${renderSelect("taskStatus", ["all", "queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"], state.taskStatus)}
            ${renderSelect("taskPriority", ["all", "P0", "P1", "P2", "P3"], state.taskPriority)}
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th><th>Workflow</th><th>Status</th><th>Priority</th><th>Attempt</th><th>Owner</th><th>Reviewer</th><th>Created</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(renderTaskRow).join("") || renderEmptyRow(9, "No tasks match the selected filters.")}
            </tbody>
          </table>
        </div>
      </article>
      ${renderTaskDetail(selected)}
    </section>
  `;
}

function renderTaskRow(task) {
  return `
    <tr class="${task.id === state.taskId ? "selected" : ""}" data-task-id="${task.id}">
      <td><strong>${task.id}</strong><small>${task.summary}</small></td>
      <td>${task.workflow}</td>
      <td>${badge(task.status, task.status)}</td>
      <td>${badge(task.priority)}</td>
      <td>${task.attempt}</td>
      <td>${task.ownerAgent}</td>
      <td>${task.reviewer}</td>
      <td>${task.createdAt}</td>
      <td>${task.updatedAt}</td>
    </tr>
  `;
}

function renderTaskDetail(task) {
  if (!task) {
    return `<aside class="panel detail-panel empty-panel"><h2>No task selected</h2><p>Select another filter to show task details.</p></aside>`;
  }
  const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
  return `
    <aside class="panel detail-panel">
      <div class="panel-heading">
        <h2>${task.id}</h2>
        ${badge(task.status, task.status)}
      </div>
      <p>${task.summary}</p>
      <div class="lifecycle">
        ${lifecycle.map((item) => `<span class="${item === task.status ? "current" : ""}">${item}</span>`).join("")}
      </div>
      <dl class="definition-list">
        <div><dt>Owner</dt><dd>${task.ownerAgent}</dd></div>
        <div><dt>Reviewer</dt><dd>${task.reviewer}</dd></div>
        <div><dt>Updated</dt><dd>${task.updatedAt}</dd></div>
      </dl>
    </aside>
  `;
}

function renderReviews() {
  const reviews = dashboardAdapter.getReviews();
  return `
    <section class="content-grid two-col">
      ${reviews
        .map(
          (review) => `
            <article class="panel">
              <div class="panel-heading">
                <h2>${review.id}</h2>
                ${badge(review.verdict, review.verdict)}
              </div>
              <dl class="definition-list">
                <div><dt>Task</dt><dd>${review.taskId}</dd></div>
                <div><dt>Reviewer</dt><dd>${review.reviewer}</dd></div>
                <div><dt>Created</dt><dd>${review.createdAt}</dd></div>
              </dl>
              ${renderList("Policy checks", review.policyChecks)}
              <label class="notes-label">Reviewer notes</label>
              <textarea readonly>${review.notes}</textarea>
              <div class="button-row">
                <button disabled>Approve mock</button>
                <button disabled>Reject mock</button>
              </div>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

function renderLogs() {
  const query = state.logSearch.toLowerCase();
  const filtered = dashboardAdapter.getLogs({ severity: state.logSeverity }).filter((event) => {
    const queryOk = !query || `${event.event} ${event.actor} ${event.taskId ?? ""}`.toLowerCase().includes(query);
    return queryOk;
  });
  return `
    <section class="panel table-panel">
      <div class="panel-heading">
        <h2>Trace viewer</h2>
        <div class="filters">
          <input id="logSearch" value="${escapeHtml(state.logSearch)}" placeholder="Search traces" />
          ${renderSelect("logSeverity", ["all", "info", "warning", "error", "critical"], state.logSeverity)}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Trace</th><th>Severity</th><th>Actor</th><th>Message</th><th>Redaction</th><th>Timestamp</th></tr></thead>
          <tbody>
            ${filtered
              .map(
                (event) => `
                  <tr>
                    <td>${event.id}</td>
                    <td>${badge(event.severity, event.severity)}</td>
                    <td>${event.actor}</td>
                    <td>${escapeHtml(event.event)}</td>
                    <td>${event.redacted ? badge("redacted", "warning") : badge("clear", "success")}</td>
                    <td>${event.timestamp}</td>
                  </tr>
                `
              )
              .join("") || renderEmptyRow(6, "No traces match the current search.")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderBackups() {
  const backups = dashboardAdapter.getBackups();
  return `
    <section class="content-grid data-detail">
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Backup manifests</h2>
          ${badge("mock evidence")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Backup</th><th>Task</th><th>Verify</th><th>Checksum</th><th>Storage URI</th><th>Created</th><th>Restore tested</th></tr></thead>
            <tbody>
              ${backups
                .map(
                  (backup) => `
                    <tr>
                      <td>${backup.id}</td>
                      <td>${backup.taskId}</td>
                      <td>${badge(backup.verifyStatus, backup.verifyStatus)}</td>
                      <td>${backup.checksum}</td>
                      <td>${backup.storageUri}</td>
                      <td>${backup.createdAt}</td>
                      <td>${backup.restoreTestedAt ?? "not tested"}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
      <aside class="panel detail-panel">
        <div class="panel-heading">
          <h2>Evidence chain</h2>
          ${badge("read-only")}
        </div>
        ${backups.map((backup) => renderList(backup.id, backup.evidenceChain)).join("")}
      </aside>
    </section>
  `;
}

function renderSettings() {
  const settings = dashboardAdapter.getSettings();
  return `
    <section class="content-grid two-col">
      <article class="panel">
        <div class="panel-heading">
          <h2>Config guard</h2>
          ${badge("mutation disabled", "blocked")}
        </div>
        <dl class="definition-list">
          <div><dt>Gateway auth mode</dt><dd>${settings.gatewayAuthMode}</dd></div>
          <div><dt>Retention</dt><dd>${settings.retentionPolicy}</dd></div>
          <div><dt>Model routing</dt><dd>${settings.modelRouting}</dd></div>
          <div><dt>Secret refs health</dt><dd>${settings.secretRefsHealth}</dd></div>
          <div><dt>Production mutation</dt><dd>${settings.productionMutation}</dd></div>
        </dl>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>MCP servers</h2>
          ${badge("mock list")}
        </div>
        ${renderList("Configured surfaces", settings.mcpServers)}
        <div class="button-row">
          <button disabled>Save settings</button>
          <button disabled>Rotate SecretRef</button>
        </div>
      </article>
      ${renderQualityGateStatus()}
      ${renderImportExportContract()}
    </section>
  `;
}

function renderQualityGateStatus() {
  return `
    <article class="panel">
      <div class="panel-heading">
        <h2>Quality gate status</h2>
        ${badge("local-only", "success")}
      </div>
      <dl class="definition-list">
        <div><dt>Quality gates</dt><dd>Run from local shell before acceptance</dd></div>
        <div><dt>Safety scan</dt><dd>Checks forbidden mutations, production endpoints, and secret-like values</dd></div>
        <div><dt>Verifier</dt><dd>Requires visible route labels, guardrails, and Runbook markers</dd></div>
        <div><dt>Gateway contract</dt><dd>gateway-stub fixtures validate locally with production wiring disabled</dd></div>
        <div><dt>Report path</dt><dd>apps/dashboard/data/generated/quality-gate-report.json</dd></div>
      </dl>
    </article>
  `;
}

function renderImportExportContract() {
  return `
    <article class="panel">
      <div class="panel-heading">
        <h2>Import / Export Contract</h2>
        ${badge("read-only", "success")}
      </div>
      <dl class="definition-list">
        <div><dt>Schema version</dt><dd>dashboard-export-v1</dd></div>
        <div><dt>Supported sources</dt><dd>mock, json, artifact</dd></div>
        <div><dt>Gateway stub source</dt><dd>gateway-stub read-only contract fixtures</dd></div>
        <div><dt>Generated snapshot path</dt><dd>apps/dashboard/data/generated/dashboard-export.generated.json</dd></div>
        <div><dt>Validation status</dt><dd>${escapeHtml(sourceStatus.validation)}</dd></div>
        <div><dt>Mutation enabled</dt><dd>false</dd></div>
        <div><dt>Safety mode</dt><dd>read-only</dd></div>
        <div><dt>Production wiring</dt><dd>disabled</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Import snapshot disabled in scaffold</button>
        <button disabled>Export snapshot via local script only</button>
      </div>
    </article>
  `;
}

function renderRbac() {
  const rbacSummary = dashboardAdapter.getRbacSummary();
  return `
    <section class="panel table-panel">
      <div class="panel-heading">
        <h2>Permission overview</h2>
        ${badge("RBAC scaffold")}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Agent</th><th>Risk</th><th>Allowed actions</th><th>Denied actions</th></tr></thead>
          <tbody>
            ${rbacSummary
              .map(
                (entry) => `
                  <tr>
                    <td><strong>${entry.name}</strong><small>${entry.agentId}</small></td>
                    <td>${badge(entry.riskLevel, entry.riskLevel)}</td>
                    <td>${entry.allowedActions.join("; ")}</td>
                    <td>${entry.deniedActions.join("; ")}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRunbook() {
  return `
    <section class="content-grid two-col">
      <article class="panel">
        <div class="panel-heading">
          <h2>Operator runbook</h2>
          ${badge("read-only", "success")}
        </div>
        <dl class="definition-list">
          <div><dt>What this dashboard is</dt><dd>A mock-only local operations scaffold for reviewing OpenClaw agents, tasks, reviews, logs, backups, settings, RBAC, and source status.</dd></div>
          <div><dt>What this dashboard is not</dt><dd>Not a live gateway client, not an auth surface, and not a mutation console.</dd></div>
          <div><dt>Safe operating rules</dt><dd>Keep production mutations disabled, keep actions read-only, and use local/static sources only.</dd></div>
          <div><dt>Data sources</dt><dd>mock, json, artifact, generated snapshot, and gateway-stub sources are supported for local inspection.</dd></div>
          <div><dt>Gateway-stub mode</dt><dd>Use ?source=gateway-stub to load read-only fixture responses mapped through the gateway contract mapper.</dd></div>
          <div><dt>Production wiring</dt><dd>disabled in scaffold</dd></div>
        </dl>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>Local acceptance</h2>
          ${badge("quality gates")}
        </div>
        <dl class="definition-list">
          <div><dt>How to run local server</dt><dd>From apps/dashboard, run python -m http.server 5173 and open http://localhost:5173/.</dd></div>
          <div><dt>How to run quality gates</dt><dd>Run node apps/dashboard/scripts/run-dashboard-quality-gates.mjs from the repository root.</dd></div>
          <div><dt>How to generate snapshot</dt><dd>Run node apps/dashboard/scripts/generate-dashboard-snapshot.mjs.</dd></div>
          <div><dt>How to validate snapshot</dt><dd>Run node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/generated/dashboard-export.generated.json.</dd></div>
        </dl>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>Troubleshooting</h2>
          ${badge("manual checks")}
        </div>
        ${renderList("What to do if dashboard is blank", [
          "Check the browser console for script or adapter errors.",
          "Confirm index.html loads app.js and all adapter scripts in order.",
          "Open the mock source URL first, then retry the generated snapshot URL."
        ])}
        ${renderList("What to do if source validation fails", [
          "Confirm the local JSON file exists and matches dashboard-export-v1.",
          "Use the snapshot validator before reloading the browser.",
          "Fallback to mock data is expected when validation fails."
        ])}
        ${renderList("What to do if Git has odd root-level files", [
          "Leave unrelated root-level files untouched.",
          "Do not stage junk root files.",
          "Ask for manual review before cleanup."
        ])}
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>What not to do</h2>
          ${badge("guardrails", "blocked")}
        </div>
        ${renderList("Safety checklist", [
          "do not connect production API",
          "do not enable mutation",
          "do not read secrets",
          "do not commit junk root files",
          "do not change deploy workflow"
        ])}
      </article>
    </section>
  `;
}

function renderList(title, items) {
  return `
    <div class="list-block">
      <h3>${title}</h3>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderSelect(id, values, selectedValue) {
  return `
    <select id="${id}">
      ${values.map((value) => `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${value}</option>`).join("")}
    </select>
  `;
}

function renderEmptyRow(columns, message) {
  return `<tr><td colspan="${columns}" class="empty-cell">${message}</td></tr>`;
}

function bindRouteEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => {
      state.route = button.dataset.route;
      history.replaceState(null, "", `#${routes.find((route) => route.id === state.route).path}`);
      renderShell();
    });
  });

  document.querySelectorAll("[data-agent-id]").forEach((row) => {
    row.addEventListener("click", () => {
      state.agentId = row.dataset.agentId;
      renderShell();
    });
  });

  document.querySelectorAll("[data-task-id]").forEach((row) => {
    row.addEventListener("click", () => {
      state.taskId = row.dataset.taskId;
      renderShell();
    });
  });

  const taskStatus = document.querySelector("#taskStatus");
  if (taskStatus) {
    taskStatus.addEventListener("change", () => {
      state.taskStatus = taskStatus.value;
      renderShell();
    });
  }

  const taskPriority = document.querySelector("#taskPriority");
  if (taskPriority) {
    taskPriority.addEventListener("change", () => {
      state.taskPriority = taskPriority.value;
      renderShell();
    });
  }

  const logSearch = document.querySelector("#logSearch");
  if (logSearch) {
    logSearch.addEventListener("input", () => {
      state.logSearch = logSearch.value;
      renderShell();
      document.querySelector("#logSearch")?.focus();
    });
  }

  const logSeverity = document.querySelector("#logSeverity");
  if (logSeverity) {
    logSeverity.addEventListener("change", () => {
      state.logSeverity = logSeverity.value;
      renderShell();
    });
  }
}

function routeFromHash() {
  const hashPath = window.location.hash.replace(/^#/, "");
  const match = routes.find((route) => route.path === hashPath || route.aliases.includes(hashPath));
  if (match) {
    state.route = match.id;
  }
}

window.addEventListener("hashchange", () => {
  routeFromHash();
  renderShell();
});

async function initDashboard() {
  const config = window.OpenClawSourceConfig.parseDashboardSourceConfig(window.location.search);
  dashboardAdapter = await window.OpenClawDashboardAdapters.resolveDashboardDataAdapter(config);
  sourceStatus = dashboardAdapter.sourceStatus;
  state.agentId = dashboardAdapter.getAgents()[0]?.id ?? "";
  state.taskId = dashboardAdapter.getTasks()[0]?.id ?? "";
  routeFromHash();
  renderShell();
}

initDashboard().catch((error) => {
  dashboardAdapter = window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
  sourceStatus = dashboardAdapter.withSourceStatus(window.OpenClawSourceStatus.createSourceStatus({
    currentSource: "mock",
    requestedSource: "error",
    health: "warning",
    validation: "passed",
    fallback: "mock",
    fallbackReason: error.message,
    dataUrl: ""
  })).sourceStatus;
  renderNav();
  renderSourceStatus();
  pageTitle.textContent = "Dashboard error";
  routeView.innerHTML = renderRouteStates("Dashboard error") + renderAdapterError(error);
});
})();
