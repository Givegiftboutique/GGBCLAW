import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const failures = [];

async function read(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

async function exists(relativePath) {
  try {
    await stat(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function runNode(args) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`node ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

for (const file of [
  "apps/dashboard/scripts/generate-security-privacy-audit.mjs",
  "apps/dashboard/scripts/test-generated-report-sanitization.mjs",
  "apps/dashboard/scripts/generate-data-retention-review.mjs",
  "apps/dashboard/scripts/generate-operator-security-checklist.mjs",
  "apps/dashboard/scripts/test-security-privacy-audit.mjs",
  "apps/dashboard/data/generated/security-privacy-audit-report.json",
  "apps/dashboard/data/generated/data-retention-review-report.json",
  "apps/dashboard/data/generated/operator-security-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/test-generated-report-sanitization.mjs"]);

const audit = JSON.parse(await read("apps/dashboard/data/generated/security-privacy-audit-report.json"));
const retention = JSON.parse(await read("apps/dashboard/data/generated/data-retention-review-report.json"));
const checklist = JSON.parse(await read("apps/dashboard/data/generated/operator-security-checklist.json"));
const combinedReports = JSON.stringify({ audit, retention, checklist });

for (const [name, report] of [["audit", audit], ["retention", retention], ["checklist", checklist]]) {
  check(report.safetyMode === "read-only", `${name} safetyMode must be read-only.`);
  check(report.mutationEnabled === false, `${name} mutationEnabled must be false.`);
  check(report.productionWiring === "disabled", `${name} productionWiring must be disabled.`);
}

check(audit.scope === "internal-operator-beta-security-review", "audit scope must be internal security review.");
check(["pass", "warning"].includes(audit.auditStatus), "audit status must be pass or warning, not fail.");
check(audit.productionStatus === "no-go-for-production", "audit productionStatus must be no-go-for-production.");
check(Array.isArray(audit.checks) && audit.checks.length >= 10, "audit checks required.");
check(Array.isArray(audit.blockedItems) && audit.blockedItems.some((item) => item.name === "production API/Gateway"), "audit blocked production API/Gateway item required.");

check(retention.scope === "internal-operator-beta", "retention scope must be internal operator beta.");
check(retention.retentionPolicyStatus === "draft-for-internal-review", "retention status must be draft-for-internal-review.");
check(Array.isArray(retention.dataClasses) && retention.dataClasses.length >= 10, "retention data classes required.");
check(JSON.stringify(retention).includes("generated reports"), "retention report must cover generated reports.");
check(JSON.stringify(retention).includes("local real snapshots"), "retention report must cover local real snapshots.");

check(checklist.scope === "internal-operator-beta", "checklist scope must be internal operator beta.");
check(checklist.language === "zh-Hant", "checklist language must be zh-Hant.");
check(checklist.productionStatus === "no-go-for-production", "checklist productionStatus must be no-go-for-production.");
check(Array.isArray(checklist.beforeProduction) && checklist.beforeProduction.some((item) => item.includes("Formal security review")), "checklist must require formal security review before production.");

check(!/[A-Za-z]:\\Users\\|\/home\//i.test(combinedReports), "security/privacy reports must not contain absolute machine paths.");
check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(combinedReports), "security/privacy reports must not contain secret-like assignments.");
check(!/Authorization\s*:/i.test(combinedReports), "security/privacy reports must not contain Authorization header values.");
check(!/credentials\s*:\s*["']include["']/i.test(combinedReports), "security/privacy reports must not contain credentials include.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(combinedReports), "security/privacy reports must not contain production endpoints.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(combinedReports.replace(/\s+/g, "")), "security/privacy reports must not enable mutation or production deploy.");
check(!/\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i.test(combinedReports), "security/privacy reports must not include external notification delivery calls.");
check(!/\.github\/workflows/i.test(combinedReports), "security/privacy reports must not include deploy workflow paths.");

if (failures.length) {
  console.error("OpenClaw security privacy audit tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw security privacy audit tests passed.");
