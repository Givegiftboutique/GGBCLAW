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
  { id: "observability", path: "/dashboard/observability", aliases: ["/observability"], label: "Observability" },
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

function getSimulatedRoleState() {
  return window.OpenClawRbacState.getCurrentRoleState();
}

function roleHas(permission) {
  return window.OpenClawRbacPolicy.hasPermission(window.OpenClawRbacState.getCurrentRole(), permission);
}

function renderSimulatedRolePanel() {
  const roleState = getSimulatedRoleState();
  return `
    <article class="panel role-simulation-panel">
      <div class="panel-heading">
        <h2>Read-only role simulation</h2>
        ${badge("simulated only", "success")}
      </div>
      <label class="notes-label" for="simulatedRole">Current simulated role</label>
      <select id="simulatedRole">
        ${window.OpenClawRbacRoles.ROLE_IDS.map((roleId) => {
          const role = window.OpenClawRbacPolicy.getRole(roleId);
          return `<option value="${roleId}" ${roleId === roleState.currentRole ? "selected" : ""}>${role.label}</option>`;
        }).join("")}
      </select>
      <dl class="definition-list compact-list">
        <div><dt>Current role</dt><dd>${escapeHtml(roleState.label)} (${escapeHtml(roleState.currentRole)})</dd></div>
        <div><dt>Storage</dt><dd>memory-only; no localStorage, no sessionStorage, no cookie</dd></div>
        <div><dt>Auth status</dt><dd>no real auth, no token, no production permissions</dd></div>
      </dl>
      ${renderList("Allowed permissions", roleState.allowedPermissions)}
      ${renderList("Denied / unavailable actions", roleState.unavailableActions)}
    </article>
  `;
}

function renderDraftPreview() {
  const stored = window.OpenClawActionDraftStore.getLatestDraft();
  if (!stored) {
    return `
      <article class="panel draft-preview-panel">
        <div class="panel-heading">
          <h2>Action draft preview</h2>
          ${badge("not submitted", "warning")}
        </div>
        <p>No draft generated yet. Draft actions create local JSON previews only.</p>
        <dl class="definition-list compact-list">
          <div><dt>dryRun</dt><dd>true</dd></div>
          <div><dt>mutationEnabled</dt><dd>false</dd></div>
          <div><dt>productionWiring</dt><dd>disabled</dd></div>
          <div><dt>requiresHumanApproval</dt><dd>true</dd></div>
          <div><dt>notSubmitted</dt><dd>true</dd></div>
        </dl>
      </article>
    `;
  }
  return `
    <article class="panel draft-preview-panel">
      <div class="panel-heading">
        <h2>Action draft preview</h2>
        ${badge(stored.validation, stored.validation === "passed" ? "success" : "blocked")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>dryRun</dt><dd>${escapeHtml(String(stored.draft.dryRun))}</dd></div>
        <div><dt>mutationEnabled</dt><dd>${escapeHtml(String(stored.draft.mutationEnabled))}</dd></div>
        <div><dt>productionWiring</dt><dd>${escapeHtml(stored.draft.productionWiring)}</dd></div>
        <div><dt>Human approval</dt><dd>${escapeHtml(String(stored.draft.requiresHumanApproval))}</dd></div>
        <div><dt>notSubmitted</dt><dd>${escapeHtml(String(stored.draft.notSubmitted))}</dd></div>
      </dl>
      ${stored.issues.length ? renderList("Validation issues", stored.issues) : ""}
      <label class="notes-label">Selectable JSON action draft</label>
      <textarea class="json-preview" readonly>${escapeHtml(JSON.stringify(stored.draft, null, 2))}</textarea>
    </article>
  `;
}

function renderReleaseHealthPanel() {
  return `
    <article class="panel release-health-panel">
      <div class="panel-heading">
        <h2>Release / Health</h2>
        ${badge("static-read-only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Release mode</dt><dd>static-read-only</dd></div>
        <div><dt>Safety mode</dt><dd>read-only</dd></div>
        <div><dt>Mutation enabled</dt><dd>false</dd></div>
        <div><dt>Production wiring</dt><dd>disabled</dd></div>
        <div><dt>Supported sources</dt><dd>mock, json, artifact, gateway-stub, local-ingest, dev-gateway</dd></div>
        <div><dt>Quality gate status</dt><dd>local report required before release handoff</dd></div>
        <div><dt>Latest safety scan status</dt><dd>local safety scan report required before release handoff</dd></div>
        <div><dt>Release manifest path</dt><dd>apps/dashboard/data/generated/release-manifest.json</dd></div>
        <div><dt>Local release index path</dt><dd>apps/dashboard/release/local-release-index.json</dd></div>
        <div><dt>Rollback tag suggestion</dt><dd>sprint-12a-internal-release-workflow</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Deploy disabled in scaffold</button>
        <button disabled>Production release requires manual approval</button>
      </div>
    </article>
  `;
}

