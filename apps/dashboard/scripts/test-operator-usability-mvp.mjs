import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const repoRoot = resolve(dashboardRoot, "../..");

const requiredFiles = [
  "apps/dashboard/src/lib/operator-usability/operator-usability.js",
  "apps/dashboard/src/lib/operator-usability/operator-usability.ts",
  "apps/dashboard/scripts/start-operator-dashboard.ps1",
  "apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs",
  "apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs",
  "apps/dashboard/scripts/test-operator-usability-mvp.mjs",
  "docs/dashboard/openclaw-dashboard-operator-usability-mvp.md"
];

const sourceModes = ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"];
const routeValues = [
  "#/dashboard",
  "#/dashboard/agents",
  "#/dashboard/tasks",
  "#/dashboard/reviews",
  "#/dashboard/logs",
  "#/dashboard/backups",
  "#/dashboard/settings",
  "#/dashboard/rbac",
  "#/dashboard/help",
  "#/dashboard/observability"
];

async function exists(path) {
  try {
    await access(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

async function readRepo(path) {
  return readFile(join(repoRoot, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runNode(script) {
  const result = spawnSync(process.execPath, [join(repoRoot, script)], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert(result.status === 0, `${script} failed: ${result.stderr || result.stdout}`);
}

for (const file of requiredFiles) {
  assert(await exists(file), `${file} must exist`);
}

runNode("apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs");
runNode("apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs");

const checklist = JSON.parse(await readRepo("apps/dashboard/data/generated/operator-daily-usability-checklist.json"));
const troubleshooting = JSON.parse(await readRepo("apps/dashboard/data/generated/operator-usability-troubleshooting-report.json"));
const operatorModule = await readRepo("apps/dashboard/src/lib/operator-usability/operator-usability.js");
const app = await readRepo("apps/dashboard/src/app.js");
const sourceConfig = await readRepo("apps/dashboard/src/lib/adapters/source-config.js");
const i18n = await readRepo("apps/dashboard/src/lib/i18n/zh-hant.js");
const index = await readRepo("apps/dashboard/index.html");
const ps1 = await readRepo("apps/dashboard/scripts/start-operator-dashboard.ps1");
const docs = await readRepo("docs/dashboard/openclaw-dashboard-operator-usability-mvp.md");
const generatedText = `${JSON.stringify(checklist)}\n${JSON.stringify(troubleshooting)}`;

assert(checklist.scope === "operator-daily-dashboard-usability", "daily usability checklist scope must match");
assert(checklist.language === "zh-Hant", "daily usability checklist must be zh-Hant");
assert(checklist.operatorRecommendedUrl.includes("?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json"), "daily checklist must point to single-agent local-ingest URL");
assert(checklist.expectedRealAgentCount === 1, "daily checklist expectedRealAgentCount must be 1");
assert(checklist.productionStatus === "no-go-for-production", "daily checklist productionStatus must remain no-go-for-production");
assert(checklist.restartEnabled === false && checklist.mutationEnabled === false && checklist.productionGatewayEnabled === false, "daily checklist disabled markers must remain false");
assert(checklist.doNotDo.some((item) => item.includes("restart")) && checklist.doNotDo.some((item) => item.includes("mutation")), "daily checklist must block restart and mutation");

assert(troubleshooting.scope === "operator-dashboard-usability-troubleshooting", "troubleshooting scope must match");
assert(troubleshooting.productionStatus === "no-go-for-production", "troubleshooting productionStatus must remain no-go-for-production");
assert(troubleshooting.commonIssues.some((issue) => issue.issue.includes("8 agents")), "troubleshooting must explain 8 agents");
for (const blocked of ["restart-agent", "mutation", "production-gateway-connect", "deploy", "auth-token-secrets"]) {
  assert(troubleshooting.blockedActions.includes(blocked), `${blocked} must be blocked`);
}

for (const marker of [
  "operatorHomeEnabled: true",
  "operatorRecommendedSource: \"local-ingest\"",
  "real-local-dashboard-export.single-agent.generated.json",
  "restartEnabled: false",
  "productionGatewayEnabled: false",
  "getOperatorRecommendedUrl",
  "buildOperatorHomeCards"
]) {
  assert(operatorModule.includes(marker), `operator usability module missing ${marker}`);
}

for (const marker of [
  "Operator Home",
  "Recommended operator view",
  "Open recommended operator view",
  "This is not the daily operator view",
  "operator-daily-usability-checklist.json",
  "operator-usability-troubleshooting-report.json",
  "Local Real Agent Health",
  "Local Health Evidence Review",
  "Restart",
  "Mutation",
  "Production gateway"
]) {
  assert(app.includes(marker), `app.js missing ${marker}`);
}

for (const marker of ["Operator 首頁", "建議 Operator 檢視", "每日 Operator 檢視", "重啟：已停用"]) {
  assert(i18n.includes(marker), `i18n missing ${marker}`);
}

assert(index.includes("operator-usability.js?v=23A"), "index must load operator usability module");
assert(index.includes("sprint-23a-operator-usability-mvp") || index.includes("sprint-23b-daily-operator-runbook-mode") || index.includes("sprint-23c-reviewed-health-input-assistant"), "index app cache marker must be Sprint 23A or later");

for (const marker of [
  "OpenClaw Operator Dashboard local preview",
  "Recommended operator view",
  "http://localhost:",
  "no-go-for-production",
  "Mutation: disabled",
  "Restart: disabled",
  "Production gateway: disabled"
]) {
  assert(ps1.includes(marker), `launch script missing ${marker}`);
}

for (const forbidden of [".env", "Authorization", "credentials: \"include\"", "production.example.com", "Restart-Service", "Stop-Service", "Start-Service"]) {
  assert(!ps1.includes(forbidden), `launch script must not include ${forbidden}`);
}

assert(docs.includes("Sprint 23A"), "operator usability doc must mention Sprint 23A");
assert(docs.includes("start-operator-dashboard.ps1"), "operator usability doc must mention launch script");
assert(docs.includes("no-go-for-production"), "operator usability doc must preserve production no-go");

for (const sourceMode of sourceModes) {
  assert(app.includes(`"${sourceMode}"`) || app.includes(sourceMode), `source mode ${sourceMode} must remain present`);
}

for (const route of routeValues) {
  const hashlessRoute = route.replace(/^#/, "");
  assert(app.includes(route) || app.includes(hashlessRoute) || sourceConfig.includes(route) || sourceConfig.includes(hashlessRoute), `route ${route} must remain present`);
}

assert(!/C:\\Users\\/i.test(generatedText), "generated usability reports must not include absolute Windows user paths");
assert(!/\/home\/[^/\s"]+/i.test(generatedText), "generated usability reports must not include POSIX home paths");
assert(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedText), "generated usability reports must not include external URLs");
assert(!/Authorization\s*:/i.test(generatedText), "generated usability reports must not include Authorization headers");
assert(!/credentials\s*:\s*["']include["']/i.test(generatedText), "generated usability reports must not include credentials include");
assert(!/(api[_-]?key|secret|password|accessToken|refreshToken)\s*[:=]/i.test(generatedText), "generated usability reports must not include secret-like values");

console.log("OpenClaw operator usability MVP tests passed.");
