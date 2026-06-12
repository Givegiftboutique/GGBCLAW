import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const configRel = "apps/dashboard/data/local/local-openclaw-connector.json";
const templateRel = "apps/dashboard/data/local/local-openclaw-connector.template.json";
const exampleRel = "apps/dashboard/data/local/local-openclaw-connector.example.json";
const defaultExportRel = "apps/dashboard/data/local/openclaw-local-export.json";
const outputRel = "apps/dashboard/data/generated/local-openclaw-connector-report.json";
const generatedAt = new Date().toISOString();
const allowedPaths = ["/health", "/status", "/agents", "/tasks"];
const blockedActions = [
  "production-gateway-connect",
  "mutation",
  "restart-agent",
  "stop-agent",
  "start-agent",
  "deploy",
  "auth-token-use"
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonRel(relPath) {
  return JSON.parse(await readFile(join(repoRoot, relPath), "utf8"));
}

async function readJsonRelOptional(relPath) {
  try {
    return await readJsonRel(relPath);
  } catch {
    return null;
  }
}

async function loadConnectorModule() {
  const source = await readFile(join(dashboardRoot, "src/lib/local-openclaw/local-openclaw-connector.js"), "utf8");
  const context = { window: {}, URL };
  vm.runInNewContext(source, context, { filename: "local-openclaw-connector.js" });
  return context.window.OpenClawLocalOpenClawConnector;
}

function reportId() {
  return `local-openclaw-connector-${generatedAt.replaceAll(":", "-").replaceAll(".", "-")}`;
}

function makeFinding(category, status, note, confidence = "medium") {
  return { category, status, note, confidence };
}

async function listRepoFiles(dirRel, results = []) {
  const dir = join(repoRoot, dirRel);
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const relPath = `${dirRel}/${entry.name}`.replaceAll("\\", "/").replace(/^\.\//, "");
    if (entry.isDirectory()) await listRepoFiles(relPath, results);
    else if (entry.isFile()) results.push(relPath);
  }
  return results;
}

async function discoverRepoConnectorHints() {
  const roots = ["apps", "docs", "ops"];
  const files = [];
  for (const root of roots) files.push(...await listRepoFiles(root));
  const safeExtensions = /\.(js|mjs|ts|json|md|html|css|ps1)$/i;
  const hints = [];
  for (const relPath of files.filter((file) => safeExtensions.test(file))) {
    if (relPath.includes("/data/generated/") || relPath.includes("/scripts/test-") || relPath.endsWith("/safety-scan-dashboard.mjs")) continue;
    let content = "";
    try {
      content = await readFile(join(repoRoot, relPath), "utf8");
    } catch {
      continue;
    }
    const lower = content.toLowerCase();
    const categories = [];
    if (lower.includes("localhost") || lower.includes("127.0.0.1")) categories.push("localhost-candidate");
    if (lower.includes("/health") || lower.includes("health")) categories.push("health-reference");
    if (lower.includes("/status") || lower.includes("status")) categories.push("status-reference");
    if (lower.includes("openclaw")) categories.push("openclaw-reference");
    if (lower.includes("agent")) categories.push("agent-reference");
    if (!categories.length) continue;
    const endpointCandidates = [];
    if (lower.includes("localhost")) endpointCandidates.push("localhost-only-candidate");
    if (lower.includes("127.0.0.1")) endpointCandidates.push("127.0.0.1-only-candidate");
    hints.push({
      filePath: relPath,
      detectedCategory: categories.slice(0, 4),
      safeEndpointCandidate: endpointCandidates.length ? endpointCandidates.join(",") : "none-detected",
      confidence: categories.includes("localhost-candidate") && (categories.includes("health-reference") || categories.includes("status-reference")) ? "medium" : "low"
    });
  }
  return hints.slice(0, 80);
}

async function safeGetJson(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    if (!response.ok) return { ok: false, status: response.status, statusText: response.statusText };
    const text = await response.text();
    try {
      return { ok: true, status: response.status, json: JSON.parse(text) };
    } catch {
      return { ok: false, status: response.status, statusText: "invalid-json" };
    }
  } catch (error) {
    return { ok: false, status: 0, statusText: error?.name === "AbortError" ? "timeout" : "not-connected" };
  } finally {
    clearTimeout(timeout);
  }
}

