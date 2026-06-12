(function () {
  const COPY = {
    productionReady: "Production 可用：否",
    "no-go-for-production": "Production 未開放",
    disabled: "已停用",
    enabled: "已啟用",
    false: "否",
    true: "是",
    passed: "已通過",
    pass: "已通過",
    warning: "需要留意",
    adapterEnabled: "Adapter 已啟用：否",
    connected: "已連線：否",
    endpointConfigured: "Endpoint 已設定：否",
    authEnabled: "Auth 已啟用：否",
    dataReturned: "已取得 Production 資料：否",
    mutationEnabled: "修改功能：停用",
    restartEnabled: "重啟功能：停用",
    deployEnabled: "部署功能：停用",
    productionAdapterEnabled: "Production Adapter 已啟用",
    productionAdapterConnected: "Production Adapter 已連線",
    productionAdapterSimulator: "Production Adapter 模擬器",
    requiresHumanApproval: "需要人工批准",
    notSubmitted: "尚未提交",
    dryRun: "只做預演",
    endpoint: "Endpoint",
    auth: "Auth",
    "local-ingest": "本地資料",
    mock: "示範資料",
    "gateway-stub": "示範 Gateway",
    "review-required": "需要人工檢查",
    "missing-fallback": "未有審核資料，已使用安全備用資料",
    "missing-reviewed-input": "未提供本地審核資料",
    "missing-fallback-to-sample": "未提供本地審核資料，已使用安全範例資料",
    blocked: "已封鎖",
    "not-evaluated": "尚未檢查",
    "local-operator-rc": "本地 Operator 可用候選版",
    unknown: "未知",
    stale: "資料可能過期",
    fresh: "最新",
    "fixture-mode": "示範模式",
    todo: "待處理",
    "in-progress": "處理中",
    running: "執行中",
    review_pending: "等待檢查",
    failed: "失敗",
    timed_out: "超時",
    cancelled: "已取消",
    lost: "失去追蹤",
    done: "已完成",
    queued: "排隊中",
    succeeded: "已成功",
    Workflow: "流程",
    Owner: "負責來源",
    Reviewer: "檢查者",
    Created: "建立時間",
    Updated: "更新時間",
    Priority: "優先級",
    Status: "狀態",
    "Health status": "健康狀態",
    "Evidence status": "證據狀態",
    "Production status": "Production 狀態",
    "Safety mode": "安全模式",
    "Fallback reason": "備用原因",
    "Expected real agent count": "預期真實 Agent 數量",
    "Actual real agent count": "實際真實 Agent 數量",
    "read-only": "唯讀",
    none: "沒有",
    ok: "正常"
  };

  const TASK_NEXT_STEPS = {
    todo: "請按優先級處理",
    "in-progress": "等待下一次刷新",
    running: "等待下一次刷新",
    review_pending: "請人工確認任務是否完成",
    failed: "查看任務備註或重新建立任務",
    timed_out: "檢查 Agent 是否仍有回應",
    cancelled: "無需處理，除非這不是你預期",
    lost: "需要人工檢查任務來源",
    queued: "等待排隊處理",
    succeeded: "無需處理",
    done: "無需處理",
    blocked: "先處理阻塞原因"
  };

  const PERMISSION_LABELS = {
    "dashboard:view": "查看 Dashboard",
    "agents:view": "查看 Agent",
    "tasks:view": "查看任務",
    "reviews:view": "查看審查",
    "logs:view": "查看日誌",
    "backups:view": "查看備份",
    "settings:view": "查看設定",
    "runbook:view": "查看操作手冊",
    "reviews:draft_decision": "產生審查草稿，不會提交",
    "backups:draft_verification": "產生備份驗證草稿，不會提交",
    "settings:draft_change": "產生設定草稿，不會提交",
    "exports:draft_request": "產生匯出草稿，不會提交"
  };

  function label(key, fallback) {
    return COPY[key] || fallback || key;
  }

  function formatOperatorLabel(key) {
    return COPY[key] || key;
  }

  function formatOperatorValue(value) {
    if (value === true) return COPY.true;
    if (value === false) return COPY.false;
    if (value === null || value === undefined || value === "") return "未提供";
    return COPY[value] || String(value);
  }

  function formatOperatorStatus(status) {
    return COPY[status] || String(status || "未知");
  }

  function formatOperatorBoolean(value) {
    return value === true ? "是" : "否";
  }

  function formatOperatorTechnicalDetail(key, value) {
    return `${formatOperatorLabel(key)}：${formatOperatorValue(value)}`;
  }

  function taskNextStep(status) {
    return TASK_NEXT_STEPS[status] || "需要人工檢查";
  }

  function permissionLabel(permission) {
    return PERMISSION_LABELS[permission] || "只產生草稿，不會提交";
  }

  function explainPanel(panelId) {
    const explanations = {
      taskInbox: "這裡顯示今天有沒有任務進入 Dashboard。",
      whatsapp: "這裡只顯示 WhatsApp 任務是否已透過本地檔案同步。",
      refresh: "Dashboard 每 1 小時只重新讀取本地報告，不會連接 Production。",
      balance: "這裡顯示本機手動填寫的 API 用量與餘額狀態，不會儲存密碼。",
      safety: "這裡確認 Production、修改、重啟、部署仍然鎖住。"
    };
    return explanations[panelId] || "這是本地只讀 Operator 資訊。";
  }

  function actionFor(status) {
    if (status === "blocked") return "請先停止操作，查看已封鎖原因。";
    if (status === "review-required" || status === "unknown") return "請按 Runbook 人工檢查，不要在 Dashboard 重啟或修改。";
    return "可以繼續用本地只讀方式查看。";
  }

  window.OpenClawOperatorCopy = {
    COPY,
    TASK_NEXT_STEPS,
    PERMISSION_LABELS,
    label,
    explainPanel,
    actionFor,
    formatOperatorLabel,
    formatOperatorValue,
    formatOperatorStatus,
    formatOperatorBoolean,
    formatOperatorTechnicalDetail,
    taskNextStep,
    permissionLabel
  };
})();
