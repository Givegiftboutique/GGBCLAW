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
  productionEntryGates: "Production Entry Gates / production entry gates",
  sourceTrust: "Data trust / 資料可信分類",
  fixtureQuarantine: "Fixture Quarantine / Fixture 隔離",
  singleAgentTruth: "Single Agent Truth / 單一真實 Agent 對齊"
});

Object.assign(ZH_HANT_STRINGS.actions, {
  productionGatewayConnectionDisabled: "Production gateway connection disabled / Production Gateway connection disabled",
  productionDeployDisabled: "Production deploy disabled / Production deploy disabled",
  productionApprovalManualOnly: "Production approval cannot be automated / manual approval required",
  fixtureCannotPromote: "Fixture data cannot be promoted to operator truth / Fixture 資料不可當作 Operator 真實資料",
  productionGatewayStillDisabled: "Production gateway connection disabled / Production Gateway 連線停用"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  demoFixtureWarning: "Demo Fixture Data / 示範測試資料；Not real agents / 並非真實 agents",
  contractFixtureWarning: "Contract Fixture Data / 合約測試資料；Not real production agents / 並非真實 production agents",
  operatorTruthCandidate: "Operator Truth Candidate / Operator 真實資料候選",
  expectedSingleAgent: "Expected real agent count: 1 / 預期真實 agent 數量：1",
  fixtureEightAgentsOnly: "8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試",
  noRealSnapshotLoaded: "No real local agent snapshot loaded. 未載入真實本地 agent snapshot。"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  actualSingleAgent: "Actual real agent count: 1 / 實際真實 agent 數量：1",
  singleAgentSnapshotLoaded: "Single-agent snapshot: loaded / 單 agent snapshot 已載入",
  realLocalSnapshotReviewRequired: "Real local snapshot review required / 真實本地 snapshot 需要審查"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  sourceLockdown: "Operator recommended source / Operator 建議資料來源"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  operatorSourceLockdown: "Operator source selection lockdown / Operator 資料來源選擇鎖定",
  operatorRecommendedUrl: "Operator recommended URL / Operator 建議 URL",
  highDemoFixtureWarning: "High warning: Demo fixture data only / 高風險提示：這只是示範 fixture",
  highContractFixtureWarning: "High warning: Contract fixture data only / 高風險提示：這只是合約 fixture"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  localAgentHealth: "Local Real Agent Health / 本地真實 Agent 健康狀態"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  localFileOnlyHealth: "Health source: local-file-only / 健康來源：本地唯讀檔案",
  localReviewedHealth: "Reviewed local health JSON / 已審核本地健康 JSON",
  invalidReviewedHealth: "Invalid reviewed local health input / 已審核本地健康輸入無效",
  noRestartAction: "No restart action available / 不提供 restart 操作",
  healthRequiresReview: "Health requires local operator review / 健康狀態需要本地 operator 人工確認"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  localHealthEvidence: "Local Health Evidence Review / 本地健康證據審核"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  localHealthEvidenceStatus: "Evidence status / 證據狀態",
  localHealthEvidenceRedaction: "Redaction applied / 已套用去敏",
  localHealthRawValuesPrinted: "Raw values printed: no / 沒有印出原始值"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  operatorHome: "Operator Home / Operator 首頁",
  operatorTroubleshooting: "Operator Troubleshooting / Operator 疑難排解",
  operatorDailyChecklist: "Daily operator checklist / 每日 Operator 清單",
  operatorUsabilityMvp: "Operator Usability MVP / Operator 可用性 MVP"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  operatorRecommendedView: "Recommended operator view / 建議 Operator 檢視",
  openRecommendedOperatorView: "Open recommended operator view / 開啟建議 Operator 檢視",
  dailyOperatorViewWarning: "This is not the daily operator view / 這不是每日 Operator 檢視",
  restartDisabled: "Restart: disabled / 重啟：已停用",
  mutationDisabled: "Mutation: disabled / 修改：已停用",
  productionGatewayDisabled: "Production gateway: disabled / Production gateway：已停用",
  productionStatusNoGo: "Production status: no-go-for-production / Production 狀態：不可上線"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  dailyOperatorRunbook: "Daily Operator Runbook / 每日 Operator Runbook"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  todayStatus: "Today status / 今日狀態",
  statusReason: "Why this status / 狀態原因",
  safeNextSteps: "Safe next steps / 安全下一步",
  blockedActions: "Blocked actions / 已封鎖操作",
  reviewRequired: "Review Required / 需要人工審查",
  fixtureMode: "Fixture Mode / Fixture 模式，不是每日 Operator 檢視",
  blockedStatus: "Blocked / 已封鎖",
  unknownStatus: "Unknown / 未知"
});

Object.assign(ZH_HANT_STRINGS.panels, {
  reviewedHealthInputAssistant: "Reviewed Health Input Assistant / 已審查健康輸入助手"
});

Object.assign(ZH_HANT_STRINGS.safety, {
  reviewedHealthTemplatePath: "Template path / 模板路徑",
  reviewedHealthLocalInputPath: "Local input path / 本地輸入路徑",
  reviewedHealthDryRunReadiness: "Dry-run readiness / 乾跑準備度",
  reviewedHealthCommitPolicy: "Commit policy: local-only-do-not-commit / 提交政策：只限本地，不要 commit",
  reviewedHealthRedactionApplied: "Redaction applied / 已套用去敏",
  reviewedHealthRawValuesPrintedFalse: "Raw values printed: false / 不會打印原始值",
  reviewedHealthMissingLocalInput: "Missing local input / 未提供本地 reviewed health input",
  reviewedHealthUnsafeRejected: "Unsafe reviewed input rejected / 不安全 reviewed input 已拒絕",
  reviewedHealthSafeNextSteps: "Safe next steps / 安全下一步"
});

window.OpenClawZhHantStrings = ZH_HANT_STRINGS;
})();