function safeUrlLabel(normalizedBaseUrl) {
  if (!normalizedBaseUrl) return "not-configured";
  const url = new URL(normalizedBaseUrl);
  return `${url.hostname === "localhost" ? "localhost" : "127.0.0.1"}:${url.port}`;
}

function buildBaseReport(discoveryFindings, overrides = {}) {
  return {
    reportId: reportId(),
    generatedAt,
    scope: "local-openclaw-readonly-connector",
    language: "zh-Hant",
    connectorEnabled: false,
    connectionStatus: "not-connected",
    readinessStatus: "needs-local-config",
    baseUrlSafeLabel: "not-configured",
    baseUrlRedacted: true,
    rawResponsePrinted: false,
    secretRedactionApplied: true,
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
    agentCount: null,
    taskCount: null,
    agents: [],
    tasks: [],
    discoveryFindings,
    connectionFindings: [],
    safeNextSteps: [],
    blockedActions,
    warnings: [],
    ...overrides
  };
}

const connector = await loadConnectorModule();
const discoveryFindings = await discoverRepoConnectorHints();
const configExists = await exists(join(repoRoot, configRel));
const configSource = configExists ? "local-config" : "template-fallback";
const config = configExists ? await readJsonRel(configRel) : await readJsonRel(templateRel);
const validation = connector.validateLocalOpenClawConnectorConfig(config);

