import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const context = vm.createContext({ window: {}, URL, console });
vm.runInContext(await readFile(join(dashboardRoot, "src/lib/adapters/dev-gateway-config.js"), "utf8"), context, { filename: "dev-gateway-config.js" });

const issues = [];
const allowed = ["http://localhost:8787", "http://127.0.0.1:8787", "http://0.0.0.0:8787", "http://dev.local:8787", "http://openclaw-dev.local:8787"];
const blocked = ["https://production.example.com", "https://api.example.com", "http://prod.local:8787", "http://live.local:8787", "http://example.com:8787", "http://secret.local:8787", "http://token.local:8787"];

for (const url of allowed) {
  const result = context.window.OpenClawDevGatewayConfig.validateDevGatewayBaseUrl(url);
  if (!result.ok) issues.push(`Expected allowed dev gateway URL: ${url} (${result.reason})`);
}

for (const url of blocked) {
  const result = context.window.OpenClawDevGatewayConfig.validateDevGatewayBaseUrl(url);
  if (result.ok) issues.push(`Expected blocked dev gateway URL: ${url}`);
}

const clientBody = await readFile(join(dashboardRoot, "src/lib/adapters/dev-gateway-client.js"), "utf8");
const adapterBody = await readFile(join(dashboardRoot, "src/lib/adapters/dev-gateway-adapter.js"), "utf8");
if (!clientBody.includes('credentials: "omit"')) issues.push("Dev gateway client must use credentials omit.");
if (/Authorization/i.test(clientBody)) issues.push("Dev gateway client must not mention Authorization headers.");
if (/localStorage|sessionStorage|document\.cookie/.test(clientBody + adapterBody)) issues.push("Dev gateway source must not use browser token or cookie storage.");
if (/\b(POST|PUT|PATCH|DELETE)\b/.test(clientBody)) issues.push("Dev gateway client must not include mutation HTTP methods.");
if (/approveReview|rejectReview|runBackup|restoreBackup|updateSettings|deleteTask|cancelTask|mutateGateway/.test(clientBody + adapterBody)) {
  issues.push("Dev gateway adapter must not expose mutation methods.");
}

if (issues.length) {
  console.error("OpenClaw dev gateway config tests failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw dev gateway config tests passed.");
