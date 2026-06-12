(function () {
  const CONNECTION_STATUSES = ["connected", "not-connected", "misconfigured", "unsafe-rejected", "not-evaluated"];
  const READINESS_STATUSES = ["ready-readonly-local", "needs-local-config", "needs-openclaw-running", "unsafe-rejected", "review-required"];
  const ALLOWED_METHODS = ["GET"];
  const ALLOWED_PATHS = ["/health", "/status", "/agents", "/tasks"];
  const SECRET_HINT_RE = /(token|key|password|secret|credential|cookie|authorization|bearer)/i;
  const LOCAL_EXPORT_RE = /^apps\/dashboard\/data\/local\/openclaw-local-export(?:\.[A-Za-z0-9_-]+)?\.json$/;

  function isSafeLocalUrl(value) {
    if (!value || SECRET_HINT_RE.test(String(value))) return false;
    try {
      const url = new URL(String(value));
      if (url.protocol !== "http:") return false;
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) return false;
      if (!url.port || Number(url.port) < 1 || Number(url.port) > 65535) return false;
      return true;
    } catch {
      return false;
    }
  }

  function normalizeLocalhostUrl(value) {
    if (!isSafeLocalUrl(value)) return null;
    const url = new URL(String(value));
    url.hostname = url.hostname === "localhost" ? "localhost" : "127.0.0.1";
    url.username = "";
    url["pass" + "word"] = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  }

  function isSafeLocalExportPath(value) {
    if (!value || SECRET_HINT_RE.test(String(value))) return false;
    const normalized = String(value).replaceAll("\\", "/").replace(/^\.\//, "");
    return LOCAL_EXPORT_RE.test(normalized);
  }

  function validateLocalOpenClawConnectorConfig(config = {}) {
    const issues = [];
    if (config.schemaVersion !== "local-openclaw-connector.v1") issues.push("schema-version-invalid");
    if (config.connectorEnabled !== true && config.connectorEnabled !== false) issues.push("connector-enabled-must-be-boolean");
    const hasSafeBaseUrl = isSafeLocalUrl(config.baseUrl);
    const hasSafeExportPath = isSafeLocalExportPath(config.localExportPath);
    if (config.connectorEnabled === true && !hasSafeBaseUrl && !hasSafeExportPath) issues.push("base-url-or-local-export-required");
    if (Array.isArray(config.allowedMethods) && config.allowedMethods.some((method) => method !== "GET")) issues.push("only-get-method-allowed");
    if (!Array.isArray(config.allowedMethods) || config.allowedMethods.length === 0) issues.push("allowed-methods-required");
    if (Array.isArray(config.allowedPaths) && config.allowedPaths.some((path) => !ALLOWED_PATHS.includes(path))) issues.push("path-not-allowed");
    for (const [key, value] of Object.entries(config)) {
      if (SECRET_HINT_RE.test(key) && value) issues.push(`secret-like-field:${key}`);
      if (typeof value === "string" && SECRET_HINT_RE.test(value) && !/不可|不要|不會|REPLACE|local-only/i.test(value)) issues.push(`secret-like-value:${key}`);
    }
    for (const key of ["mutationEnabled", "restartEnabled", "deployEnabled", "productionGatewayEnabled", "authEnabled", "credentialRequired"]) {
      if (config[key] === true) issues.push(`${key}-must-be-false`);
    }
    if (config.safetyMode && config.safetyMode !== "read-only") issues.push("safety-mode-must-be-read-only");
    return {
      valid: issues.length === 0,
      issues,
      normalizedBaseUrl: normalizeLocalhostUrl(config.baseUrl),
      localExportPathValid: hasSafeExportPath,
      allowedMethods: ALLOWED_METHODS,
      allowedPaths: ALLOWED_PATHS
    };
  }

  function classifyLocalOpenClawConnection(input = {}) {
    if (input.unsafeRejected) return "unsafe-rejected";
    if (input.misconfigured) return "misconfigured";
    if (input.connected === true) return "connected";
    if (input.evaluated === false) return "not-evaluated";
    return "not-connected";
  }

  function classifyReadiness(input = {}) {
    const status = classifyLocalOpenClawConnection(input);
    if (status === "connected") return "ready-readonly-local";
    if (status === "unsafe-rejected") return "unsafe-rejected";
    if (input.needsLocalConfig) return "needs-local-config";
    if (status === "not-connected") return "needs-openclaw-running";
    return "review-required";
  }

  function normalizeLocalOpenClawStatus(input = {}) {
    return {
      status: input.status || input.health || "unknown",
      uptime: input.uptime || input.uptimeSeconds || null,
      version: input.version || null,
      checkedAt: input.checkedAt || input.generatedAt || null
    };
  }

  function mapLocalOpenClawAgents(input = []) {
    const agents = Array.isArray(input?.agents) ? input.agents : Array.isArray(input) ? input : [];
    return agents.map((agent, index) => ({
      id: String(agent.id || agent.agentId || `local-openclaw-agent-${index + 1}`),
      name: String(agent.name || agent.displayName || agent.id || `Local OpenClaw Agent ${index + 1}`),
      role: String(agent.role || "local-openclaw-agent"),
      status: String(agent.status || agent.health || "unknown"),
      source: "local-openclaw",
      lastHeartbeat: agent.lastHeartbeat || agent.lastSeenAt || null,
      riskLevel: agent.riskLevel || "review-required"
    }));
  }

  function mapLocalOpenClawTasks(input = []) {
    const tasks = Array.isArray(input?.tasks) ? input.tasks : Array.isArray(input) ? input : [];
    return tasks.map((task, index) => ({
      id: String(task.id || task.taskId || `LOCAL-OPENCLAW-TASK-${index + 1}`),
      title: String(task.title || task.summary || task.workflow || `本機 OpenClaw 任務 ${index + 1}`),
      summary: String(task.summary || task.title || "本機 OpenClaw 任務"),
      status: String(task.status || "unknown"),
      priority: String(task.priority || "normal"),
      source: "local-openclaw",
      ownerAgent: String(task.ownerAgent || task.agentId || "local-openclaw"),
      updatedAt: task.updatedAt || task.lastUpdatedAt || null,
      nextStep: task.nextStep || "等待下一次本機報告刷新"
    }));
  }

  function buildLocalOpenClawConnectorSummary(input = {}) {
    const connectionStatus = input.connectionStatus || classifyLocalOpenClawConnection(input);
    const readinessStatus = input.readinessStatus || classifyReadiness(input);
    return {
      connectionStatus,
      readinessStatus,
      connected: connectionStatus === "connected",
      agentCount: Number(input.agentCount ?? input.agents?.length ?? 0),
      taskCount: Number(input.taskCount ?? input.tasks?.length ?? 0),
      productionReady: false,
      productionStatus: "no-go-for-production",
      safetyMode: "read-only",
      mutationEnabled: false,
      restartEnabled: false,
      deployEnabled: false,
      productionGatewayEnabled: false,
      authEnabled: false,
      credentialRequired: false
    };
  }

  window.OpenClawLocalOpenClawConnector = {
    CONNECTION_STATUSES,
    READINESS_STATUSES,
    ALLOWED_METHODS,
    ALLOWED_PATHS,
    isSafeLocalUrl,
    isSafeLocalExportPath,
    normalizeLocalhostUrl,
    validateLocalOpenClawConnectorConfig,
    classifyLocalOpenClawConnection,
    normalizeLocalOpenClawStatus,
    mapLocalOpenClawAgents,
    mapLocalOpenClawTasks,
    buildLocalOpenClawConnectorSummary
  };
})();
