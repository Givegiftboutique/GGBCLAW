(function () {
const REQUEST_TIMEOUT_MS = 3500;
const ENDPOINTS = {
  metrics: "/dashboard/metrics",
  agents: "/dashboard/agents",
  agentDetail: "/dashboard/agents/:id",
  tasks: "/dashboard/tasks",
  taskDetail: "/dashboard/tasks/:id",
  reviews: "/dashboard/reviews",
  logs: "/dashboard/logs",
  backups: "/dashboard/backups",
  settings: "/dashboard/settings",
  rbac: "/dashboard/rbac",
  sourceStatus: "/dashboard/source-status"
};

function endpointPath(endpoint, id) {
  return id ? endpoint.replace(":id", encodeURIComponent(id)) : endpoint;
}

async function readOnlyGetJson(baseUrl, endpoint, id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}${endpointPath(endpoint, id)}`, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Dev gateway read-only GET failed: ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function readDevGatewayFixtures(baseUrl) {
  return {
    metrics: await readOnlyGetJson(baseUrl, ENDPOINTS.metrics),
    agents: await readOnlyGetJson(baseUrl, ENDPOINTS.agents),
    agentDetail: await readOnlyGetJson(baseUrl, ENDPOINTS.agentDetail, "agent-orchestrator"),
    tasks: await readOnlyGetJson(baseUrl, ENDPOINTS.tasks),
    taskDetail: await readOnlyGetJson(baseUrl, ENDPOINTS.taskDetail, "TASK-20260609-OC-DASH-001"),
    reviews: await readOnlyGetJson(baseUrl, ENDPOINTS.reviews),
    logs: await readOnlyGetJson(baseUrl, ENDPOINTS.logs),
    backups: await readOnlyGetJson(baseUrl, ENDPOINTS.backups),
    settings: await readOnlyGetJson(baseUrl, ENDPOINTS.settings),
    rbac: await readOnlyGetJson(baseUrl, ENDPOINTS.rbac),
    sourceStatus: await readOnlyGetJson(baseUrl, ENDPOINTS.sourceStatus)
  };
}

window.OpenClawDevGatewayClient = {
  REQUEST_TIMEOUT_MS,
  ENDPOINTS,
  readOnlyGetJson,
  readDevGatewayFixtures
};
})();
