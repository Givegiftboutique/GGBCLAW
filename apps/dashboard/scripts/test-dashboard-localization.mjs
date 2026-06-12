import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const failures = [];

async function read(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const i18n = await read("apps/dashboard/src/lib/i18n/i18n.js");
const zh = await read("apps/dashboard/src/lib/i18n/zh-hant.js");
const app = await read("apps/dashboard/src/app.js");
const html = await read("apps/dashboard/index.html");
const mockData = await read("apps/dashboard/src/lib/mock-data.js");
const sourceStatus = await read("apps/dashboard/src/lib/adapters/source-status.js");
const dashboardSchema = await read("apps/dashboard/schema/dashboard-export.schema.json");
const readme = await read("apps/dashboard/README.md");
const docsIndex = await read("docs/dashboard/README.md");
const combinedUi = `${zh}\n${app}\n${html}`;
const combinedTechnical = `${app}\n${mockData}\n${sourceStatus}\n${dashboardSchema}\n${i18n}\n${zh}`;
const combinedDocs = `${readme}\n${docsIndex}`;

for (const marker of ["儀表板", "總覽", "Agent 狀態", "今日任務", "安全審查", "日誌", "備份", "設定", "權限", "操作手冊", "觀測", "資料來源"]) {
  check(combinedUi.includes(marker), `Missing Traditional Chinese UI marker: ${marker}`);
}

for (const marker of ["安全模式", "唯讀", "寫入操作啟用", "Production wiring", "Production 暫不可上線", "read-only", "mutationEnabled", "disabled", "no-go-for-production"]) {
  check(`${combinedUi}\n${combinedDocs}`.includes(marker), `Missing safety localization marker: ${marker}`);
}

for (const marker of ["Operator 操作手冊", "身份可查看範圍", "安全操作草稿", "Production 就緒狀態摘要", "警示預覽清單", "真實本地資料試行"]) {
  check(combinedUi.includes(marker), `Missing page localization marker: ${marker}`);
}

for (const marker of ["Internal Operator Beta", "內部 Operator Beta", "快速開始", "Production: no-go"]) {
  check(combinedDocs.includes(marker), `Missing docs localization marker: ${marker}`);
}

for (const route of ["/dashboard", "/dashboard/agents", "/dashboard/tasks", "/dashboard/reviews", "/dashboard/logs", "/dashboard/backups", "/dashboard/settings", "/dashboard/rbac", "/dashboard/help", "/dashboard/observability"]) {
  check(app.includes(route), `Route value changed or missing: ${route}`);
}

for (const source of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  check(app.includes(source) || readme.includes(source), `Source mode changed or missing: ${source}`);
}

for (const key of ["getMetrics", "getAgents", "getTasks", "schemaVersion", "sourceStatus", "mutationEnabled", "productionWiring"]) {
  check(combinedTechnical.includes(key), `Technical key missing: ${key}`);
}

const forbiddenPatterns = [
  /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i,
  /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i,
  /\b(approveReview|rejectReview|restoreBackup|updateSettings|runBackup)\s*\(/i
];
for (const [name, body] of [["app.js", app], ["i18n.js", i18n], ["zh-hant.js", zh]]) {
  for (const pattern of forbiddenPatterns) {
    check(!pattern.test(body), `${name} contains forbidden pattern: ${pattern}`);
  }
}

check(html.includes("zh-Hant"), "index.html must use zh-Hant language marker.");
check(html.includes("src/lib/i18n/zh-hant.js") && html.includes("src/lib/i18n/i18n.js"), "index.html must load i18n files.");

if (failures.length) {
  console.error("OpenClaw dashboard Traditional Chinese localization tests failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("OpenClaw dashboard Traditional Chinese localization tests passed.");
