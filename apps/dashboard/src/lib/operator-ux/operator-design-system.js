(function () {
  const TOKENS = {
    shell: "operator-console-shell",
    panel: "console-panel",
    card: "console-card",
    cardGrid: "console-card-grid",
    hero: "console-hero",
    technical: "technical-detail"
  };

  const STATUS_TONE = {
    ok: "success",
    pass: "success",
    passed: "success",
    fresh: "success",
    online: "success",
    warning: "warning",
    stale: "warning",
    unknown: "warning",
    "review-required": "warning",
    "missing-fallback": "warning",
    blocked: "blocked",
    failed: "blocked",
    "no-go-for-production": "blocked",
    disabled: "muted"
  };

  const ROUTE_SUMMARIES = {
    overview: "今日營運總覽會集中顯示任務、Agent、用量、刷新與 Production 安全鎖。",
    agents: "這裡顯示 Dashboard 目前看到的本地 Agent。Dashboard 只讀，不會重啟、停止或修改 Agent。",
    tasks: "這裡顯示 Dashboard 目前收到的任務。如果 WhatsApp 任務未出現，代表同步入口未接好，不代表 Dashboard 壞機。",
    reviews: "這裡只會模擬權限與操作草稿，不會真的批准、拒絕或修改任何資料。",
    logs: "這裡顯示本地日誌摘要，方便你檢查是否有需要人工跟進的事件。",
    backups: "這裡顯示備份證據與校驗狀態，不會執行還原或寫入 Production。",
    observability: "這裡顯示本地觀測摘要、風險提示與 readiness 狀態，不會發送外部通知。",
    settings: "這裡顯示目前設定狀態。Dashboard 只會產生草稿，不會直接修改設定。",
    rbac: "這裡顯示目前模擬身份可以查看甚麼。這不是登入系統，也不會開啟 Production 權限。",
    runbook: "這裡整理每日操作步驟、疑難排解與不可執行的高風險操作。"
  };

  function toneForStatus(status) {
    return STATUS_TONE[status] || "muted";
  }

  function getRouteSummary(routeId) {
    return ROUTE_SUMMARIES[routeId] || "這頁提供本地只讀營運資訊，技術資料已收起在技術詳情。";
  }

  function buildConsoleCard({ title, value, note, tone = "muted", action = "" }) {
    return { title, value, note, tone, action };
  }

  function buildSafetyLocks() {
    return [
      buildConsoleCard({ title: "Production", value: "已鎖定", note: "Production 未開放", tone: "blocked" }),
      buildConsoleCard({ title: "修改功能", value: "已停用", note: "不會改動 Agent 或資料", tone: "success" }),
      buildConsoleCard({ title: "重啟功能", value: "已停用", note: "不會重啟、停止或啟動 Agent", tone: "success" }),
      buildConsoleCard({ title: "登入與 Token", value: "未使用", note: "沒有真實登入、沒有 token", tone: "success" })
    ];
  }

  window.OpenClawOperatorDesignSystem = {
    TOKENS,
    STATUS_TONE,
    ROUTE_SUMMARIES,
    toneForStatus,
    getRouteSummary,
    buildConsoleCard,
    buildSafetyLocks
  };
})();
