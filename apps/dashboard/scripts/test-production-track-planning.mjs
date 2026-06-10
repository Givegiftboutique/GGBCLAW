import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

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

function runNode(args) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`node ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

for (const file of [
  "apps/dashboard/scripts/generate-production-track-plan.mjs",
  "apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs",
  "apps/dashboard/scripts/generate-production-entry-gates.mjs",
  "apps/dashboard/scripts/test-production-track-planning.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-production-track-plan.mjs"]);
runNode(["apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs"]);
runNode(["apps/dashboard/scripts/generate-production-entry-gates.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/production-track-plan-report.json",
  "apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json",
  "apps/dashboard/data/generated/production-entry-gates-report.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const plan = await readJson("apps/dashboard/data/generated/production-track-plan-report.json");
const gateway = await readJson("apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json");
const gates = await readJson("apps/dashboard/data/generated/production-entry-gates-report.json");
const combined = JSON.stringify({ plan, gateway, gates });

check(plan.productionStatus === "no-go-for-production", "production track plan must remain no-go-for-production.");
check(plan.productionTrackStatus === "planning-only", "productionTrackStatus must be planning-only.");
check(gateway.productionStatus === "no-go-for-production", "gateway readiness productionStatus must remain no-go-for-production.");
check(gateway.gatewayConnectionStatus === "not-connected", "gatewayConnectionStatus must be not-connected.");
check(gateway.readinessStatus === "not-ready", "readinessStatus must be not-ready.");
check(gates.productionStatus === "no-go-for-production", "entry gates productionStatus must remain no-go-for-production.");
check(gates.entryGateStatus === "blocked", "entryGateStatus must be blocked.");

for (const report of [plan, gateway, gates]) {
  check(report.safetyMode === "read-only", "safetyMode must be read-only.");
  check(report.mutationEnabled === false, "mutationEnabled must be false.");
  check(report.productionWiring === "disabled", "productionWiring must be disabled.");
}

check(plan.currentRelease === "v1.0.0-internal", "currentRelease must be v1.0.0-internal.");
check(plan.phases?.length >= 7, "production track plan must include P1-P7 phases.");
check(gateway.requiredControls?.some((item) => item.includes("read-only GET")), "gateway readiness must require read-only GET endpoints.");
check(gates.gates?.some((gate) => gate.gateId === "internal-v1-tag" && gate.status === "pass"), "entry gates must note internal v1 tag exists.");
check(gates.hardBlockers?.length > 0, "entry gates must list hard blockers.");
check(plan.blockers?.some((item) => item.includes("only 1 real agent")), "production track plan must record the single real agent reality.");
check(plan.blockers?.some((item) => item.includes("8-agent data is mock")), "production track plan must quarantine 8-agent fixture data from operator truth.");
check(gateway.requiredControls?.some((item) => item.includes("Fixture Quarantine + Single Agent Truth Alignment")), "gateway readiness must require fixture quarantine before implementation.");
check(gates.gates?.some((gate) => gate.gateId === "fixture-quarantine-single-agent" && gate.status === "blocked"), "entry gates must block on fixture quarantine and single agent truth alignment.");

check(!/production-ready/i.test(combined), "production track reports must not use production-ready as current status.");
check(!/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(combined), "production track reports must not contain secret-like assignments.");
check(!/https?:\/\//i.test(combined), "production track reports must not contain endpoint URLs.");
check(!/\bAuthorization\b/i.test(combined), "production track reports must not contain Authorization header usage.");
check(!/credentials\s*:\s*["']include["']/i.test(combined), "production track reports must not include credentialed requests.");
check(!/\b(localStorage|sessionStorage|document\.cookie)\b/i.test(combined), "production track reports must not contain browser token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(combined.replace(/\s+/g, "")), "production track reports must not enable mutation or deploy.");
check(!/\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i.test(combined), "production track reports must not include external notification delivery.");
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(combined), "production track reports must not contain absolute machine paths.");

if (failures.length) {
  console.error("OpenClaw production track planning tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw production track planning tests passed.");
