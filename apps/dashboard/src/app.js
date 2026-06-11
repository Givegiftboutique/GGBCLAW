(function () {
let dashboardAdapter = window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
let sourceStatus = dashboardAdapter.sourceStatus;
const t = window.OpenClawI18n?.t ?? ((key, fallback) => fallback ?? key);

const routes = [
  { id: "overview", path: "/dashboard", aliases: ["/"], label: t("routes.overview", "總覽") },
  { id: "agents", path: "/dashboard/agents", aliases: ["/agents"], label: t("routes.agents", "Agents / 代理程式") },
  { id: "tasks", path: "/dashboard/tasks", aliases: ["/tasks"], label: t("routes.tasks", "任務") },
  { id: "reviews", path: "/dashboard/reviews", aliases: ["/reviews"], label: t("routes.reviews", "審核") },
  { id: "logs", path: "/dashboard/logs", aliases: ["/logs"], label: t("routes.logs", "日誌") },
  { id: "backups", path: "/dashboard/backups", aliases: ["/backups"], label: t("routes.backups", "備份") },
  { id: "observability", path: "/dashboard/observability", aliases: ["/observability"], label: t("routes.observability", "觀測 / Observability") },
  { id: "settings", path: "/dashboard/settings", aliases: ["/settings"], label: t("routes.settings", "設定") },
  { id: "rbac", path: "/dashboard/rbac", aliases: ["/rbac"], label: t("routes.rbac", "權限 / RBAC") },
  { id: "runbook", path: "/dashboard/help", aliases: ["/help", "/runbook"], label: t("routes.runbook", "操作手冊") }
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
        <h2>${t("panels.roleSimulation", "唯讀角色模擬")}</h2>
        ${badge("simulated only / 只作模擬", "success")}
      </div>
      <label class="notes-label" for="simulatedRole">目前模擬角色</label>
      <select id="simulatedRole">
        ${window.OpenClawRbacRoles.ROLE_IDS.map((roleId) => {
          const role = window.OpenClawRbacPolicy.getRole(roleId);
          return `<option value="${roleId}" ${roleId === roleState.currentRole ? "selected" : ""}>${role.label}</option>`;
        }).join("")}
      </select>
      <dl class="definition-list compact-list">
        <div><dt>目前角色</dt><dd>${escapeHtml(roleState.label)} (${escapeHtml(roleState.currentRole)})</dd></div>
        <div><dt>儲存方式</dt><dd>memory-only; no localStorage, no sessionStorage, no cookie</dd></div>
        <div><dt>Auth 狀態</dt><dd>no real auth, no token, no production permissions</dd></div>
      </dl>
      ${renderList("允許權限 / Allowed permissions", roleState.allowedPermissions)}
      ${renderList("拒絕 / 不可用操作", roleState.unavailableActions)}
    </article>
  `;
}

function renderDraftPreview() {
  const stored = window.OpenClawActionDraftStore.getLatestDraft();
  if (!stored) {
    return `
      <article class="panel draft-preview-panel">
        <div class="panel-heading">
          <h2>${t("panels.actionDraftPreview", "操作草稿預覽")}</h2>
          ${badge("not submitted / 尚未提交", "warning")}
        </div>
        <p>尚未產生草稿。操作草稿只會建立本地 JSON 預覽，不會提交。</p>
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
          <h2>${t("panels.actionDraftPreview", "操作草稿預覽")}</h2>
        ${badge(stored.validation, stored.validation === "passed" ? "success" : "blocked")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>dryRun</dt><dd>${escapeHtml(String(stored.draft.dryRun))}</dd></div>
        <div><dt>mutationEnabled</dt><dd>${escapeHtml(String(stored.draft.mutationEnabled))}</dd></div>
        <div><dt>productionWiring</dt><dd>${escapeHtml(stored.draft.productionWiring)}</dd></div>
        <div><dt>需要人工批准</dt><dd>${escapeHtml(String(stored.draft.requiresHumanApproval))}</dd></div>
        <div><dt>notSubmitted</dt><dd>${escapeHtml(String(stored.draft.notSubmitted))}</dd></div>
      </dl>
      ${stored.issues.length ? renderList("Validation issues", stored.issues) : ""}
      <label class="notes-label">可選取的 JSON 操作草稿</label>
      <textarea class="json-preview" readonly>${escapeHtml(JSON.stringify(stored.draft, null, 2))}</textarea>
    </article>
  `;
}

function renderReleaseHealthPanel() {
  return `
    <article class="panel release-health-panel">
      <div class="panel-heading">
        <h2>${t("panels.releaseHealth", "Release / Health 發佈健康狀態")}</h2>
        ${badge("static-read-only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>發佈模式</dt><dd>static-read-only</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${t("safety.mutationFalse", "false（未啟用）")}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${t("safety.disabled", "disabled（已停用）")}</dd></div>
        <div><dt>支援資料來源</dt><dd>mock, json, artifact, gateway-stub, local-ingest, dev-gateway</dd></div>
        <div><dt>品質閘門狀態</dt><dd>交付前需要本地 report</dd></div>
        <div><dt>最新安全掃描狀態</dt><dd>交付前需要本地 safety scan report</dd></div>
        <div><dt>Release manifest 路徑</dt><dd>apps/dashboard/data/generated/release-manifest.json</dd></div>
        <div><dt>Local release index 路徑</dt><dd>apps/dashboard/release/local-release-index.json</dd></div>
        <div><dt>Rollback tag 建議</dt><dd>sprint-12a-internal-release-workflow</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.deployDisabled", "Deploy disabled in scaffold（部署已停用）")}</button>
        <button disabled>Production release requires manual approval（Production 發佈需要人工批准）</button>
      </div>
    </article>
  `;
}

function renderRealLocalDataPilotPanel() {
  return `
    <article class="panel real-local-pilot-panel">
      <div class="panel-heading">
        <h2>${t("panels.realLocalPilot", "真實本地資料試行")}</h2>
        ${badge("local script only / 只限本地 script", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Generated snapshot path / 已生成 snapshot 路徑</dt><dd>apps/dashboard/data/generated/real-local-dashboard-export.generated.json</dd></div>
        <div><dt>Browser URL</dt><dd>?source=local-ingest&amp;data=./data/generated/real-local-dashboard-export.generated.json</dd></div>
        <div><dt>Snapshot 更新演練指令</dt><dd>node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${t("safety.mutationFalse", "false（未啟用）")}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${t("safety.disabled", "disabled（已停用）")}</dd></div>
        <div><dt>絕對路徑</dt><dd>${t("safety.absolutePathsRedacted", "absolute paths redacted（絕對路徑已遮蔽）")}</dd></div>
        <div><dt>敏感值</dt><dd>${t("safety.secretsRedacted", "secrets redacted（敏感值已遮蔽）")}</dd></div>
        <div><dt>Production endpoints</dt><dd>${t("safety.productionEndpointsBlocked", "production endpoints blocked（Production endpoint 已封鎖）")}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.liveImportDisabled", "Live import disabled（即時匯入已停用）")}</button>
        <button disabled>${t("actions.refreshViaScriptOnly", "Refresh via local script only（只可用本地 script 更新）")}</button>
      </div>
    </article>
  `;
}

function renderDevGatewayLiveDrillPanel() {
  return `
    <article class="panel dev-gateway-live-drill-panel">
      <div class="panel-heading">
        <h2>${t("panels.devGatewayLiveDrill", "Dev Gateway Read-only Live Drill / 開發 Gateway 唯讀演練")}</h2>
        ${badge("localhost read-only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>本機 fixture server</dt><dd>node apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs --port 8787</dd></div>
        <div><dt>Browser URL</dt><dd>?source=dev-gateway&amp;baseUrl=http://localhost:8787</dd></div>
        <div><dt>允許 URL</dt><dd>${t("safety.localhostOnly", "只允許 localhost / 127.0.0.1")}</dd></div>
        <div><dt>credentials</dt><dd>${t("safety.credentialsOmit", "credentials: omit（不送 credentials）")}</dd></div>
        <div><dt>Authorization header</dt><dd>${t("safety.noAuthHeader", "Authorization header：未使用")}</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${t("safety.mutationFalse", "false（未啟用）")}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${t("safety.disabled", "disabled（已停用）")}</dd></div>
        <div><dt>Production URL</dt><dd>${t("safety.productionUrlBlocked", "Production URL blocked（Production URL 已封鎖）")}</dd></div>
        <div><dt>Fallback</dt><dd>${t("safety.fallbackChain", "fallback to gateway-stub / generated snapshot / mock")}</dd></div>
        <div><dt>Live drill report path</dt><dd>apps/dashboard/data/generated/dev-gateway-live-drill-report.json</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.liveProductionGatewayDisabled", "Live production gateway disabled（Production Gateway 已停用）")}</button>
        <button disabled>${t("actions.localDrillOnly", "Local drill only（只限本機演練）")}</button>
      </div>
    </article>
  `;
}

function renderOperatorWorkflowPanel() {
  return `
    <article class="panel operator-workflow-panel">
      <div class="panel-heading">
        <h2>${t("panels.operatorDailyWorkflow", "Operator Daily Workflow / Operator 每日流程")}</h2>
        ${badge("local evidence only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>${t("panels.operatorDailyWorkflow", "Operator Daily Workflow / Operator 每日流程")}</dt><dd>node apps/dashboard/scripts/run-operator-daily-workflow.mjs</dd></div>
        <div><dt>${t("panels.incidentDrill", "Incident drill / 事故演練")}</dt><dd>node apps/dashboard/scripts/run-operator-incident-drill.mjs</dd></div>
        <div><dt>${t("panels.evidenceManifest", "Evidence manifest / 證據清單")}</dt><dd>node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs</dd></div>
        <div><dt>Daily summary path</dt><dd>apps/dashboard/data/generated/operator-daily-summary.json</dd></div>
        <div><dt>Incident drill report path</dt><dd>apps/dashboard/data/generated/operator-incident-drill-report.json</dd></div>
        <div><dt>Evidence manifest path</dt><dd>apps/dashboard/data/generated/operator-evidence-manifest.json</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
        <div><dt>notificationSent</dt><dd>${t("safety.notificationFalse", "notificationSent false（未發送通知）")}</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.externalEscalationDisabled", "External escalation disabled（外部升級已停用）")}</button>
        <button disabled>${t("actions.productionIncidentActionDisabled", "Production incident action disabled（Production 事故操作已停用）")}</button>
        <button disabled>${t("actions.mutationDisabled", "Mutation disabled（寫入操作已停用）")}</button>
      </div>
    </article>
  `;
}

function renderInternalStaticHostingPanel() {
  return `
    <article class="panel internal-static-hosting-panel">
      <div class="panel-heading">
        <h2>${t("panels.internalStaticHosting", "Internal Static Hosting Dry Run / 內部靜態 Hosting 演練")}</h2>
        ${badge("static-preview-only", "success")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Preview server command</dt><dd>node apps/dashboard/scripts/start-internal-static-preview.mjs --port 5180</dd></div>
        <div><dt>Dry-run command</dt><dd>node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs</dd></div>
        <div><dt>Access checklist command</dt><dd>node apps/dashboard/scripts/generate-operator-access-checklist.mjs</dd></div>
        <div><dt>Dry-run report path</dt><dd>apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json</dd></div>
        <div><dt>Access checklist path</dt><dd>apps/dashboard/data/generated/operator-access-checklist.json</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
        <div><dt>productionDeploy</dt><dd>false</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.productionDeployDisabled", "Production deploy disabled / Production 部署已停用")}</button>
        <button disabled>${t("actions.publicHostingDisabled", "Public hosting disabled / 公開 hosting 已停用")}</button>
        <button disabled>${t("actions.externalAccessManualApproval", "External access requires manual approval / 外部存取需要人工批准")}</button>
      </div>
    </article>
  `;
}

function renderSecurityPrivacyPanel() {
  return `
    <article class="panel security-privacy-panel">
      <div class="panel-heading">
        <h2>${t("panels.securityPrivacyAudit", "Security / Privacy Audit / 安全與私隱審核")}</h2>
        ${badge("internal review only", "warning")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Security / Privacy Audit</dt><dd>node apps/dashboard/scripts/generate-security-privacy-audit.mjs</dd></div>
        <div><dt>Generated report sanitization</dt><dd>node apps/dashboard/scripts/test-generated-report-sanitization.mjs</dd></div>
        <div><dt>Data Retention Review</dt><dd>node apps/dashboard/scripts/generate-data-retention-review.mjs</dd></div>
        <div><dt>Operator Security Checklist</dt><dd>node apps/dashboard/scripts/generate-operator-security-checklist.mjs</dd></div>
        <div><dt>Security privacy audit report path</dt><dd>apps/dashboard/data/generated/security-privacy-audit-report.json</dd></div>
        <div><dt>Data retention review report path</dt><dd>apps/dashboard/data/generated/data-retention-review-report.json</dd></div>
        <div><dt>Operator security checklist path</dt><dd>apps/dashboard/data/generated/operator-security-checklist.json</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
        <div><dt>retention policy</dt><dd>draft-for-internal-review</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.productionSecurityApprovalDisabled", "Production security approval disabled / Production 安全批准已停用")}</button>
        <button disabled>${t("actions.publicSharingDisabled", "Public sharing disabled / 公開分享已停用")}</button>
      </div>
    </article>
  `;
}

function renderInternalReleaseCandidatePanel() {
  return `
    <article class="panel internal-rc-panel">
      <div class="panel-heading">
        <h2>${t("panels.internalReleaseCandidate", "v1.0.0 Internal Release Candidate / 內部正式候選版")}</h2>
        ${badge("signoffStatus pending", "warning")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Candidate tag</dt><dd>v1.0.0-internal-rc1</dd></div>
        <div><dt>Final internal tag</dt><dd>v1.0.0-internal</dd></div>
        <div><dt>signoffStatus</dt><dd>pending / 等待人工簽核</dd></div>
        <div><dt>Manual sign-off required</dt><dd>manualSignoffRequired true</dd></div>
        <div><dt>productionStatus</dt><dd>${t("safety.noGo", "no-go-for-production / Production 暫不可上線")}</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
        <div><dt>RC report path</dt><dd>apps/dashboard/data/generated/internal-release-candidate-report.json</dd></div>
        <div><dt>Sign-off package path</dt><dd>apps/dashboard/data/generated/internal-signoff-package.json</dd></div>
        <div><dt>Generate RC report</dt><dd>node apps/dashboard/scripts/generate-internal-release-candidate.mjs</dd></div>
        <div><dt>Generate sign-off package</dt><dd>node apps/dashboard/scripts/generate-internal-signoff-package.mjs</dd></div>
        <div><dt>Verify v1 RC</dt><dd>node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.productionReleaseDisabled", "Production release disabled / Production 發佈已停用")}</button>
        <button disabled>${t("actions.signoffCannotBeAutomated", "Sign-off cannot be automated / 簽核不可自動完成")}</button>
        <button disabled>${t("actions.mutationRemainsDisabled", "Mutation remains disabled / 寫入操作維持停用")}</button>
      </div>
    </article>
  `;
}

function renderProductionTrackPanel() {
  return `
    <article class="panel production-track-panel">
      <div class="panel-heading">
        <h2>${t("panels.productionTrackPlanning", "Production Track Planning / Production 路線規劃")}</h2>
        ${badge("planning-only", "blocked")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>Current release</dt><dd>v1.0.0-internal</dd></div>
        <div><dt>productionStatus</dt><dd>no-go-for-production / Production 仍不可上線</dd></div>
        <div><dt>productionTrackStatus</dt><dd>planning-only</dd></div>
        <div><dt>gatewayConnectionStatus</dt><dd>not-connected</dd></div>
        <div><dt>readinessStatus</dt><dd>not-ready</dd></div>
        <div><dt>entryGateStatus</dt><dd>blocked</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>read-only / 唯讀</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
        <div><dt>Reality alignment</dt><dd>Current real operator environment is expected to have only 1 real agent; 8-agent data is mock / fixture / gateway-stub lifecycle test data only.</dd></div>
        <div><dt>Future prerequisite</dt><dd>Fixture Quarantine + Single Agent Truth Alignment before any read-only production gateway implementation.</dd></div>
        <div><dt>Production track report path</dt><dd>apps/dashboard/data/generated/production-track-plan-report.json</dd></div>
        <div><dt>Gateway readiness report path</dt><dd>apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json</dd></div>
        <div><dt>Entry gates report path</dt><dd>apps/dashboard/data/generated/production-entry-gates-report.json</dd></div>
        <div><dt>Generate production track plan</dt><dd>node apps/dashboard/scripts/generate-production-track-plan.mjs</dd></div>
        <div><dt>Generate gateway readiness</dt><dd>node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs</dd></div>
        <div><dt>Generate entry gates</dt><dd>node apps/dashboard/scripts/generate-production-entry-gates.mjs</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>${t("actions.productionGatewayConnectionDisabled", "Production gateway connection disabled / Production Gateway 連線已停用")}</button>
        <button disabled>${t("actions.productionDeployDisabled", "Production deploy disabled / Production 部署已停用")}</button>
        <button disabled>${t("actions.productionApprovalManualOnly", "Production approval cannot be automated / Production 批准不可自動化")}</button>
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
        <h2>${t("panels.observabilitySummary", "觀測摘要")}</h2>
        ${badge("local-preview-only", "success")}
      </div>
      <section class="mini-metric-grid">
        <div><strong>${report.summary.critical}</strong><span>Critical / 嚴重</span></div>
        <div><strong>${report.summary.warning}</strong><span>Warning / 警告</span></div>
        <div><strong>${report.summary.info}</strong><span>Info</span></div>
        <div><strong>${report.summary.total}</strong><span>警示總數</span></div>
      </section>
      <dl class="definition-list compact-list">
        <div><dt>通知模式</dt><dd>${report.notificationMode}</dd></div>
        <div><dt>已送出通知</dt><dd>false（沒有外部通知）</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${report.safetyMode}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${report.productionWiring}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${String(report.mutationEnabled)}</dd></div>
      </dl>
      ${renderList("建議本地 Operator 操作", [
        "在本地檢查警示預覽。",
        "交付前更新本地資料來源。",
        "執行品質閘門和安全掃描。",
        "不要送出 webhook、email、Slack 或 SMS 警示。"
      ])}
      ${topAlerts.length ? renderAlertPreviewList(topAlerts) : "<p>No local alert previews are open.</p>"}
      <div class="button-row">
        <button disabled>Acknowledge disabled in scaffold（確認功能已停用）</button>
        <button disabled>${t("actions.externalAlertDisabled", "External alert delivery disabled（外部通知已停用）")}</button>
      </div>
    </article>
  `;
}

function renderProductionReadinessPanel() {
  const report = getProductionReadinessPreview();
  return `
    <article class="panel readiness-panel">
      <div class="panel-heading">
        <h2>${t("panels.readinessSummary", "Production 就緒狀態摘要")}</h2>
        ${badge(report.recommendation, "blocked")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>範圍</dt><dd>${report.scope}</dd></div>
        <div><dt>Production deploy</dt><dd>${String(report.productionDeploy)}</dd></div>
        <div><dt>建議</dt><dd>${report.recommendation}（Production 暫不可上線）</dd></div>
        <div><dt>Internal beta 狀態</dt><dd>${report.internalOperatorBetaStatus}</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${report.safetyMode}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${report.productionWiring}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${String(report.mutationEnabled)}</dd></div>
      </dl>
      <section class="mini-metric-grid">
        <div><strong>${report.summary.pass}</strong><span>Pass</span></div>
        <div><strong>${report.summary.warning}</strong><span>Warning</span></div>
        <div><strong>${report.summary.blocker}</strong><span>Blocker</span></div>
        <div><strong>${report.summary.notApplicable}</strong><span>N/A</span></div>
      </section>
      ${renderList("已知 blocker", report.knownBlockers.slice(0, 6))}
      ${renderList("Production 前必須完成", report.requiredBeforeProduction)}
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
    <span>${t("status.dataSource", "資料來源")}: ${escapeHtml(sourceStatus.currentSource)}</span>
    <span>${t("status.health", "健康狀態")}: ${escapeHtml(sourceStatus.health)}</span>
    <span>${t("status.validation", "驗證")}: ${escapeHtml(sourceStatus.validation)}</span>
    <span>${t("status.fallback", "回退")}: ${escapeHtml(sourceStatus.fallback)}</span>
    <span>${t("status.fallbackReason", "回退原因")}: ${escapeHtml(sourceStatus.fallbackReason || "none")}</span>
    <span>${t("status.safetyMode", "安全模式")}: read-only（唯讀）</span>
    <span>${t("status.productionWiring", "Production wiring")}: ${escapeHtml(sourceStatus.productionWiring || "disabled")}（已停用）</span>
    <span>${t("status.mutationEnabled", "寫入操作啟用")}: ${escapeHtml(String(sourceStatus.mutationEnabled ?? false))}</span>
    <span>${t("status.ingestFile", "本地匯入檔案")}: ${escapeHtml(sourceStatus.currentSource === "local-ingest" ? sourceStatus.dataUrl : "n/a")}</span>
    <span>Base URL: ${escapeHtml(sourceStatus.currentSource === "dev-gateway" ? sourceStatus.dataUrl || sourceStatus.baseUrlState || "missing" : "n/a")}</span>
    <span>${t("status.lastLoaded", "最後載入")}: ${escapeHtml(sourceStatus.lastLoadedAt)}</span>
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
      <div class="state-pill loading">${t("states.loading", "載入中：mock shimmer 已準備")}</div>
      <div class="state-pill empty">${t("states.empty", "空狀態：無資料提示已準備")}</div>
      <div class="state-pill error">${t("states.error", "錯誤：唯讀回退已準備")}</div>
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

function getSourceTrustClassification() {
  const helper = window.OpenClawSourceTrust;
  const requestedSource = new URLSearchParams(window.location.search).get("source") || sourceStatus.currentSource;
  if (!helper?.getSourceTrustClassification) {
    return {
      source: requestedSource,
      trustLevel: "review-required",
      operatorTruth: false,
      expectedAgentCount: null,
      fixtureData: false,
      requiresReview: true,
      warningZhHant: "資料可信分類尚未載入。",
      warningEn: "Data trust classification is not loaded.",
      allowedForProductionPlanning: false
    };
  }
  return helper.getSourceTrustClassification(requestedSource, {
    validationPassed: sourceStatus.validation === "passed" && sourceStatus.currentSource === requestedSource
  });
}

function getSourceLockdownRule() {
  const helper = window.OpenClawSourceLockdown;
  const requestedSource = new URLSearchParams(window.location.search).get("source") || sourceStatus.currentSource;
  if (!helper?.getSourceLockdownRule) {
    return {
      source: requestedSource,
      operatorRecommended: false,
      requiresExplicitSelection: true,
      requiresDemoAcknowledgement: false,
      defaultAllowed: false,
      warningLevel: "medium",
      recommendedUrl: "?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
      blockedReason: "Source lockdown policy is not loaded.",
      expectedAgentCount: null,
      operatorTruth: false,
      fixtureData: false
    };
  }
  return helper.getSourceLockdownRule(requestedSource);
}

function getDefaultEntryNotice() {
  const helper = window.OpenClawSourceLockdown;
  if (!helper?.getDefaultEntryNotice) {
    return {
      showOperatorSafeNotice: !new URLSearchParams(window.location.search).has("source"),
      operatorRecommendedSource: "local-ingest",
      operatorRecommendedData: "./data/generated/real-local-dashboard-export.single-agent.generated.json",
      operatorRecommendedUrl: "?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
      defaultEntryBehavior: "operator-safe-notice",
      warningLevel: "high",
      messageEn: "No source query was provided. Use the operator recommended single-agent local-ingest URL.",
      messageZhHant: "未指定 source query；請使用 Operator 建議的 single-agent local-ingest URL。"
    };
  }
  return helper.getDefaultEntryNotice(window.location.search);
}

function renderOperatorSourceLockdownPanel() {
  const rule = getSourceLockdownRule();
  const notice = getDefaultEntryNotice();
  const isMock = rule.source === "mock";
  const isGatewayStub = rule.source === "gateway-stub";
  const isLocalIngest = rule.source === "local-ingest";
  const agentCount = dashboardAdapter.getAgents().length;
  const dataUrl = sourceStatus.dataUrl || new URLSearchParams(window.location.search).get("data") || "";
  const isSingleAgentSnapshot = isLocalIngest && dataUrl.includes("real-local-dashboard-export.single-agent.generated.json") && agentCount === 1;
  const tone = rule.warningLevel === "high" || notice.showOperatorSafeNotice ? "blocked" : isLocalIngest ? "success" : "warning";
  return `
    <article class="panel source-lockdown-panel ${tone === "blocked" ? "fixture-warning" : ""}">
      <div class="panel-heading">
        <h2>${t("panels.sourceLockdown", "Operator recommended source / Operator 建議資料來源")}</h2>
        ${badge(rule.warningLevel === "high" ? "high warning" : rule.warningLevel, tone)}
      </div>
      ${notice.showOperatorSafeNotice ? `<p class="source-trust-warning"><strong>No query param => show operator source selection notice + recommended single-agent URL.</strong></p>` : ""}
      ${notice.showOperatorSafeNotice ? `<p>${escapeHtml(notice.messageEn)} ${escapeHtml(notice.messageZhHant)}</p>` : ""}
      <p><strong>local-ingest single-agent snapshot</strong></p>
      <p><code>${escapeHtml(rule.recommendedUrl)}</code></p>
      ${isMock ? `<p class="source-trust-warning"><strong>High warning: Demo fixture data only.</strong> 高風險提示：這只是示範 fixture，不是真實 agents。You are viewing demo fixture data, not real agents.</p>` : ""}
      ${isGatewayStub ? `<p class="source-trust-warning"><strong>High warning: Contract fixture data only.</strong> 高風險提示：這只是合約 fixture，不是真實 production agents。</p>` : ""}
      ${isLocalIngest && isSingleAgentSnapshot ? `<p><strong>Operator truth candidate loaded.</strong> Operator 真實資料候選已載入。Actual real agent count: 1. 實際真實 agent 數量：1。</p>` : ""}
      <dl class="definition-list compact-list">
        <div><dt>Default entry behavior</dt><dd>operator-safe-notice</dd></div>
        <div><dt>Operator recommended source</dt><dd>local-ingest</dd></div>
        <div><dt>Recommended data</dt><dd>./data/generated/real-local-dashboard-export.single-agent.generated.json</dd></div>
        <div><dt>Requires explicit selection</dt><dd>${escapeHtml(String(rule.requiresExplicitSelection))}</dd></div>
        <div><dt>Requires demo acknowledgement</dt><dd>${escapeHtml(String(rule.requiresDemoAcknowledgement))}</dd></div>
        <div><dt>Default allowed as operator truth</dt><dd>${escapeHtml(String(rule.defaultAllowed))}</dd></div>
        <div><dt>Expected real agent count</dt><dd>1</dd></div>
        <div><dt>Production status</dt><dd>no-go-for-production</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Production gateway connection disabled</button>
        <button disabled>Mutation remains disabled</button>
      </div>
    </article>
  `;
}

function getLocalAgentHealthPreview() {
  const agents = dashboardAdapter.getAgents();
  const dataUrl = sourceStatus.dataUrl || new URLSearchParams(window.location.search).get("data") || "";
  const isSingleAgentSnapshot = sourceStatus.currentSource === "local-ingest"
    && dataUrl.includes("real-local-dashboard-export.single-agent.generated.json")
    && agents.length === 1;
  const agent = agents[0] || {};
  const sampleInput = {
    generatedAt: new Date().toISOString(),
    agentHealth: [
      {
        agentId: agent.id || "local-orchestrator",
        displayName: agent.name || "Local Orchestrator",
        expectedRealAgent: isSingleAgentSnapshot,
        source: "local-readonly-health-snapshot",
        status: isSingleAgentSnapshot ? "unknown" : "review-required",
        heartbeatStatus: "unknown",
        lastSeenAt: null,
        healthNotes: [
          "Local read-only health candidate.",
          "No production gateway connection.",
          "No mutation action available."
        ],
        reviewRequired: true
      }
    ]
  };
  const health = window.OpenClawLocalAgentHealth?.evaluateLocalAgentHealth?.(sampleInput) ?? {
    healthConnectionStatus: "local-file-only",
    overallHealthStatus: "review-required",
    agents: sampleInput.agentHealth,
    blockedActions: ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]
  };
  return {
    ...health,
    expectedRealAgentCount: 1,
    actualRealAgentCount: isSingleAgentSnapshot ? 1 : agents.length,
    operatorTruthSource: "local-ingest single-agent snapshot",
    healthSource: "local-file-only",
    reviewedHealthInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
    reviewedHealthExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
    reviewedInputStatus: "missing-fallback-to-sample",
    reportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
    checklistPath: "apps/dashboard/data/generated/operator-agent-health-checklist.json",
    loaded: isSingleAgentSnapshot
  };
}

function getLocalHealthEvidencePreview() {
  const health = getLocalAgentHealthPreview();
  const review = window.OpenClawLocalHealthEvidence?.buildLocalHealthEvidenceReview?.({
    ...health,
    healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json"
  }) ?? {
    evidenceStatus: "missing-fallback",
    acceptedHealthSource: "local-file-only",
    fallbackUsed: true,
    fallbackReason: "missing-reviewed-input",
    redactionApplied: true,
    rawValuesPrinted: false,
    reviewedInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
    reviewedInputExamplePath: "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
    healthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
    blockedActions: ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"],
    warnings: [],
    requiredFollowups: []
  };
  return {
    ...review,
    reportPath: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
    checklistPath: "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json"
  };
}

function renderLocalAgentHealthPanel() {
  const health = getLocalAgentHealthPreview();
  const status = health.loaded ? health.overallHealthStatus : "review-required";
  const tone = status === "online" ? "success" : status === "stale" ? "warning" : "blocked";
  return `
    <article class="panel local-agent-health-panel">
      <div class="panel-heading">
        <h2>${t("panels.localAgentHealth", "Local Real Agent Health / 本地真實 Agent 健康狀態")}</h2>
        ${badge(`health status: ${status}`, tone)}
      </div>
      ${!health.loaded ? `<p class="source-trust-warning"><strong>Local health report not loaded.</strong> 未載入本地健康報告。</p>` : ""}
      <p><strong>Health source: ${escapeHtml(health.healthSource || "local-file-only")}</strong> / 健康來源：本地唯讀檔案或已審核本地 JSON</p>
      <p><strong>Operator truth source: local-ingest single-agent snapshot</strong></p>
      <dl class="definition-list compact-list">
        <div><dt>Expected real agent count</dt><dd>1</dd></div>
        <div><dt>Actual real agent count</dt><dd>${escapeHtml(String(health.actualRealAgentCount))}</dd></div>
        <div><dt>Health status</dt><dd>${escapeHtml(status)}</dd></div>
        <div><dt>Health connection status</dt><dd>local-file-only</dd></div>
        <div><dt>Reviewed local health JSON</dt><dd>${health.reviewedHealthInputPath}</dd></div>
        <div><dt>Reviewed JSON source</dt><dd>local-reviewed-json or local-file-only</dd></div>
        <div><dt>Reviewed input status</dt><dd>${escapeHtml(health.reviewedInputStatus || "missing-fallback-to-sample")}</dd></div>
        <div><dt>Health report path</dt><dd>${health.reportPath}</dd></div>
        <div><dt>Health checklist path</dt><dd>${health.checklistPath}</dd></div>
        <div><dt>Production status</dt><dd>no-go-for-production</dd></div>
        <div><dt>Safety mode</dt><dd>read-only</dd></div>
        <div><dt>mutationEnabled</dt><dd>false</dd></div>
        <div><dt>productionWiring</dt><dd>disabled</dd></div>
      </dl>
      <p class="source-trust-warning"><strong>If reviewed JSON is invalid:</strong> status = review-required; reason = invalid reviewed local health input; operator action = inspect sanitized local health JSON and run manual runbook.</p>
      ${(status === "unknown" || status === "review-required") ? `<p class="source-trust-warning">Health requires local operator review. 健康狀態需要本地 operator 人工確認。</p>` : ""}
      <div class="button-row">
        <button disabled>No restart action available</button>
        <button disabled>No production gateway connection</button>
        <button disabled>No mutation action</button>
      </div>
    </article>
  `;
}

function renderLocalHealthEvidencePanel() {
  const evidence = getLocalHealthEvidencePreview();
  const status = evidence.evidenceStatus || "missing-fallback";
  const tone = status === "reviewed-valid" ? "success" : status === "unsafe-rejected" ? "blocked" : "warning";
  return `
    <article class="panel local-health-evidence-panel">
      <div class="panel-heading">
        <h2>${t("panels.localHealthEvidence", "Local Health Evidence Review / 本地健康證據審核")}</h2>
        ${badge(`evidence status: ${escapeHtml(status)}`, tone)}
      </div>
      <p><strong>Accepted health source: ${escapeHtml(evidence.acceptedHealthSource || "local-file-only")}</strong></p>
      <dl class="definition-list compact-list">
        <div><dt>Evidence status:</dt><dd>${escapeHtml(status)}</dd></div>
        <div><dt>Accepted health source</dt><dd>${escapeHtml(evidence.acceptedHealthSource || "local-file-only")}</dd></div>
        <div><dt>Reviewed input path</dt><dd>${evidence.reviewedInputPath}</dd></div>
        <div><dt>Fallback used:</dt><dd>${evidence.fallbackUsed ? "yes" : "no"}</dd></div>
        <div><dt>Fallback reason:</dt><dd>${escapeHtml(evidence.fallbackReason || "none")}</dd></div>
        <div><dt>Redaction applied:</dt><dd>yes</dd></div>
        <div><dt>Raw values printed:</dt><dd>no</dd></div>
        <div><dt>Evidence report path</dt><dd>${evidence.reportPath}</dd></div>
        <div><dt>Evidence checklist path</dt><dd>${evidence.checklistPath}</dd></div>
      </dl>
      ${status === "missing-fallback" || status === "sample-fallback" ? `<p class="source-trust-warning"><strong>Reviewed local health JSON not provided.</strong> Using safe local-file-only fallback. 未提供已審核本地健康 JSON，正在使用安全 fallback。</p>` : ""}
      ${status === "reviewed-invalid-fallback" || status === "unsafe-rejected" ? `<p class="source-trust-warning"><strong>Reviewed local health JSON rejected.</strong> Raw values were not printed. 已審核 JSON 被拒絕，沒有印出原始值。</p>` : ""}
      ${status === "reviewed-valid" ? `<p class="source-trust-ok"><strong>Reviewed local health JSON accepted.</strong> 已審核本地健康 JSON 已接受。</p>` : ""}
      <div class="button-row">
        <button disabled>No restart action available</button>
        <button disabled>No production gateway connection</button>
        <button disabled>No mutation action</button>
      </div>
    </article>
  `;
}

function getOperatorUsabilityPreview() {
  const agents = dashboardAdapter.getAgents();
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const recommendedUrl = window.OpenClawOperatorUsability?.getOperatorRecommendedUrl?.(baseUrl)
    ?? `${baseUrl}?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json#/dashboard`;
  const context = {
    source: sourceStatus.currentSource,
    agentCount: agents.length,
    healthStatus: health.overallHealthStatus,
    evidenceStatus: evidence.evidenceStatus
  };
  const cards = window.OpenClawOperatorUsability?.buildOperatorHomeCards?.(context) ?? [];
  const warnings = window.OpenClawOperatorUsability?.getOperatorUsabilityWarnings?.(context) ?? [];
  return { agents, health, evidence, recommendedUrl, cards, warnings };
}

function renderOperatorHomePanel() {
  const preview = getOperatorUsabilityPreview();
  const noQueryParam = !new URLSearchParams(window.location.search).has("source");
  return `
    <article class="panel operator-home-panel">
      <div class="panel-heading">
        <h2>${t("panels.operatorHome", "Operator Home / Operator 首頁")}</h2>
        ${badge("operator usability MVP", "success")}
      </div>
      <p><strong>Recommended operator view / 建議 Operator 檢視</strong></p>
      <p><a href="${escapeHtml(preview.recommendedUrl)}">Open recommended operator view / 開啟建議 Operator 檢視</a></p>
      <p class="url-line">?source=local-ingest&amp;data=./data/generated/real-local-dashboard-export.single-agent.generated.json</p>
      ${noQueryParam ? `<p class="source-trust-warning">No query param detected. This operator-safe launch card points to the daily single-agent view and does not treat mock as operator truth.</p>` : ""}
      <section class="operator-card-grid">
        ${preview.cards.map((card) => `
          <div class="operator-home-card">
            <strong>${escapeHtml(card.label)}</strong>
            <span>${escapeHtml(card.value)}</span>
            <small>${escapeHtml(card.detail)}</small>
          </div>
        `).join("")}
      </section>
      <dl class="definition-list compact-list">
        <div><dt>1 real agent expected / 預期 1 個真實 agent</dt><dd>1</dd></div>
        <div><dt>Single-agent local-ingest snapshot / 單 agent local-ingest snapshot</dt><dd>loaded via recommended URL</dd></div>
        <div><dt>Local real agent health / 本地真實 Agent 健康狀態</dt><dd>${escapeHtml(preview.health.overallHealthStatus || "review-required")}</dd></div>
        <div><dt>Local health evidence review / 本地健康證據審核</dt><dd>${escapeHtml(preview.evidence.evidenceStatus || "missing-fallback")}</dd></div>
        <div><dt>Production status</dt><dd>no-go-for-production / Production 狀態：不可上線</dd></div>
        <div><dt>Restart</dt><dd>disabled / 重啟：已停用</dd></div>
        <div><dt>Mutation</dt><dd>disabled / 修改：已停用</dd></div>
        <div><dt>Production gateway</dt><dd>disabled / Production gateway：已停用</dd></div>
      </dl>
      ${preview.warnings.length ? `<ul class="warning-list">${preview.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}
    </article>
  `;
}

function renderOperatorTroubleshootingPanel() {
  const isFixture = sourceStatus.currentSource === "mock" || sourceStatus.currentSource === "gateway-stub";
  return `
    <article class="panel operator-troubleshooting-panel">
      <div class="panel-heading">
        <h2>${t("panels.operatorTroubleshooting", "Operator Troubleshooting / Operator 排障")}</h2>
        ${badge("daily help", "warning")}
      </div>
      ${isFixture ? `<p class="source-trust-warning"><strong>This is not the daily operator view.</strong> 這不是每日 Operator 檢視。</p>` : ""}
      <dl class="definition-list compact-list">
        <div><dt>I see 8 agents / 我見到 8 個 agents</dt><dd>Open the recommended operator URL; 8 agents are fixture only.</dd></div>
        <div><dt>Source badge says mock</dt><dd>Mock is demo fixture data, not daily operator truth.</dd></div>
        <div><dt>Health is unknown / stale</dt><dd>Use the runbook. Do not restart from Dashboard.</dd></div>
        <div><dt>Evidence fallback is active</dt><dd>Check reviewed local health JSON and regenerate local reports.</dd></div>
        <div><dt>Dashboard server closed</dt><dd>Run apps/dashboard/scripts/start-operator-dashboard.ps1 again.</dd></div>
        <div><dt>Troubleshooting report path</dt><dd>apps/dashboard/data/generated/operator-usability-troubleshooting-report.json</dd></div>
        <div><dt>Daily checklist path</dt><dd>apps/dashboard/data/generated/operator-daily-usability-checklist.json</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Restart disabled</button>
        <button disabled>Mutation disabled</button>
        <button disabled>Production gateway disabled</button>
      </div>
    </article>
  `;
}

function renderSourceTrustPanel() {
  const trust = getSourceTrustClassification();
  const isMock = trust.source === "mock";
  const isGatewayStub = trust.source === "gateway-stub";
  const isLocalIngest = trust.source === "local-ingest";
  const tone = trust.fixtureData ? "blocked" : isLocalIngest ? "warning" : "success";
  const title = isMock
    ? "Demo Fixture Data / 示範測試資料"
    : isGatewayStub
      ? "Contract Fixture Data / 合約測試資料"
      : isLocalIngest
        ? "Operator Truth Candidate / Operator 真實資料候選"
        : "Data trust / 資料可信分類";
  return `
    <article class="panel source-trust-panel ${trust.fixtureData ? "fixture-warning" : ""}">
      <div class="panel-heading">
        <h2>Data trust / 資料可信分類</h2>
        ${badge(trust.trustLevel, tone)}
      </div>
      <p class="source-trust-warning"><strong>${title}</strong></p>
      ${isMock ? `<p>Not real agents / 並非真實 agents。8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試。</p>` : ""}
      ${isGatewayStub ? `<p>Not real production agents / 並非真實 production agents。Gateway stub 只作 contract / lifecycle regression。</p>` : ""}
      ${isLocalIngest ? `<p>Expected real agent count: 1 / 預期真實 agent 數量：1。Local ingest 只係 operator truth candidate，仍需人工 review。</p>` : ""}
      ${!isLocalIngest ? `<p>No real local agent snapshot loaded. 未載入真實本地 agent snapshot。</p>` : ""}
      <dl class="definition-list compact-list">
        <div><dt>Source mode</dt><dd>${escapeHtml(trust.source)}</dd></div>
        <div><dt>Trust level</dt><dd>${escapeHtml(trust.trustLevel)}</dd></div>
        <div><dt>Operator truth</dt><dd>${escapeHtml(String(trust.operatorTruth))}</dd></div>
        <div><dt>Fixture data</dt><dd>${escapeHtml(String(trust.fixtureData))}</dd></div>
        <div><dt>Expected agent count</dt><dd>${escapeHtml(trust.expectedAgentCount ?? "review-required")}</dd></div>
        <div><dt>Requires review</dt><dd>${escapeHtml(String(trust.requiresReview))}</dd></div>
        <div><dt>Production planning</dt><dd>${trust.allowedForProductionPlanning ? "review-only" : "not allowed as production truth"}</dd></div>
        <div><dt>Warning</dt><dd>${escapeHtml(trust.warningZhHant)} / ${escapeHtml(trust.warningEn)}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Fixture data cannot be promoted to operator truth</button>
        <button disabled>Production gateway connection disabled</button>
      </div>
    </article>
  `;
}

function renderSourceTrustPanel() {
  const trust = getSourceTrustClassification();
  const isMock = trust.source === "mock";
  const isGatewayStub = trust.source === "gateway-stub";
  const isLocalIngest = trust.source === "local-ingest";
  const agentCount = dashboardAdapter.getAgents().length;
  const dataUrl = sourceStatus.dataUrl || new URLSearchParams(window.location.search).get("data") || "";
  const isSingleAgentSnapshot = isLocalIngest && dataUrl.includes("real-local-dashboard-export.single-agent.generated.json") && agentCount === 1;
  const localIngestReviewRequired = isLocalIngest && !isSingleAgentSnapshot;
  const tone = trust.fixtureData ? "blocked" : isLocalIngest ? "warning" : "success";
  const title = isMock
    ? t("safety.demoFixtureWarning", "Demo Fixture Data / 示範測試資料；Not real agents / 並非真實 agents")
    : isGatewayStub
      ? t("safety.contractFixtureWarning", "Contract Fixture Data / 合約測試資料；Not real production agents / 並非真實 production agents")
      : isLocalIngest
        ? t("safety.operatorTruthCandidate", "Operator Truth Candidate / Operator 真實資料候選")
        : t("panels.sourceTrust", "Data trust / 資料可信分類");
  return `
    <article class="panel source-trust-panel ${trust.fixtureData ? "fixture-warning" : ""}">
      <div class="panel-heading">
        <h2>${t("panels.sourceTrust", "Data trust / 資料可信分類")}</h2>
        ${badge(trust.trustLevel, tone)}
      </div>
      <p class="source-trust-warning"><strong>${title}</strong></p>
      ${isMock ? `<p>8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試。Not real agents / 並非真實 agents。</p>` : ""}
      ${isGatewayStub ? `<p>Contract Fixture Data / 合約測試資料。Not real production agents / 並非真實 production agents。</p>` : ""}
      ${isLocalIngest ? `<p>${t("safety.expectedSingleAgent", "Expected real agent count: 1 / 預期真實 agent 數量：1")}</p>` : ""}
      ${isSingleAgentSnapshot ? `<p>Actual real agent count: 1 / 實際真實 agent 數量：1。Single-agent snapshot: loaded / 單 agent snapshot 已載入。</p>` : ""}
      ${localIngestReviewRequired ? `<p class="source-trust-warning">Real local snapshot review required. 真實本地 snapshot 需要審查。Expected 1 agent, found ${escapeHtml(agentCount)}. 預期 1 個 agent，但找到 ${escapeHtml(agentCount)} 個。</p>` : ""}
      ${!isLocalIngest ? `<p>No real local agent snapshot loaded. 未載入真實本地 agent snapshot。</p>` : ""}
      <dl class="definition-list compact-list">
        <div><dt>Source mode</dt><dd>${escapeHtml(trust.source)}</dd></div>
        <div><dt>Trust level</dt><dd>${escapeHtml(trust.trustLevel)}</dd></div>
        <div><dt>Operator truth</dt><dd>${escapeHtml(String(trust.operatorTruth))}</dd></div>
        <div><dt>Fixture data</dt><dd>${escapeHtml(String(trust.fixtureData))}</dd></div>
        <div><dt>Expected agent count</dt><dd>${escapeHtml(trust.expectedAgentCount ?? "review-required")}</dd></div>
        ${isLocalIngest ? `<div><dt>Actual real agent count</dt><dd>${escapeHtml(String(agentCount))}</dd></div>` : ""}
        ${isLocalIngest ? `<div><dt>Single-agent snapshot</dt><dd>${isSingleAgentSnapshot ? "loaded / 已載入" : "review-required / 需要審查"}</dd></div>` : ""}
        <div><dt>Requires review</dt><dd>${escapeHtml(String(trust.requiresReview))}</dd></div>
        <div><dt>Production planning</dt><dd>${trust.allowedForProductionPlanning ? "review-only" : "not allowed as production truth"}</dd></div>
        <div><dt>Warning</dt><dd>${escapeHtml(trust.warningZhHant)} / ${escapeHtml(trust.warningEn)}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Fixture data cannot be promoted to operator truth</button>
        <button disabled>Production gateway connection disabled</button>
      </div>
    </article>
  `;
}

function renderSourceTrustPanel() {
  const trust = getSourceTrustClassification();
  const isMock = trust.source === "mock";
  const isGatewayStub = trust.source === "gateway-stub";
  const isLocalIngest = trust.source === "local-ingest";
  const agentCount = dashboardAdapter.getAgents().length;
  const dataUrl = sourceStatus.dataUrl || new URLSearchParams(window.location.search).get("data") || "";
  const isSingleAgentSnapshot = isLocalIngest && dataUrl.includes("real-local-dashboard-export.single-agent.generated.json") && agentCount === 1;
  const localIngestReviewRequired = isLocalIngest && !isSingleAgentSnapshot;
  const tone = trust.fixtureData ? "blocked" : isLocalIngest ? "warning" : "success";
  const title = isMock
    ? t("safety.demoFixtureWarning", "Demo Fixture Data / 示範測試資料；Not real agents / 並非真實 agents")
    : isGatewayStub
      ? t("safety.contractFixtureWarning", "Contract Fixture Data / 合約測試資料；Not real production agents / 並非真實 production agents")
      : isLocalIngest
        ? t("safety.operatorTruthCandidate", "Operator Truth Candidate / Operator 真實資料候選")
        : t("panels.sourceTrust", "Data trust / 資料可信分類");
  return `
    <article class="panel source-trust-panel ${trust.fixtureData ? "fixture-warning" : ""}">
      <div class="panel-heading">
        <h2>${t("panels.sourceTrust", "Data trust / 資料可信分類")}</h2>
        ${badge(trust.trustLevel, tone)}
      </div>
      <p class="source-trust-warning"><strong>${title}</strong></p>
      ${isMock ? `<p class="source-trust-warning"><strong>High warning: Demo fixture data only.</strong> You are viewing demo fixture data, not real agents. 高風險提示：這只是示範 fixture，不是真實 agents。8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試。</p>` : ""}
      ${isGatewayStub ? `<p class="source-trust-warning"><strong>High warning: Contract fixture data only.</strong> 高風險提示：這只是合約 fixture，不是真實 production agents。Contract Fixture Data / 合約測試資料。</p>` : ""}
      ${isLocalIngest ? `<p>${t("safety.expectedSingleAgent", "Expected real agent count: 1 / 預期真實 agent 數量：1")}</p>` : ""}
      ${isSingleAgentSnapshot ? `<p>Actual real agent count: 1 / 實際真實 agent 數量：1。Single-agent snapshot: loaded / 單 agent snapshot 已載入。</p>` : ""}
      ${localIngestReviewRequired ? `<p class="source-trust-warning">Real local snapshot review required. 真實本地 snapshot 需要審查。Expected 1 agent, found ${escapeHtml(agentCount)}. 預期 1 個 agent，但找到 ${escapeHtml(agentCount)} 個。</p>` : ""}
      ${!isLocalIngest ? `<p>No real local agent snapshot loaded. 未載入真實本地 agent snapshot。</p>` : ""}
      <dl class="definition-list compact-list">
        <div><dt>Source mode</dt><dd>${escapeHtml(trust.source)}</dd></div>
        <div><dt>Trust level</dt><dd>${escapeHtml(trust.trustLevel)}</dd></div>
        <div><dt>Operator truth</dt><dd>${escapeHtml(String(trust.operatorTruth))}</dd></div>
        <div><dt>Fixture data</dt><dd>${escapeHtml(String(trust.fixtureData))}</dd></div>
        <div><dt>Expected agent count</dt><dd>${escapeHtml(trust.expectedAgentCount ?? "review-required")}</dd></div>
        ${isLocalIngest ? `<div><dt>Actual real agent count</dt><dd>${escapeHtml(String(agentCount))}</dd></div>` : ""}
        ${isLocalIngest ? `<div><dt>Single-agent snapshot</dt><dd>${isSingleAgentSnapshot ? "loaded / 已載入" : "review-required / 需要審查"}</dd></div>` : ""}
        <div><dt>Requires review</dt><dd>${escapeHtml(String(trust.requiresReview))}</dd></div>
        <div><dt>Production planning</dt><dd>${trust.allowedForProductionPlanning ? "review-only" : "not allowed as production truth"}</dd></div>
        <div><dt>Warning</dt><dd>${escapeHtml(trust.warningZhHant)} / ${escapeHtml(trust.warningEn)}</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Fixture data cannot be promoted to operator truth</button>
        <button disabled>Production gateway connection disabled</button>
      </div>
    </article>
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
          <h2>${t("panels.sourceStatus", "資料來源狀態")}</h2>
          ${badge(sourceStatus.health, sourceStatus.health === "ok" ? "success" : "warning")}
        </div>
        <dl class="definition-list">
          ${statusRows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
      </article>
      ${renderOperatorHomePanel()}
      ${renderOperatorTroubleshootingPanel()}
      ${renderSourceTrustPanel()}
      ${renderOperatorSourceLockdownPanel()}
      ${renderLocalAgentHealthPanel()}
      ${renderLocalHealthEvidencePanel()}
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
          <h2>${t("panels.operationsGuard", "操作安全守衛")}</h2>
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
      ${renderInternalReleaseCandidatePanel()}
      ${renderProductionTrackPanel()}
      ${renderInternalStaticHostingPanel()}
      ${renderSecurityPrivacyPanel()}
      ${renderOperatorWorkflowPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderDevGatewayLiveDrillPanel()}
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
      ${renderOperatorHomePanel()}
      ${renderOperatorSourceLockdownPanel()}
      ${renderLocalAgentHealthPanel()}
      ${renderLocalHealthEvidencePanel()}
      ${renderSourceTrustPanel()}
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>${t("panels.agentRegistry", "代理程式登錄")}</h2>
          ${badge(`${agents.length} agents / 代理程式`)}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>代理程式</th><th>角色</th><th>Runtime</th><th>Model</th><th>Workspace</th><th>Sandbox</th><th>工具</th><th>狀態</th><th>Heartbeat</th>
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
        <div><dt>角色</dt><dd>${agent.role}</dd></div>
        <div><dt>Workspace scope / 工作範圍</dt><dd>${agent.workspace}</dd></div>
        <div><dt>Tool profile / 工具設定</dt><dd>${agent.toolsProfile}</dd></div>
      </dl>
      ${renderList("職責 / Responsibilities", agent.responsibilities)}
      ${renderList("允許操作 / Allowed actions", agent.allowedActions)}
      ${renderList("拒絕操作 / Denied actions", agent.deniedActions)}
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
          <h2>${t("panels.taskQueue", "任務佇列")}</h2>
          <div class="filters">
            ${renderSelect("taskStatus", ["all", "queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"], state.taskStatus)}
            ${renderSelect("taskPriority", ["all", "P0", "P1", "P2", "P3"], state.taskPriority)}
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>任務</th><th>Workflow</th><th>狀態</th><th>優先級</th><th>嘗試</th><th>Owner</th><th>Reviewer</th><th>建立</th><th>更新</th>
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
    return `<aside class="panel detail-panel empty-panel"><h2>未選取任務</h2><p>請選擇另一個 filter 以顯示任務詳情。</p></aside>`;
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
        <div><dt>Owner / 負責代理程式</dt><dd>${task.ownerAgent}</dd></div>
        <div><dt>Reviewer / 審核者</dt><dd>${task.reviewer}</dd></div>
        <div><dt>更新時間</dt><dd>${task.updatedAt}</dd></div>
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
                <div><dt>任務</dt><dd>${review.taskId}</dd></div>
                <div><dt>審核者</dt><dd>${review.reviewer}</dd></div>
                <div><dt>建立時間</dt><dd>${review.createdAt}</dd></div>
              </dl>
              ${renderList("政策檢查 / Policy checks", review.policyChecks)}
              <label class="notes-label">審核備註</label>
              <textarea readonly>${review.notes}</textarea>
              <div class="button-row">
                <button disabled>${t("actions.approveMock", "Approve mock（模擬批准）")}</button>
                <button disabled>${t("actions.rejectMock", "Reject mock（模擬拒絕）")}</button>
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="approve" data-review-id="${escapeHtml(review.id)}">${t("actions.generateApproveDraft", "產生 approve 操作草稿")}</button>
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="reject" data-review-id="${escapeHtml(review.id)}">${t("actions.generateRejectDraft", "產生 reject 操作草稿")}</button>
                <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="needs_changes" data-review-id="${escapeHtml(review.id)}">${t("actions.generateNeedsChangesDraft", "產生 needs changes 操作草稿")}</button>
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
          <h2>${t("panels.traceViewer", "日誌追蹤檢視器")}</h2>
        <div class="filters">
          <input id="logSearch" value="${escapeHtml(state.logSearch)}" placeholder="搜尋日誌" />
          ${renderSelect("logSeverity", ["all", "info", "warning", "error", "critical"], state.logSeverity)}
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Trace</th><th>嚴重性</th><th>Actor</th><th>訊息</th><th>遮蔽狀態</th><th>時間</th></tr></thead>
          <tbody>
            ${filtered
              .map(
                (event) => `
                  <tr>
                    <td>${event.id}</td>
                    <td>${badge(event.severity, event.severity)}</td>
                    <td>${event.actor}</td>
                    <td>${escapeHtml(event.event)}</td>
                    <td>${event.redacted ? badge("redacted / 已遮蔽", "warning") : badge("clear / 清楚", "success")}</td>
                    <td>${event.timestamp}</td>
                  </tr>
                `
              )
              .join("") || renderEmptyRow(6, "沒有符合目前搜尋的日誌。")}
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
          <h2>${t("panels.backupManifests", "備份清單")}</h2>
          ${badge("mock evidence / 模擬證據")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>備份</th><th>任務</th><th>驗證</th><th>Checksum</th><th>Storage URI</th><th>建立</th><th>Restore 測試</th></tr></thead>
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
                      <td>${backup.restoreTestedAt ?? "not tested / 未測試"}</td>
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
          <h2>${t("panels.evidenceChain", "證據鏈")}</h2>
          ${badge("read-only")}
        </div>
        ${backups.map((backup) => renderList(backup.id, backup.evidenceChain)).join("")}
        <div class="button-row">
          <button ${roleHas("backups:draft_verification") ? "" : "disabled"} data-backup-draft-id="${escapeHtml(backups[0]?.id ?? "")}">${t("actions.generateBackupDraft", "產生備份驗證草稿")}</button>
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
          <h2>${t("panels.configGuard", "設定安全守衛")}</h2>
          ${badge("mutation disabled / 寫入已停用", "blocked")}
        </div>
        <dl class="definition-list">
          <div><dt>Gateway auth 模式</dt><dd>${settings.gatewayAuthMode}</dd></div>
          <div><dt>保留政策</dt><dd>${settings.retentionPolicy}</dd></div>
          <div><dt>Model routing</dt><dd>${settings.modelRouting}</dd></div>
          <div><dt>Secret refs health</dt><dd>${settings.secretRefsHealth}</dd></div>
          <div><dt>Production mutation</dt><dd>${settings.productionMutation}</dd></div>
        </dl>
        <div class="button-row">
          <button ${roleHas("admin:view_config") ? "" : "disabled"} data-settings-draft="request">${t("actions.generateSettingsDraft", "產生設定變更草稿")}</button>
        </div>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>MCP servers / MCP 伺服器</h2>
          ${badge("mock list")}
        </div>
        ${renderList("已設定 surface", settings.mcpServers)}
        <div class="button-row">
          <button disabled>儲存設定（已停用）</button>
          <button disabled>Rotate SecretRef（已停用）</button>
        </div>
      </article>
      ${renderSimulatedRolePanel()}
      ${renderDraftPreview()}
      ${renderOperatorHomePanel()}
      ${renderOperatorTroubleshootingPanel()}
      ${renderSourceTrustPanel()}
      ${renderOperatorSourceLockdownPanel()}
      ${renderLocalAgentHealthPanel()}
      ${renderLocalHealthEvidencePanel()}
      ${renderReleaseHealthPanel()}
      ${renderInternalReleaseCandidatePanel()}
      ${renderProductionTrackPanel()}
      ${renderInternalStaticHostingPanel()}
      ${renderSecurityPrivacyPanel()}
      ${renderOperatorWorkflowPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderDevGatewayLiveDrillPanel()}
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
      ${renderInternalReleaseCandidatePanel()}
      ${renderProductionTrackPanel()}
      ${renderOperatorHomePanel()}
      ${renderSourceTrustPanel()}
      ${renderOperatorSourceLockdownPanel()}
      ${renderLocalAgentHealthPanel()}
      ${renderLocalHealthEvidencePanel()}
      ${renderOperatorTroubleshootingPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderOperatorWorkflowPanel()}
      ${renderInternalStaticHostingPanel()}
      ${renderSecurityPrivacyPanel()}
      ${renderDevGatewayLiveDrillPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>${t("panels.alertPreviewList", "警示預覽清單")}</h2>
          ${badge("notificationSent false", "success")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>警示</th><th>嚴重性</th><th>狀態</th><th>Entity</th><th>本地建議操作</th><th>傳送狀態</th></tr></thead>
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
              `).join("") || renderEmptyRow(6, "目前沒有本地警示預覽。")}
            </tbody>
          </table>
        </div>
        <div class="button-row">
          <button disabled>Acknowledge disabled in scaffold（確認功能已停用）</button>
          <button disabled>${t("actions.externalAlertDisabled", "External alert delivery disabled（外部通知已停用）")}</button>
        </div>
      </article>
      <article class="panel table-panel">
        <div class="panel-heading">
          <h2>${t("panels.readinessChecklist", "就緒狀態清單")}</h2>
          ${badge("production deploy false", "blocked")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>類別</th><th>狀態</th><th>證據</th></tr></thead>
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
        <h2>品質閘門狀態</h2>
        ${badge("local-only / 只限本地", "success")}
      </div>
      <dl class="definition-list">
        <div><dt>Quality gates / 品質閘門</dt><dd>驗收前在本地 shell 執行</dd></div>
        <div><dt>Safety scan / 安全掃描</dt><dd>檢查禁止寫入操作、production endpoints 和 secret-like values</dd></div>
        <div><dt>Verifier / 驗證器</dt><dd>檢查可見路由 label、安全 guardrails 和操作手冊 markers</dd></div>
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
        <h2>匯入 / 匯出合約</h2>
        ${badge("read-only", "success")}
      </div>
      <dl class="definition-list">
        <div><dt>Schema version / Schema 版本</dt><dd>dashboard-export-v1</dd></div>
        <div><dt>支援資料來源</dt><dd>mock, json, artifact, gateway-stub, local-ingest, dev-gateway</dd></div>
        <div><dt>Gateway stub source</dt><dd>gateway-stub read-only contract fixtures</dd></div>
        <div><dt>Local ingest source</dt><dd>local-ingest JSON files only; CSV parsing is future work</dd></div>
        <div><dt>Dev gateway source</dt><dd>dev-gateway read-only GET with credentials omitted</dd></div>
        <div><dt>Generated snapshot path</dt><dd>apps/dashboard/data/generated/dashboard-export.generated.json</dd></div>
        <div><dt>驗證狀態</dt><dd>${escapeHtml(sourceStatus.validation)}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>false</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>read-only</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>disabled</dd></div>
      </dl>
      <div class="button-row">
        <button disabled>Import snapshot disabled in scaffold（匯入已停用）</button>
        <button disabled>Export snapshot via local script only（只可本地 script 匯出）</button>
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
          <h2>角色矩陣</h2>
          ${badge("RBAC scaffold")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>角色</th><th>說明</th><th>允許權限</th><th>拒絕 / 不可用操作</th></tr></thead>
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
          <h2>權限矩陣</h2>
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
          <h2>代理程式權限總覽</h2>
          ${badge("existing agent guardrails")}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>代理程式</th><th>風險</th><th>允許操作</th><th>拒絕操作</th></tr></thead>
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
          <h2>安全守衛摘要</h2>
          ${badge("read-only", "success")}
        </div>
        ${renderList("模擬 auth 安全備註", ["simulated only", "no real auth", "no token", "no cookie", "no production permissions"])}
        ${renderList("非目標 / 禁止操作", forbidden)}
      </article>
    </section>
  `;
}

function renderRunbook() {
  return `
    <section class="content-grid two-col">
      <article class="panel">
        <div class="panel-heading">
          <h2>${t("panels.operatorRunbook", "Operator 操作手冊")}</h2>
          ${badge("read-only", "success")}
        </div>
        <dl class="definition-list">
          <div><dt>What this dashboard is / 這個儀表板是甚麼</dt><dd>mock-only 本地操作儀表板，用來檢視 OpenClaw agents、tasks、reviews、logs、backups、settings、RBAC 和 source status。</dd></div>
          <div><dt>What this dashboard is not / 這個儀表板不是甚麼</dt><dd>不是 live gateway client，不是真實 auth surface，也不是 mutation console。</dd></div>
          <div><dt>Safe operating rules / 安全操作規則</dt><dd>Production 寫入操作保持停用；所有 action 維持 read-only，只使用本地 / static sources。</dd></div>
          <div><dt>資料來源</dt><dd>支援 mock, json, artifact, generated snapshot, gateway-stub, local-ingest, dev-gateway 作本地檢視。</dd></div>
          <div><dt>Gateway-stub mode</dt><dd>使用 ?source=gateway-stub 載入唯讀 fixture responses，並經 gateway contract mapper 映射。</dd></div>
          <div><dt>Local-ingest mode</dt><dd>使用 ?source=local-ingest 或 ?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json 載入本地 JSON ingest files。</dd></div>
          <div><dt>Dev-gateway mode</dt><dd>只可明確使用 ?source=dev-gateway&baseUrl=http://localhost:8787 做 read-only dev gateway 檢查。</dd></div>
          <div><dt>RBAC stub</dt><dd>viewer, operator, reviewer, admin, audit-only 只在記憶體中模擬；no real login, no token, no cookie, no production permissions。</dd></div>
          <div><dt>Action drafts</dt><dd>Review, backup, settings, export action drafts 只會產生本地 JSON preview，並保持 dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, notSubmitted true。</dd></div>
          <div><dt>Release workflow</dt><dd>任何人工內部 static handoff 前，先產生 local release manifest、local release index，並執行 local release verification。</dd></div>
          <div><dt>觀測 / Observability</dt><dd>只提供本地 alert preview；notification mode 是 local-preview-only，notificationSent false。</dd></div>
          <div><dt>Production 就緒狀態</dt><dd>範圍是 internal-operator-beta；在 blockers 解決前 recommendation 保持 no-go-for-production。</dd></div>
          <div><dt>Production wiring</dt><dd>disabled in scaffold（已停用）。</dd></div>
        </dl>
      </article>
      ${renderOperatorHomePanel()}
      ${renderOperatorTroubleshootingPanel()}
      ${renderSourceTrustPanel()}
      ${renderOperatorSourceLockdownPanel()}
      ${renderLocalAgentHealthPanel()}
      ${renderLocalHealthEvidencePanel()}
      ${renderReleaseHealthPanel()}
      ${renderInternalReleaseCandidatePanel()}
      ${renderProductionTrackPanel()}
      ${renderInternalStaticHostingPanel()}
      ${renderSecurityPrivacyPanel()}
      ${renderOperatorWorkflowPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderDevGatewayLiveDrillPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      <article class="panel">
        <div class="panel-heading">
          <h2>本地檢查</h2>
          ${badge("quality gates")}
        </div>
        <dl class="definition-list">
          <div><dt>How to run local server / 如何啟動本地 server</dt><dd>在 apps/dashboard 內執行 python -m http.server 5173，然後打開 http://localhost:5173/。</dd></div>
          <div><dt>How to run quality gates / 如何執行品質閘門</dt><dd>在 repo root 執行 node apps/dashboard/scripts/run-dashboard-quality-gates.mjs。</dd></div>
          <div><dt>Gateway Contract Tests</dt><dd>Run node apps/dashboard/scripts/test-gateway-contract.mjs to validate local gateway-stub fixtures and mapper output.</dd></div>
          <div><dt>Fixture Diff</dt><dd>Run node apps/dashboard/scripts/diff-gateway-fixtures.mjs to compare current fixtures with the baseline.</dd></div>
          <div><dt>Local ingest test</dt><dd>Run node apps/dashboard/scripts/test-local-ingest.mjs.</dd></div>
          <div><dt>Dev gateway config test</dt><dd>Run node apps/dashboard/scripts/test-dev-gateway-config.mjs.</dd></div>
          <div><dt>RBAC policy test</dt><dd>Run node apps/dashboard/scripts/test-rbac-policy.mjs.</dd></div>
          <div><dt>Action draft test</dt><dd>Run node apps/dashboard/scripts/test-action-drafts.mjs.</dd></div>
          <div><dt>Localization test</dt><dd>Run node apps/dashboard/scripts/test-dashboard-localization.mjs.</dd></div>
          <div><dt>How to generate snapshot</dt><dd>Run node apps/dashboard/scripts/generate-dashboard-snapshot.mjs.</dd></div>
          <div><dt>How to validate snapshot</dt><dd>Run node apps/dashboard/scripts/validate-dashboard-snapshot.mjs apps/dashboard/data/generated/dashboard-export.generated.json.</dd></div>
        </dl>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h2>故障排查</h2>
          ${badge("manual checks")}
        </div>
        ${renderList("儀表板空白時，請這樣做", [
          "Check the browser console for script or adapter errors.",
          "Confirm index.html loads app.js and all adapter scripts in order.",
          "Open the mock source URL first, then retry the generated snapshot URL."
        ])}
        ${renderList("source validation 失敗時，請這樣做", [
          "Confirm the local JSON file exists and matches dashboard-export-v1.",
          "Use the snapshot validator before reloading the browser.",
          "Fallback to mock data is expected when validation fails."
        ])}
        ${renderList("Git 有奇怪 root-level 檔案時，請這樣做", [
          "Leave unrelated root-level files untouched.",
          "Do not stage junk root files.",
          "Ask for manual review before cleanup."
        ])}
        ${renderList("如果草稿產生被停用，請這樣做", [
          "Switch the simulated role in RBAC or Settings.",
          "Confirm the selected role has only draft permissions.",
          "Remember action drafts are not submitted and never mutate settings, reviews, or backups."
        ])}
        ${renderList("內部 static handoff 前，請這樣做", [
          "Run the one-command quality gate.",
          "Generate the release manifest and local release index.",
          "Run local release verification.",
          "Review Git status manually before commit, push, or tag."
        ])}
        ${renderList("本地觀測出現警示時，請這樣做", [
          "Review the alert preview locally.",
          "Refresh local source data and rerun quality gates.",
          "Do not send external notifications from the scaffold."
        ])}
        ${renderList("甚麼算 breaking change", [
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
          <h2>不要做甚麼</h2>
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
  return `
    <section class="content-grid two-col">
      <article class="panel">
        <div class="panel-heading">
          <h2>${t("panels.operatorRunbook", "Operator 操作手冊")}</h2>
          ${badge("read-only", "success")}
        </div>
        <dl class="definition-list">
          <div><dt>What this dashboard is / 這個儀表板是甚麼</dt><dd>mock-only 本地操作腳手架，用於檢視 OpenClaw agents、tasks、reviews、logs、backups、settings、RBAC 和 source status。</dd></div>
          <div><dt>What this dashboard is not / 這個儀表板不是甚麼</dt><dd>不是 live gateway client、不是 auth surface、也不是 mutation console。</dd></div>
          <div><dt>Safe operating rules / 安全操作規則</dt><dd>Production 寫入操作保持停用，所有 action 維持 read-only，只使用本地 / static sources。</dd></div>
          <div><dt>資料來源</dt><dd>支援 mock, json, artifact, generated snapshot, gateway-stub, local-ingest, dev-gateway 作本地檢視。</dd></div>
          <div><dt>Gateway-stub mode</dt><dd>Use ?source=gateway-stub to load read-only fixture responses mapped through the gateway contract mapper.</dd></div>
          <div><dt>Local-ingest mode</dt><dd>Use ?source=local-ingest or ?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json to load local JSON ingest files.</dd></div>
          <div><dt>Dev-gateway mode</dt><dd>Use ?source=dev-gateway&baseUrl=http://localhost:8787 for explicit read-only dev gateway checks.</dd></div>
          <div><dt>RBAC stub</dt><dd>Roles viewer, operator, reviewer, admin, and audit-only are simulated in memory only; no real login, no token, no cookie, and no production permissions.</dd></div>
          <div><dt>Action drafts</dt><dd>Review, backup, settings, and export action drafts are local JSON previews with dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.</dd></div>
          <div><dt>Release workflow</dt><dd>Generate local release manifest, local release index, and verify local release before any manual internal static hosting handoff.</dd></div>
          <div><dt>觀測 / Observability</dt><dd>只顯示本地警示預覽；notification mode 為 local-preview-only，notificationSent false。</dd></div>
          <div><dt>Production 就緒狀態</dt><dd>範圍為 internal-operator-beta；在 blocker 解決前 recommendation 保持 no-go-for-production。</dd></div>
          <div><dt>Production wiring</dt><dd>disabled in scaffold（已停用）</dd></div>
        </dl>
      </article>
      ${renderReleaseHealthPanel()}
      ${renderRealLocalDataPilotPanel()}
      ${renderObservabilitySummaryPanel()}
      ${renderProductionReadinessPanel()}
      <article class="panel">
        <div class="panel-heading">
          <h2>本地驗收</h2>
          ${badge("quality gates")}
        </div>
        <dl class="definition-list">
          <div><dt>How to run local server / 如何啟動本地 server</dt><dd>在 apps/dashboard 執行 python -m http.server 5173，然後打開 http://localhost:5173/。</dd></div>
          <div><dt>How to run quality gates / 如何執行品質閘門</dt><dd>在 repo root 執行 node apps/dashboard/scripts/run-dashboard-quality-gates.mjs。</dd></div>
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
          <h2>疑難排解</h2>
          ${badge("manual checks")}
        </div>
        ${renderList("如果儀表板空白，請這樣做", [
          "Check the browser console for script or adapter errors.",
          "Confirm index.html loads app.js and all adapter scripts in order.",
          "Open the mock source URL first, then retry the generated snapshot URL."
        ])}
        ${renderList("如果資料來源驗證失敗，請這樣做", [
          "Confirm the local JSON file exists and matches dashboard-export-v1.",
          "Use the snapshot validator before reloading the browser.",
          "Fallback to mock data is expected when validation fails."
        ])}
        ${renderList("如果 Git 有奇怪 root-level files，請這樣做", [
          "Leave unrelated root-level files untouched.",
          "Do not stage junk root files.",
          "Ask for manual review before cleanup."
        ])}
        ${renderList("如果草稿產生被停用，請這樣做", [
          "Switch the simulated role in RBAC or Settings.",
          "Confirm the selected role has only draft permissions.",
          "Remember action drafts are not submitted and never mutate settings, reviews, or backups."
        ])}
        ${renderList("內部 static handoff 前要做甚麼", [
          "Run the one-command quality gate.",
          "Generate the release manifest and local release index.",
          "Run local release verification.",
          "Review Git status manually before commit, push, or tag."
        ])}
        ${renderList("本地警示出現時要做甚麼", [
          "Review the alert preview locally.",
          "Refresh local source data and rerun quality gates.",
          "Do not send external notifications from the scaffold."
        ])}
        ${renderList("甚麼算 breaking change", [
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
          <h2>不要做甚麼</h2>
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
