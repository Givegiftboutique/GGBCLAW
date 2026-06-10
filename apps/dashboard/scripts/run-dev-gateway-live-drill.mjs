import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createDevGatewayFixtureServer } from "./start-dev-gateway-fixture-server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "dev-gateway-live-drill-report.json");
const allowedUrls = ["http://localhost:8787", "http://127.0.0.1:8787"];
const blockedUrls = ["https://production.example.com", "https://api.example.com", "https://live.example.com", "http://example.com"];
const readOnlyEndpoints = [
  "/health",
  "/dashboard/metrics",
  "/dashboard/agents",
  "/dashboard/agents/agent-orchestrator",
  "/dashboard/tasks",
  "/dashboard/tasks/TASK-20260609-OC-DASH-001",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/source-status"
];
const blockedMethods = ["POST", "PUT", "PATCH", "DELETE"];

function pass(name, extra = {}) {
  return { name, result: "pass", ...extra };
}

function fail(name, reason, extra = {}) {
  return { name, result: "fail", reason, ...extra };
}

async function loadConfigContext() {
  const context = vm.createContext({ window: {}, URL, console });
  vm.runInContext(await readFile(join(dashboardRoot, "src/lib/adapters/dev-gateway-config.js"), "utf8"), context, { filename: "dev-gateway-config.js" });
  return context.window.OpenClawDevGatewayConfig;
}

async function safeGetJson(url, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal
    });
    return { ok: response.ok, status: response.status, body: await response.json() };
  } finally {
    clearTimeout(timer);
  }
}

async function startOrReuseFixtureServer() {
  try {
    return await createDevGatewayFixtureServer({ host: "127.0.0.1", port: 8787 });
  } catch (error) {
    if (error.code !== "EADDRINUSE") throw error;
    const health = await safeGetJson("http://127.0.0.1:8787/health", 1000);
    if (!health.ok || health.body?.fixtureServer !== true || health.body?.mutationEnabled !== false) {
      throw new Error("Port 8787 is busy and does not expose the OpenClaw read-only fixture server.");
    }
    return {
      server: null,
      host: "127.0.0.1",
      port: 8787,
      url: "http://127.0.0.1:8787",
      reusedExistingServer: true,
      close: async () => {}
    };
  }
}

async function checkFallbackUnavailable() {
  try {
    await safeGetJson("http://127.0.0.1:9/health", 300);
    return fail("unavailable gateway fallback", "unexpected response from unavailable localhost port");
  } catch (error) {
    return pass("unavailable gateway fallback", {
      fallbackChain: ["gateway-stub", "generated snapshot", "mock"],
      reason: error.name === "AbortError" ? "timeout" : "connection unavailable"
    });
  }
}

const checks = [];
let serverHandle;
try {
  const configApi = await loadConfigContext();
  serverHandle = await startOrReuseFixtureServer();

  const allowedUrlChecks = [];
  for (const url of allowedUrls) {
    const validation = configApi.validateDevGatewayBaseUrl(url);
    if (!validation.ok) {
      allowedUrlChecks.push(fail(url, validation.reason));
      continue;
    }
    try {
      const response = await safeGetJson(`${url}/health`);
      allowedUrlChecks.push(response.ok && response.body?.mutationEnabled === false && response.body?.productionWiring === "disabled"
        ? pass(url, { status: response.status, baseUrlState: "allowed" })
        : fail(url, "health response missing read-only safety markers", { status: response.status }));
    } catch (error) {
      allowedUrlChecks.push(fail(url, error.message));
    }
  }

  const blockedUrlChecks = blockedUrls.map((url) => {
    const validation = configApi.validateDevGatewayBaseUrl(url);
    return validation.ok ? fail(url, "production-like URL unexpectedly allowed") : pass(url, { reason: validation.reason, fallbackChain: ["gateway-stub", "generated snapshot", "mock"] });
  });

  const endpointChecks = [];
  for (const endpoint of readOnlyEndpoints) {
    try {
      const response = await safeGetJson(`${serverHandle.url}${endpoint}`);
      const body = response.body ?? {};
      const readOnly = body.safetyMode === "read-only" && body.mutationEnabled === false && body.productionWiring === "disabled" && body.fixtureServer === true;
      endpointChecks.push(response.ok && readOnly ? pass(endpoint, { status: response.status }) : fail(endpoint, "GET response missing fixture safety markers", { status: response.status }));
    } catch (error) {
      endpointChecks.push(fail(endpoint, error.message));
    }
  }

  const mutationMethodChecks = [];
  for (const method of blockedMethods) {
    try {
      const response = await fetch(`${serverHandle.url}/dashboard/metrics`, {
        method,
        credentials: "omit",
        cache: "no-store"
      });
      const body = await response.json();
      mutationMethodChecks.push(response.status === 405 && body?.mutationEnabled === false
        ? pass(`${method} blocked`, { status: response.status })
        : fail(`${method} blocked`, "method did not return expected 405 read-only response", { status: response.status }));
    } catch (error) {
      mutationMethodChecks.push(fail(`${method} blocked`, error.message));
    }
  }

  const fallbackChecks = [await checkFallbackUnavailable()];
  const clientBody = await readFile(join(dashboardRoot, "src/lib/adapters/dev-gateway-client.js"), "utf8");
  const credentialCheck = clientBody.includes('credentials: "omit"') ? pass("credentials omit marker") : fail("credentials omit marker", "dev gateway client missing credentials omit");
  const authorizationCheck = /Authorization/i.test(clientBody) ? fail("no auth header marker", "dev gateway client mentions auth header") : pass("no auth header marker");

  checks.push(...allowedUrlChecks, ...blockedUrlChecks, ...endpointChecks, ...mutationMethodChecks, ...fallbackChecks, credentialCheck, authorizationCheck);

  const report = {
    reportId: `dev-gateway-live-drill-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    generatedAt: new Date().toISOString(),
    scope: "localhost-read-only-drill",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    credentialsMode: "omit",
    authorizationHeaderUsed: false,
    fixtureServer: {
      host: "127.0.0.1",
      port: 8787,
      url: "http://127.0.0.1:8787",
      reusedExistingServer: serverHandle.reusedExistingServer === true
    },
    allowedUrlChecks,
    blockedUrlChecks,
    endpointChecks,
    fallbackChecks,
    mutationMethodChecks,
    summary: {
      passed: checks.filter((check) => check.result === "pass").length,
      failed: checks.filter((check) => check.result === "fail").length,
      warnings: 0
    }
  };

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (report.summary.failed > 0) {
    console.error(`OpenClaw dev gateway read-only live drill failed. Report: ${relative(repoRoot, reportPath)}`);
    for (const check of checks.filter((item) => item.result === "fail")) {
      console.error(`- ${check.name}: ${check.reason}`);
    }
    process.exitCode = 1;
  } else {
    console.log("OpenClaw dev gateway read-only live drill passed.");
    console.log(`Report: ${relative(repoRoot, reportPath)}`);
  }
} finally {
  if (serverHandle) await serverHandle.close();
}
