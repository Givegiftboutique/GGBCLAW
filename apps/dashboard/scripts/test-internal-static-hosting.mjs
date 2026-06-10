import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
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

for (const file of [
  "apps/dashboard/scripts/start-internal-static-preview.mjs",
  "apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs",
  "apps/dashboard/scripts/generate-operator-access-checklist.mjs",
  "apps/dashboard/scripts/test-internal-static-hosting.mjs",
  "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  "apps/dashboard/data/generated/operator-access-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const serverScript = await read("apps/dashboard/scripts/start-internal-static-preview.mjs");
const dryRunScript = await read("apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs");
const checklistScript = await read("apps/dashboard/scripts/generate-operator-access-checklist.mjs");
const activeScripts = `${serverScript}\n${dryRunScript}\n${checklistScript}`;

const dryRun = JSON.parse(await read("apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json"));
const checklist = JSON.parse(await read("apps/dashboard/data/generated/operator-access-checklist.json"));
const combinedReports = JSON.stringify({ dryRun, checklist });

check(dryRun.scope === "internal-static-hosting-dry-run", "dry-run scope must be internal-static-hosting-dry-run.");
check(dryRun.hostingMode === "static-preview-only", "dry-run hostingMode must be static-preview-only.");
check(dryRun.productionDeploy === false, "dry-run productionDeploy must be false.");
check(dryRun.safetyMode === "read-only", "dry-run safetyMode must be read-only.");
check(dryRun.mutationEnabled === false, "dry-run mutationEnabled must be false.");
check(dryRun.productionWiring === "disabled", "dry-run productionWiring must be disabled.");
check(dryRun.summary?.failed === 0, "dry-run report must have zero failed checks.");
check(Array.isArray(dryRun.requiredFiles) && dryRun.requiredFiles.some((item) => item.name === "apps/dashboard/index.html"), "dry-run required file checks must include index.html.");
check(Array.isArray(dryRun.requiredReports) && dryRun.requiredReports.some((item) => item.name.endsWith("release-manifest.json")), "dry-run required reports must include release manifest.");

check(checklist.scope === "internal-operator-beta", "access checklist scope must be internal-operator-beta.");
check(checklist.language === "zh-Hant", "access checklist language must be zh-Hant.");
check(checklist.productionStatus === "no-go-for-production", "access checklist productionStatus must be no-go-for-production.");
check(checklist.safetyMode === "read-only", "access checklist safetyMode must be read-only.");
check(checklist.mutationEnabled === false, "access checklist mutationEnabled must be false.");
check(checklist.productionWiring === "disabled", "access checklist productionWiring must be disabled.");
check(Array.isArray(checklist.recommendedUrls) && checklist.recommendedUrls.length >= 3, "access checklist recommended URLs required.");
for (const url of checklist.recommendedUrls ?? []) {
  check(/^http:\/\/127\.0\.0\.1:5180\//.test(url), `recommended URL must be 127.0.0.1 only: ${url}`);
}

check(serverScript.includes("X-OpenClaw-Safety-Mode") && serverScript.includes("X-OpenClaw-Production-Wiring") && serverScript.includes("X-OpenClaw-Mutation-Enabled"), "preview server must emit safety headers.");
check(serverScript.includes("127.0.0.1") && serverScript.includes("5180"), "preview server must default to 127.0.0.1:5180.");
check(serverScript.includes("path traversal blocked"), "preview server must block path traversal.");
check(serverScript.includes("405"), "preview server must reject unsupported methods.");

check(!/process\.env|dotenv|\.env\b/i.test(activeScripts), "static hosting scripts must not read .env or process env.");
check(!/credentials\s*:\s*["']include["']|localStorage|sessionStorage|document\.cookie/i.test(activeScripts), "static hosting scripts must not handle credentials include, storage tokens, or cookies.");
check(!/\bfetch\s*\(|XMLHttpRequest|connectProductionGateway/i.test(activeScripts), "static hosting scripts must not proxy or connect production gateway.");
check(!/\b(deployProduction|runProductionDeploy|publishProduction|pushStaticRelease)\s*\(/i.test(activeScripts), "static hosting scripts must not introduce deploy commands.");
check(!/\b(approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway)\s*\(/.test(activeScripts), "static hosting scripts must not introduce mutation behavior.");
check(!/mkdir\(.*\.github|writeFile\(.*\.github\/workflows/i.test(activeScripts), "static hosting scripts must not create GitHub Actions or CI.");

check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(combinedReports), "generated reports must not contain secret-like assignments.");
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(combinedReports), "generated reports must not contain absolute machine paths.");
check(!/https?:\/\/(?!127\.0\.0\.1\b|localhost\b|json-schema\.org\b)/i.test(combinedReports), "generated reports must not contain production endpoints.");
check(!/"productionDeploy":true|"mutationEnabled":true/i.test(combinedReports.replace(/\s+/g, "")), "generated reports must keep deploy and mutation disabled.");

if (failures.length) {
  console.error("OpenClaw internal static hosting tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw internal static hosting tests passed.");
