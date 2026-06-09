(function () {
const ALLOWED_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "dev.local", "openclaw-dev.local"]);
const BLOCKED_BASE_URL_RE = /(prod|production|live|real|secret|token)/i;
const READ_ONLY_ENDPOINTS = [
  "/dashboard/metrics",
  "/dashboard/agents",
  "/dashboard/agents/:id",
  "/dashboard/tasks",
  "/dashboard/tasks/:id",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/source-status"
];

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateDevGatewayBaseUrl(baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    return { ok: false, normalizedBaseUrl: "", reason: "missing baseUrl" };
  }
  if (BLOCKED_BASE_URL_RE.test(normalized)) {
    return { ok: false, normalizedBaseUrl: normalized, reason: "blocked unsafe dev gateway URL keyword" };
  }
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, normalizedBaseUrl: normalized, reason: "invalid URL" };
  }
  if (parsed.protocol !== "http:") {
    return { ok: false, normalizedBaseUrl: normalized, reason: "dev gateway must use http local URL" };
  }
  if (!ALLOWED_DEV_HOSTS.has(parsed.hostname)) {
    return { ok: false, normalizedBaseUrl: normalized, reason: `host not allowed: ${parsed.hostname}` };
  }
  if (!parsed.port) {
    return { ok: false, normalizedBaseUrl: normalized, reason: "dev gateway port is required" };
  }
  return { ok: true, normalizedBaseUrl: normalized, reason: "allowed dev gateway URL" };
}

function parseDevGatewayConfig(params) {
  const baseUrl = params.get("baseUrl") || "";
  const result = validateDevGatewayBaseUrl(baseUrl);
  return {
    baseUrl,
    normalizedBaseUrl: result.normalizedBaseUrl,
    devGatewayEnabled: result.ok,
    devGatewayReason: result.reason,
    allowedHosts: Array.from(ALLOWED_DEV_HOSTS)
  };
}

window.OpenClawDevGatewayConfig = {
  ALLOWED_DEV_HOSTS: Array.from(ALLOWED_DEV_HOSTS),
  READ_ONLY_ENDPOINTS,
  validateDevGatewayBaseUrl,
  parseDevGatewayConfig
};
})();
