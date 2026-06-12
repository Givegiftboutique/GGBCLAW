import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

async function read(rel) {
  return readFile(join(repoRoot, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stripTechnicalDetails(source) {
  return source
    .replace(/renderTechnicalDetails\([\s\S]*?\]\)\}/g, "renderTechnicalDetails(...)")
    .replace(/renderTechnicalDetails\([\s\S]*?\]\)/g, "renderTechnicalDetails(...)");
}

const app = await read("apps/dashboard/src/app.js");
const i18n = await read("apps/dashboard/src/lib/i18n/zh-hant.js");
const copy = await read("apps/dashboard/src/lib/operator-ux/operator-copy.js");
const safety = await read("apps/dashboard/scripts/safety-scan-dashboard.mjs");
const verifier = await read("apps/dashboard/verify-dashboard.mjs");
const mainUi = stripTechnicalDetails(app);

assert(copy.includes("formatOperatorLabel") && copy.includes("formatOperatorValue"), "operator copy module must expose formatter helpers.");
assert(app.includes("Agent 狀態"), "UI must include Agent 狀態.");
assert(app.includes("今日任務"), "UI must include 今日任務.");
assert(app.includes("安全審查"), "UI must include 安全審查.");
assert(app.includes("用量與餘額"), "UI must include 用量與餘額.");
assert(app.includes("每 1 小時自動刷新"), "UI must include hourly refresh wording.");
assert(app.includes("Production 安全鎖"), "UI must include Production safety lock.");
assert(app.includes("技術詳情"), "UI must include technical details blocks.");
assert(i18n.includes("Agent 狀態") && i18n.includes("今日任務") && i18n.includes("安全審查"), "i18n must include Chinese-first route strings.");

assert(!mainUi.includes("Agents / 代理程式"), "main UI must not use Agents / 代理程式 title.");
assert(!mainUi.includes("<th>Workflow</th>"), "tasks table must not expose Workflow header.");
assert(!mainUi.includes("<th>Owner</th>"), "tasks table must not expose Owner header.");
assert(!mainUi.includes("<th>Reviewer</th>"), "tasks table must not expose Reviewer header.");
assert(!mainUi.includes("Allowed permissions"), "reviews page must not expose Allowed permissions as main heading.");
assert(!mainUi.includes("memory-only; no local" + "Storage"), "reviews page must not expose raw storage text as main visible text.");

for (const rawKey of [
  "<dt>productionAdapterEnabled</dt>",
  "<dt>productionAdapterConnected</dt>",
  "<dt>mutationEnabled</dt>",
  "<dt>requiresHumanApproval</dt>",
  "<dt>notSubmitted</dt>"
]) {
  assert(!mainUi.includes(rawKey), `main UI must not expose raw key ${rawKey}.`);
}

assert(app.includes("Production 未開放") || app.includes("Production 狀態"), "production guardrails must remain visible in Chinese.");
assert(!/"productionReady"\s*:\s*true/i.test(app), "productionReady must not be enabled.");
assert(!/"adapterEnabled"\s*:\s*true/i.test(app), "adapterEnabled must not be enabled.");
assert(!/"connected"\s*:\s*true/i.test(app), "connected must not be enabled.");
assert(!/"endpointConfigured"\s*:\s*true/i.test(app), "endpointConfigured must not be enabled.");
assert(!/"authEnabled"\s*:\s*true/i.test(app), "authEnabled must not be enabled.");
const sensitiveWords = ["api[_-]?" + "key", "author" + "ization", "bear" + "er", "pass" + "word", "cred" + "ential", "sec" + "ret"];
const sensitiveValuePattern = new RegExp(`(${sensitiveWords.join("|")})\\s*[:=]\\s*["'][^"']{8,}`, "i");
assert(!sensitiveValuePattern.test(app + i18n + copy), "UI copy must not include sensitive-looking values.");
assert(safety.includes("test-chinese-operator-ux-copy.mjs"), "safety scan must reference Chinese operator UX copy test.");
assert(verifier.includes("Agent 狀態") && verifier.includes("技術詳情"), "verifier must check Chinese-first UX markers.");

console.log("OpenClaw Chinese operator UX copy tests passed.");
