import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const failures = [];

async function exists(relativePath) {
  try {
    await stat(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(repoRoot, relativePath), "utf8"));
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
  "apps/dashboard/scripts/generate-internal-release-candidate.mjs",
  "apps/dashboard/scripts/generate-internal-signoff-package.mjs",
  "apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs",
  "apps/dashboard/scripts/test-internal-release-candidate.mjs",
  "apps/dashboard/data/generated/internal-release-candidate-report.json",
  "apps/dashboard/data/generated/internal-signoff-package.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs"]);

const rcReport = await readJson("apps/dashboard/data/generated/internal-release-candidate-report.json");
const signoffPackage = await readJson("apps/dashboard/data/generated/internal-signoff-package.json");
const combined = JSON.stringify({ rcReport, signoffPackage });

check(rcReport.releaseCandidate === "v1.0.0-internal-rc1", "RC report must use v1.0.0-internal-rc1.");
check(rcReport.internalStatus === "release-candidate", "RC report internalStatus must be release-candidate.");
check(rcReport.manualSignoffRequired === true, "manualSignoffRequired must be true.");
check(rcReport.signoffStatus === "pending", "RC signoffStatus must remain pending.");
check(signoffPackage.signoffStatus === "pending", "sign-off package signoffStatus must remain pending.");
check(signoffPackage.notApprovedYet === true, "sign-off package notApprovedYet must remain true.");
check(signoffPackage.requiredReviewers?.includes("security-reviewer"), "sign-off package must include security reviewer.");

for (const report of [rcReport, signoffPackage]) {
  check(report.productionStatus === "no-go-for-production", "productionStatus must be no-go-for-production.");
  check(report.safetyMode === "read-only", "safetyMode must be read-only.");
  check(report.mutationEnabled === false, "mutationEnabled must be false.");
  check(report.productionWiring === "disabled", "productionWiring must be disabled.");
}

for (const mode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  check(rcReport.supportedSources?.includes(mode), `supported source must be preserved: ${mode}`);
}

check(!/"signoffStatus"\s*:\s*"approved"/i.test(combined), "signoffStatus must not be approved.");
check(!/"notApprovedYet"\s*:\s*false/i.test(combined), "notApprovedYet must not be false.");
check(!/production-ready/i.test(combined), "RC package must not use production-ready status.");
check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(combined), "RC package must not contain secret-like assignments.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(combined), "RC package must not contain production endpoints.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(combined.replace(/\s+/g, "")), "RC package must not enable mutation or deploy.");
check(!/\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i.test(combined), "RC package must not include external notification delivery.");

if (failures.length) {
  console.error("OpenClaw internal release candidate tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw internal release candidate tests passed.");
