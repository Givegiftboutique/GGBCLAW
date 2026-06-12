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
    if (entry.isDirectory()) {
      await listRepoFiles(relPath, results);
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }
  return results;
}

async function discoverRepoConnectorHints() {
  const roots = ["apps", "docs", "ops"];
  const files = [];
  for (const root of roots) {
    files.push(...await listRepoFiles(root));
  }
  const safeExtensions = /\.(js|mjs|ts|json|md|html|css|ps1)$/i;
  const hints = [];
  for (const relPath of files.filter((file) => safeExtensions.test(file))) {
    if (relPath.includes("/data/generated/") || relPath.includes("/scripts/test-") || relPath.endsWith("/safety-scan-dashboard.mjs")) {
      continue;
    }
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
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, status: response.status, statusText: response.statusText };
    }
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

function buildBaseReport(overrides = {}) {
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
  report = buildBaseReport({
    configSource,
    connectorEnabled: false,
    connectionStatus: "not-connected",
    readinessStatus: "needs-local-config",
    localConfigPath: configRel,
    templatePath: templateRel,
    examplePath: exampleRel,
    connectionFindings: [
      makeFinding("local-config", "missing", "local-openclaw-connector.json not found; using safe template fallback.", "high")
    ],
    safeNextSteps: [
      "確認本機 OpenClaw 是否有 read-only /health、/status、/agents、/tasks endpoint。",
      "複製 local-openclaw-connector.template.json 為 local-openclaw-connector.json，並只填 localhost / 127.0.0.1。",
      "不要在 local-openclaw-connector.json 放 API key、password、token 或 production URL。"
    ],
    warnings: ["本機 OpenClaw 未連接；這不是 Dashboard 壞機。"]
  });
} else if (!validation.valid) {
  const unsafe = validation.issues.some((issue) => issue.includes("unsafe") || issue.includes("secret") || issue.includes("must-be-false") || issue.includes("only-get"));
  report = buildBaseReport({
    configSource,
    connectorEnabled: config.connectorEnabled === true,
    connectionStatus: unsafe ? "unsafe-rejected" : "misconfigured",
    readinessStatus: unsafe ? "unsafe-rejected" : "review-required",
    baseUrlSafeLabel: validation.normalizedBaseUrl ? safeUrlLabel(validation.normalizedBaseUrl) : "not-configured",
    localConfigPath: configRel,
    validationIssues: validation.issues,
    connectionFindings: validation.issues.map((issue) => makeFinding("config-validation", "rejected", issue, "high")),
    safeNextSteps: [
      "檢查 local-openclaw-connector.json，只保留 localhost / 127.0.0.1。",
      "確認只允許 GET。",
      "移除任何 credential / token / password / production URL。"
    ],
    warnings: ["本機 OpenClaw connector 設定未通過安全檢查。"]
  });
} else if (config.connectorEnabled !== true) {
  report = buildBaseReport({
    configSource,
    connectorEnabled: false,
    connectionStatus: "not-connected",
    readinessStatus: "needs-openclaw-running",
    baseUrlSafeLabel: safeUrlLabel(validation.normalizedBaseUrl),
    localConfigPath: configRel,
    connectionFindings: [
      makeFinding("connector-enabled", "disabled", "connectorEnabled is false; no local HTTP request was made.", "high")
    ],
    safeNextSteps: [
      "如要讀取本機 OpenClaw，先確認 OpenClaw 本機 read-only endpoint 已啟動。",
      "只在 local-openclaw-connector.json 把 connectorEnabled 改為 true。",
      "仍然只允許 GET，且不需要 credential。"
    ],
    warnings: ["本機 OpenClaw connector 目前關閉。"]
  });
} else {
  const baseUrl = validation.normalizedBaseUrl;
  const endpointResults = {};
  for (const path of allowedPaths) {
    endpointResults[path] = await safeGetJson(`${baseUrl}${path}`);
  }
  const healthLike = endpointResults["/health"].ok ? endpointResults["/health"].json : endpointResults["/status"].json;
  const agentsPayload = endpointResults["/agents"].ok ? endpointResults["/agents"].json : healthLike;
  const tasksPayload = endpointResults["/tasks"].ok ? endpointResults["/tasks"].json : healthLike;
  const agents = connector.mapLocalOpenClawAgents(agentsPayload);
  const tasks = connector.mapLocalOpenClawTasks(tasksPayload);
  const connected = Object.values(endpointResults).some((result) => result.ok);
  const connectionStatus = connected ? "connected" : "not-connected";
  report = buildBaseReport({
    configSource,
    connectorEnabled: true,
    connectionStatus,
    readinessStatus: connected ? "ready-readonly-local" : "needs-openclaw-running",
    baseUrlSafeLabel: safeUrlLabel(baseUrl),
    localConfigPath: configRel,
    endpointResults: Object.fromEntries(Object.entries(endpointResults).map(([path, result]) => [path, { ok: result.ok, status: result.status, statusText: result.statusText || "ok" }])),
    agentCount: agents.length,
    taskCount: tasks.length,
    agents,
    tasks,
    connectionFindings: Object.entries(endpointResults).map(([path, result]) => makeFinding("localhost-endpoint", result.ok ? "available" : "not-connected", `${path} ${result.ok ? "responded with safe JSON" : result.statusText}`, result.ok ? "high" : "medium")),
    safeNextSteps: connected
      ? ["檢查本機 OpenClaw Agent / 任務狀態。", "保持只讀，不要在 Dashboard restart、mutation 或 deploy。"]
      : ["確認本機 OpenClaw 是否啟動。", "確認 read-only endpoint 是否提供 /health、/status、/agents、/tasks。"],
    warnings: connected ? [] : ["本機 OpenClaw 未連接；這不是 Dashboard 壞機。"]
  });
}

const outputPath = join(repoRoot, outputRel);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log("OpenClaw local connector report generated.");
console.log(`Report: ${relative(repoRoot, outputPath).replaceAll("\\", "/")}`);
