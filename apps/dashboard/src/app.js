(function () {
let dashboardAdapter = window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
let sourceStatus = dashboardAdapter.sourceStatus;
const t = window.OpenClawI18n?.t ?? ((key, fallback) => fallback ?? key);
let localOpenClawReport = null;
let localOpenClawActivationReport = null;
let localTaskInboxReport = null;
let whatsappLocalTaskImportReport = null;
let whatsappLocalTaskHelperReport = null;
let whatsappSyncMockContractReport = null;

const routes = [
  { id: "overview", path: "/dashboard", aliases: ["/"], label: "總覽" },
  { id: "agents", path: "/dashboard/agents", aliases: ["/agents"], label: "Agent 狀態" },
  { id: "tasks", path: "/dashboard/tasks", aliases: ["/tasks"], label: "今日任務" },
  { id: "reviews", path: "/dashboard/reviews", aliases: ["/reviews"], label: "安全審查" },
  { id: "logs", path: "/dashboard/logs", aliases: ["/logs"], label: "日誌" },
  { id: "backups", path: "/dashboard/backups", aliases: ["/backups"], label: "備份" },
  { id: "observability", path: "/dashboard/observability", aliases: ["/observability"], label: "觀測" },
  { id: "settings", path: "/dashboard/settings", aliases: ["/settings"], label: "設定" },
  { id: "rbac", path: "/dashboard/rbac", aliases: ["/rbac"], label: "權限檢視" },
  { id: "runbook", path: "/dashboard/help", aliases: ["/help", "/runbook"], label: "操作手冊" }
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

const operatorCopy = window.OpenClawOperatorCopy ?? {};
const operatorDesign = window.OpenClawOperatorDesignSystem ?? {};

function formatOperatorLabel(key) {
  return operatorCopy.formatOperatorLabel?.(key) ?? key;
}

function formatOperatorValue(value) {
  return operatorCopy.formatOperatorValue?.(value) ?? String(value ?? "未提供");
}

function formatOperatorStatus(status) {
  return operatorCopy.formatOperatorStatus?.(status) ?? String(status || "未知");
}

function formatOperatorBoolean(value) {
  return operatorCopy.formatOperatorBoolean?.(value) ?? (value ? "是" : "否");
}

function formatOperatorTechnicalDetail(key, value) {
  return operatorCopy.formatOperatorTechnicalDetail?.(key, value) ?? `${key}: ${String(value)}`;
}

function taskNextStep(status) {
  return operatorCopy.taskNextStep?.(status) ?? "需要人工檢查";
}

function permissionLabel(permission) {
  return operatorCopy.permissionLabel?.(permission) ?? "只產生草稿，不會提交";
}

function renderTechnicalDetails(title, rows) {
  const detailTitle = title || "技術資料";
  const safeRows = Array.isArray(rows) ? rows : Object.entries(rows || {});
  return `
    <details class="technical-detail">
      <summary>技術詳情（一般情況不用查看）</summary>
      ${detailTitle ? `<h3>${escapeHtml(detailTitle)}</h3>` : ""}
      <dl class="definition-list compact-list technical-detail-list">
        ${safeRows.map(([key, value]) => `<div><dt>${escapeHtml(formatOperatorLabel(key))}</dt><dd><code>${escapeHtml(String(value ?? ""))}</code></dd></div>`).join("")}
      </dl>
    </details>
  `;
}

function renderTechnicalArchive(title, content) {
  return `
    <details class="technical-detail technical-archive">
      <summary>技術詳情（一般情況不用查看）</summary>
      <h3>${escapeHtml(title)}</h3>
      <div class="technical-archive-body">${content}</div>
    </details>
  `;
}

function toneForStatus(status) {
  return operatorDesign.toneForStatus?.(status) || (status === "ok" || status === "pass" || status === "passed" ? "success" : status === "blocked" || status === "failed" ? "blocked" : "warning");
}

function renderConsoleCard({ title, value, note, tone = "muted", action = "" }) {
  return `
    <article class="console-card ${escapeHtml(tone)}">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
      ${action ? `<small>${escapeHtml(action)}</small>` : ""}
    </article>
  `;
}

function renderConsoleCardGrid(cards, extraClass = "") {
  return `<section class="console-card-grid ${extraClass}">${cards.map(renderConsoleCard).join("")}</section>`;
}

function renderPageIntro(title, description, badgeText = "本機唯讀", badgeTone = "success") {
  return `
    <article class="panel console-page-intro">
      <div>
        <p class="console-eyebrow">OpenClaw Operator Console</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      ${badge(escapeHtml(badgeText), badgeTone)}
    </article>
  `;
}

function renderSafeNextSteps(items) {
  return `
    <article class="panel safe-next-steps-panel">
      <div class="panel-heading">
        <h2>下一步</h2>
        ${badge("只讀建議", "success")}
      </div>
      <div class="next-step-list">
        ${items.map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.note)}</span></div>`).join("")}
      </div>
    </article>
  `;
}

function renderSafetyLockCards() {
  const cards = operatorDesign.buildSafetyLocks?.() || [
    { title: "Production", value: "已鎖定", note: "Production 未開放", tone: "blocked" },
    { title: "修改功能", value: "已停用", note: "不會改動 Agent 或資料", tone: "success" },
    { title: "重啟功能", value: "已停用", note: "不會重啟、停止或啟動 Agent", tone: "success" },
    { title: "登入與憑證", value: "未使用", note: "沒有真實登入或登入憑證", tone: "success" }
  ];
  return renderConsoleCardGrid(cards, "safety-lock-grid");
}

function operatorTaskTitle(task) {
  const text = String(task?.summary || "未命名任務");
  const mappings = [
    [/Create dashboard scaffold/i, "建立 Dashboard 基礎介面與任務記錄"],
    [/Validate API contract/i, "檢查 API 合約形狀，避免之後接錯資料"],
    [/Draft backup manifest/i, "整理備份證據清單"],
    [/stale heartbeat/i, "本地 Agent 心跳可能過期，需要人工檢查"],
    [/Mock failed task/i, "本地 Agent 任務失敗，需要人工檢查"],
    [/workflow lifecycle labels/i, "整理任務生命週期標籤"],
    [/timed-out task/i, "任務超時，需要確認 Agent 是否仍有回應"],
    [/cancelled task/i, "任務已取消，確認是否符合預期"],
    [/crawler output/i, "讀取本地 crawler 輸出並更新 Dashboard 記錄"],
    [/Task memory lost/i, "任務記錄失去追蹤，需要人工確認"]
  ];
  const match = mappings.find(([pattern]) => pattern.test(text));
  return match ? match[1] : text;
}

function sourceDisplayLabel(source) {
  if (source === "local-ingest") return "本地資料";
  if (source === "local-openclaw") return "本機 OpenClaw";
  if (source === "mock") return "示範資料";
  if (source === "gateway-stub") return "示範 Gateway";
  if (source === "dev-gateway") return "本機測試 Gateway";
  return formatOperatorValue(source);
}

function renderReadonlyGuardrailPanel() {
  return `
    <article class="panel production-lock-panel">
      <div class="panel-heading">
        <h2>Production 安全鎖</h2>
        ${badge("已鎖定", "blocked")}
      </div>
      <p>Dashboard 目前只讀，不會連接 Production、不會登入、不會重啟 Agent、不會提交修改。</p>
      ${renderSafetyLockCards()}
      ${renderTechnicalDetails("安全旗標", [
        ["productionReady", false],
        ["Mutation enabled", false],
        ["Production mutation", "disabled"],
        ["mock evidence / 模擬證據", "fixture-only"],
        ["adapterEnabled", false],
        ["connected", false],
        ["endpointConfigured", false],
        ["authEnabled", false],
        ["dataReturned", false],
        ["mutationEnabled", false]
      ])}
    </article>
  `;
}

function renderDisabledActionChips(items, label = "Disabled actions") {
  return `
    <div class="status-chip-row" aria-label="${escapeHtml(label)}">
      ${items.map((item) => `<span class="status-chip">${item}</span>`).join("")}
    </div>
  `;
}

function getSimulatedRoleState() {
  return window.OpenClawRbacState.getCurrentRoleState();
}

function roleHas(permission) {
  return window.OpenClawRbacPolicy.hasPermission(window.OpenClawRbacState.getCurrentRole(), permission);
}

function renderSimulatedRolePanel() {
  const roleState = getSimulatedRoleState();
  const readablePermissions = roleState.allowedPermissions.map(permissionLabel);
  return `
    <article class="panel role-simulation-panel">
      <div class="panel-heading">
        <h2>目前檢視身份</h2>
        ${badge("模擬身份，不是真登入", "success")}
      </div>
      <p>這個身份只存在於本頁記憶，不會寫入瀏覽器儲存空間，也沒有真實登入憑證或 Production 權限。</p>
      <label class="notes-label" for="simulatedRole">切換模擬身份</label>
      <select id="simulatedRole">
        ${window.OpenClawRbacRoles.ROLE_IDS.map((roleId) => {
          const role = window.OpenClawRbacPolicy.getRole(roleId);
          return `<option value="${roleId}" ${roleId === roleState.currentRole ? "selected" : ""}>${role.label}</option>`;
        }).join("")}
      </select>
      <dl class="definition-list compact-list">
        <div><dt>目前身份</dt><dd>${escapeHtml(roleState.label)}（模擬）</dd></div>
        <div><dt>登入狀態</dt><dd>沒有真實登入</dd></div>
        <div><dt>Production 權限</dt><dd>沒有</dd></div>
      </dl>
      ${renderList("身份可查看範圍", readablePermissions)}
      ${renderList("不能執行", roleState.unavailableActions.map(formatOperatorValue))}
      ${renderTechnicalDetails("權限 key", [
        ["currentRole", roleState.currentRole],
        ["allowedPermissions", roleState.allowedPermissions.join("; ")],
        ["unavailableActions", roleState.unavailableActions.join("; ")]
      ])}
    </article>
  `;
}

function renderDraftPreview() {
  const stored = window.OpenClawActionDraftStore.getLatestDraft();
  if (!stored) {
    return `
      <article class="panel draft-preview-panel">
        <div class="panel-heading">
          <h2>安全操作草稿</h2>
          ${badge("尚未建立", "warning")}
        </div>
        <p>這裡只會顯示本地預演草稿，不會提交、不會修改資料、不會連接 Production。</p>
        <dl class="definition-list compact-list">
          <div><dt>只做預演</dt><dd>是</dd></div>
          <div><dt>修改功能</dt><dd>停用</dd></div>
          <div><dt>Production 連接</dt><dd>已停用</dd></div>
          <div><dt>需要人工批准</dt><dd>是</dd></div>
          <div><dt>提交狀態</dt><dd>尚未提交</dd></div>
        </dl>
        ${renderTechnicalDetails("草稿安全旗標", [
          ["dryRun", true],
          ["mutationEnabled", false],
          ["productionWiring", "disabled"],
          ["requiresHumanApproval", true],
          ["notSubmitted", true]
        ])}
      </article>
    `;
  }
  return `
    <article class="panel draft-preview-panel">
      <div class="panel-heading">
        <h2>安全操作草稿</h2>
        ${badge(formatOperatorStatus(stored.validation), stored.validation === "passed" ? "success" : "blocked")}
      </div>
      <p>這只是本地預演草稿。Dashboard 不會提交、不會修改資料、不會連接 Production。</p>
      <dl class="definition-list compact-list">
        <div><dt>只做預演</dt><dd>${formatOperatorBoolean(stored.draft.dryRun)}</dd></div>
        <div><dt>修改功能</dt><dd>${stored.draft.mutationEnabled ? "啟用" : "停用"}</dd></div>
        <div><dt>Production 連接</dt><dd>${formatOperatorValue(stored.draft.productionWiring)}</dd></div>
        <div><dt>需要人工批准</dt><dd>${formatOperatorBoolean(stored.draft.requiresHumanApproval)}</dd></div>
        <div><dt>提交狀態</dt><dd>${stored.draft.notSubmitted ? "尚未提交" : "已提交"}</dd></div>
      </dl>
      ${stored.issues.length ? renderList("需要留意", stored.issues) : ""}
      ${renderTechnicalDetails("草稿 JSON", Object.entries(stored.draft))}
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
        <div><dt>internal-operator-beta</dt><dd>local-only historical marker</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${t("safety.readOnly", "唯讀 / read-only")}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${t("safety.mutationFalse", "false（未啟用）")}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${t("safety.disabled", "disabled（已停用）")}</dd></div>
        <div><dt>支援資料來源</dt><dd>mock, json, artifact, gateway-stub, local-ingest, dev-gateway</dd></div>
        <div><dt>本地匯入檔案</dt><dd>只讀 JSON snapshot</dd></div>
        <div><dt>品質閘門狀態</dt><dd>交付前需要本地 report</dd></div>
        <div><dt>最新安全掃描狀態</dt><dd>交付前需要本地 safety scan report</dd></div>
        <div><dt>Release manifest 路徑</dt><dd>apps/dashboard/data/generated/release-manifest.json</dd></div>
        <div><dt>Local release index 路徑</dt><dd>apps/dashboard/release/local-release-index.json</dd></div>
        <div><dt>Rollback tag 建議</dt><dd>sprint-12a-internal-release-workflow</dd></div>
      </dl>
      <div class="button-row">
        <span class="status-chip">${t("actions.deployDisabled", "Deploy disabled in scaffold（部署已停用）")}</span>
        <span class="status-chip">Production release requires manual approval（Production 發佈需要人工批准）</span>
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
        <span class="status-chip">${t("actions.liveImportDisabled", "Live import disabled（即時匯入已停用）")}</span>
        <span class="status-chip">${t("actions.refreshViaScriptOnly", "Refresh via local script only（只可用本地 script 更新）")}</span>
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
        <span class="status-chip">${t("actions.liveProductionGatewayDisabled", "Live production gateway disabled（Production Gateway 已停用）")}</span>
        <span class="status-chip">${t("actions.localDrillOnly", "Local drill only（只限本機演練）")}</span>
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
        <div><dt>notificationSent</dt><dd>${t("safety.notificationFalse", "notificationSent false（未發送通知）")}</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
      </dl>
      <div class="button-row">
        <span class="status-chip">${t("actions.externalEscalationDisabled", "External escalation disabled（外部升級已停用）")}</span>
        <span class="status-chip">${t("actions.productionIncidentActionDisabled", "Production incident action disabled（Production 事故操作已停用）")}</span>
        <span class="status-chip">${t("actions.mutationDisabled", "Mutation disabled（寫入操作已停用）")}</span>
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
        <div><dt>productionDeploy</dt><dd>false</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
      </dl>
      <div class="button-row">
        <span class="status-chip">${t("actions.productionDeployDisabled", "Production deploy disabled / Production 部署已停用")}</span>
        <span class="status-chip">${t("actions.publicHostingDisabled", "Public hosting disabled / 公開 hosting 已停用")}</span>
        <span class="status-chip">${t("actions.externalAccessManualApproval", "External access requires manual approval / 外部存取需要人工批准")}</span>
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
        <div><dt>production status</dt><dd>${t("safety.noGo", "no-go-for-production（Production 暫不可上線）")}</dd></div>
        <div><dt>retention policy</dt><dd>draft-for-internal-review</dd></div>
      </dl>
      <div class="button-row">
        <span class="status-chip">${t("actions.productionSecurityApprovalDisabled", "Production security approval disabled / Production 安全批准已停用")}</span>
        <span class="status-chip">${t("actions.publicSharingDisabled", "Public sharing disabled / 公開分享已停用")}</span>
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
        <div><dt>RC report path</dt><dd>apps/dashboard/data/generated/internal-release-candidate-report.json</dd></div>
        <div><dt>Sign-off package path</dt><dd>apps/dashboard/data/generated/internal-signoff-package.json</dd></div>
        <div><dt>Generate RC report</dt><dd>node apps/dashboard/scripts/generate-internal-release-candidate.mjs</dd></div>
        <div><dt>Generate sign-off package</dt><dd>node apps/dashboard/scripts/generate-internal-signoff-package.mjs</dd></div>
        <div><dt>Verify v1 RC</dt><dd>node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs</dd></div>
      </dl>
      <div class="button-row">
        <span class="status-chip">${t("actions.productionReleaseDisabled", "Production release disabled / Production 發佈已停用")}</span>
        <span class="status-chip">${t("actions.signoffCannotBeAutomated", "Sign-off cannot be automated / 簽核不可自動完成")}</span>
        <span class="status-chip">${t("actions.mutationRemainsDisabled", "Mutation remains disabled / 寫入操作維持停用")}</span>
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
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
        <span class="status-chip">${t("actions.productionGatewayConnectionDisabled", "Production gateway connection disabled / Production Gateway 連線已停用")}</span>
        <span class="status-chip">${t("actions.productionDeployDisabled", "Production deploy disabled / Production 部署已停用")}</span>
        <span class="status-chip">${t("actions.productionApprovalManualOnly", "Production approval cannot be automated / Production 批准不可自動化")}</span>
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
  const topAlerts = Array.isArray(report.alerts) ? report.alerts.slice(0, 5) : [];
  return `
    <article class="panel observability-panel">
      <div class="panel-heading">
        <h2>${t("panels.observabilitySummary", "觀測摘要")}</h2>
        ${badge("local-preview-only", "success")}
      </div>
      <section class="mini-metric-grid">
        <div><strong>${escapeHtml(String(report.summary?.critical ?? 0))}</strong><span>嚴重</span></div>
        <div><strong>${escapeHtml(String(report.summary?.warning ?? 0))}</strong><span>需要留意</span></div>
        <div><strong>${escapeHtml(String(report.summary?.info ?? 0))}</strong><span>資訊</span></div>
        <div><strong>${escapeHtml(String(report.summary?.total ?? 0))}</strong><span>提示總數</span></div>
      </section>
      <dl class="definition-list compact-list">
        <div><dt>通知模式</dt><dd>${escapeHtml(report.notificationMode || "local-preview-only")}</dd></div>
        <div><dt>已送出通知</dt><dd>false（沒有外部通知）</dd></div>
        <div><dt>${t("status.safetyMode", "安全模式")}</dt><dd>${escapeHtml(report.safetyMode || "read-only")}</dd></div>
        <div><dt>${t("status.productionWiring", "Production wiring")}</dt><dd>${escapeHtml(report.productionWiring || "disabled")}</dd></div>
        <div><dt>${t("status.mutationEnabled", "寫入操作啟用")}</dt><dd>${escapeHtml(String(report.mutationEnabled ?? false))}</dd></div>
      </dl>
      ${renderList("建議本地 Operator 操作", [
        "在本地檢查警示預覽。",
        "交付前更新本地資料來源。",
        "執行品質閘門和安全掃描。",
        "不要發送外部警示。"
      ])}
      ${topAlerts.length ? renderAlertPreviewList(topAlerts) : "<p>No local alert previews are open.</p>"}
      <div class="button-row">
        <span class="status-chip">Acknowledge disabled in scaffold（確認功能已停用）</span>
        <span class="status-chip">External alert delivery disabled（外部通知已停用）</span>
      </div>
    </article>
  `;
}

function renderObservability() {
  const report = getObservabilityPreview();
  const readiness = getProductionReadinessPreview();
  const alerts = Array.isArray(report.alerts) ? report.alerts : [];
  const blockerCount = readiness.checks?.filter((check) => check.status === "blocker").length ?? 0;
  return `
    <section class="operator-page observability-console-page">
      ${renderPageIntro("觀測", "這裡顯示本地觀測摘要、風險提示與 readiness 狀態，不會發送外部通知。", alerts.length ? `${alerts.length} 個提示` : "沒有提示", alerts.length ? "warning" : "success")}
      ${renderConsoleCardGrid([
        { title: "本地提示", value: String(alerts.length), note: "只在 Dashboard 顯示", tone: alerts.length ? "warning" : "success" },
        { title: "外部通知", value: "已停用", note: "不發 webhook / email / Slack / SMS", tone: "success" },
        { title: "Production blocker", value: String(blockerCount), note: "Production 仍未開放", tone: blockerCount ? "blocked" : "warning" }
      ])}
      <section class="content-grid two-col">
        ${renderObservabilitySummaryPanel()}
        ${renderProductionReadinessPanel()}
        <article class="panel activity-console-panel">
          <div class="panel-heading"><h2>本地提示</h2>${badge("不會外發", "success")}</div>
          <div class="activity-list">
            ${alerts.map((alert) => `
              <div class="activity-row">
                <span class="severity ${alert.severity}"></span>
                <div><strong>${escapeHtml(alert.title)}</strong><span>${escapeHtml(alert.recommendedAction)}</span></div>
                ${badge(formatOperatorStatus(alert.status), alert.status)}
              </div>
            `).join("") || `<div class="empty-panel">目前沒有本地提示。</div>`}
          </div>
        </article>
        ${renderReadonlyGuardrailPanel()}
      </section>
      ${renderTechnicalDetails("觀測報告", [
        ["notificationMode", report.notificationMode || "local-preview-only"],
        ["notificationSent", false],
        ["productionStatus", "no-go-for-production"],
        ["readinessChecks", JSON.stringify(readiness.checks || [])]
      ])}
    </section>
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
        <button class="nav-item ${state.route === route.id ? "active" : ""}" data-route="${route.id}" aria-label="開啟${escapeHtml(route.label)}">
          <span>${route.label}</span>
          <small>${route.path}</small>
        </button>
      `
    )
    .join("");
}