function renderRealLocalDataPilotPanel() {
  return `
    <article class="panel real-local-pilot-panel">
      <div class="panel-heading">
        <h2>Real Local Data Pilot</h2>
        ${badge("local script only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Generated snapshot path</dt><dd>apps/dashboard/data/generated/real-local-dashboard-export.generated.json</dd></div>
        <div><dt>Browser URL</dt><dd>?source=local-ingest&amp;data=./data/generated/real-local-dashboard-export.generated.json</dd></div>
        <div><dt>Refresh drill command</dt><dd>node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs</dd></div>
        <div><dt>Safety mode</dt><dd>read-only</dd></div>
        <div><dt>Mutation enabled</dt><dd>false</dd></div>
        <div><dt>Production wiring</dt><dd>disabled</dd></div>
        <div><dt>Absolute paths</dt><dd>absolute paths redacted</dd></div>
        <div><dt>Secrets</dt><dd>secrets redacted</dd></div>
        <div><dt>Production endpoints</dt><dd>production endpoints blocked</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Live import disabled</button>
        <button disabled>Refresh via local script only</button>
      </div>
    </article>
  `;
}

function getObservabilityPreview() {
  return window.OpenClawObservabilityEvaluator.evaluateObservability({
    metrics: dashboardAdapter.getMetrics(),
    agents: dashboardAdapter.getAgents(),
    tasks: dashboardAdapter.getTasks(),
    reviews: dashboardAdapter.getReviews(),
    logs: dashboardAdapter.getLogs(),
    backups: dashboardAdapter.getBackups(),
    settings: dashboardAdapter.getSettings(),
    sourceStatus,
    qualityGateReport: { result: "pass" },
    safetyScanReport: { result: "pass" },
    releaseManifest: {
      releaseId: "dashboard-local-release-ui-preview",
      generatedAt: new Date().toISOString(),
      dashboard: {
        mode: "static-read-only",
        safetyMode: "read-only",
        mutationEnabled: false,
        productionWiring: "disabled"
      }
    }
  });
}

function getProductionReadinessPreview() {
  return window.OpenClawReadinessEvaluator.evaluateProductionReadiness({
    observabilityReport: getObservabilityPreview(),
    releaseManifest: {
      dashboard: {
        mode: "static-read-only",
        safetyMode: "read-only",
        mutationEnabled: false,
        productionWiring: "disabled"
      }
    }
  });
}

function renderObservabilitySummaryPanel() {
  const report = getObservabilityPreview();
  const topAlerts = report.alerts.slice(0, 5);
  return `
    <article class="panel observability-panel">
      <div class="panel-heading">
        <h2>Observability summary</h2>
        ${badge("local-preview-only", "success")}
      </div>
      <section class="mini-metric-grid">
        <div><strong>${report.summary.critical}</strong><span>Critical</span></div>
        <div><strong>${report.summary.warning}</strong><span>Warning</span></div>
        <div><strong>${report.summary.info}</strong><span>Info</span></div>
        <div><strong>${report.summary.total}</strong><span>Total alerts</span></div>
      </section>
      <dl class="definition-list compact-list">
        <div><dt>Notification mode</dt><dd>${report.notificationMode}</dd></div>
        <div><dt>Notification sent</dt><dd>false</dd></div>
        <div><dt>Safety mode</dt><dd>${report.safetyMode}</dd></div>
        <div><dt>Production wiring</dt><dd>${report.productionWiring}</dd></div>
        <div><dt>Mutation enabled</dt><dd>${String(report.mutationEnabled)}</dd></div>
      </dl>
      ${renderList("Recommended local operator actions", [
        "Review alert preview locally.",
        "Refresh local source data before handoff.",
        "Run quality gate and safety scan.",
        "Do not send webhook, email, Slack, or SMS alerts."
      ])}
      ${topAlerts.length ? renderAlertPreviewList(topAlerts) : "<p>No local alert previews are open.</p>"}
      <div class="button-row">
        <button disabled>Acknowledge disabled in scaffold</button>
        <button disabled>External alert delivery disabled</button>
      </div>
    </article>
  `;
}

