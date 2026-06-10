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

for (const file of [
  "apps/dashboard/scripts/generate-operator-daily-summary.mjs",
  "apps/dashboard/scripts/run-operator-daily-workflow.mjs",
  "apps/dashboard/scripts/run-operator-incident-drill.mjs",
  "apps/dashboard/scripts/generate-operator-evidence-manifest.mjs"
]) {
  check((await read(file)).trim().length > 0, `${file} must exist.`);
}

const daily = JSON.parse(await read("apps/dashboard/data/generated/operator-daily-summary.json"));
const incident = JSON.parse(await read("apps/dashboard/data/generated/operator-incident-drill-report.json"));
const evidence = JSON.parse(await read("apps/dashboard/data/generated/operator-evidence-manifest.json"));

for (const [name, report] of [["daily", daily], ["incident", incident], ["evidence", evidence]]) {
  check(report.safetyMode === "read-only", `${name} safetyMode must be read-only.`);
  check(report.mutationEnabled === false, `${name} mutationEnabled must be false.`);
  check(report.productionWiring === "disabled", `${name} productionWiring must be disabled.`);
  check(JSON.stringify(report).includes("no-go-for-production") || name === "evidence", `${name} must preserve production no-go marker.`);
}

check(daily.productionStatus === "no-go-for-production", "daily summary productionStatus must be no-go-for-production.");
check(Array.isArray(daily.dailyChecklist) && daily.dailyChecklist.length > 0, "daily summary checklist required.");
check(incident.notificationSent === false, "incident notificationSent must be false.");
check(incident.externalEscalationSent === false, "incident externalEscalationSent must be false.");
check(Array.isArray(incident.scenarios) && incident.scenarios.length >= 8, "incident drill scenarios required.");
check(Array.isArray(evidence.evidence) && evidence.evidence.some((item) => item.type === "quality-gate-report"), "evidence manifest refs required.");

const combined = JSON.stringify({ daily, incident, evidence });
check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(combined), "reports must not contain secret-like values.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(combined), "reports must not contain unexpected production endpoints.");
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(combined), "reports must not contain absolute machine paths.");
check(!/"notificationSent":true|"externalEscalationSent":true|"mutationEnabled":true/.test(combined.replace(/\s+/g, "")), "reports must keep local-only safety flags.");

const scriptBodies = await Promise.all([
  read("apps/dashboard/scripts/generate-operator-daily-summary.mjs"),
  read("apps/dashboard/scripts/run-operator-daily-workflow.mjs"),
  read("apps/dashboard/scripts/run-operator-incident-drill.mjs"),
  read("apps/dashboard/scripts/generate-operator-evidence-manifest.mjs")
]);
const joinedScripts = scriptBodies.join("\n");
check(!/fetch\s*\(|XMLHttpRequest|sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification/.test(joinedScripts), "operator workflow scripts must not perform network notification calls.");
check(!/Authorization|credentials\s*:\s*["']include["']|localStorage|sessionStorage|document\.cookie/.test(joinedScripts), "operator workflow scripts must not handle auth tokens or cookies.");
check(!/approveReview|rejectReview|restoreBackup|updateSettings|runBackup|mutateGateway/.test(joinedScripts), "operator workflow scripts must not introduce mutation endpoint behavior.");

if (failures.length) {
  console.error("OpenClaw operator workflow tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw operator workflow tests passed.");
