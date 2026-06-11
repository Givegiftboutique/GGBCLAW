import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

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

async function readText(relativePath) {
  return readFile(join(repoRoot, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

function runNode(args) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`node ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

async function loadEvidenceModule() {
  const source = await readText("apps/dashboard/src/lib/agent-health/local-health-evidence.js");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-health-evidence.js" });
  return context.window.OpenClawLocalHealthEvidence;
}

const requiredFiles = [
  "apps/dashboard/src/lib/agent-health/local-health-evidence.js",
  "apps/dashboard/src/lib/agent-health/local-health-evidence.ts",
  "apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs",
  "apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs",
  "apps/dashboard/scripts/test-local-health-evidence-review.mjs"
];
for (const file of requiredFiles) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs"]);
runNode(["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs"]);

for (const file of [
  "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const evidenceModule = await loadEvidenceModule();
const healthReport = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
const evidenceReport = await readJson("apps/dashboard/data/generated/local-health-evidence-review-report.json");
const checklist = await readJson("apps/dashboard/data/generated/operator-local-health-evidence-checklist.json");
const reviewedExample = await readJson("apps/dashboard/data/local/reviewed-local-agent-health.example.json");

check(evidenceModule.classifyEvidenceStatus({ reviewedInputStatus: "valid", healthSource: "local-reviewed-json" }) === "reviewed-valid", "valid reviewed input must classify reviewed-valid.");
check(evidenceReport.productionStatus === "no-go-for-production", "evidence report productionStatus must remain no-go-for-production.");
check(evidenceReport.safetyMode === "read-only" && evidenceReport.mutationEnabled === false && evidenceReport.productionWiring === "disabled", "evidence report must keep safety flags.");
check(evidenceReport.expectedRealAgentCount === 1 && evidenceReport.actualRealAgentCount === 1, "evidence report must align to one real agent.");
check(evidenceReport.operatorTruthSnapshot === "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json", "evidence report must point to single-agent snapshot.");
check(evidenceReport.reviewedInputPath === "apps/dashboard/data/local/reviewed-local-agent-health.json", "evidence report must include reviewed input path.");
check(evidenceReport.reviewedInputExamplePath === "apps/dashboard/data/local/reviewed-local-agent-health.example.json", "evidence report must include reviewed input example path.");
check(["reviewed-valid", "reviewed-invalid-fallback", "missing-fallback", "sample-fallback", "review-required", "unsafe-rejected"].includes(evidenceReport.evidenceStatus), "evidenceStatus must be valid.");
check(["local-reviewed-json", "local-file-only"].includes(evidenceReport.acceptedHealthSource), "acceptedHealthSource must be local-reviewed-json or local-file-only.");
check(evidenceReport.fallbackUsed === false || Boolean(evidenceReport.fallbackReason), "fallback reason must exist when fallback is used.");
check(evidenceReport.redactionApplied === true, "redactionApplied must be true.");
check(evidenceReport.rawValuesPrinted === false, "rawValuesPrinted must be false.");
check(Array.isArray(evidenceReport.validationEvidence), "validationEvidence must be an array.");
check(Array.isArray(evidenceReport.rejectedEvidence), "rejectedEvidence must be an array.");
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
  check(evidenceReport.blockedActions?.includes(blocked), `evidence report must block ${blocked}.`);
}
check(!JSON.stringify(evidenceReport).includes("gateway-stub") && !JSON.stringify(evidenceReport).includes("\"source\":\"mock\""), "evidence report must not fallback to mock or gateway-stub.");
check(healthReport.redactionApplied === true && healthReport.rawValuesPrinted === false, "health report must include redaction markers.");
check(checklist.evidenceReviewReportPath === "apps/dashboard/data/generated/local-health-evidence-review-report.json", "checklist must include evidence report path.");
check(checklist.operatorChecks?.some((item) => item.includes("evidenceStatus")), "checklist must include evidenceStatus review step.");
check(checklist.notAllowed?.some((item) => item.includes("raw reviewed local health JSON values")), "checklist must forbid raw value printing.");

const tempDir = join(tmpdir(), `openclaw-evidence-test-${Date.now()}`);
await mkdir(tempDir, { recursive: true });
const validReviewedPath = join(tempDir, "valid-reviewed-local-agent-health.json");
await writeFile(validReviewedPath, `${JSON.stringify({
  ...reviewedExample,
  reviewedAt: "2026-06-11T00:00:00.000Z",
  agents: [
    {
      ...reviewedExample.agents[0],
      status: "online",
      heartbeat: {
        status: "fresh",
        lastSeenAt: "2026-06-11T00:00:00.000Z",
        staleAfterSeconds: 300
      }
    }
  ]
}, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs", "--data", validReviewedPath]);
runNode(["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"]);
let tempEvidenceReport = await readJson("apps/dashboard/data/generated/local-health-evidence-review-report.json");
check(tempEvidenceReport.evidenceStatus === "reviewed-valid", "valid reviewed JSON must produce reviewed-valid evidence.");
check(tempEvidenceReport.acceptedHealthSource === "local-reviewed-json", "valid reviewed JSON must be accepted as local-reviewed-json.");
check(tempEvidenceReport.fallbackUsed === false && tempEvidenceReport.fallbackReason === "none", "valid reviewed JSON must not fallback.");

const unsafeValue = "SHOULD_NOT_PRINT_THIS_SECRET_VALUE";
const unsafeReviewedPath = join(tempDir, "unsafe-reviewed-local-agent-health.json");
await writeFile(unsafeReviewedPath, `${JSON.stringify({
  ...reviewedExample,
  agents: [
    {
      ...reviewedExample.agents[0],
      apiKey: unsafeValue
    }
  ]
}, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs", "--data", unsafeReviewedPath]);
runNode(["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"]);
tempEvidenceReport = await readJson("apps/dashboard/data/generated/local-health-evidence-review-report.json");
const tempHealthReport = await readJson("apps/dashboard/data/generated/local-real-agent-health-report.json");
check(tempEvidenceReport.evidenceStatus === "unsafe-rejected", "unsafe reviewed JSON must produce unsafe-rejected evidence.");
check(tempEvidenceReport.acceptedHealthSource === "local-file-only", "unsafe reviewed JSON must fallback to local-file-only.");
check(tempEvidenceReport.fallbackUsed === true && tempEvidenceReport.fallbackReason === "unsafe-keys", "unsafe reviewed JSON must record unsafe-keys fallback.");
check(tempEvidenceReport.validationEvidence?.some((entry) => entry.key === "apiKey" && entry.rawValuePrinted === false), "unsafe evidence must include key only and rawValuePrinted false.");
check(!JSON.stringify(tempEvidenceReport).includes(unsafeValue), "evidence report must not leak unsafe raw value.");
check(!JSON.stringify(tempHealthReport).includes(unsafeValue), "health report must not leak unsafe raw value.");

const invalidReviewedPath = join(tempDir, "invalid-reviewed-local-agent-health.json");
await writeFile(invalidReviewedPath, `${JSON.stringify({ ...reviewedExample, expectedAgentCount: 2 }, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs", "--data", invalidReviewedPath]);
runNode(["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"]);
tempEvidenceReport = await readJson("apps/dashboard/data/generated/local-health-evidence-review-report.json");
check(tempEvidenceReport.evidenceStatus === "reviewed-invalid-fallback", "invalid reviewed JSON must produce reviewed-invalid-fallback evidence.");
check(tempEvidenceReport.fallbackReason === "invalid-reviewed-input", "invalid reviewed JSON must record invalid fallback reason.");
check(tempEvidenceReport.validationEvidence?.some((entry) => entry.key === "expectedAgentCount"), "invalid evidence must include failed key.");

await rm(tempDir, { recursive: true, force: true });
runNode(["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"]);
runNode(["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"]);

const generatedText = JSON.stringify({
  evidenceReport: await readJson("apps/dashboard/data/generated/local-health-evidence-review-report.json"),
  checklist: await readJson("apps/dashboard/data/generated/operator-local-health-evidence-checklist.json")
});
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedText), "evidence reports must not contain absolute machine paths.");
check(!/(password|api[_-]?key|private[_-]?key)\s*[:=]/i.test(generatedText), "evidence reports must not contain secret-like assignments.");
check(!/\bAuthorization\s*:|credentials\s*:\s*["']include["']|document\.cookie|localStorage|sessionStorage|token\s*[:=]|cookie\s*[:=]/i.test(generatedText), "evidence reports must not contain auth/token/cookie handling.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedText.replace(/\s+/g, "")), "evidence reports must not enable mutation or deploy.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedText), "evidence reports must not contain production endpoints.");

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Local Health Evidence Review",
  "Evidence status:",
  "Accepted health source:",
  "Fallback used:",
  "Fallback reason:",
  "Redaction applied:",
  "Raw values printed:",
  "Reviewed local health JSON not provided.",
  "Reviewed local health JSON rejected.",
  "Reviewed local health JSON accepted."
]) {
  check(app.includes(marker), `UI must contain evidence marker: ${marker}`);
}

const docs = [
  await readText("docs/dashboard/openclaw-dashboard-local-health-evidence-review.md").catch(() => ""),
  await readText("apps/dashboard/README.md").catch(() => ""),
  await readText("docs/dashboard/README.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-local-agent-health.md").catch(() => ""),
  await readText("docs/dashboard/openclaw-dashboard-operator-runbook.md").catch(() => "")
].join("\n");
for (const marker of [
  "Sprint 22C",
  "local health evidence review",
  "local-health-evidence-review-report.json",
  "redaction applied",
  "raw values never printed",
  "production still no-go"
]) {
  check(docs.includes(marker), `docs must contain marker: ${marker}`);
}

const qualityGate = await readText("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
for (const marker of [
  "generate-local-health-evidence-review-report.mjs",
  "generate-operator-local-health-evidence-checklist.mjs",
  "test-local-health-evidence-review.mjs",
  "localHealthEvidenceReviewReport",
  "operatorLocalHealthEvidenceChecklist",
  "localHealthEvidenceReviewTests"
]) {
  check(qualityGate.includes(marker), `quality gate must reference ${marker}.`);
}

const safetyScan = await readText("apps/dashboard/scripts/safety-scan-dashboard.mjs");
for (const marker of [
  "local-health-evidence.js",
  "local-health-evidence-review-report.json",
  "operator-local-health-evidence-checklist.json",
  "raw-reviewed-health-values-printed"
]) {
  check(safetyScan.includes(marker), `safety scan must reference ${marker}.`);
}

if (failures.length) {
  console.error("OpenClaw local health evidence review tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw local health evidence review tests passed.");