function renderProductionReadinessPanel() {
  const report = getProductionReadinessPreview();
  return `
    <article class="panel readiness-panel">
      <div class="panel-heading">
        <h2>Production readiness summary</h2>
        ${badge(report.recommendation, "blocked")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Scope</dt><dd>${report.scope}</dd></div>
        <div><dt>Production deploy</dt><dd>${String(report.productionDeploy)}</dd></div>
        <div><dt>Recommendation</dt><dd>${report.recommendation}</dd></div>
        <div><dt>Internal beta status</dt><dd>${report.internalOperatorBetaStatus}</dd></div>
        <div><dt>Safety mode</dt><dd>${report.safetyMode}</dd></div>
        <div><dt>Production wiring</dt><dd>${report.productionWiring}</dd></div>
        <div><dt>Mutation enabled</dt><dd>${String(report.mutationEnabled)}</dd></div>
      </dl>
      <section class="mini-metric-grid">
        <div><strong>${report.summary.pass}</strong><span>Pass</span></div>
        <div><strong>${report.summary.warning}</strong><span>Warning</span></div>
        <div><strong>${report.summary.blocker}</strong><span>Blocker</span></div>
        <div><strong>${report.summary.notApplicable}</strong><span>N/A</span></div>
      </section>
      ${renderList("Known blockers", report.knownBlockers.slice(0, 6))}
      ${renderList("Required before production", report.requiredBeforeProduction)}
    </article>
  `;
}

