(function () {
  const ACTIVATION_STATUSES = [
    "needs-local-config",
    "needs-openclaw-running",
    "ready-to-test",
    "connected-readonly",
    "unsafe-rejected",
    "review-required"
  ];
  const SECRET_HINT_RE = /(token|key|password|secret|credential|cookie|authorization|bearer|auth)/i;
  const LOCAL_EXPORT_RE = /^apps\/dashboard\/data\/local\/openclaw-local-export(?:\.[A-Za-z0-9_-]+)?\.json$/;

  function connectorApi() {
    return window.OpenClawLocalOpenClawConnector || {};
  }

  function normalizePath(value) {
    return String(value || "").replaceAll("\\", "/").replace(/^\.\//, "");
  }

  function validateLocalOpenClawEndpointCandidate(input = {}) {
    const baseUrl = input.baseUrl || input;
    const api = connectorApi();
    const safe = typeof api.isSafeLocalUrl === "function" ? api.isSafeLocalUrl(baseUrl) : false;
    return {
      valid: safe,
      candidateType: "localhost-endpoint",
      safeLabel: safe ? "localhost" : "rejected",
      rejectedReason: safe ? null : "only localhost / 127.0.0.1 HTTP URLs without token/key/password are allowed",
      allowedMethods: ["GET"],
      externalNetworkAllowed: false,
      rawValuePrinted: false
    };
  }

  function validateLocalOpenClawExportCandidate(input = {}) {
    const path = normalizePath(input.localExportPath || input);
    const safe = LOCAL_EXPORT_RE.test(path) && !SECRET_HINT_RE.test(path);
    return {
      valid: safe,
      candidateType: "local-export-file",
      safeLabel: safe ? "repo-local-export" : "rejected",
      localExportPath: safe ? path : "rejected",
      rejectedReason: safe ? null : "only repo-relative apps/dashboard/data/local/openclaw-local-export*.json is allowed",
      externalNetworkAllowed: false,
      rawValuePrinted: false
    };
  }

  function buildLocalOpenClawActivationStatus(input = {}) {
    if (input.connectionStatus === "connected") return "connected-readonly";
    if (input.connectionStatus === "unsafe-rejected" || input.readinessStatus === "unsafe-rejected") return "unsafe-rejected";
    if (input.localConfigPresent === false || input.readinessStatus === "needs-local-config") return "needs-local-config";
    if (input.connectorEnabled === true && input.readinessStatus === "needs-openclaw-running") return "needs-openclaw-running";
    if (input.connectorEnabled === true) return "ready-to-test";
    return "review-required";
  }

  function buildLocalOpenClawSetupSteps(input = {}) {
    const status = buildLocalOpenClawActivationStatus(input);
    if (status === "connected-readonly") {
      return [
        "本機 OpenClaw 已只讀連接，請查看 Agent 與任務是否符合預期。",
        "如資料不更新，重新執行 connector report 或使用 Dashboard 立即刷新。"
      ];
    }
    if (status === "needs-openclaw-running") {
      return [
        "已找到本機設定，但讀不到 OpenClaw。",
        "請確認本機 OpenClaw 是否啟動，或確認 local export file 是否存在。",
        "不要在 Dashboard 重啟 Agent；只用本機 runbook 檢查。"
      ];
    }
    if (status === "unsafe-rejected") {
      return [
        "目前設定被安全規則拒絕。",
        "請只使用 localhost / 127.0.0.1 或 repo-relative local export file。",
        "移除任何 API key、password、token、外部 URL 或 Production URL。"
      ];
    }
    return [
      "尚未建立本機連接設定。",
      "如果你知道本機 OpenClaw read-only endpoint，使用 PowerShell 建立 localhost 設定。",
      "如果你不知道 endpoint，先用本機 export file 方式。",
      "設定檔只留在本機，不會 commit。"
    ];
  }

  function buildLocalOpenClawActivationCards(input = {}) {
    const status = buildLocalOpenClawActivationStatus(input);
    return [
      {
        title: "目前狀態",
        value: status,
        note: status === "connected-readonly" ? "已只讀連接" : "需要本機設定或啟動 OpenClaw"
      },
      {
        title: "安全方式",
        value: "localhost 或本機 export file",
        note: "不使用 API key、password、token"
      },
      {
        title: "允許操作",
        value: "GET / 本地讀檔",
        note: "不會修改、重啟或部署"
      }
    ];
  }

  function buildLocalOpenClawActivationSummary(input = {}) {
    const activationStatus = buildLocalOpenClawActivationStatus(input);
    return {
      activationStatus,
      localConfigPresent: input.localConfigPresent === true,
      connectorEnabled: input.connectorEnabled === true,
      baseUrlSafeLabel: input.baseUrlSafeLabel || "not-configured",
      localExportPath: input.localExportPath || "apps/dashboard/data/local/openclaw-local-export.json",
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
      operatorSteps: buildLocalOpenClawSetupSteps(input),
      safeNextSteps: buildLocalOpenClawSetupSteps(input),
      blockedActions: ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]
    };
  }

  window.OpenClawLocalOpenClawActivationAssistant = {
    ACTIVATION_STATUSES,
    buildLocalOpenClawActivationStatus,
    buildLocalOpenClawSetupSteps,
    validateLocalOpenClawEndpointCandidate,
    validateLocalOpenClawExportCandidate,
    buildLocalOpenClawActivationCards,
    buildLocalOpenClawActivationSummary
  };
})();
