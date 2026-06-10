import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const gatewayStubRoot = join(dashboardRoot, "data", "gateway-stub");
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;
const ALLOWED_BIND_HOSTS = new Set(["127.0.0.1"]);

const endpointFiles = new Map([
  ["/dashboard/metrics", "metrics.json"],
  ["/dashboard/agents", "agents.json"],
  ["/dashboard/agents/agent-orchestrator", "agent-detail.json"],
  ["/dashboard/tasks", "tasks.json"],
  ["/dashboard/tasks/TASK-20260609-OC-DASH-001", "task-detail.json"],
  ["/dashboard/reviews", "reviews.json"],
  ["/dashboard/logs", "logs.json"],
  ["/dashboard/backups", "backups.json"],
  ["/dashboard/settings", "settings.json"],
  ["/dashboard/rbac", "rbac.json"],
  ["/dashboard/source-status", "source-status.json"]
]);

function parseArgs(argv) {
  const options = { host: DEFAULT_HOST, port: DEFAULT_PORT };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--host") options.host = argv[index + 1] || "";
    if (arg === "--port") options.port = Number(argv[index + 1] || DEFAULT_PORT);
  }
  return options;
}

function assertSafeBind({ host, port }) {
  if (!ALLOWED_BIND_HOSTS.has(host)) {
    throw new Error(`Unsafe fixture server host blocked: ${host || "missing"}`);
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid fixture server port: ${port}`);
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "http://localhost:5173",
    "access-control-allow-methods": "GET",
    "access-control-allow-headers": "content-type",
    "x-openclaw-safety-mode": "read-only",
    "x-openclaw-mutation-enabled": "false",
    "x-openclaw-production-wiring": "disabled",
    "x-openclaw-fixture-server": "true"
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function withFixtureSafety(payload) {
  return {
    ...payload,
    fixtureServer: true,
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled"
  };
}

async function loadFixture(fileName) {
  const payload = JSON.parse(await readFile(join(gatewayStubRoot, fileName), "utf8"));
  payload.meta = {
    ...payload.meta,
    source: "dev-gateway-fixture-server",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    fixtureServer: true
  };
  if (payload.data?.sourceStatus) {
    payload.data.sourceStatus = {
      ...payload.data.sourceStatus,
      dataUrl: "http://localhost:8787",
      safetyMode: "read-only",
      mutationEnabled: false,
      productionWiring: "disabled",
      fixtureServer: true
    };
  }
  return withFixtureSafety(payload);
}

export async function createDevGatewayFixtureServer(options = {}) {
  const config = {
    host: options.host || DEFAULT_HOST,
    port: Number(options.port || DEFAULT_PORT)
  };
  assertSafeBind(config);

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${config.host}:${config.port}`);
    if (request.method !== "GET") {
      sendJson(response, 405, withFixtureSafety({
        error: "Mutation methods are blocked on the OpenClaw dev gateway fixture server.",
        method: request.method,
        allowedMethods: ["GET"]
      }));
      return;
    }

    if (requestUrl.pathname === "/health") {
      sendJson(response, 200, withFixtureSafety({
        status: "ok",
        scope: "localhost-read-only-drill"
      }));
      return;
    }

    const fileName = endpointFiles.get(requestUrl.pathname);
    if (!fileName) {
      sendJson(response, 404, withFixtureSafety({
        error: "Unknown read-only fixture endpoint.",
        path: requestUrl.pathname
      }));
      return;
    }

    try {
      sendJson(response, 200, await loadFixture(fileName));
    } catch (error) {
      sendJson(response, 500, withFixtureSafety({
        error: "Fixture load failed.",
        reason: error.message
      }));
    }
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(config.port, config.host, () => {
      server.off("error", rejectPromise);
      resolvePromise();
    });
  });

  return {
    server,
    host: config.host,
    port: config.port,
    url: `http://${config.host}:${config.port}`,
    close: () => new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => error ? rejectPromise(error) : resolvePromise());
    })
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  try {
    const server = await createDevGatewayFixtureServer(options);
    console.log(`OpenClaw dev gateway fixture server listening on http://${server.host}:${server.port}`);
  } catch (error) {
    console.error(`OpenClaw dev gateway fixture server failed: ${error.message}`);
    process.exit(1);
  }
}
