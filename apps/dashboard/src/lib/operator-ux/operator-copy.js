(function () {
  const COPY = {
    productionReady: "Production 可用：否",
    "no-go-for-production": "Production 未開放",
    adapterEnabled: "Adapter 已啟用：否",
    connected: "已連線：否",
    endpointConfigured: "Endpoint 已設定：否",
    authEnabled: "Auth 已啟用：否",
    dataReturned: "已取得 Production 資料：否",
    mutationEnabled: "修改功能：停用",
    restartEnabled: "重啟功能：停用",
    deployEnabled: "部署功能：停用",
    "local-ingest": "本地資料",
    mock: "示範資料",
    "gateway-stub": "示範 Gateway",
    "review-required": "需要檢查",
    blocked: "已封鎖",
    unknown: "未知",
    "fixture-mode": "示範模式"
  };

  function label(key, fallback) {
    return COPY[key] || fallback || key;
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

  window.OpenClawOperatorCopy = { COPY, label, explainPanel, actionFor };
})();