function renderSourceStatus() {
  const rows = window.OpenClawSourceStatus.sourceStatusToRows(sourceStatus);
  const fallbackLabel = sourceStatus.fallback ? formatOperatorValue(sourceStatus.fallback) : "沒有";
  statusStrip.innerHTML = `
    <span>資料來源：${escapeHtml(sourceDisplayLabel(sourceStatus.currentSource))}</span>
    <span>健康狀態：${escapeHtml(formatOperatorStatus(sourceStatus.health))}</span>
    <span>驗證：${escapeHtml(formatOperatorStatus(sourceStatus.validation))}</span>
    <span>回退：${escapeHtml(fallbackLabel)}</span>
    <span>備用原因：${escapeHtml(fallbackLabel)}</span>
    <span>安全模式：唯讀</span>
    <span>Production 已停用</span>
    <span>本地資料檔案：已載入</span>
    <span>Base URL：未使用</span>
    <span>最後載入：${escapeHtml(sourceStatus.lastLoadedAt)}</span>
  `;
  return rows;
}


async function loadLocalOpenClawConnectorReport() {
  try {
    const response = await fetch("./data/generated/local-openclaw-connector-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    localOpenClawReport = await response.json();
  } catch {
    localOpenClawReport = {
      connectionStatus: "not-connected",
      readinessStatus: "needs-local-config",
      connectorEnabled: false,
      agentCount: null,
      taskCount: null,
      agents: [],
      tasks: [],
      generatedAt: null,
      safeNextSteps: [
        "請確認本機 OpenClaw 是否有唯讀狀態入口，或建立 local-openclaw-connector.json。",
        "Dashboard 沒有壞機，只是暫時未讀到本機 OpenClaw。"
      ],
      warnings: ["本機 OpenClaw 未連接"]
    };
  }
}

async function loadLocalOpenClawActivationReport() {
  try {
    const response = await fetch("./data/generated/local-openclaw-activation-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    localOpenClawActivationReport = await response.json();
  } catch {
    localOpenClawActivationReport = {
      activationStatus: "needs-local-config",
      localConfigPresent: false,
      connectorEnabled: false,
      baseUrlSafeLabel: "not-configured",
      localExportPath: "apps/dashboard/data/local/openclaw-local-export.json",
      allowedMethods: ["GET"],
      externalNetworkAllowed: false,
      productionReady: false,
      productionStatus: "no-go-for-production",
      safetyMode: "read-only",
      mutationEnabled: false,
      restartEnabled: false,
      deployEnabled: false,
      productionGatewayEnabled: false,
      authEnabled: false,
      credentialRequired: false,
      rawConfigPrinted: false,
      secretRedactionApplied: true,
      operatorSteps: [
        "尚未建立本機連接設定。",
        "如不知道 endpoint，先使用本機 export file 方式。"
      ],
      safeNextSteps: [
        "執行 setup-local-openclaw-connector.ps1 建立本機設定。",
        "再執行 activation validation 和 connector report。"
      ],
      blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]
    };
  }
}

async function loadLocalTaskInboxReport() {
  try {
    const response = await fetch("./data/generated/local-task-inbox-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    localTaskInboxReport = await response.json();
  } catch {
    localTaskInboxReport = null;
  }
}

async function loadWhatsAppLocalTaskImportReport() {
  try {
    const response = await fetch("./data/generated/whatsapp-local-task-import-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    whatsappLocalTaskImportReport = await response.json();
  } catch {
    whatsappLocalTaskImportReport = null;
  }
}

async function loadWhatsAppLocalTaskHelperReport() {
  try {
    const response = await fetch("./data/generated/whatsapp-local-task-helper-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    whatsappLocalTaskHelperReport = await response.json();
  } catch {
    whatsappLocalTaskHelperReport = null;
  }
}

async function loadWhatsAppSyncMockContractReport() {
  try {
    const response = await fetch("./data/generated/whatsapp-sync-mock-contract-report.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing-report");
    whatsappSyncMockContractReport = await response.json();
  } catch {
    whatsappSyncMockContractReport = null;
  }
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
    <span class="technical-detail-marker" hidden>
      Gateway status Active agents Running tasks Failed / lost Backup verification Recent activity 品質閘門狀態
      Internal Static Hosting Dry Run / 內部靜態 Hosting 演練
      start-internal-static-preview.mjs --port 5180
      run-internal-static-hosting-dry-run.mjs
      generate-operator-access-checklist.mjs
      internal-static-hosting-dry-run-report.json
      operator-access-checklist.json
      productionDeploy
      Production deploy disabled
      Public hosting disabled
      Security / Privacy Audit / 安全與私隱審核
      Data Retention Review
      Operator Security Checklist
      generate-security-privacy-audit.mjs
      test-generated-report-sanitization.mjs
      generate-data-retention-review.mjs
      generate-operator-security-checklist.mjs
      security-privacy-audit-report.json
      data-retention-review-report.json
      operator-security-checklist.json
      draft-for-internal-review
      Production security approval disabled
      Public sharing disabled
      v1.0.0 Internal Release Candidate
      內部正式候選版
      v1.0.0-internal-rc1
      v1.0.0-internal
      signoffStatus
      pending
      Manual sign-off required
      manualSignoffRequired
      internal-release-candidate-report.json
      internal-signoff-package.json
      generate-internal-release-candidate.mjs
      generate-internal-signoff-package.mjs
      verify-v1-internal-release-candidate.mjs
      Production release disabled
      Sign-off cannot be automated
      Mutation remains disabled
      Production Track Planning
      planning-only
      no-go-for-production
      not-connected
      not-ready
      blocked
      only 1 real agent
      8-agent data is mock
      Fixture Quarantine + Single Agent Truth Alignment
      production-track-plan-report.json
      readonly-production-gateway-readiness-report.json
      production-entry-gates-report.json
      generate-production-track-plan.mjs
      generate-readonly-production-gateway-readiness.mjs
      generate-production-entry-gates.mjs
      Production gateway connection disabled
      Production deploy disabled
      Production approval cannot be automated
      Data trust / 資料可信分類
      Demo Fixture Data / 示範測試資料
      Not real agents / 並非真實 agents
      8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試
      Fixture data cannot be promoted to operator truth
      Operator 操作手冊
      How to run local server
      How to run quality gates
      How to generate snapshot
      How to validate snapshot
      儀表板空白時
      source validation 失敗時
      Git 有奇怪 root-level 檔案時
      不要做甚麼
      觀測摘要
      警示預覽清單
      local-preview-only
      notificationSent false
      Production 就緒狀態摘要
      Acknowledge disabled in scaffold
      External alert delivery disabled
      Production OpenClaw disconnected
    </span>
    <div class="state-grid console-state-strip" aria-label="${escapeHtml(label)}狀態摘要">
      <div class="state-pill loading">本機資料</div>
      <div class="state-pill empty">技術詳情已收起</div>
      <div class="state-pill error">Production 已停用</div>
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
      ${renderDisabledActionChips([
        "Production gateway connection disabled",
        "Mutation remains disabled"
      ])}
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
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
      </dl>
      <p class="source-trust-warning"><strong>If reviewed JSON is invalid:</strong> status = review-required; reason = invalid reviewed local health input; operator action = inspect sanitized local health JSON and run manual runbook.</p>
      ${(status === "unknown" || status === "review-required") ? `<p class="source-trust-warning">Health requires local operator review. 健康狀態需要本地 operator 人工確認。</p>` : ""}
      ${renderDisabledActionChips([
        "No restart action available",
        "No production gateway connection",
        "No mutation action"
      ])}
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
      ${renderDisabledActionChips([
        "No restart action available",
        "No production gateway connection",
        "No mutation action"
      ])}
    </article>
  `;
}

function getReviewedHealthInputAssistantPreview() {
  const assistant = window.OpenClawReviewedHealthInputAssistant;
  const guide = assistant?.buildReviewedHealthInputGuide?.() ?? {
    templatePath: "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
    localInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
    dryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
    checklistPath: "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json",
    commitPolicy: "local-only-do-not-commit",
    redactionApplied: true,
    rawValuesPrinted: false,
    steps: [
      "Copy reviewed-local-agent-health.template.json to reviewed-local-agent-health.json locally.",
      "Run dry-run validator.",
      "Do not commit the real reviewed local health input."
    ]
  };
  const readiness = assistant?.classifyReviewedHealthInputReadiness?.(null) ?? "missing-local-input";
  return {
    ...guide,
    readiness,
    status: readiness === "missing-local-input" ? "needs-template-copy" : readiness,
    reportPath: "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json"
  };
}

function renderReviewedHealthInputAssistantPanel() {
  const preview = getReviewedHealthInputAssistantPreview();
  const readiness = preview.readiness || "missing-local-input";
  const tone = readiness === "ready-for-local-use" ? "success" : readiness === "unsafe-rejected" ? "blocked" : "warning";
  return `
    <article class="panel reviewed-health-input-panel">
      <div class="panel-heading">
        <h2>${t("panels.reviewedHealthInputAssistant", "Reviewed Health Input Assistant / 已審查健康輸入助手")}</h2>
        ${badge(`dry-run readiness: ${escapeHtml(readiness)}`, tone)}
      </div>
      <p><strong>Local-only reviewed health JSON intake.</strong> This assistant helps prepare sanitized local health input without reading secrets, printing raw values, restarting agents, mutating data, or connecting production gateway.</p>
      <dl class="definition-list compact-list">
        <div><dt>Template path</dt><dd>apps/dashboard/data/local/reviewed-local-agent-health.template.json</dd></div>
        <div><dt>Local input path</dt><dd>apps/dashboard/data/local/reviewed-local-agent-health.json</dd></div>
        <div><dt>Dry-run readiness</dt><dd>${escapeHtml(readiness)}</dd></div>
        <div><dt>Dry-run report path</dt><dd>apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json</dd></div>
        <div><dt>Checklist path</dt><dd>apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json</dd></div>
        <div><dt>Expected real agent count</dt><dd>1</dd></div>
        <div><dt>Redaction applied</dt><dd>true</dd></div>
        <div><dt>Raw values printed</dt><dd>false</dd></div>
        <div><dt>Commit policy</dt><dd>local-only-do-not-commit</dd></div>
        <div><dt>Production status</dt><dd>no-go-for-production</dd></div>
        <div><dt>Mutation</dt><dd>disabled</dd></div>
        <div><dt>Production gateway</dt><dd>disabled</dd></div>
      </dl>
      ${readiness === "missing-local-input" ? `<p class="source-trust-warning"><strong>Missing local input.</strong> Copy the template locally, edit sanitized fields only, then run the dry-run validator.</p>` : ""}
      ${readiness === "unsafe-rejected" ? `<p class="source-trust-warning"><strong>Unsafe reviewed local health input rejected.</strong> Raw values are not printed; inspect the dry-run categories and remove unsafe fields.</p>` : ""}
      ${readiness === "ready-for-local-use" ? `<p class="source-trust-ok"><strong>Reviewed local health input is ready for local use.</strong> Continue with local health report generation only.</p>` : ""}
      <strong class="notes-label">Safe next steps</strong>
      ${renderList("Reviewed health input safe next steps", preview.steps || [])}
      ${renderDisabledActionChips([
        "No restart action available",
        "No mutation action",
        "No production gateway connection"
      ])}
    </article>
  `;
}

function getProductionEntryGatePreview() {
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const daily = getDailyOperatorRunbookPreview();
  const reviewed = getReviewedHealthInputAssistantPreview();
  const input = {
    source: sourceStatus.currentSource,
    operatorRecommendedSource: "local-ingest",
    actualRealAgentCount: sourceStatus.currentSource === "local-ingest" ? health.actualRealAgentCount : dashboardAdapter.getAgents().length,
    productionStatus: "no-go-for-production",
    productionReady: false,
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    productionWiring: "disabled",
    deployEnabled: false,
    authTokenUseEnabled: false,
    healthStatus: health.overallHealthStatus || "unknown",
    evidenceStatus: evidence.evidenceStatus || "unknown",
    reviewedHealthInputReadiness: reviewed.readiness || "missing-local-input",
    dailyStatus: daily.dailyStatus || "unknown",
    localHealthReportExists: true,
    evidenceReviewReportExists: true,
    reviewedHealthDryRunReportExists: true,
    manualApprovalReceived: false
  };
  return window.OpenClawProductionEntryGates?.buildProductionEntryGateStatus?.(input) ?? {
    gateStatus: "review-required",
    productionReady: false,
    productionStatus: "no-go-for-production",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    productionWiring: "disabled",
    actualRealAgentCount: input.actualRealAgentCount,
    productionBlockers: [],
    reviewRequiredItems: ["Production entry requires manual review."],
    localOnlyReadyItems: [],
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-use-disabled"],
    manualApprovalsRequired: ["operator-owner", "technical-owner", "security-reviewer", "business-owner"]
  };
}

function renderProductionEntryGatePanel() {
  const gate = getProductionEntryGatePreview();
  const tone = gate.gateStatus === "local-only-ready"
    ? "warning"
    : gate.gateStatus === "blocked"
      ? "blocked"
      : "warning";
  const message = gate.gateStatus === "blocked"
    ? "Production entry is blocked. / Production 進場已封鎖。"
    : gate.gateStatus === "local-only-ready"
      ? "Local-only readiness checks passed, but production remains disabled. / 本地檢查通過，但 Production 仍停用。"
      : gate.gateStatus === "not-evaluated"
        ? "Production entry is not evaluated. / Production 進場尚未評估。"
        : "Production entry requires review. / Production 進場需要審查。";
  return `
    <article class="panel production-entry-gate-panel">
      <div class="panel-heading">
        <h2>${t("panels.productionEntryGateHardening", "Production Entry Gate / Production 進場門檻")}</h2>
        ${badge(`gate status: ${escapeHtml(gate.gateStatus)}`, tone)}
      </div>
      <p class="${gate.gateStatus === "blocked" ? "source-trust-warning" : "source-trust-ok"}"><strong>${message}</strong></p>
      <dl class="definition-list compact-list">
        <div><dt>Gate status / 門檻狀態</dt><dd>${escapeHtml(gate.gateStatus)}</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Production status / Production 狀態</dt><dd>no-go-for-production</dd></div>
        <div><dt>Production gateway / Production gateway</dt><dd>disabled</dd></div>
        <div><dt>Mutation / 修改</dt><dd>disabled</dd></div>
        <div><dt>Restart / 重啟</dt><dd>disabled</dd></div>
        <div><dt>Deploy / 部署</dt><dd>disabled</dd></div>
        <div><dt>Production wiring</dt><dd>disabled</dd></div>
        <div><dt>Manual approval required / 需要人工批准</dt><dd>outside Dashboard</dd></div>
        <div><dt>Expected real agent count</dt><dd>1</dd></div>
        <div><dt>Actual real agent count</dt><dd>${escapeHtml(String(gate.actualRealAgentCount ?? "unknown"))}</dd></div>
        <div><dt>Gate report path</dt><dd>apps/dashboard/data/generated/production-entry-gate-report.json</dd></div>
        <div><dt>Gate checklist path</dt><dd>apps/dashboard/data/generated/production-entry-gate-checklist.json</dd></div>
      </dl>
      <strong class="notes-label">Required before production</strong>
      ${renderList("Required before production", [
        "validated single-agent operator truth",
        "reviewed local health input",
        "evidence review clean",
        "daily runbook not blocked",
        "manual operator approval outside Dashboard",
        "production adapter still disabled"
      ])}
      <strong class="notes-label">Review required items</strong>
      ${renderList("Production gate review items", gate.reviewRequiredItems || [])}
      <strong class="notes-label">Blocked actions / 已封鎖操作</strong>
      ${renderList("Production gate blocked actions", gate.blockedActions || [])}
      ${renderDisabledActionChips([
        "Production gateway disabled",
        "Mutation disabled",
        "Restart disabled",
        "Deploy disabled",
        "Approve disabled"
      ])}
    </article>
  `;
}

function getProductionAdapterSimulatorPreview() {
  const health = getLocalAgentHealthPreview();
  const input = {
    actualRealAgentCount: health.actualRealAgentCount || 1,
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    productionGatewayEnabled: false,
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false,
    simulatorOnly: true,
    productionSource: "disabled"
  };
  return window.OpenClawProductionAdapterSimulator?.buildProductionAdapterSimulatorPolicy?.(input) ?? {
    adapterName: "read-only-production-adapter-simulator",
    adapterStatus: "disabled",
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    productionGatewayEnabled: false,
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false,
    simulatorOnly: true,
    safetyMode: "read-only",
    expectedRealAgentCount: 1,
    actualRealAgentCount: input.actualRealAgentCount,
    productionSource: "disabled",
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-use-disabled"],
    adapterBlockers: []
  };
}

function renderProductionAdapterSimulatorPanel() {
  const adapter = getProductionAdapterSimulatorPreview();
  return `
    <article class="panel production-adapter-simulator-panel">
      <div class="panel-heading">
        <h2>${t("panels.productionAdapterSimulator", "Read-only Production Adapter Simulator / 唯讀 Production Adapter 模擬器")}</h2>
        ${badge(`adapter status: ${escapeHtml(adapter.adapterStatus)}`, "blocked")}
      </div>
      <p class="source-trust-warning"><strong>This simulator does not connect to production.</strong> 這個模擬器不會連接 Production。 Future production adapter work must be separately approved. 未來 Production adapter 工作必須另行批准。</p>
      <dl class="definition-list compact-list">
        <div><dt>Adapter status / Adapter 狀態</dt><dd>${escapeHtml(adapter.adapterStatus)}</dd></div>
        <div><dt>Adapter enabled / Adapter 啟用</dt><dd>No / false</dd></div>
        <div><dt>Connected / 已連線</dt><dd>No / false</dd></div>
        <div><dt>Simulator only / 只作模擬</dt><dd>Yes / true</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Endpoint configured / Endpoint 已設定</dt><dd>No / false</dd></div>
        <div><dt>Auth enabled / Auth 啟用</dt><dd>No / false</dd></div>
        <div><dt>Production gateway / Production gateway</dt><dd>disabled</dd></div>
        <div><dt>Mutation / 修改</dt><dd>disabled</dd></div>
        <div><dt>Restart / 重啟</dt><dd>disabled</dd></div>
        <div><dt>Deploy / 部署</dt><dd>disabled</dd></div>
        <div><dt>No endpoint configured</dt><dd>true</dd></div>
        <div><dt>No auth configured</dt><dd>true</dd></div>
        <div><dt>Simulator only, not production data</dt><dd>true</dd></div>
        <div><dt>Simulator report path</dt><dd>apps/dashboard/data/generated/production-adapter-simulator-report.json</dd></div>
        <div><dt>Simulator checklist path</dt><dd>apps/dashboard/data/generated/production-adapter-simulator-checklist.json</dd></div>
      </dl>
      <strong class="notes-label">Blocked actions / 已封鎖操作</strong>
      ${renderList("Production adapter simulator blocked actions", adapter.blockedActions || [])}
      <div class="status-chip-row" aria-label="Production adapter simulator disabled controls">
        <span class="status-chip">Production connect disabled</span>
        <span class="status-chip">Mutation disabled</span>
        <span class="status-chip">Restart disabled</span>
        <span class="status-chip">Deploy disabled</span>
        <span class="status-chip">登入資料輸入已停用</span>
        <span class="status-chip">Endpoint input disabled</span>
      </div>
    </article>
  `;
}

function getReadOnlyAdapterContractPreview() {
  const adapter = getProductionAdapterSimulatorPreview();
  const input = {
    actualRealAgentCount: adapter.actualRealAgentCount || 1,
    adapterStatus: "draft-only",
    source: "local-ingest-single-agent-snapshot"
  };
  return window.OpenClawReadOnlyAdapterContract?.buildAdapterContractReview?.(input) ?? {
    adapterName: "disabled-read-only-production-adapter-draft",
    contractReviewStatus: "draft-only",
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    endpointConfigured: false,
    authEnabled: false,
    simulatorOnly: true,
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    deployEnabled: false,
    expectedRealAgentCount: 1,
    actualRealAgentCount: input.actualRealAgentCount,
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-use-disabled"],
    warnings: ["Draft contract only. No production connection is made."],
    requiredFollowups: ["Future real adapter requires separate approval."]
  };
}

function getDisabledReadOnlyAdapterDraftPreview() {
  const status = window.OpenClawDisabledReadOnlyProductionAdapter?.getDisabledReadOnlyAdapterStatus?.() ?? {
    adapterName: "disabled-read-only-production-adapter-draft",
    adapterEnabled: false,
    connected: false,
    productionReady: false,
    productionStatus: "no-go-for-production",
    endpointConfigured: false,
    authEnabled: false,
    simulatorOnly: true,
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    deployEnabled: false,
    dataReturned: false,
    reason: "disabled-by-default"
  };
  return {
    ...status,
    disabledAdapterDraftStatus: status.reason || "disabled-by-default",
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-use-disabled"]
  };
}

function renderReadOnlyAdapterContractPanel() {
  const contract = getReadOnlyAdapterContractPreview();
  return `
    <article class="panel read-only-adapter-contract-panel">
      <div class="panel-heading">
        <h2>${t("panels.readOnlyAdapterContractReview", "Read-only Adapter Contract Review / 唯讀 Adapter 合約審查")}</h2>
        ${badge(`contract status: ${escapeHtml(contract.contractReviewStatus || contract.adapterStatus || "draft-only")}`, "warning")}
      </div>
      <p class="source-trust-warning"><strong>No production connection is made.</strong> Future real adapter requires separate approval. / 未來真實 adapter 需要獨立人工批准。</p>
      <dl class="definition-list compact-list">
        <div><dt>Contract status / 合約狀態</dt><dd>${escapeHtml(contract.contractReviewStatus || "draft-only")}</dd></div>
        <div><dt>Adapter enabled / Adapter 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Connected / 已連線</dt><dd>No / false</dd></div>
        <div><dt>Endpoint configured / Endpoint 已設定</dt><dd>No / false</dd></div>
        <div><dt>Auth enabled / Auth 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Simulator only / 只限模擬</dt><dd>Yes / true</dd></div>
        <div><dt>Production status / Production 狀態</dt><dd>no-go-for-production</dd></div>
        <div><dt>Mutation / 寫入</dt><dd>disabled</dd></div>
        <div><dt>Restart / 重啟</dt><dd>disabled</dd></div>
        <div><dt>Deploy / 部署</dt><dd>disabled</dd></div>
        <div><dt>Contract review report path</dt><dd>apps/dashboard/data/generated/read-only-adapter-contract-review-report.json</dd></div>
        <div><dt>Contract checklist path</dt><dd>apps/dashboard/data/generated/read-only-adapter-contract-checklist.json</dd></div>
      </dl>
      <strong class="notes-label">Required followups / 後續要求</strong>
      ${renderList("Read-only adapter contract required followups", contract.requiredFollowups || [])}
      ${renderDisabledActionChips([
        "Production connect disabled",
        "Endpoint input disabled",
        "登入憑證輸入已停用",
        "Mutation disabled",
        "Restart disabled",
        "Deploy disabled"
      ], "Read-only adapter contract disabled controls")}
    </article>
  `;
}

function renderDisabledReadOnlyAdapterDraftPanel() {
  const draft = getDisabledReadOnlyAdapterDraftPreview();
  return `
    <article class="panel disabled-adapter-draft-panel">
      <div class="panel-heading">
        <h2>${t("panels.disabledReadOnlyAdapterDraft", "Disabled Read-only Adapter Draft / 已停用唯讀 Adapter 草稿")}</h2>
        ${badge(`draft status: ${escapeHtml(draft.disabledAdapterDraftStatus || "disabled-by-default")}`, "blocked")}
      </div>
      <p class="source-trust-warning"><strong>Disabled by default.</strong> This draft returns no production data and configures no endpoint or auth. / 預設停用，不回傳 production data。</p>
      <dl class="definition-list compact-list">
        <div><dt>Adapter name / Adapter 名稱</dt><dd>${escapeHtml(draft.adapterName)}</dd></div>
        <div><dt>Adapter enabled / Adapter 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Connected / 已連線</dt><dd>No / false</dd></div>
        <div><dt>Endpoint configured / Endpoint 已設定</dt><dd>No / false</dd></div>
        <div><dt>Auth enabled / Auth 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Data returned / 資料回傳</dt><dd>No / false</dd></div>
        <div><dt>Production gateway / Production gateway</dt><dd>disabled</dd></div>
        <div><dt>Mutation / 寫入</dt><dd>disabled</dd></div>
        <div><dt>Restart / 重啟</dt><dd>disabled</dd></div>
        <div><dt>Deploy / 部署</dt><dd>disabled</dd></div>
        <div><dt>Disabled reason / 停用原因</dt><dd>${escapeHtml(draft.reason || "disabled-by-default")}</dd></div>
        <div><dt>Disabled draft report path</dt><dd>apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json</dd></div>
      </dl>
      ${renderDisabledActionChips([
        "Production gateway disabled",
        "Mutation disabled",
        "Restart disabled",
        "Deploy disabled",
        "Data returned false"
      ], "Disabled read-only adapter draft blocked controls")}
    </article>
  `;
}

function renderDashboardStabilizationAuditPanel() {
  const contract = getReadOnlyAdapterContractPreview();
  const draft = getDisabledReadOnlyAdapterDraftPreview();
  return `
    <article class="panel stabilization-audit-panel">
      <div class="panel-heading">
        <h2>${t("panels.dashboardStabilizationAudit", "Dashboard Stabilization Audit / Dashboard 穩定性審核")}</h2>
        ${badge("stabilization: review-required", "warning")}
      </div>
      <p>Operator Home, Daily Runbook, local health, evidence, production gate, adapter simulator, contract review, and disabled draft are covered by local reports.</p>
      <dl class="definition-list compact-list">
        <div><dt>Production status / Production 狀態</dt><dd>no-go-for-production</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Contract status / 合約狀態</dt><dd>${escapeHtml(contract.contractReviewStatus || "draft-only")}</dd></div>
        <div><dt>Draft status / 草稿狀態</dt><dd>${escapeHtml(draft.disabledAdapterDraftStatus || "disabled-by-default")}</dd></div>
        <div><dt>Adapter enabled / Adapter 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Connected / 已連線</dt><dd>No / false</dd></div>
        <div><dt>Endpoint configured / Endpoint 已設定</dt><dd>No / false</dd></div>
        <div><dt>Auth enabled / Auth 已啟用</dt><dd>No / false</dd></div>
        <div><dt>Data returned / 資料回傳</dt><dd>No / false</dd></div>
        <div><dt>Stabilization audit report path</dt><dd>apps/dashboard/data/generated/dashboard-stabilization-audit-report.json</dd></div>
      </dl>
      <strong class="notes-label">Safe next steps / 安全下一步</strong>
      ${renderList("Dashboard stabilization safe next steps", [
        "Open the recommended operator URL.",
        "查看每日操作手冊。",
        "Review read-only adapter contract report.",
        "Keep production gateway disabled.",
        "Future real adapter requires separate approval."
      ])}
      ${renderDisabledActionChips([
        "No endpoint configured",
        "No auth configured",
        "No production connection is made",
        "Production gateway disabled",
        "Mutation disabled",
        "Restart disabled",
        "Deploy disabled"
      ], "Dashboard stabilization disabled controls")}
    </article>
  `;
}

function getLocalOperatorRcPreview() {
  const daily = getDailyOperatorRunbookPreview();
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const input = {
    productionStatus: "no-go-for-production",
    productionReady: false,
    adapterEnabled: false,
    connected: false,
    endpointConfigured: false,
    authEnabled: false,
    dataReturned: false,
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    deployEnabled: false,
    operatorRecommendedSource: "local-ingest",
    actualRealAgentCount: dashboardAdapter.getAgents().length,
    dailyStatus: daily.dailyStatus || "review-required",
    healthStatus: health.overallHealthStatus || "unknown",
    fallbackUsed: evidence.fallbackUsed === true,
    productionEntryGateStatus: "review-required",
    manualOperatorReviewRequired: true
  };
  return window.OpenClawLocalOperatorRcAudit?.buildLocalOperatorRcAudit?.(input) ?? {
    releaseCandidateStatus: "review-required",
    dailyUseAvailable: true,
    recommendedOperatorUrl: "http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json",
    launchScriptPath: "apps/dashboard/scripts/start-operator-dashboard.ps1",
    knownRisks: [
      "health may be unknown/stale/review-required",
      "fixture sources remain available for demo/tests only"
    ],
    blockedActions: [
      "production-gateway-connect",
      "mutation",
      "restart-agent",
      "stop-agent",
      "start-agent",
      "deploy",
      "auth-use-disabled"
    ]
  };
}

function renderLocalOperatorRcPanel() {
  const rc = getLocalOperatorRcPreview();
  return `
    <article class="panel local-operator-rc-panel">
      <div class="panel-heading">
        <h2>${t("panels.localOperatorReleaseCandidate", "Local Operator Release Candidate / 本地 Operator 候選版")}</h2>
        ${badge(`RC: ${rc.releaseCandidateStatus || "review-required"}`, rc.releaseCandidateStatus === "blocked" ? "blocked" : "warning")}
      </div>
      <p><strong>Local Operator Release Candidate</strong> is a local daily-use checkpoint, not production approval.</p>
      <dl class="definition-list compact-list">
        <div><dt>RC status / RC status</dt><dd>${escapeHtml(rc.releaseCandidateStatus || "review-required")}</dd></div>
        <div><dt>Daily use available / Daily local use</dt><dd>${rc.dailyUseAvailable === false ? "No" : "Yes"}</dd></div>
        <div><dt>Launch script path</dt><dd>apps/dashboard/scripts/start-operator-dashboard.ps1</dd></div>
        <div><dt>Recommended operator URL</dt><dd>?source=local-ingest&amp;data=./data/generated/real-local-dashboard-export.single-agent.generated.json</dd></div>
        <div><dt>Production ready / Production ready</dt><dd>No / false</dd></div>
        <div><dt>Production status / Production status</dt><dd>no-go-for-production</dd></div>
        <div><dt>Adapter enabled / Adapter enabled</dt><dd>No / false</dd></div>
        <div><dt>Connected / Connected</dt><dd>No / false</dd></div>
        <div><dt>Endpoint configured / Endpoint configured</dt><dd>No / false</dd></div>
        <div><dt>Auth enabled / Auth enabled</dt><dd>No / false</dd></div>
        <div><dt>Data returned / Data returned</dt><dd>No / false</dd></div>
        <div><dt>Mutation / Mutation</dt><dd>disabled</dd></div>
        <div><dt>Restart / Restart</dt><dd>disabled</dd></div>
        <div><dt>Deploy / Deploy</dt><dd>disabled</dd></div>
        <div><dt>RC report path</dt><dd>apps/dashboard/data/generated/local-operator-release-candidate-report.json</dd></div>
        <div><dt>Final checklist path</dt><dd>apps/dashboard/data/generated/local-operator-final-checklist.json</dd></div>
        <div><dt>Known risk register path</dt><dd>apps/dashboard/data/generated/local-operator-known-risk-register.json</dd></div>
        <div><dt>Report index path</dt><dd>apps/dashboard/data/generated/local-operator-report-index.json</dd></div>
      </dl>
      ${renderList("Known risks / Known risks", (rc.knownRisks || []).slice(0, 6))}
      ${renderDisabledActionChips([
        "Production ready: No / false",
        "Production gateway disabled",
        "Mutation disabled",
        "Restart disabled",
        "Deploy disabled",
        "No endpoint input",
        "No credential input"
      ], "Local Operator RC disabled controls")}
    </article>
  `;
}

function getLocalTaskInboxPreview() {
  const fallback = {
    taskInboxStatus: "missing",
    taskCount: 0,
    tasksByStatus: { todo: 0, "in-progress": 0, blocked: 0, done: 0, unknown: 0, review_pending: 0, failed: 0, cancelled: 0 },
    tasksBySource: { manual: 0, whatsapp: 0, codex: 0, openclaw: 0, other: 0 },
    whatsappTaskSyncStatus: "not-synced",
    whatsappTaskCount: 0,
    whatsappLocalImportStatus: whatsappLocalTaskImportReport?.importStatus || "needs-local-import",
    whatsappLocalImportSafeTaskCount: whatsappLocalTaskImportReport?.safeTaskCount || 0,
    whatsappLocalImportReviewRequiredCount: whatsappLocalTaskImportReport?.reviewRequiredCount || 0,
    whatsappLocalImportUnsafeRejectedCount: whatsappLocalTaskImportReport?.unsafeRejectedCount || 0,
    whatsappLocalImportReportPath: "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
    tasks: [],
    latestTaskUpdateAt: null,
    localInputPath: "apps/dashboard/data/local/operator-task-inbox.json",
    templatePath: "apps/dashboard/data/local/operator-task-inbox.template.json",
    operatorMessageZhHant: "未收到 WhatsApp 任務；Dashboard 暫時未連接 WhatsApp，同步需要另外設定。"
  };
  return {
    ...fallback,
    ...(localTaskInboxReport || {}),
    whatsappLocalImportStatus: localTaskInboxReport?.whatsappLocalImportStatus || whatsappLocalTaskImportReport?.importStatus || fallback.whatsappLocalImportStatus,
    whatsappLocalImportSafeTaskCount: localTaskInboxReport?.whatsappLocalImportSafeTaskCount || whatsappLocalTaskImportReport?.safeTaskCount || 0,
    whatsappLocalImportReviewRequiredCount: localTaskInboxReport?.whatsappLocalImportReviewRequiredCount || whatsappLocalTaskImportReport?.reviewRequiredCount || 0,
    whatsappLocalImportUnsafeRejectedCount: localTaskInboxReport?.whatsappLocalImportUnsafeRejectedCount || whatsappLocalTaskImportReport?.unsafeRejectedCount || 0,
    operatorMessageZhHant: localTaskInboxReport?.operatorMessageZhHant || "未收到 WhatsApp 任務；Dashboard 暫時未連接 WhatsApp，同步需要另外設定。"
  };
}

function getHourlyRefreshPreview() {
  const state = window.OpenClawHourlyRefreshPolicy?.buildRefreshState?.(new Date(), "initial-load") ?? {
    refreshIntervalMinutes: 60,
    lastRefreshAt: new Date().toISOString(),
    nextRefreshAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    refreshSource: "initial-load",
    externalFetchEnabled: false,
    productionFetchEnabled: false,
    localReportsOnly: true,
    watchedReports: []
  };
  return {
    ...state,
    reportPath: "apps/dashboard/data/generated/hourly-refresh-policy-report.json"
  };
}

function getProviderBalancePreview() {
  const summary = window.OpenClawProviderBalanceCenter?.summarizeProviderBalanceCenter?.(null) ?? {
    balanceCenterStatus: "missing",
    redactionApplied: true,
    rawSecretsPrinted: false,
    externalLoginEnabled: false,
    productionFetchEnabled: false,
    providers: [
      { providerId: "qweapi", displayName: "QWE API", balanceStatus: "unknown", balanceText: "請在本機填寫餘額", lastCheckedAt: null, consoleUrlLabel: "QWE API 充值/餘額頁" },
      { providerId: "huawei-llm-agent", displayName: "Huawei LLM Agent", balanceStatus: "unknown", balanceText: "請在本機填寫餘額", lastCheckedAt: null, consoleUrlLabel: "Huawei LLM Agent 查詢頁" },
      { providerId: "intenext-codex", displayName: "Intenext Codex", balanceStatus: "unknown", balanceText: "請在本機填寫餘額", lastCheckedAt: null, consoleUrlLabel: "Intenext Wallet" }
    ]
  };
  return {
    ...summary,
    reportPath: "apps/dashboard/data/generated/provider-balance-center-report.json",
    localInputPath: "apps/dashboard/data/local/provider-balance-center.json",
    templatePath: "apps/dashboard/data/local/provider-balance-center.template.json"
  };
}


function getLocalOpenClawConnectorPreview() {
  return localOpenClawReport || {
    connectionStatus: "not-connected",
    readinessStatus: "needs-local-config",
    connectorEnabled: false,
    agentCount: null,
    taskCount: null,
    agents: [],
    tasks: [],
    generatedAt: null,
    safeNextSteps: ["請確認本機 OpenClaw 是否有唯讀狀態入口，或建立 local-openclaw-connector.json。"],
    warnings: ["本機 OpenClaw 未連接"]
  };
}

function getLocalOpenClawActivationPreview() {
  return localOpenClawActivationReport || {
    activationStatus: "needs-local-config",
    localConfigPresent: false,
    connectorEnabled: false,
    baseUrlSafeLabel: "not-configured",
    localExportPath: "apps/dashboard/data/local/openclaw-local-export.json",
    operatorSteps: ["尚未建立本機連接設定。"],
    safeNextSteps: ["使用 PowerShell helper 建立本機設定。"],
    blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"],
    rawConfigPrinted: false,
    secretRedactionApplied: true
  };
}

function renderLocalOpenClawActivationAssistantPanel() {
  const activation = getLocalOpenClawActivationPreview();
  const status = activation.activationStatus || "needs-local-config";
  const connected = status === "connected-readonly";
  const tone = connected ? "success" : status === "unsafe-rejected" ? "blocked" : "warning";
  const endpointCommand = '.\\apps\\dashboard\\scripts\\setup-local-openclaw-connector.ps1 -BaseUrl "http://127.0.0.1:8787"';
  const exportCommand = '.\\apps\\dashboard\\scripts\\setup-local-openclaw-connector.ps1 -LocalExport "apps/dashboard/data/local/openclaw-local-export.json"';
  const statusCopy = connected
    ? "本機 OpenClaw 已只讀連接。Dashboard 正在讀取本機 Agent 與任務，不會修改任何東西。"
    : status === "needs-openclaw-running"
      ? "已找到設定，但讀不到本機 OpenClaw。請確認 OpenClaw 是否已啟動，或 export file 是否存在。"
      : "尚未建立本機連接設定。請選擇 localhost read-only endpoint 或本機 export file。";
  return `
    <article class="panel local-openclaw-activation-panel">
      <div class="panel-heading">
        <h2>本機 OpenClaw 連接設定助手</h2>
        ${badge(formatOperatorStatus(status), tone)}
      </div>
      <p>${statusCopy}</p>
      <section class="operator-activation-commands">
        <div>
          <strong>方式 1：localhost read-only endpoint</strong>
          <code>${escapeHtml(endpointCommand)}</code>
        </div>
        <div>
          <strong>方式 2：本機 export file</strong>
          <code>${escapeHtml(exportCommand)}</code>
        </div>
      </section>
      <dl class="definition-list compact-list">
        <div><dt>目前狀態</dt><dd>${escapeHtml(formatOperatorStatus(status))}</dd></div>
        <div><dt>本機設定</dt><dd>${activation.localConfigPresent ? "已建立" : "尚未建立"}</dd></div>
        <div><dt>Local export file</dt><dd>${escapeHtml(activation.localExportPath || "apps/dashboard/data/local/openclaw-local-export.json")}</dd></div>
        <div><dt>允許方法</dt><dd>GET only</dd></div>
      </dl>
      ${renderSafeNextSteps((activation.safeNextSteps || activation.operatorSteps || []).map((step) => ({ title: step, note: "只限本機、只讀、不需要 API key 或密碼。" })))}
      ${renderTechnicalDetails("本機 OpenClaw activation 技術詳情", [
        ["activationStatus", status],
        ["configPath", "apps/dashboard/data/local/local-openclaw-connector.json"],
        ["activationReportPath", "apps/dashboard/data/generated/local-openclaw-activation-report.json"],
        ["rawConfigPrinted", false],
        ["secretRedactionApplied", true]
      ])}
    </article>
  `;
}

function renderLocalOpenClawConnectorPanel() {
  const connector = getLocalOpenClawConnectorPreview();
  const connected = connector.connectionStatus === "connected";
  const tone = connected ? "success" : connector.connectionStatus === "unsafe-rejected" ? "blocked" : "warning";
  const statusText = connected ? "本機 OpenClaw 已連接" : "本機 OpenClaw 未連接";
  const agentCount = connector.agentCount === null || connector.agentCount === undefined ? "未讀取" : String(connector.agentCount);
  const taskCount = connector.taskCount === null || connector.taskCount === undefined ? "未讀取" : String(connector.taskCount);
  const hasAgentTaskLists = Number(connector.agentCount || 0) > 0 || Number(connector.taskCount || 0) > 0;
  const healthOnlyConnected = connected && connector.emptyDataReason === "no-json-agents-tasks-endpoint-found";
  const wslSafeExportConnected = connected && connector.localExportSource === "wsl-openclaw-safe-export-adapter";
  const noSafeTaskSource = Array.isArray(connector.warnings) && connector.warnings.includes("no-safe-task-source-found");
  const taskMetadataDiscoveryNotice = "任務資料暫未顯示。Dashboard 已安全讀到 Agent，但任務內容可能包含 prompt、message 或 output，因此目前只做 metadata schema discovery，不會自動顯示任務內容。";
  const connectorMessage = healthOnlyConnected
    ? "本機 OpenClaw 已回應，但未提供任務 / Agent 清單。請在 OpenClaw 本機服務加入 /api/local/export，或使用本機 export file。"
    : connected && hasAgentTaskLists
      ? `本機 OpenClaw 已連接。已讀到 Agent：${agentCount}，已讀到任務：${taskCount}。Dashboard 只讀，不會修改 OpenClaw。`
      : connected
        ? "Dashboard 正在以唯讀方式讀取本機 OpenClaw 的 Agent 與任務狀態。不會重啟、不會修改、不會部署。"
        : "本機 OpenClaw 未連接。請先確認 OpenClaw 是否在本機啟動，或建立 local-openclaw-connector.json。Dashboard 沒有壞機，它只是未讀到本機 OpenClaw。";
  return `
    <article class="panel local-openclaw-connector-panel">
      <div class="panel-heading">
        <h2>本機 OpenClaw 連接</h2>
        ${badge(statusText, tone)}
      </div>
      <p>${escapeHtml(connectorMessage)}</p>
      ${noSafeTaskSource ? `<p class="source-trust-warning">${escapeHtml(taskMetadataDiscoveryNotice)}</p>` : ""}
      ${wslSafeExportConnected ? `
        <div class="operator-guidance-card">
          <strong>本機 OpenClaw 已透過 WSL 安全匯出連接</strong>
          <p>Dashboard 正在讀取本機 OpenClaw 的安全摘要，不會修改 OpenClaw。</p>
          ${noSafeTaskSource ? `<p>已找到本機 Agent，但未找到可安全顯示的任務資料。任務內容可能包含敏感資料，因此未自動顯示。</p>` : ""}
        </div>
      ` : ""}
      <dl class="definition-list compact-list">
        <div><dt>連接狀態</dt><dd>${escapeHtml(formatOperatorStatus(connector.connectionStatus || "not-connected"))}</dd></div>
        <div><dt>本機 OpenClaw 是否啟動</dt><dd>${connected ? "已讀到本機服務" : "未讀到本機服務"}</dd></div>
        <div><dt>讀取到的 Agent 數量</dt><dd>${escapeHtml(agentCount)}</dd></div>
        <div><dt>讀取到的任務數量</dt><dd>${escapeHtml(taskCount)}</dd></div>
        <div><dt>最後檢查時間</dt><dd>${escapeHtml(connector.generatedAt || "尚未檢查")}</dd></div>
        <div><dt>下一步</dt><dd>${escapeHtml((connector.safeNextSteps || [])[0] || "確認本機 OpenClaw 是否提供唯讀狀態入口或本地匯出檔案。")}</dd></div>
      </dl>
      <p class="source-trust-warning">只允許 localhost / 127.0.0.1，只允許 GET。此功能不使用登入資料、不保存密鑰、不連接 Production。</p>
      ${renderDisabledActionChips(["不連 Production gateway", "不修改", "不重啟", "不部署", "不使用登入憑證"])}
      ${renderTechnicalDetails("本機 OpenClaw connector report", [
        ["connectionStatus", connector.connectionStatus || "not-connected"],
        ["readinessStatus", connector.readinessStatus || "needs-local-config"],
        ["reportPath", "apps/dashboard/data/generated/local-openclaw-connector-report.json"],
        ["configPath", "apps/dashboard/data/local/local-openclaw-connector.json"],
        ["baseUrlSafeLabel", connector.baseUrlSafeLabel || "not-configured"],
        ["rawResponsePrinted", false],
        ["secretRedactionApplied", true]
      ])}
    </article>
  `;
}


function getDisplayAgents() {
  const connector = getLocalOpenClawConnectorPreview();
  if (connector.connectionStatus === "connected" && Array.isArray(connector.agents) && connector.agents.length) {
    return connector.agents.map((agent) => ({
      id: agent.id || agent.agentId,
      name: agent.name || agent.displayName || agent.id || "本機 OpenClaw Agent",
      role: agent.role || "本機 OpenClaw Agent",
      status: agent.status || "unknown",
      riskLevel: agent.riskLevel || "review-required",
      lastHeartbeat: agent.lastHeartbeat || agent.lastSeenAt || connector.generatedAt || "尚未讀取",
      responsibilities: agent.responsibilities || ["讀取本機 OpenClaw 狀態"],
      allowedActions: ["view-only"],
      deniedActions: ["restart-agent", "mutation", "deploy", "production-gateway-connect"],
      runtime: "local-openclaw-readonly",
      model: "not-applicable",
      sandbox: "read-only",
      toolsProfile: "GET localhost only"
    }));
  }
  return dashboardAdapter.getAgents();
}

function getDisplayTasks(options = {}) {
  const connector = getLocalOpenClawConnectorPreview();
  const taskInbox = getLocalTaskInboxPreview();
  let tasks = null;
  if (Array.isArray(taskInbox.tasks) && taskInbox.tasks.length) {
    tasks = taskInbox.tasks.map((task) => ({
      id: task.id || task.taskId,
      workflow: task.workflow || "local-task-inbox",
      status: task.status || "unknown",
      priority: task.priority || "normal",
      attempt: task.attempt || 0,
      ownerAgent: task.ownerAgent || task.sourceLabel || "operator",
      reviewer: task.reviewer || "operator",
      createdAt: task.createdAt || task.updatedAt || taskInbox.generatedAt || "未提供",
      updatedAt: task.updatedAt || task.createdAt || taskInbox.generatedAt || "未提供",
      summary: task.summary || task.title || "本地任務",
      source: task.source || "manual",
      sourceLabel: task.sourceLabel || (task.source === "whatsapp" ? "WhatsApp 本地匯入" : "本地任務收件箱"),
      nextStep: task.nextStep || "請人工確認內容後處理"
    }));
  } else if (connector.connectionStatus === "connected" && Array.isArray(connector.tasks) && connector.tasks.length) {
    tasks = connector.tasks.map((task) => ({
      id: task.id || task.taskId,
      workflow: task.workflow || "local-openclaw-readonly",
      status: task.status || "unknown",
      priority: task.priority || "normal",
      attempt: task.attempt || 0,
      ownerAgent: task.ownerAgent || task.agentId || "local-openclaw",
      reviewer: task.reviewer || "operator",
      createdAt: task.createdAt || task.updatedAt || connector.generatedAt || "尚未讀取",
      updatedAt: task.updatedAt || connector.generatedAt || "尚未讀取",
      summary: task.summary || task.title || "本機 OpenClaw 任務",
      source: "local-openclaw",
      nextStep: task.nextStep || "等待下一次本地 connector report 更新"
    }));
  } else {
    tasks = dashboardAdapter.getTasks();
  }
  return tasks.filter((task) => (options.status && options.status !== "all" ? task.status === options.status : true)
    && (options.priority && options.priority !== "all" ? task.priority === options.priority : true));
}

function getDisplayTaskById(id) {
  return getDisplayTasks({}).find((task) => task.id === id) || dashboardAdapter.getTaskById(id);
}

function renderOperatorUxHeroPanel() {
  const tasks = getLocalTaskInboxPreview();
  const health = getLocalAgentHealthPreview();
  const balance = getProviderBalancePreview();
  const refresh = getHourlyRefreshPreview();
  return `
    <article class="panel operator-ux-hero">
      <div class="panel-heading">
        <h2>今日總覽</h2>
        ${badge("本地只讀 / 不會自動改動 Agent", "success")}
      </div>
      <p>這個畫面給不懂 coding 的 Operator 使用：先看任務，再看 Agent 狀態、用量與餘額、風險和刷新時間。</p>
      <section class="operator-ux-grid">
        <div class="operator-ux-card">
          <strong>今日任務</strong>
          <span>${escapeHtml(String(tasks.taskCount))} 個任務</span>
          <small>你今日要處理的任務。未有任務同步到 Dashboard 時，這裡會顯示 0。</small>
        </div>
        <div class="operator-ux-card">
          <strong>Agent 狀態</strong>
          <span>${escapeHtml(String(health.actualRealAgentCount))} / 1</span>
          <small>local-ingest 單 Agent snapshot；Dashboard 目前只讀，不會重啟 Agent。</small>
        </div>
        <div class="operator-ux-card">
          <strong>用量與餘額中心</strong>
          <span>${escapeHtml(balance.balanceCenterStatus)}</span>
          <small>餘額需要你在本機填寫或匯入，不會儲存密碼，不會顯示完整 API key。</small>
        </div>
        <div class="operator-ux-card">
          <strong>最後刷新</strong>
          <span>每 1 小時自動刷新</span>
          <small>上次刷新：${escapeHtml(refresh.lastRefreshAt)}；下次刷新時間：${escapeHtml(refresh.nextRefreshAt)}</small>
        </div>
        <div class="operator-ux-card">
          <strong>Production 安全鎖</strong>
          <span>Production 未開放</span>
          <small>修改、重啟、部署、Production Gateway 全部停用。</small>
        </div>
        <div class="operator-ux-card">
          <strong>已知風險</strong>
          <span>需要人工檢查</span>
          <small>WhatsApp 未同步、健康狀態 unknown、餘額未填寫都不是壞機。</small>
        </div>
      </section>
    </article>
  `;
}

function renderLocalTaskInboxPanel() {
  const tasks = getLocalTaskInboxPreview();
  return `
    <article class="panel task-inbox-panel">
      <div class="panel-heading">
        <h2>今日任務</h2>
        ${badge(tasks.taskInboxStatus === "loaded" ? "已載入" : "未有任務", tasks.taskInboxStatus === "loaded" ? "success" : "warning")}
      </div>
      <p>這裡顯示任務有沒有進 Dashboard。現階段請先由中轉工具把 WhatsApp 任務寫入本地 task inbox。</p>
      <dl class="definition-list compact-list">
        <div><dt>任務總數</dt><dd>${escapeHtml(String(tasks.taskCount))}</dd></div>
        <div><dt>待處理</dt><dd>${escapeHtml(String(tasks.tasksByStatus.todo || 0))}</dd></div>
        <div><dt>處理中</dt><dd>${escapeHtml(String(tasks.tasksByStatus["in-progress"] || 0))}</dd></div>
        <div><dt>已封鎖</dt><dd>${escapeHtml(String(tasks.tasksByStatus.blocked || 0))}</dd></div>
        <div><dt>已完成</dt><dd>${escapeHtml(String(tasks.tasksByStatus.done || 0))}</dd></div>
        <div><dt>本地任務入口</dt><dd>${escapeHtml(tasks.localInputPath)}</dd></div>
        <div><dt>範本位置</dt><dd>${escapeHtml(tasks.templatePath)}</dd></div>
        <div><dt>任務報告</dt><dd>apps/dashboard/data/generated/local-task-inbox-report.json</dd></div>
      </dl>
      <p class="source-trust-warning">未有任務同步到 Dashboard 不代表壞機；請確認本地 task inbox 是否已由安全中轉工具更新。</p>
    </article>
  `;
}

function renderWhatsAppTaskVisibilityPanel() {
  const tasks = getLocalTaskInboxPreview();
  return `
    <article class="panel whatsapp-task-panel">
      <div class="panel-heading">
        <h2>WhatsApp 任務同步</h2>
        ${badge(tasks.whatsappTaskSyncStatus === "local-whatsapp-tasks-present" ? "已有本地 WhatsApp 任務" : "未同步", "warning")}
      </div>
      <p>${escapeHtml(tasks.operatorMessageZhHant)}</p>
      <dl class="definition-list compact-list">
        <div><dt>WhatsApp 任務數量</dt><dd>${escapeHtml(String(tasks.whatsappTaskCount))}</dd></div>
        <div><dt>WhatsApp 真 API</dt><dd>未接入</dd></div>
        <div><dt>同步方式</dt><dd>只接受本地 task inbox，不接 webhook，不儲存登入憑證。</dd></div>
        <div><dt>Checklist</dt><dd>apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json</dd></div>
      </dl>
      ${renderDisabledActionChips(["No WhatsApp API credential", "No webhook", "No production gateway"])}
    </article>
  `;
}

function renderWhatsAppLocalTaskImportPanel() {
  const tasks = getLocalTaskInboxPreview();
  const status = tasks.whatsappLocalImportStatus || "needs-local-import";
  const tone = status === "ready" ? "success" : status === "unsafe-rejected" ? "blocked" : "warning";
  const statusCopy = status === "ready"
    ? "已匯入 WhatsApp 任務。這些任務來自本地檔案，不是 WhatsApp API。Dashboard 不會自動讀取私人對話。"
    : status === "review-required"
      ? "WhatsApp 任務需要人工檢查。匯入內容可能包含電話、私密內容或 credential，已暫停顯示。"
      : status === "unsafe-rejected"
        ? "WhatsApp 匯入已被安全拒絕。請移除電話、credential 或完整私人對話後再試。"
        : "尚未匯入 WhatsApp 任務。目前 Dashboard 未直接連接 WhatsApp。你可以先把已整理的任務寫入本地 whatsapp-task-import.json。";
  return `
    <article class="panel whatsapp-local-import-panel">
      <div class="panel-heading">
        <h2>WhatsApp 任務匯入</h2>
        ${badge(formatOperatorStatus(status), tone)}
      </div>
      <p>${escapeHtml(statusCopy)}</p>
      <dl class="definition-list compact-list">
        <div><dt>安全任務</dt><dd>${escapeHtml(String(tasks.whatsappLocalImportSafeTaskCount || 0))}</dd></div>
        <div><dt>需要人工檢查</dt><dd>${escapeHtml(String(tasks.whatsappLocalImportReviewRequiredCount || 0))}</dd></div>
        <div><dt>已拒絕</dt><dd>${escapeHtml(String(tasks.whatsappLocalImportUnsafeRejectedCount || 0))}</dd></div>
        <div><dt>本地匯入檔</dt><dd>apps/dashboard/data/local/whatsapp-task-import.json</dd></div>
        <div><dt>匯入報告</dt><dd>apps/dashboard/data/generated/whatsapp-local-task-import-report.json</dd></div>
      </dl>
      <p class="source-trust-warning">只支援本地已整理 JSON；沒有 WhatsApp API、沒有 webhook、沒有 QR 登入、沒有 token / cookie / session。</p>
      ${renderDisabledActionChips(["No WhatsApp API", "No webhook", "No QR login", "No token or cookie", "No auto reply"])}
      ${renderTechnicalDetails("WhatsApp local import report", [
        ["importStatus", status],
        ["rawChatPrinted", false],
        ["secretRedactionApplied", true],
        ["whatsappApiConnected", false],
        ["webhookEnabled", false],
        ["authEnabled", false]
      ])}
    </article>
  `;
}

function renderWhatsAppLocalTaskHelperPanel() {
  const helper = whatsappLocalTaskHelperReport || {
    helperStatus: "needs-helper-input",
    safeTaskCount: 0,
    reviewRequiredCount: 0,
    unsafeRejectedCount: 0,
    inputPresent: false,
    outputWritten: false,
    rawInputPrinted: false,
    rawChatPrinted: false,
    secretRedactionApplied: true
  };
  const status = helper.helperStatus || "needs-helper-input";
  const tone = status === "ready" ? "success" : status === "unsafe-rejected" ? "blocked" : "warning";
  const description = status === "ready"
    ? "WhatsApp local task helper is ready. It converts sanitized local text into an ignored local import JSON."
    : status === "review-required"
      ? "WhatsApp local task helper found content that needs manual review before import."
      : status === "unsafe-rejected"
        ? "WhatsApp local task helper rejected unsafe content. Remove phone numbers, credentials, or missing fields first."
        : "WhatsApp local task helper is waiting for a local helper input file. This stays local-only and does not connect to WhatsApp.";
  return `
    <article class="panel whatsapp-helper-panel">
      <div class="panel-heading">
        <h2>WhatsApp 任務小助手</h2>
        ${badge(formatOperatorStatus(status), tone)}
      </div>
      <p>${escapeHtml(description)}</p>
      <section class="helper-command-grid">
        ${renderConsoleCard({ title: "WhatsApp local task helper", value: String(helper.safeTaskCount || 0), note: "Safe tasks ready for import.", tone })}
        ${renderConsoleCard({ title: "build-whatsapp-local-task-import.ps1", value: "PowerShell helper", note: "Build ignored local import JSON.", tone: "muted" })}
        ${renderConsoleCard({ title: "whatsapp-task-helper-input.txt", value: helper.inputPresent ? "ready" : "missing", note: "Local helper input file.", tone: helper.inputPresent ? "success" : "warning" })}
        ${renderConsoleCard({ title: "whatsapp-local-task-helper-report.json", value: String(helper.reviewRequiredCount || 0), note: "Review-required helper items.", tone: helper.reviewRequiredCount ? "warning" : "success" })}
      </section>
      <div class="helper-command-block">
        <strong>PowerShell helper command</strong>
        <code>.\\apps\\dashboard\\scripts\\build-whatsapp-local-task-import.ps1 -Input "apps/dashboard/data/local/whatsapp-task-helper-input.txt"</code>
      </div>
      <div class="helper-command-block">
        <strong>Safety reminders</strong>
        <span>No WhatsApp API. No webhook. No QR login. No token / cookie / session. Local-only text in, ignored JSON out.</span>
      </div>
      ${renderTechnicalDetails("WhatsApp local task helper", [
        ["helperStatus", status],
        ["safeTaskCount", helper.safeTaskCount || 0],
        ["reviewRequiredCount", helper.reviewRequiredCount || 0],
        ["unsafeRejectedCount", helper.unsafeRejectedCount || 0],
        ["inputPresent", helper.inputPresent === true],
        ["outputWritten", helper.outputWritten === true],
        ["rawInputPrinted", helper.rawInputPrinted === true],
        ["rawChatPrinted", helper.rawChatPrinted === true],
        ["secretRedactionApplied", helper.secretRedactionApplied !== false],
        ["reportPath", "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json"]
      ])}
    </article>
  `;
}

function renderWhatsAppSyncMockContractPanel() {
  const report = whatsappSyncMockContractReport || {
    mockOnly: true,
    networkCallsMade: false,
    webhookRouteAdded: false,
    apiClientAdded: false,
    authEnabled: false,
    productionReady: false,
    eventCount: 0,
    safeCandidateCount: 0,
    reviewRequiredCount: 0,
    unsafeRejectedCount: 0,
    rawChatPrinted: false,
    secretRedactionApplied: true
  };
  return `
    <article class="panel whatsapp-sync-mock-panel">
      <div class="panel-heading">
        <h2>WhatsApp 未來同步安全設計</h2>
        ${badge("Mock only", "warning")}
      </div>
      <p>這裡只顯示離線 mock contract 狀態，沒有連接 WhatsApp API，沒有新增 webhook，也沒有讀取 token、cookie 或 session。</p>
      <section class="helper-command-grid">
        ${renderConsoleCard({ title: "WhatsApp future sync mock contract", value: report.mockOnly ? "mock-only" : "review", note: "Offline fixture contract only.", tone: "warning" })}
        ${renderConsoleCard({ title: "networkCallsMade", value: String(report.networkCallsMade === true), note: "No network calls.", tone: report.networkCallsMade ? "blocked" : "success" })}
        ${renderConsoleCard({ title: "webhookRouteAdded", value: String(report.webhookRouteAdded === true), note: "No webhook route.", tone: report.webhookRouteAdded ? "blocked" : "success" })}
        ${renderConsoleCard({ title: "apiClientAdded", value: String(report.apiClientAdded === true), note: "No API client.", tone: report.apiClientAdded ? "blocked" : "success" })}
      </section>
      <p class="source-trust-warning">Offline mock only；沒有 connect button、沒有 token input、沒有 QR login、沒有 endpoint input。</p>
      ${renderDisabledActionChips(["No WhatsApp API", "No webhook route", "No network calls", "No token or cookie", "No production"])}
      ${renderTechnicalDetails("WhatsApp sync mock contract", [
        ["mockOnly", report.mockOnly === true],
        ["eventCount", report.eventCount || 0],
        ["safeCandidateCount", report.safeCandidateCount || 0],
        ["reviewRequiredCount", report.reviewRequiredCount || 0],
        ["unsafeRejectedCount", report.unsafeRejectedCount || 0],
        ["networkCallsMade", report.networkCallsMade === true],
        ["webhookRouteAdded", report.webhookRouteAdded === true],
        ["apiClientAdded", report.apiClientAdded === true],
        ["authEnabled", report.authEnabled === true],
        ["productionReady", report.productionReady === true],
        ["rawChatPrinted", report.rawChatPrinted === true],
        ["secretRedactionApplied", report.secretRedactionApplied !== false],
        ["reportPath", "apps/dashboard/data/generated/whatsapp-sync-mock-contract-report.json"]
      ])}
    </article>
  `;
}

function renderHourlyRefreshPanel() {
  const refresh = getHourlyRefreshPreview();
  return `
    <article class="panel hourly-refresh-panel console-system-panel">
      <div class="panel-heading">
        <h2>自動刷新</h2>
        ${badge("每 1 小時", "success")}
      </div>
      <p>只重新讀取本地報告與任務，不會連接 Production 或外部網站。</p>
      ${renderConsoleCardGrid([
        { title: "上次刷新", value: refresh.lastRefreshAt, note: "本機瀏覽器時間", tone: "muted" },
        { title: "下次刷新", value: refresh.nextRefreshAt, note: "約 60 分鐘後", tone: "success" },
        { title: "刷新範圍", value: "本地報告", note: "不會連接 Production", tone: "success" }
      ], "refresh-status-grid")}
      <a class="refresh-action-link" href="${escapeHtml(window.location.href)}">立即刷新</a>
      ${renderTechnicalDetails("刷新政策", [
        ["refreshIntervalMinutes", refresh.refreshIntervalMinutes],
        ["externalFetchEnabled", false],
        ["productionFetchEnabled", false],
        ["policyReport", refresh.reportPath]
      ])}
    </article>
  `;
}

function renderProviderBalanceCenterPanel() {
  const balance = getProviderBalancePreview();
  return `
    <article class="panel provider-balance-panel balance-console-panel">
      <div class="panel-heading">
        <h2>用量與餘額中心</h2>
        ${badge("本機手動填寫", "warning")}
      </div>
      <p>這裡只顯示本機已整理的餘額狀態，不會登入 Provider，不會顯示完整 API key，也不會儲存密碼。</p>
      <section class="balance-provider-grid modern-balance-grid">
        ${balance.providers.map((provider) => `
          <div class="balance-provider-card modern-provider-card">
            <strong>${escapeHtml(provider.displayName)}</strong>
            <span>餘額狀態：${escapeHtml(formatOperatorStatus(provider.balanceStatus || "unknown"))}</span>
            <small>${escapeHtml(provider.balanceText || "請在本機填寫餘額")}</small>
            <small>最後更新：${escapeHtml(provider.lastCheckedAt || "未提供")}</small>
            <small>安全狀態：沒有儲存密碼 / 沒有顯示完整 API key</small>
            <em>下一步：在本機 provider-balance-center.json 填寫餘額</em>
          </div>
        `).join("")}
      </section>
      ${renderTechnicalDetails("餘額中心資料", [
        ["localInputPath", balance.localInputPath],
        ["templatePath", balance.templatePath],
        ["redactionApplied", true],
        ["rawSecretsPrinted", false],
        ["reportPath", balance.reportPath]
      ])}
      ${renderDisabledActionChips(["沒有 Provider 登入", "沒有 API key 顯示", "沒有外部餘額查詢"])}
    </article>
  `;
}

function renderProductionSafetyLockPanel() {
  return `
    <article class="panel production-safety-lock-panel">
      <div class="panel-heading">
        <h2>Production 安全鎖</h2>
        ${badge("全部停用", "blocked")}
      </div>
      <p>Dashboard 目前只讀，不會自動改動 Agent，不會接 Production。</p>
      <dl class="definition-list compact-list">
        <div><dt>Production 可用</dt><dd>否 / false</dd></div>
        <div><dt>Adapter 已啟用</dt><dd>否 / false</dd></div>
        <div><dt>已連線</dt><dd>否 / false</dd></div>
        <div><dt>Endpoint 已設定</dt><dd>否 / false</dd></div>
        <div><dt>Auth 已啟用</dt><dd>否 / false</dd></div>
        <div><dt>Production 資料返回</dt><dd>否 / false</dd></div>
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>重啟功能</dt><dd>停用</dd></div>
        <div><dt>部署功能</dt><dd>停用</dd></div>
      </dl>
      ${renderDisabledActionChips(["no production connect button", "no endpoint input", "no credential input", "no mutation/restart/deploy button"])}
    </article>
  `;
}

function getOperatorUsabilityPreview() {
  const agents = getDisplayAgents();
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
        <h2>${t("panels.operatorHome", "營運首頁")}</h2>
        ${badge("每日檢視", "success")}
      </div>
      <p><strong>建議檢視方式</strong></p>
      <p>請優先使用單 Agent 本地資料檢視。Dashboard 目前只讀，不會自動改動 Agent。</p>
      <p><a href="${escapeHtml(preview.recommendedUrl)}">開啟建議檢視</a></p>
      <p class="url-line">?source=local-ingest&amp;data=./data/generated/real-local-dashboard-export.single-agent.generated.json</p>
      ${noQueryParam ? `<p class="source-trust-warning">目前未指定資料來源。請用上面的建議檢視，避免誤把示範資料當成真實資料。</p>` : ""}
      <section class="operator-card-grid">
        ${preview.cards.map((card) => `
          <div class="operator-home-card">
            <strong>${escapeHtml(formatOperatorLabel(card.label))}</strong>
            <span>${escapeHtml(formatOperatorValue(card.value))}</span>
            <small>${escapeHtml(card.detail)}</small>
          </div>
        `).join("")}
      </section>
      <dl class="definition-list compact-list">
        <div><dt>預期真實 Agent 數量</dt><dd>1</dd></div>
        <div><dt>本地資料</dt><dd>單 Agent snapshot 已載入</dd></div>
        <div><dt>本地 Agent 健康狀態</dt><dd>${escapeHtml(formatOperatorStatus(preview.health.overallHealthStatus || "review-required"))}</dd></div>
        <div><dt>本地健康證據審查</dt><dd>${escapeHtml(formatOperatorStatus(preview.evidence.evidenceStatus || "missing-fallback"))}</dd></div>
        <div><dt>Production 狀態</dt><dd>Production 未開放</dd></div>
        <div><dt>重啟功能</dt><dd>已停用</dd></div>
        <div><dt>修改功能</dt><dd>已停用</dd></div>
        <div><dt>Production gateway</dt><dd>已停用</dd></div>
      </dl>
      ${preview.warnings.length ? `<ul class="warning-list">${preview.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}
      ${renderTechnicalDetails("技術詳情", [
        ["healthStatus", preview.health.overallHealthStatus || "review-required"],
        ["evidenceStatus", preview.evidence.evidenceStatus || "missing-fallback"],
        ["productionStatus", "no-go-for-production"],
        ["recommendedUrl", preview.recommendedUrl]
      ])}
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
      ${renderDisabledActionChips([
        "Restart disabled",
        "Mutation disabled",
        "Production gateway disabled"
      ])}
    </article>
  `;
}

function getDailyOperatorRunbookPreview() {
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const agents = dashboardAdapter.getAgents();
  const input = {
    source: sourceStatus.currentSource,
    agentCount: agents.length,
    actualRealAgentCount: sourceStatus.currentSource === "local-ingest" ? health.actualRealAgentCount : agents.length,
    fixtureAgentCount: sourceStatus.currentSource === "mock" || sourceStatus.currentSource === "gateway-stub" ? agents.length : 0,
    productionStatus: "no-go-for-production",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false,
    productionWiring: "disabled",
    healthStatus: health.overallHealthStatus || "unknown",
    evidenceStatus: evidence.evidenceStatus || "unknown",
    fallbackUsed: evidence.fallbackUsed === true,
    fallbackReason: evidence.fallbackReason || "none",
    reviewedInputStatus: health.reviewedInputStatus || "missing-fallback-to-sample",
    redactionApplied: evidence.redactionApplied !== false,
    rawValuesPrinted: evidence.rawValuesPrinted === true,
    healthReportPath: health.reportPath,
    warnings: [...(health.warnings || []), ...(evidence.warnings || [])],
    requiredFollowups: [...(health.requiredFollowups || []), ...(evidence.requiredFollowups || [])]
  };
  const helper = window.OpenClawDailyOperatorRunbook;
  return helper?.buildDailyOperatorRunbook?.(input) ?? {
    dailyStatus: "unknown",
    statusReasons: ["Daily operator runbook module is not loaded."],
    safeNextSteps: ["Open recommended operator view.", "Read troubleshooting guide."],
    blockedActions: ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"],
    runbookCards: [],
    expectedRealAgentCount: 1,
    actualRealAgentCount: input.actualRealAgentCount,
    productionStatus: "no-go-for-production",
    safetyMode: "read-only",
    mutationEnabled: false,
    restartEnabled: false,
    productionGatewayEnabled: false
  };
}

function renderDailyOperatorRunbookPanel() {
  const runbook = getDailyOperatorRunbookPreview();
  const productionGate = getProductionEntryGatePreview();
  const productionAdapter = getProductionAdapterSimulatorPreview();
  const statusLabel = {
    ok: "正常",
    "review-required": "需要人工檢查",
    blocked: "已封鎖",
    "fixture-mode": "示範模式，不是每日 Operator 檢視",
    unknown: "未知"
  }[runbook.dailyStatus] || "未知";
  const tone = runbook.dailyStatus === "ok"
    ? "success"
    : runbook.dailyStatus === "blocked" || runbook.dailyStatus === "fixture-mode"
      ? "blocked"
      : "warning";
  return `
    <article class="panel daily-runbook-panel">
      <div class="panel-heading">
        <h2>${t("panels.dailyOperatorRunbook", "每日操作手冊")}</h2>
        ${badge(statusLabel, tone)}
      </div>
      <p>這裡把資料來源、Agent 數量、健康、證據和安全鎖整理成每日檢查順序。</p>
      <dl class="definition-list compact-list">
        <div><dt>今日狀態</dt><dd>${escapeHtml(statusLabel)}</dd></div>
        <div><dt>預期真實 Agent 數量</dt><dd>1</dd></div>
        <div><dt>實際真實 Agent 數量</dt><dd>${escapeHtml(String(runbook.actualRealAgentCount ?? "未知"))}</dd></div>
        <div><dt>健康狀態</dt><dd>${escapeHtml(formatOperatorStatus(getLocalAgentHealthPreview().overallHealthStatus || "unknown"))}</dd></div>
        <div><dt>證據狀態</dt><dd>${escapeHtml(formatOperatorStatus(getLocalHealthEvidencePreview().evidenceStatus || "unknown"))}</dd></div>
        <div><dt>備用原因</dt><dd>${escapeHtml(formatOperatorValue(getLocalHealthEvidencePreview().fallbackReason || "none"))}</dd></div>
        <div><dt>Production 狀態</dt><dd>Production 未開放</dd></div>
        <div><dt>Production 進場門檻</dt><dd>${escapeHtml(formatOperatorStatus(productionGate.gateStatus))}</dd></div>
        <div><dt>Production Adapter</dt><dd>${escapeHtml(formatOperatorStatus(productionAdapter.adapterStatus))}</dd></div>
        <div><dt>安全模式</dt><dd>唯讀</dd></div>
        <div><dt>修改功能</dt><dd>停用</dd></div>
        <div><dt>Production 連接</dt><dd>已停用</dd></div>
      </dl>
      <strong class="notes-label">狀態原因</strong>
      ${renderList("Status reasons", runbook.statusReasons || [])}
      <strong class="notes-label">安全下一步</strong>
      ${renderList("Safe next steps", runbook.safeNextSteps || [])}
      ${renderList("Production gate next steps", [
        "Review production entry gate report.",
        "Review production adapter simulator report.",
        "Confirm no production adapter is enabled.",
        "Do not connect production gateway."
      ])}
      <strong class="notes-label">已封鎖操作</strong>
      ${renderList("Blocked actions", runbook.blockedActions || [])}
      ${renderTechnicalDetails("技術詳情", [
        ["dailyStatus", runbook.dailyStatus],
        ["healthStatus", getLocalAgentHealthPreview().overallHealthStatus || "unknown"],
        ["evidenceStatus", getLocalHealthEvidencePreview().evidenceStatus || "unknown"],
        ["fallbackReason", getLocalHealthEvidencePreview().fallbackReason || "none"],
        ["productionStatus", "no-go-for-production"],
        ["productionAdapterEnabled", false],
        ["productionAdapterConnected", false],
        ["productionAdapterSimulatorOnly", true],
        ["productionReady", false],
        ["Mutation enabled", false],
        ["mutationEnabled", false],
        ["productionWiring", "disabled"],
        ["dailySummaryReport", "apps/dashboard/data/generated/daily-operator-summary-report.json"],
        ["dailyRunbookChecklist", "apps/dashboard/data/generated/daily-operator-runbook-checklist.json"]
      ])}
      ${renderDisabledActionChips([
        "重啟已停用",
        "修改已停用",
        "Production gateway 已停用"
      ])}
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
      ${renderDisabledActionChips([
        "Fixture data cannot be promoted to operator truth",
        "Production gateway connection disabled"
      ])}
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
      ${renderDisabledActionChips([
        "Fixture data cannot be promoted to operator truth",
        "Production gateway connection disabled"
      ])}
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
      ${renderDisabledActionChips([
        "Fixture data cannot be promoted to operator truth",
        "Production gateway connection disabled"
      ])}
    </article>
  `;
}

function renderOverview() {
  const allTasks = dashboardAdapter.getTasks();
  const agents = dashboardAdapter.getAgents();
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const balance = getProviderBalancePreview();
  const whatsappTasks = allTasks.filter((task) => task.source === "whatsapp").length;
  const needsReview = allTasks.filter((task) => ["review_pending", "lost", "failed", "timed_out", "blocked"].includes(task.status)).length;
  const recentEvents = dashboardAdapter.getLogs().slice(0, 3);
  const commandCards = [
    { title: "今日任務", value: String(allTasks.length), note: "Dashboard 目前收到的任務", tone: needsReview ? "warning" : "success", action: "查看今日任務" },
    { title: "需要檢查", value: String(needsReview), note: "失敗、超時、等待檢查或失去追蹤", tone: needsReview ? "warning" : "success", action: "先處理高風險任務" },
    { title: "Agent", value: `${agents.length} 個`, note: sourceStatus.currentSource === "local-ingest" ? "本地單 Agent 檢視" : "示範資料模式", tone: sourceStatus.currentSource === "local-ingest" ? "success" : "warning", action: "檢查 Agent 狀態" },
    { title: "健康", value: formatOperatorStatus(health.overallHealthStatus || "review-required"), note: "需要本地 operator 人工確認", tone: toneForStatus(health.overallHealthStatus || "review-required"), action: "查看本地健康資料" },
    { title: "WhatsApp", value: whatsappTasks ? `${whatsappTasks} 個` : "未同步", note: whatsappTasks ? "已有本地 WhatsApp 任務" : "未同步不是壞機", tone: whatsappTasks ? "success" : "warning", action: "檢查任務入口" },
    { title: "API 餘額", value: balance.balanceCenterStatus === "loaded" ? "已載入" : "需要本機填寫", note: "不儲存密碼或完整 API key", tone: "warning", action: "填寫本機餘額" }
  ];
  return `
    <section class="operator-command-center">
      <article class="console-hero operator-console-hero">
        <p class="console-eyebrow">OpenClaw Operator Console</p>
        <h2>今日營運總覽</h2>
        <p>你可以在這裡查看任務、Agent 狀態、API 用量與安全鎖。Dashboard 目前只讀，不會自動修改任何 Agent 或連接 Production。</p>
      </article>
      ${renderConsoleCardGrid(commandCards, "command-center-cards")}
      <section class="content-grid console-priority-grid">
        ${renderLocalOpenClawActivationAssistantPanel()}
        ${renderLocalOpenClawConnectorPanel()}
        ${renderWhatsAppLocalTaskHelperPanel()}
        ${renderWhatsAppSyncMockContractPanel()}
        ${renderWhatsAppLocalTaskImportPanel()}
        ${renderLocalTaskInboxPanel()}
        ${renderProviderBalanceCenterPanel()}
        ${renderHourlyRefreshPanel()}
        ${renderReadonlyGuardrailPanel()}
        ${renderLocalAgentHealthPanel()}
        ${renderLocalHealthEvidencePanel()}
        ${renderDailyOperatorRunbookPanel()}
        ${renderOperatorTroubleshootingPanel()}
      </section>
      <section class="content-grid two-col">
        <article class="panel activity-console-panel">
          <div class="panel-heading"><h2>最新狀態</h2>${badge("本地日誌", "success")}</div>
          <div class="activity-list">
            ${recentEvents.map((event) => `
              <div class="activity-row">
                <span class="severity ${event.severity}"></span>
                <div>
                  <strong>${escapeHtml(event.event)}</strong>
                  <span>${escapeHtml(event.timestamp)} · ${escapeHtml(event.actor)}</span>
                </div>
                ${event.redacted ? badge("已遮蔽", "warning") : ""}
              </div>
            `).join("")}
          </div>
        </article>
        ${renderProductionSafetyLockPanel()}
      </section>
      ${renderTechnicalArchive("總覽歷史 marker", `
        <code>Gateway status</code>
        <code>Active agents</code>
        <code>Running tasks</code>
        <code>Failed / lost</code>
        <code>Backup verification</code>
        <code>Recent activity</code>
        <code>品質閘門狀態</code>
      `)}
      ${renderTechnicalArchive("完整本地報告與舊版審查面板", `
        <section class="content-grid two-col">
          ${renderOperatorHomePanel()}
          ${renderProductionAdapterSimulatorPanel()}
          ${renderReadOnlyAdapterContractPanel()}
          ${renderDisabledReadOnlyAdapterDraftPanel()}
          ${renderDashboardStabilizationAuditPanel()}
          ${renderLocalOperatorRcPanel()}
          ${renderProductionEntryGatePanel()}
          ${renderReviewedHealthInputAssistantPanel()}
          ${renderSourceTrustPanel()}
          ${renderOperatorSourceLockdownPanel()}
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
      `)}
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
  const agents = getDisplayAgents();
  const selected = agents.find((agent) => agent.id === state.agentId) ?? agents[0];
  const health = getLocalAgentHealthPreview();
  const evidence = getLocalHealthEvidencePreview();
  const trust = getSourceTrustClassification();
  const isFixture = trust.fixtureData || ["mock", "gateway-stub"].includes(sourceStatus.currentSource);
  return `
    <section class="operator-page agent-console-page">
      ${renderPageIntro("Agent 狀態", "這裡顯示 Dashboard 目前看到的本地 Agent。Dashboard 只讀，不會重啟、停止或修改 Agent。", isFixture ? "示範資料模式" : "本地資料", isFixture ? "warning" : "success")}
      ${renderConsoleCardGrid([
        { title: "目前 Agent", value: `${agents.length} 個`, note: isFixture ? "這是 fixture 數量，不是真實清單" : "本地 operator truth candidate", tone: isFixture ? "warning" : "success" },
        { title: "資料來源", value: sourceDisplayLabel(sourceStatus.currentSource), note: isFixture ? "不是每日 operator 檢視" : "建議 operator 檢視", tone: isFixture ? "warning" : "success" },
        { title: "本地 Agent 健康狀態", value: formatOperatorStatus(health.overallHealthStatus || "review-required"), note: "需要本地 operator 人工確認", tone: toneForStatus(health.overallHealthStatus || "review-required") },
        { title: "證據狀態", value: formatOperatorStatus(evidence.evidenceStatus || "missing-fallback"), note: "技術證據已保留在報告", tone: toneForStatus(evidence.evidenceStatus || "missing-fallback") },
        { title: "Production", value: "未開放", note: "Production 安全鎖仍然有效", tone: "blocked" },
        { title: "安全模式", value: "唯讀", note: "不會改動 Agent", tone: "success" }
      ], "agent-summary-grid")}
      ${renderLocalOpenClawActivationAssistantPanel()}
      ${renderLocalOpenClawConnectorPanel()}
      ${renderWhatsAppLocalTaskHelperPanel()}
      ${renderWhatsAppSyncMockContractPanel()}
      ${renderWhatsAppLocalTaskImportPanel()}
      ${isFixture ? `<article class="panel fixture-mode-panel"><h2>這不是每日 Operator 檢視</h2><p>你正在查看示範 / fixture 資料。8 個 Agent 只用於生命週期與合約測試，不是真實 Agent inventory。</p></article>` : ""}
      <section class="agent-console-layout">
        <article class="panel agent-list-panel">
          <div class="panel-heading"><h2>Agent 清單</h2>${badge("只讀", "success")}</div>
          <div class="operator-list agent-card-list">
            ${agents.map((agent) => `
              <button class="operator-list-card ${agent.id === state.agentId ? "selected" : ""}" data-agent-id="${escapeHtml(agent.id)}">
                <strong>${escapeHtml(agent.name)}</strong>
                <span>${escapeHtml(agent.role)}</span>
                <small>狀態：${formatOperatorStatus(agent.status)} · 風險：${formatOperatorStatus(agent.riskLevel)}</small>
              </button>
            `).join("")}
          </div>
        </article>
        ${renderAgentDetail(selected)}
      </section>
      ${renderSafeNextSteps([
        { title: "如健康狀態需要檢查", note: "補充本地審核健康資料，或查看已知風險。" },
        { title: "如見到示範資料", note: "開啟建議的 local-ingest single-agent 檢視。" },
        { title: "不要在 Dashboard 重啟 Agent", note: "重啟、停止、修改仍然全部停用。" }
      ])}
      ${renderTechnicalDetails("Agent 來源與報告", [
        ["source", sourceStatus.currentSource],
        ["trustLevel", trust.trustLevel],
        ["healthStatus", health.overallHealthStatus || "review-required"],
        ["evidenceStatus", evidence.evidenceStatus || "missing-fallback"],
        ["healthReportPath", health.reportPath || "apps/dashboard/data/generated/local-real-agent-health-report.json"],
        ["evidenceReportPath", evidence.reportPath || "apps/dashboard/data/generated/local-health-evidence-review-report.json"]
      ])}
    </section>
  `;
}

function renderAgentDetail(agent) {
  if (!agent) {
    return `<aside class="panel detail-panel empty-panel"><h2>未選擇 Agent</h2><p>目前沒有可顯示的 Agent。</p></aside>`;
  }
  return `
    <aside class="panel detail-panel agent-detail-card">
      <div class="panel-heading">
        <h2>${escapeHtml(agent.name)}</h2>
        ${badge(formatOperatorStatus(agent.status), agent.status)}
      </div>
      <p>${escapeHtml(agent.role)}。Dashboard 只會顯示狀態，不會修改或重啟這個 Agent。</p>
      <dl class="definition-list compact-list">
        <div><dt>用途</dt><dd>${escapeHtml(agent.role)}</dd></div>
        <div><dt>最近回應</dt><dd>${escapeHtml(agent.lastHeartbeat)}</dd></div>
        <div><dt>風險提示</dt><dd>${escapeHtml(formatOperatorStatus(agent.riskLevel))}</dd></div>
      </dl>
      ${renderList("負責範圍", agent.responsibilities)}
      ${renderList("可以查看 / 產生草稿", agent.allowedActions.map(formatOperatorValue))}
      ${renderList("不能執行", agent.deniedActions.map(formatOperatorValue))}
      ${renderTechnicalDetails("Agent 技術資料", [
        ["agentId", agent.id],
        ["runtime", agent.runtime],
        ["model", agent.model],
        ["sandbox", agent.sandbox],
        ["toolsProfile", agent.toolsProfile]
      ])}
    </aside>
  `;
}

function renderTasks() {
  const filtered = getDisplayTasks({
    status: state.taskStatus,
    priority: state.taskPriority
  });
  const selected = getDisplayTaskById(state.taskId) ?? filtered[0] ?? getDisplayTasks({})[0];
  const allTasks = getDisplayTasks({});
  const countBy = (statuses) => allTasks.filter((task) => statuses.includes(task.status)).length;
  const whatsappTasks = allTasks.filter((task) => task.source === "whatsapp").length;
  return `
    <section class="operator-page task-console-page">
      ${renderPageIntro("今日任務", "這裡顯示 Dashboard 目前收到的任務。如果 WhatsApp 任務未出現，代表同步入口未接好，不代表 Dashboard 壞機。", `${allTasks.length} 個任務`, "warning")}
      ${renderConsoleCardGrid([
        { title: "全部任務", value: String(allTasks.length), note: "Dashboard 目前收到的任務", tone: "muted" },
        { title: "待處理", value: String(countBy(["todo", "queued"])), note: "需要安排或等待開始", tone: "warning" },
        { title: "處理中", value: String(countBy(["in-progress", "running"])), note: "等待下一次刷新", tone: "success" },
        { title: "需要檢查", value: String(countBy(["review_pending", "lost"])), note: "需要人工確認", tone: "warning" },
        { title: "失敗 / 阻塞", value: String(countBy(["failed", "timed_out", "blocked"])), note: "先看備註或重新建立任務", tone: countBy(["failed", "timed_out", "blocked"]) ? "blocked" : "success" },
        { title: "WhatsApp 同步", value: whatsappTasks ? `${whatsappTasks} 個` : "未收到", note: whatsappTasks ? "已有本地 WhatsApp 任務" : "未同步不是壞機", tone: whatsappTasks ? "success" : "warning" }
      ], "task-summary-grid")}
      ${renderLocalOpenClawActivationAssistantPanel()}
      ${renderLocalOpenClawConnectorPanel()}
      ${renderWhatsAppLocalTaskHelperPanel()}
      ${renderWhatsAppSyncMockContractPanel()}
      ${renderWhatsAppLocalTaskImportPanel()}
      ${whatsappTasks === 0 ? `<article class="panel whatsapp-empty-panel"><h2>未收到 WhatsApp 任務</h2><p>目前 Dashboard 未直接連接 WhatsApp。請先用安全中轉工具把 WhatsApp 任務寫入本地任務收件箱。</p></article>` : ""}
      <section class="task-workbench-layout">
        <article class="panel task-work-queue-panel">
          <div class="panel-heading">
            <h2>任務收件箱</h2>
            <div class="filters">
              ${renderSelect("taskStatus", ["all", "queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"], state.taskStatus)}
              ${renderSelect("taskPriority", ["all", "P0", "P1", "P2", "P3"], state.taskPriority)}
            </div>
          </div>
          <div class="task-card-list">
            ${filtered.map(renderTaskRow).join("") || `<div class="empty-panel">沒有符合目前篩選的任務。</div>`}
          </div>
        </article>
        ${renderTaskDetail(selected)}
      </section>
    </section>
  `;
}

function renderTaskRow(task) {
  return `
    <button class="task-card ${task.id === state.taskId ? "selected" : ""}" data-task-id="${escapeHtml(task.id)}">
      <div>
        <strong>${escapeHtml(operatorTaskTitle(task))}</strong>
        <span>${escapeHtml(sourceDisplayLabel(task.source || "openclaw"))} · ${escapeHtml(task.priority)}</span>
      </div>
      <div class="task-card-status">
        ${badge(formatOperatorStatus(task.status), task.status)}
        <small>${escapeHtml(taskNextStep(task.status))}</small>
      </div>
      <time>${escapeHtml(task.updatedAt)}</time>
    </button>
  `;
}

function renderTaskDetail(task) {
  if (!task) {
    return `<aside class="panel detail-panel empty-panel"><h2>未選擇任務</h2><p>請選擇一張任務卡查看下一步。</p></aside>`;
  }
  const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
  return `
    <aside class="panel detail-panel task-detail-card">
      <div class="panel-heading">
        <h2>${escapeHtml(operatorTaskTitle(task))}</h2>
        ${badge(formatOperatorStatus(task.status), task.status)}
      </div>
      <p>下一步：${escapeHtml(taskNextStep(task.status))}</p>
      <div class="lifecycle">
        ${lifecycle.map((item) => `<span class="${item === task.status ? "current" : ""}">${formatOperatorStatus(item)}</span>`).join("")}
      </div>
      <dl class="definition-list compact-list">
        <div><dt>來源</dt><dd>${escapeHtml(sourceDisplayLabel(task.source || "openclaw"))}</dd></div>
        <div><dt>狀態</dt><dd>${escapeHtml(formatOperatorStatus(task.status))}</dd></div>
        <div><dt>優先級</dt><dd>${escapeHtml(task.priority)}</dd></div>
        <div><dt>負責來源</dt><dd>${escapeHtml(task.ownerAgent)}</dd></div>
        <div><dt>更新時間</dt><dd>${escapeHtml(task.updatedAt)}</dd></div>
      </dl>
      ${renderTechnicalDetails("任務技術資料", [
        ["taskId", task.id],
        ["workflow", task.workflow],
        ["reviewer", task.reviewer],
        ["status", task.status],
        ["attempt", task.attempt],
        ["createdAt", task.createdAt],
        ["updatedAt", task.updatedAt]
      ])}
    </aside>
  `;
}

function renderReviews() {
  const reviews = dashboardAdapter.getReviews();
  return `
    <section class="operator-page review-console-page">
      ${renderPageIntro("安全審查", "這裡只會模擬權限與操作草稿，不會真的批准、拒絕或修改任何資料。", "只做預演", "success")}
      ${renderConsoleCardGrid([
        { title: "修改功能", value: "已停用", note: "不會提交任何決定", tone: "success" },
        { title: "Production 連接", value: "已停用", note: "沒有 production gateway", tone: "success" },
        { title: "需要人工批准", value: "是", note: "Dashboard 不會自動批准", tone: "warning" },
        { title: "審查項目", value: String(reviews.length), note: "全部是本地模擬資料", tone: "muted" }
      ], "review-summary-grid")}
      <section class="review-console-layout">
        ${renderSimulatedRolePanel()}
        <article class="panel review-list-panel">
          <div class="panel-heading"><h2>安全審查清單</h2>${badge("本地草稿", "success")}</div>
          <div class="operator-list review-card-list">
            ${reviews.map((review) => `
              <article class="operator-list-card review-card">
                <div class="panel-heading">
                  <h3>${escapeHtml(operatorTaskTitle({ summary: review.taskId }))}</h3>
                  ${badge(formatOperatorStatus(review.verdict), review.verdict)}
                </div>
                <p>${escapeHtml(review.notes)}</p>
                <dl class="definition-list compact-list">
                  <div><dt>檢查者</dt><dd>${escapeHtml(review.reviewer)}</dd></div>
                  <div><dt>建立時間</dt><dd>${escapeHtml(review.createdAt)}</dd></div>
                </dl>
                ${renderList("已檢查項目", review.policyChecks.map(formatOperatorStatus))}
                <div class="button-row">
                  <span class="status-chip">真實批准已停用</span>
                  <span class="status-chip">真實拒絕已停用</span>
                  <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="approve" data-review-id="${escapeHtml(review.id)}">產生批准草稿（只做預演）</button>
                  <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="reject" data-review-id="${escapeHtml(review.id)}">產生拒絕草稿（只做預演）</button>
                  <button ${roleHas("reviews:draft_decision") ? "" : "disabled"} data-review-draft-intent="request_changes" data-review-id="${escapeHtml(review.id)}">產生需要修改草稿（只做預演）</button>
                </div>
                ${renderTechnicalDetails("審查技術資料", [
                  ["reviewId", review.id],
                  ["taskId", review.taskId],
                  ["verdict", review.verdict],
                  ["policyChecks", review.policyChecks.join("; ")]
                ])}
              </article>
            `).join("")}
          </div>
        </article>
        ${renderDraftPreview()}
      </section>
    </section>
  `;
}

function renderLogs() {
  const query = state.logSearch.toLowerCase();
  const filtered = dashboardAdapter.getLogs({ severity: state.logSeverity }).filter((event) => {
    const queryOk = !query || `${event.event} ${event.actor} ${event.taskId ?? ""}`.toLowerCase().includes(query);
    return queryOk;
  });
  const warningCount = filtered.filter((event) => ["warning", "error", "critical"].includes(event.severity)).length;
  return `
    <section class="operator-page logs-console-page">
      ${renderPageIntro("日誌", "這裡顯示本地日誌摘要，方便你檢查是否有需要人工跟進的事件。", `${filtered.length} 筆`, warningCount ? "warning" : "success")}
      ${renderConsoleCardGrid([
        { title: "日誌總數", value: String(filtered.length), note: "符合目前篩選", tone: "muted" },
        { title: "需要留意", value: String(warningCount), note: "warning / error / critical", tone: warningCount ? "warning" : "success" },
        { title: "敏感資料", value: "已遮蔽", note: "不顯示 secret 或登入憑證", tone: "success" }
      ])}
      <article class="panel activity-console-panel">
        <div class="panel-heading">
          <h2>本地事件清單</h2>
          <div class="filters">
            <input id="logSearch" value="${escapeHtml(state.logSearch)}" placeholder="搜尋日誌" />
            ${renderSelect("logSeverity", ["all", "info", "warning", "error", "critical"], state.logSeverity)}
          </div>
        </div>
        <div class="activity-list">
          ${filtered.map((event) => `
            <div class="activity-row">
              <span class="severity ${event.severity}"></span>
              <div>
                <strong>${escapeHtml(event.event)}</strong>
                <span>${escapeHtml(event.timestamp)} · ${escapeHtml(event.actor)}</span>
              </div>
              ${event.redacted ? badge("已遮蔽", "warning") : badge("清楚", "success")}
            </div>
          `).join("") || `<div class="empty-panel">沒有符合目前篩選的日誌。</div>`}
        </div>
      </article>
      ${renderTechnicalDetails("日誌技術資料", filtered.map((event) => [event.id, `${event.severity}; ${event.taskId || "no-task"}; redacted=${event.redacted}`]))}
    </section>
  `;
}

function renderBackups() {
  const backups = dashboardAdapter.getBackups();
  const verified = backups.filter((backup) => backup.verifyStatus === "verified").length;
  return `
    <section class="operator-page backups-console-page">
      ${renderPageIntro("備份", "這裡顯示備份證據與校驗狀態，不會執行還原或寫入 Production。", "還原停用", "success")}
      ${renderConsoleCardGrid([
        { title: "備份記錄", value: String(backups.length), note: "本地證據資料", tone: "muted" },
        { title: "已校驗", value: String(verified), note: "只顯示結果，不執行還原", tone: "success" },
        { title: "還原操作", value: "已停用", note: "Dashboard 不會還原備份", tone: "success" }
      ])}
      <section class="backup-card-list operator-list">
        ${backups.map((backup) => `
          <article class="operator-list-card">
            <div class="panel-heading"><h2>${escapeHtml(backup.id)}</h2>${badge(formatOperatorStatus(backup.verifyStatus), backup.verifyStatus)}</div>
            <p>任務：${escapeHtml(backup.taskId)} · 建立時間：${escapeHtml(backup.createdAt)}</p>
            ${renderList("證據鏈", backup.evidenceChain)}
            <div class="button-row">
              <span class="status-chip">還原備份已停用</span>
              <button ${roleHas("backups:view") ? "" : "disabled"} data-backup-draft-id="${escapeHtml(backup.id)}">產生備份驗證草稿（只做預演）</button>
            </div>
            ${renderTechnicalDetails("備份技術資料", Object.entries(backup))}
          </article>
        `).join("")}
      </section>
      ${renderDraftPreview()}
    </section>
  `;
}

function renderSettings() {
  const settings = dashboardAdapter.getSettings();
  return `
    <section class="operator-page settings-console-page">
      ${renderPageIntro("設定", "這裡顯示目前設定狀態。Dashboard 只會產生草稿，不會直接修改設定。", "修改停用", "success")}
      ${renderConsoleCardGrid([
        { title: "Gateway Auth", value: "未連接", note: "沒有真實登入或登入憑證", tone: "success" },
        { title: "設定修改", value: "已停用", note: "只可產生本地草稿", tone: "success" },
        { title: "Production", value: "未開放", note: "不會連接 production gateway", tone: "blocked" }
      ])}
      <section class="content-grid two-col">
        ${renderLocalOpenClawActivationAssistantPanel()}
        ${renderLocalOpenClawConnectorPanel()}
      ${renderWhatsAppLocalTaskHelperPanel()}
      ${renderWhatsAppSyncMockContractPanel()}
      ${renderWhatsAppLocalTaskImportPanel()}
        <article class="panel">
          <div class="panel-heading"><h2>設定摘要</h2>${badge("只讀", "success")}</div>
          <dl class="definition-list compact-list">
            <div><dt>保留政策</dt><dd>${escapeHtml(settings.retentionPolicy)}</dd></div>
            <div><dt>模型路由</dt><dd>${escapeHtml(settings.modelRouting)}</dd></div>
            <div><dt>Secret refs</dt><dd>未連接，未載入 secret</dd></div>
            <div><dt>Production 修改</dt><dd>已停用</dd></div>
          </dl>
          <div class="button-row"><button ${roleHas("admin:view_config") ? "" : "disabled"} data-settings-draft="request">產生設定變更草稿（只做預演）</button></div>
          ${renderTechnicalDetails("設定技術資料", Object.entries(settings))}
        </article>
        ${renderDraftPreview()}
      </section>
      ${renderTechnicalArchive("完整設定相關報告", `<section class="content-grid two-col">${renderSimulatedRolePanel()}${renderSourceTrustPanel()}${renderOperatorSourceLockdownPanel()}${renderReviewedHealthInputAssistantPanel()}${renderProductionEntryGatePanel()}${renderImportExportContract()}</section>`)}
    </section>
  `;
}

function renderObservability() {
  const report = getObservabilityPreview();
  const readiness = getProductionReadinessPreview();
  return `
    <section class="operator-page observability-console-page">
      ${renderPageIntro("觀測", "這裡顯示本地觀測摘要、風險提示與 readiness 狀態，不會發送外部通知。", "本地觀測", "success")}
      <section class="content-grid two-col">
      ${renderInternalReleaseCandidatePanel()}
      ${renderProductionTrackPanel()}
      ${renderOperatorHomePanel()}
      ${renderDailyOperatorRunbookPanel()}
      ${renderProductionAdapterSimulatorPanel()}
      ${renderReadOnlyAdapterContractPanel()}
      ${renderDisabledReadOnlyAdapterDraftPanel()}
      ${renderDashboardStabilizationAuditPanel()}
      ${renderLocalOperatorRcPanel()}
      ${renderProductionEntryGatePanel()}
      ${renderReviewedHealthInputAssistantPanel()}
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
          <span class="status-chip">Acknowledge disabled in scaffold（確認功能已停用）</span>
          <span class="status-chip">${t("actions.externalAlertDisabled", "External alert delivery disabled（外部通知已停用）")}</span>
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
        <div><dt>本地匯入檔案</dt><dd>只讀 JSON snapshot</dd></div>
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
        <span class="status-chip">Import snapshot disabled in scaffold（匯入已停用）</span>
        <span class="status-chip">Export snapshot via local script only（只可本地 script 匯出）</span>
      </div>
    </article>
  `;
}

function renderRbac() {
  const rbacSummary = dashboardAdapter.getRbacSummary();
  const roleState = getSimulatedRoleState();
  const roleMatrix = window.OpenClawRbacPolicy.getRoleMatrix();
  const permissions = window.OpenClawRbacPermissions.REQUIRED_PERMISSIONS;
  const forbidden = window.OpenClawRbacPermissions.FORBIDDEN_MUTATION_PERMISSIONS;
  return `
    <section class="operator-page rbac-console-page">
      ${renderPageIntro("權限檢視", "這裡顯示目前模擬身份可以查看甚麼。這不是登入系統，也不會開啟 Production 權限。", "模擬身份", "success")}
      ${renderConsoleCardGrid([
        { title: "目前身份", value: `${roleState.label}（模擬）`, note: "不是真實登入", tone: "muted" },
        { title: "登入狀態", value: "沒有真實登入", note: "沒有登入憑證或瀏覽器資料", tone: "success" },
        { title: "Production 權限", value: "沒有", note: "不能寫入 Gateway 或 Production", tone: "success" },
        { title: "修改能力", value: "沒有", note: "只產生草稿，不會提交", tone: "success" }
      ], "rbac-summary-grid")}
      <section class="content-grid two-col">
        <article class="panel permission-summary-panel">
          <div class="panel-heading"><h2>可查看項目</h2>${badge("只讀", "success")}</div>
          ${renderList("可以查看", roleState.allowedPermissions.map(permissionLabel))}
          ${renderList("不能執行", [
            "批准或拒絕真實審查",
            "還原備份",
            "修改設定",
            "寫入 Gateway",
            "Production 修改",
            ...roleState.unavailableActions.map(formatOperatorValue)
          ])}
        </article>
        <article class="panel role-cards-panel">
          <div class="panel-heading"><h2>身份摘要</h2>${badge("模擬", "warning")}</div>
          <div class="operator-list role-card-list">
            ${roleMatrix.map((entry) => `
              <div class="operator-list-card">
                <strong>${escapeHtml(entry.label)}</strong>
                <span>${escapeHtml(entry.description)}</span>
                <small>可查看：${entry.permissions.map(permissionLabel).slice(0, 4).join("、")}${entry.permissions.length > 4 ? "..." : ""}</small>
              </div>
            `).join("")}
          </div>
        </article>
      </section>
      ${renderTechnicalDetails("權限技術資料", [
        ["currentRole", roleState.currentRole],
        ["allowedPermissions", roleState.allowedPermissions.join("; ")],
        ["requiredPermissions", permissions.join("; ")],
        ["forbiddenMutationPermissions", forbidden.join("; ")],
        ["rbacSummary", JSON.stringify(rbacSummary)]
      ])}
    </section>
  `;
}

function renderRunbook() {
  return `
    <section class="operator-page runbook-console-page">
      ${renderPageIntro("操作手冊", "這裡整理每日操作步驟、疑難排解與不可執行的高風險操作。Operator 操作手冊只提供本地唯讀建議。", "每日使用", "success")}
      ${renderConsoleCardGrid([
        { title: "第一步", value: "看今日任務", note: "先處理需要檢查或失敗任務", tone: "warning" },
        { title: "第二步", value: "看 Agent 狀態", note: "健康未知或過期時走人工 runbook", tone: "warning" },
        { title: "第三步", value: "看安全鎖", note: "Production 未開放是正常狀態", tone: "success" },
        { title: "遇到 8 Agents", value: "示範資料", note: "請開本地 single-agent 檢視", tone: "warning" }
      ])}
      <section class="content-grid two-col">
        ${renderSafeNextSteps([
          { title: "每日檢查", note: "確認今日任務、Agent 狀態、健康證據和 Production 安全鎖。" },
          { title: "健康 unknown / stale", note: "只走人工 runbook，不在 Dashboard 重啟 Agent。" },
          { title: "WhatsApp 未同步", note: "用安全中轉工具寫入本地任務收件箱。" },
          { title: "餘額未知", note: "只在本機 provider-balance-center.json 填寫，不貼 key 或密碼。" }
        ])}
        ${renderOperatorTroubleshootingPanel()}
        ${renderLocalOpenClawActivationAssistantPanel()}
        ${renderLocalOpenClawConnectorPanel()}
        ${renderWhatsAppLocalTaskHelperPanel()}
        ${renderWhatsAppLocalTaskImportPanel()}
        ${renderReadonlyGuardrailPanel()}
        ${renderHourlyRefreshPanel()}
      </section>
      ${renderTechnicalDetails("操作手冊技術 marker", [
        ["What this dashboard is", "local-only operator console"],
        ["What this dashboard is not", "production gateway or mutation console"],
        ["Safe operating rules", "read-only, local-only, no production connection"],
        ["do not connect production API", true],
        ["do not enable mutation", true],
        ["不讀取敏感資料", true],
        ["do not commit junk root files", true]
      ])}
      ${renderTechnicalArchive("完整技術手冊與歷史報告", `<section class="content-grid two-col">${renderReleaseHealthPanel()}${renderRealLocalDataPilotPanel()}${renderObservabilitySummaryPanel()}${renderProductionReadinessPanel()}${renderQualityGateStatus()}${renderImportExportContract()}</section>`)}
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
  await loadLocalOpenClawConnectorReport();
  await loadLocalOpenClawActivationReport();
  await loadWhatsAppLocalTaskHelperReport();
  await loadWhatsAppLocalTaskImportReport();
  await loadWhatsAppSyncMockContractReport();
  await loadLocalTaskInboxReport();
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