let report;
if (!configExists) {
  report = buildBaseReport(discoveryFindings, {
    configSource,
    connectorEnabled: false,
    connectionStatus: "not-connected",
    readinessStatus: "needs-local-config",
    localConfigPath: configRel,
    templatePath: templateRel,
    examplePath: exampleRel,
    localExportPath: defaultExportRel,
    connectionFindings: [
      makeFinding("local-config", "missing", "local-openclaw-connector.json not found; using safe template fallback.", "high")
    ],
    safeNextSteps: [
      "確認本機 OpenClaw 是否有 read-only /health、/status、/agents、/tasks endpoint。",
      "如不知道 endpoint，先使用本機 export file 方式。",
      "不要在 local-openclaw-connector.json 放 API key、password、token 或 production URL。"
    ],
    warnings: ["本機 OpenClaw 未連接，這不是 Dashboard 壞機。"]
  });
} else if (!validation.valid) {
  const unsafe = validation.issues.some((issue) => issue.includes("unsafe") || issue.includes("secret") || issue.includes("must-be-false") || issue.includes("only-get"));
  report = buildBaseReport(discoveryFindings, {
    configSource,
    connectorEnabled: config.connectorEnabled === true,
    connectionStatus: unsafe ? "unsafe-rejected" : "misconfigured",
    readinessStatus: unsafe ? "unsafe-rejected" : "review-required",
    baseUrlSafeLabel: validation.normalizedBaseUrl ? safeUrlLabel(validation.normalizedBaseUrl) : "not-configured",
    localConfigPath: configRel,
    localExportPath: config.localExportPath || defaultExportRel,
    validationIssues: validation.issues,
    connectionFindings: validation.issues.map((issue) => makeFinding("config-validation", "rejected", issue, "high")),
    safeNextSteps: [
      "檢查 local-openclaw-connector.json，只保留 localhost / 127.0.0.1 或安全本機 export file。",
      "確認只允許 GET。",
      "移除任何 credential、token、password 或 production URL。"
    ],
    warnings: ["本機 OpenClaw connector 設定被安全規則拒絕。"]
  });
} else if (config.connectorEnabled !== true) {
  report = buildBaseReport(discoveryFindings, {
    configSource,
    connectorEnabled: false,
    connectionStatus: "not-connected",
    readinessStatus: "needs-openclaw-running",
    baseUrlSafeLabel: validation.normalizedBaseUrl ? safeUrlLabel(validation.normalizedBaseUrl) : "not-configured",
    localConfigPath: configRel,
    localExportPath: config.localExportPath || defaultExportRel,
    connectionFindings: [
      makeFinding("connector-enabled", "disabled", "connectorEnabled is false; no local HTTP request was made.", "high")
    ],
    safeNextSteps: [
      "如果要讀取本機 OpenClaw，請用 activation assistant 建立本機設定。",
      "可選 localhost read-only endpoint 或本機 export file。",
      "仍然只允許 GET，不需要 credential。"
    ],
    warnings: ["本機 OpenClaw connector 尚未啟用。"]
  });
} else {
  const baseUrl = validation.normalizedBaseUrl;
  const configuredExportRel = String(config.localExportPath || defaultExportRel).replaceAll("\\", "/").replace(/^\.\//, "");
  const exportPayload = validation.localExportPathValid ? await readJsonRelOptional(configuredExportRel) : null;
  if (exportPayload) {
    const agents = connector.mapLocalOpenClawAgents(exportPayload);
    const tasks = connector.mapLocalOpenClawTasks(exportPayload);
    report = buildBaseReport(discoveryFindings, {
      configSource,
      connectorEnabled: true,
      connectionStatus: "connected",
      readinessStatus: "ready-readonly-local",
      setupMode: config.setupMode || "local-export-file",
      baseUrlSafeLabel: baseUrl ? safeUrlLabel(baseUrl) : "not-configured",
      localConfigPath: configRel,
      localExportPath: configuredExportRel,
      healthConnectionStatus: "local-export-file",
      agentCount: agents.length,
      taskCount: tasks.length,
      agents,
      tasks,
      connectionFindings: [
        makeFinding("local-export-file", "available", "repo-relative local OpenClaw export file loaded safely.", "high")
      ],
      safeNextSteps: [
        "檢查本機 OpenClaw export file 是否由 operator 本機產生。",
        "Dashboard 只讀取 export file，不會修改、重啟或部署。"
      ]
    });
  } else {
    const endpointResults = {};
    for (const path of allowedPaths) endpointResults[path] = await safeGetJson(`${baseUrl}${path}`);
    const healthLike = endpointResults["/health"].ok ? endpointResults["/health"].json : endpointResults["/status"].json;
    const agentsPayload = endpointResults["/agents"].ok ? endpointResults["/agents"].json : healthLike;
    const tasksPayload = endpointResults["/tasks"].ok ? endpointResults["/tasks"].json : healthLike;
    const agents = connector.mapLocalOpenClawAgents(agentsPayload);
    const tasks = connector.mapLocalOpenClawTasks(tasksPayload);
    const connected = Object.values(endpointResults).some((result) => result.ok);
    report = buildBaseReport(discoveryFindings, {
      configSource,
      connectorEnabled: true,
      connectionStatus: connected ? "connected" : "not-connected",
      readinessStatus: connected ? "ready-readonly-local" : "needs-openclaw-running",
      setupMode: config.setupMode || "localhost-http",
      baseUrlSafeLabel: safeUrlLabel(baseUrl),
      localConfigPath: configRel,
      localExportPath: configuredExportRel,
      endpointResults: Object.fromEntries(Object.entries(endpointResults).map(([path, result]) => [path, { ok: result.ok, status: result.status, statusText: result.statusText || "ok" }])),
      agentCount: agents.length,
      taskCount: tasks.length,
      agents,
      tasks,
      connectionFindings: Object.entries(endpointResults).map(([path, result]) => makeFinding("localhost-endpoint", result.ok ? "available" : "not-connected", `${path} ${result.ok ? "responded with safe JSON" : result.statusText}`, result.ok ? "high" : "medium")),
      safeNextSteps: connected
        ? ["檢查本機 OpenClaw Agent / 任務狀態。", "保持唯讀，不要在 Dashboard restart、mutation 或 deploy。"]
        : ["請確認本機 OpenClaw 是否已啟動。", "如不知道 endpoint，改用本機 export file 方式。"],
      warnings: connected ? [] : ["本機 OpenClaw 未連接，這不是 Dashboard 壞機。"]
    });
  }
}

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw local connector report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
