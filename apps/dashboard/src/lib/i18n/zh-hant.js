(function () {
const ZH_HANT_STRINGS = {
  appTitle: "OpenClaw 儀表板",
  internalBeta: "內部 Operator Beta",
  productionNoGo: "Production 暫不可上線",
  mockOnlyScaffold: "mock-only scaffold / 唯讀腳手架",
  productionMutationsDisabled: "Production 寫入操作已停用",
  routes: {
    overview: "總覽",
    agents: "Agents / 代理程式",
    tasks: "任務",
    reviews: "審核",
    logs: "日誌",
    backups: "備份",
    observability: "觀測 / Observability",
    settings: "設定",
    rbac: "權限 / RBAC",
    runbook: "操作手冊"
  },
  status: {
    dataSource: "資料來源",
    health: "健康狀態",
    validation: "驗證",
    fallback: "回退",
    fallbackReason: "回退原因",
    safetyMode: "安全模式",
    productionWiring: "Production wiring",
    mutationEnabled: "寫入操作啟用",
    ingestFile: "本地匯入檔案",
    baseUrl: "Base URL",
    lastLoaded: "最後載入"
  },
  states: {
    loading: "載入中：mock shimmer 已準備",
    empty: "目前沒有資料；唯讀狀態正常",
    error: "錯誤：唯讀回退已準備"
  },
  panels: {
    sourceStatus: "資料來源狀態",
    operationsGuard: "操作安全守衛",
    releaseHealth: "Release / Health 發佈健康狀態",
    realLocalPilot: "真實本地資料試行",
    observabilitySummary: "觀測摘要",
    readinessSummary: "Production 就緒狀態摘要",
    qualityGate: "品質閘門狀態",
    importExport: "匯入 / 匯出合約",
    roleSimulation: "唯讀角色模擬",
    actionDraftPreview: "操作草稿預覽",
    agentRegistry: "代理程式註冊表",
    taskQueue: "任務佇列",
    traceViewer: "日誌追蹤檢視",
    backupManifests: "備份 manifests",
    evidenceChain: "證據鏈",
    configGuard: "設定安全守衛",
    alertPreviewList: "警示預覽清單",
    readinessChecklist: "就緒狀態清單",
    operatorRunbook: "Operator 操作手冊",
    devGatewayLiveDrill: "Dev Gateway Read-only Live Drill / 開發 Gateway 唯讀演練",
    operatorDailyWorkflow: "Operator Daily Workflow / Operator 每日流程",
    incidentDrill: "Incident drill / 事故演練",
    evidenceManifest: "Evidence manifest / 證據清單"
  },
  safety: {
    readOnly: "唯讀 / read-only",
    mutationFalse: "false（未啟用）",
    disabled: "disabled（已停用）",
    noGo: "no-go-for-production（Production 暫不可上線）",
    localOnly: "只限本地",
    scriptOnly: "只可透過本地 script 更新",
    absolutePathsRedacted: "absolute paths redacted（絕對路徑已移除）",
    secretsRedacted: "secrets redacted（敏感值已移除）",
    productionEndpointsBlocked: "production endpoints blocked（Production endpoint 已封鎖）",
    credentialsOmit: "credentials: omit（不送 credentials）",
    noAuthHeader: "Authorization header：未使用",
    localhostOnly: "只允許 localhost / 127.0.0.1",
    productionUrlBlocked: "Production URL blocked（Production URL 已封鎖）",
    fallbackChain: "fallback to gateway-stub / generated snapshot / mock",
    notificationFalse: "notificationSent false（未發送通知）",
    externalEscalationFalse: "externalEscalationSent false（未發送外部升級）"
  },
  actions: {
    liveImportDisabled: "Live import disabled（即時匯入已停用）",
    refreshViaScriptOnly: "Refresh via local script only（只可用本地 script 更新）",
    approveMock: "Approve mock（模擬批准）",
    rejectMock: "Reject mock（模擬拒絕）",
    generateApproveDraft: "產生 approve 操作草稿",
    generateRejectDraft: "產生 reject 操作草稿",
    generateNeedsChangesDraft: "產生 needs changes 操作草稿",
    generateBackupDraft: "產生備份驗證草稿",
    generateSettingsDraft: "產生設定變更草稿",
    deployDisabled: "Deploy disabled in scaffold（部署已停用）",
    externalAlertDisabled: "External alert delivery disabled（外部通知已停用）",
    liveProductionGatewayDisabled: "Live production gateway disabled（Production Gateway 已停用）",
    localDrillOnly: "Local drill only（只限本機演練）",
    externalEscalationDisabled: "External escalation disabled（外部升級已停用）",
    productionIncidentActionDisabled: "Production incident action disabled（Production 事故操作已停用）",
    mutationDisabled: "Mutation disabled（寫入操作已停用）"
  }
};

Object.assign(ZH_HANT_STRINGS.panels, {
  internalReleaseCandidate: "v1.0.0 Internal Release Candidate / 內部正式候選版"
});

Object.assign(ZH_HANT_STRINGS.actions, {
  productionReleaseDisabled: "Production release disabled / Production 發佈已停用",
  signoffCannotBeAutomated: "Sign-off cannot be automated / 簽核不可自動完成",
  mutationRemainsDisabled: "Mutation remains disabled / 寫入操作維持停用"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  productionTrackPlanning: "Production Track Planning / Production route planning",
  readonlyProductionGatewayReadiness: "Read-only Production Gateway Readiness / read-only production gateway readiness",
  productionEntryGates: "Production Entry Gates / production entry gates"
});

Object.assign(ZH_HANT_STRINGS.actions, {
  productionGatewayConnectionDisabled: "Production gateway connection disabled / Production Gateway connection disabled",
  productionDeployDisabled: "Production deploy disabled / Production deploy disabled",
  productionApprovalManualOnly: "Production approval cannot be automated / manual approval required"
});

window.OpenClawZhHantStrings = ZH_HANT_STRINGS;
})();
