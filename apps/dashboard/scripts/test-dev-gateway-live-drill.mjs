import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const failures = [];

async function read(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const serverScript = await read("apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs");
const drillScript = await read("apps/dashboard/scripts/run-dev-gateway-live-drill.mjs");
const clientScript = await read("apps/dashboard/src/lib/adapters/dev-gateway-client.js");
const report = JSON.parse(await read("apps/dashboard/data/generated/dev-gateway-live-drill-report.json"));

check(serverScript.includes("node:http"), "fixture server must use Node built-in http.");
check(serverScript.includes("127.0.0.1"), "fixture server must bind localhost loopback only.");
check(serverScript.includes("mutationEnabled: false"), "fixture server must include mutationEnabled false marker.");
check(drillScript.includes("localhost-read-only-drill"), "live drill script must mark localhost-read-only-drill scope.");
check(report.scope === "localhost-read-only-drill", "report scope must be localhost-read-only-drill.");
check(report.safetyMode === "read-only", "report safetyMode must be read-only.");
check(report.mutationEnabled === false, "report mutationEnabled must be false.");
check(report.productionWiring === "disabled", "report productionWiring must be disabled.");
check(report.credentialsMode === "omit", "report credentialsMode must be omit.");
check(report.authorizationHeaderUsed === false, "report must say authorizationHeaderUsed false.");
check(report.summary?.failed === 0, "live drill report must have zero failed checks.");
check((report.allowedUrlChecks ?? []).every((item) => item.result === "pass"), "allowed localhost URLs must pass.");
check((report.blockedUrlChecks ?? []).every((item) => item.result === "pass"), "blocked production-like URLs must pass.");
check((report.endpointChecks ?? []).length >= 12 && report.endpointChecks.every((item) => item.result === "pass"), "all endpoint GET checks must pass.");
check((report.mutationMethodChecks ?? []).every((item) => item.result === "pass"), "mutation methods must be blocked.");
check((report.fallbackChecks ?? []).length > 0 && report.fallbackChecks.every((item) => item.result === "pass"), "fallback checks must pass.");
check(clientScript.includes('credentials: "omit"'), "dev gateway client must use credentials omit.");
check(!/Authorization/i.test(clientScript), "dev gateway client must not mention auth header.");
check(!/localStorage|sessionStorage|document\.cookie/.test(clientScript), "dev gateway client must not use token or cookie storage.");
check(!/\b(method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["'])\b/.test(clientScript), "dev gateway client must not include mutation method path.");

const reportText = JSON.stringify(report);
check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(reportText), "report must not contain secret-like values.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(reportText), "report must not contain unexpected external URLs.");

if (failures.length) {
  console.error("OpenClaw dev gateway live drill tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw dev gateway live drill tests passed.");