function renderAlertPreviewList(alerts) {
  return `
    <div class="alert-preview-list">
      ${alerts.map((alert) => `
        <div class="alert-preview-row ${alert.severity}">
          ${badge(alert.severity, alert.severity)}
          <div>
            <strong>${escapeHtml(alert.title)}</strong>
            <span>${escapeHtml(alert.type)} - ${escapeHtml(alert.entityType)}:${escapeHtml(alert.entityId)}</span>
            <small>${escapeHtml(alert.recommendedAction)}</small>
          </div>
        </div>
      `).join("")}
    </div>
  `;
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
    <span>Mutation enabled: ${escapeHtml(String(sourceStatus.mutationEnabled ?? false))}</span>
    <span>Ingest file: ${escapeHtml(sourceStatus.currentSource === "local-ingest" ? sourceStatus.dataUrl : "n/a")}</span>
    <span>Base URL: ${escapeHtml(sourceStatus.currentSource === "dev-gateway" ? sourceStatus.dataUrl || sourceStatus.baseUrlState || "missing" : "n/a")}</span>
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
    observability: renderObservability,
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
          <div><dt>Local ingest</dt><dd>${sourceStatus.currentSource === "local-ingest" ? `local-ingest file active: ${escapeHtml(sourceStatus.dataUrl)}` : "Available through ?source=local-ingest"}</dd></div>
          <div><dt>Dev gateway</dt><dd>${sourceStatus.currentSource === "dev-gateway" ? `dev-gateway read-only source active: ${escapeHtml(sourceStatus.dataUrl)}` : "Disabled unless ?source=dev-gateway&baseUrl=... is explicitly provided"}</dd></div>
          <div><dt>Actions</dt><dd>Approve, reject, retry, cancel, export, and restore are mock-only</dd></div>
          <div><dt>Memory</dt><dd>Task changelog stored in Markdown</dd></div>
          <div><dt>Secrets</dt><dd>No secret refs loaded in scaffold</dd></div>
        </dl>
      </article>
      ${renderReleaseHealthPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
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
      <div class="content-grid">
        ${renderSimulatedRolePanel()}
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
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="approve" data-review-id="${escapeHtml(review.id)}">Generate approve draft</button>
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="reject" data-review-id="${escapeHtml(review.id)}">Generate reject draft</button>
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="needs_changes" data-review-id="${escapeHtml(review.id)}">Generate needs changes draft</button>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
      ${renderDraftPreview()}
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
        <div class="button-row">
          <button ${roleHas("backups:draft_verification") ? "" : "disabled"} data-backup-draft-id="${escapeHtml(backups[0]?.id ?? "")}">Generate backup verification draft</button>
        </div>
      </aside>
      ${renderDraftPreview()}
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
        <div class="button-row">
          <button ${roleHas("admin:view_config") ? "" : "disabled"} data-settings-draft="request">Generate settings change request draft</button>
        </div>
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
      ${renderSimulatedRolePanel()}
      ${renderDraftPreview()}
      ${renderReleaseHealthPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      ${renderQualityGateStatus()}
      ${renderImportExportContract()}
    </section>
  `;
}

function renderObservability() {
  const report = getObservabilityPreview();
  const readiness = getProductionReadinessPreview();
  return `
    <section class="content-grid two-col">
      ${renderRealLocalDataPilotPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Alert preview list</h2>
          ${badge("notificationSent false", "success")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Alert</th><th>Severity</th><th>Status</th><th>Entity</th><th>Local action</th><th>Delivery</th></tr></thead>
            <tbody>
              ${report.alerts.map((alert) => `
                <tr>
                  <td><strong>${escapeHtml(alert.title)}</strong><small>${escapeHtml(alert.type)}</small></td>
                  <td>${badge(alert.severity, alert.severity)}</td>
                  <td>${escapeHtml(alert.status)}</td>
                  <td>${escapeHtml(alert.entityType)} / ${escapeHtml(alert.entityId)}</td>
                  <td>${escapeHtml(alert.recommendedAction)}</td>
                  <td>localOnly ${String(alert.localOnly)}; notificationSent ${String(alert.notificationSent)}</td>
                </tr>
              `).join("") || renderEmptyRow(6, "No local alert previews are open.")}
            </tbody>
          </table>
        </div>
        <div class="button-row">
          <button disabled>Acknowledge disabled in scaffold</button>
          <button disabled>External alert delivery disabled</button>
        </div>
      </article>
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Readiness checklist</h2>
          ${badge("production deploy false", "blocked")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Category</th><th>Status</th><th>Evidence</th></tr></thead>
            <tbody>
              ${readiness.checks.map((check) => `
                <tr>
                  <td><strong>${escapeHtml(check.title)}</strong><small>${escapeHtml(check.category)}</small></td>
                  <td>${badge(check.status, check.status === "pass" ? "success" : check.status === "blocker" ? "blocked" : "warning")}</td>
                  <td>${escapeHtml(check.evidence)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
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
        <div><dt>Local ingest tests</dt><dd>local-ingest samples map to the Dashboard model without unsafe values</dd></div>
        <div><dt>Dev gateway tests</dt><dd>dev-gateway config blocks unsafe base URLs and keeps credentials omitted</dd></div>
        <div><dt>RBAC policy tests</dt><dd>RBAC stub verifies simulated roles, draft-only permissions, and forbidden mutation permissions absent</dd></div>
        <div><dt>Action draft tests</dt><dd>Action drafts validate dryRun true, mutationEnabled false, productionWiring disabled, and notSubmitted true</dd></div>
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
        <div><dt>Supported sources</dt><dd>mock, json, artifact, gateway-stub, local-ingest, dev-gateway</dd></div>
        <div><dt>Gateway stub source</dt><dd>gateway-stub read-only contract fixtures</dd></div>
        <div><dt>Local ingest source</dt><dd>local-ingest JSON files only; CSV parsing is future work</dd></div>
        <div><dt>Dev gateway source</dt><dd>dev-gateway read-only GET with credentials omitted</dd></div>
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
  const roleMatrix = window.OpenClawRbacPolicy.getRoleMatrix();
  const permissions = window.OpenClawRbacPermissions.REQUIRED_PERMISSIONS;
  const forbidden = window.OpenClawRbacPermissions.FORBIDDEN_MUTATION_PERMISSIONS;
  return `
    <section class="content-grid">
      ${renderSimulatedRolePanel()}
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Role matrix</h2>
          ${badge("RBAC scaffold")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Role</th><th>Description</th><th>Allowed permissions</th><th>Denied / unavailable actions</th></tr></thead>
            <tbody>
              ${roleMatrix
                .map(
                  (entry) => `
                  <tr>
                    <td><strong>${escapeHtml(entry.label)}</strong><small>${escapeHtml(entry.roleId)}</small></td>
                    <td>${escapeHtml(entry.description)}</td>
                    <td>${entry.permissions.map(escapeHtml).join("; ")}</td>
                    <td>${[...entry.deniedPermissions, ...entry.forbiddenActions].map(escapeHtml).join("; ")}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Permission matrix</h2>
          ${badge("draft-only permissions")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Permission</th>${window.OpenClawRbacRoles.ROLE_IDS.map((roleId) => `<th>${escapeHtml(roleId)}</th>`).join("")}</tr></thead>
            <tbody>
              ${permissions
                .map(
                  (permission) => `
                    <tr>
                      <td>${escapeHtml(permission)}</td>
                      ${window.OpenClawRbacRoles.ROLE_IDS.map((roleId) => `<td>${window.OpenClawRbacPolicy.hasPermission(roleId, permission) ? "allowed" : "denied"}</td>`).join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>Agent permission overview</h2>
          ${badge("existing agent guardrails")}
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
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>Guardrail summary</h2>
          ${badge("read-only", "success")}
        </div>
        ${renderList("Simulated auth safety note", ["simulated only", "no real auth", "no token", "no cookie", "no production permissions"])}
        ${renderList("Non-goal forbidden actions", forbidden)}
      </article>
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
          <div><dt>Data sources</dt><dd>mock, json, artifact, generated snapshot, gateway-stub, local-ingest, and dev-gateway sources are supported for local inspection.</dd></div>
          <div><dt>Gateway-stub mode</dt><dd>Use ?source=gateway-stub to load read-only fixture responses mapped through the gateway contract mapper.</dd></div>
          <div><dt>Local-ingest mode</dt><dd>Use ?source=local-ingest or ?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json to load local JSON ingest files.</dd></div>
          <div><dt>Dev-gateway mode</dt><dd>Use ?source=dev-gateway&baseUrl=http://localhost:8787 for explicit read-only dev gateway checks.</dd></div>
          <div><dt>RBAC stub</dt><dd>Roles viewer, operator, reviewer, admin, and audit-only are simulated in memory only; no real login, no token, no cookie, and no production permissions.</dd></div>
          <div><dt>Action drafts</dt><dd>Review, backup, settings, and export action drafts are local JSON previews with dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.</dd></div>
          <div><dt>Release workflow</dt><dd>Generate local release manifest, local release index, and verify local release before any manual internal static hosting handoff.</dd></div>
          <div><dt>Observability</dt><dd>Local alert preview only; notification mode local-preview-only and notificationSent false.</dd></div>
          <div><dt>Production readiness</dt><dd>Scope internal-operator-beta; recommendation no-go-for-production until production blockers are resolved.</dd></div>
          <div><dt>Production wiring</dt><dd>disabled in scaffold</dd></div>
        </dl>
      </article>
      ${renderReleaseHealthPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      <article class="panel">
        <div class="panel-heading">
          <h2>Local acceptance</h2>
          ${badge("quality gates")}
        </div>
        <dl class="definition-list">
          <div><dt>How to run local server</dt><dd>From apps/dashboard, run python -m http.server 5173 and open http://localhost:5173/.</dd></div>
          <div><dt>How to run quality gates</dt><dd>Run node apps/dashboard/scripts/run-dashboard-quality-gates.mjs from the repository root.</dd></div>
          <div><dt>Gateway Contract Tests</dt><dd>Run node apps/dashboard/scripts/test-gateway-contract.mjs to validate local gateway-stub fixtures and mapper output.</dd></div>
          <div><dt>Fixture Diff</dt><dd>Run node apps/dashboard/scripts/diff-gateway-fixtures.mjs to compare current fixtures with the baseline.</dd></div>
          <div><dt>Local ingest test</dt><dd>Run node apps/dashboard/scripts/test-local-ingest.mjs.</dd></div>
          <div><dt>Dev gateway config test</dt><dd>Run node apps/dashboard/scripts/test-dev-gateway-config.mjs.</dd></div>
          <div><dt>RBAC policy test</dt><dd>Run node apps/dashboard/scripts/test-rbac-policy.mjs.</dd></div>
          <div><dt>Action draft sample generator</dt><dd>Run node apps/dashboard/scripts/generate-action-draft-samples.mjs.</dd></div>
          <div><dt>Action draft test</dt><dd>Run node apps/dashboard/scripts/test-action-drafts.mjs.</dd></div>
          <div><dt>Release manifest</dt><dd>Run node apps/dashboard/scripts/generate-release-manifest.mjs.</dd></div>
          <div><dt>Local release bundle index</dt><dd>Run node apps/dashboard/scripts/create-local-release-bundle.mjs.</dd></div>
          <div><dt>Local release verification</dt><dd>Run node apps/dashboard/scripts/verify-local-release.mjs.</dd></div>
          <div><dt>Observability report</dt><dd>Run node apps/dashboard/scripts/generate-observability-report.mjs.</dd></div>
          <div><dt>Observability tests</dt><dd>Run node apps/dashboard/scripts/test-observability.mjs.</dd></div>
          <div><dt>Production readiness report</dt><dd>Run node apps/dashboard/scripts/generate-production-readiness-report.mjs.</dd></div>
          <div><dt>Production readiness tests</dt><dd>Run node apps/dashboard/scripts/test-production-readiness.mjs.</dd></div>
          <div><dt>Final Beta Audit</dt><dd>Run node apps/dashboard/scripts/generate-final-beta-audit.mjs and node apps/dashboard/scripts/verify-final-beta.mjs.</dd></div>
          <div><dt>Baseline policy</dt><dd>Regenerate baseline only for intentional contract fixture updates; do not regenerate baseline just to hide a breaking change.</dd></div>
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
        ${renderList("What to do if draft generation is disabled", [
          "Switch the simulated role in RBAC or Settings.",
          "Confirm the selected role has only draft permissions.",
          "Remember action drafts are not submitted and never mutate settings, reviews, or backups."
        ])}
        ${renderList("What to do before internal static handoff", [
          "Run the one-command quality gate.",
          "Generate the release manifest and local release index.",
          "Run local release verification.",
          "Review Git status manually before commit, push, or tag."
        ])}
        ${renderList("What to do when local alerts appear", [
          "Review the alert preview locally.",
          "Refresh local source data and rerun quality gates.",
          "Do not send external notifications from the scaffold."
        ])}
        ${renderList("What counts as a breaking change", [
          "Missing gateway fixture file, endpoint, or response section.",
          "Missing task lifecycle state or 8-agent coverage.",
          "Mutation enabled, safety mode changed, unsafe value, or production wiring not disabled."
        ])}
        ${renderList("Dev gateway safe URL rules", [
          "Allowed examples: http://localhost:8787 and http://127.0.0.1:8787.",
          "Blocked examples: production-like HTTPS hosts and hosts containing prod, production, live, real, secret, or token.",
          "No credentials, no auth headers, no cookies, and no token storage are allowed."
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
          "do not add real login, token handling, or cookie handling",
          "do not run production deploy",
          "do not add GitHub Actions or CI",
          "do not send webhook, email, Slack, or SMS alerts",
          "do not mark the dashboard production-ready",
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

  const simulatedRole = document.querySelector("#simulatedRole");
  if (simulatedRole) {
    simulatedRole.addEventListener("change", () => {
      window.OpenClawRbacState.setCurrentRole(simulatedRole.value);
      renderShell();
    });
  }

  document.querySelectorAll("[data-review-draft-intent]").forEach((button) => {
    button.addEventListener("click", () => {
      const review = dashboardAdapter.getReviews().find((item) => item.id === button.dataset.reviewId);
      const draft = window.OpenClawActionDraftBuilder.buildReviewDecisionDraft(review, button.dataset.reviewDraftIntent, window.OpenClawRbacState.getCurrentRole());
      window.OpenClawActionDraftStore.setLatestDraft(draft);
      renderShell();
    });
  });

  document.querySelectorAll("[data-backup-draft-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const backup = dashboardAdapter.getBackups().find((item) => item.id === button.dataset.backupDraftId);
      const draft = window.OpenClawActionDraftBuilder.buildBackupVerificationDraft(backup, window.OpenClawRbacState.getCurrentRole());
      window.OpenClawActionDraftStore.setLatestDraft(draft);
      renderShell();
    });
  });

  const settingsDraft = document.querySelector("[data-settings-draft]");
  if (settingsDraft) {
    settingsDraft.addEventListener("click", () => {
      const draft = window.OpenClawActionDraftBuilder.buildSettingsChangeRequestDraft(dashboardAdapter.getSettings(), window.OpenClawRbacState.getCurrentRole());
      window.OpenClawActionDraftStore.setLatestDraft(draft);
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
