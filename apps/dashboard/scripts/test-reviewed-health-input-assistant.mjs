import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
    await access(join(repoRoot, relativePath));
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

async function loadAssistant() {
  const source = await readText("apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-reviewed-health-input-assistant.js" });
  return context.window.OpenClawReviewedHealthInputAssistant;
}

for (const file of [
  "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js",
  "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.ts",
  "apps/dashboard/data/local/.gitignore",
  "apps/dashboard/scripts/generate-reviewed-local-health-template.mjs",
  "apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs",
  "apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs",
  "apps/dashboard/scripts/test-reviewed-health-input-assistant.mjs"
]) {
  check(await exists(file), `${file} must exist.`);
}

runNode(["apps/dashboard/scripts/generate-reviewed-local-health-template.mjs"]);
runNode(["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs"]);
runNode(["apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs"]);

for (const file of [
  "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json",
  "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json"
]) {
  check(await exists(file), `${file} must exist.`);
}

const assistant = await loadAssistant();
const template = await readJson("apps/dashboard/data/local/reviewed-local-agent-health.template.json");
const templateReport = await readJson("apps/dashboard/data/generated/reviewed-local-health-input-template-report.json");
const dryRunReport = await readJson("apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json");
const checklist = await readJson("apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json");
const gitignore = await readText("apps/dashboard/data/local/.gitignore");

check(assistant.buildReviewedHealthInputTemplate().agentHealth?.length === 1, "assistant template must contain one agent.");
check(assistant.validateReviewedHealthInputDryRun(template).acceptedForLocalUse === true, "template must dry-run validate.");
check(assistant.classifyReviewedHealthInputReadiness(null) === "missing-local-input", "missing input must classify missing-local-input.");
check(template.schemaVersion === "local-agent-health.v1", "template schemaVersion must match.");
check(template.productionStatus === "no-go-for-production" && template.safetyMode === "read-only", "template must keep no-go/read-only.");
check(template.mutationEnabled === false && template.productionWiring === "disabled", "template must keep mutation disabled and production wiring disabled.");
check(template.agentHealth?.length === 1, "template must contain exactly one agentHealth entry.");
check(template.agentHealth?.[0]?.agentId === "local-orchestrator", "template agentId must align to single-agent truth.");
check(template.agentHealth?.[0]?.source === "local-reviewed-json", "template agent source must be local-reviewed-json.");

for (const marker of ["reviewed-local-agent-health.json", "reviewed-local-agent-health.*.local.json", "*.secret.json", "*.private.json"]) {
  check(gitignore.includes(marker), `.gitignore must protect ${marker}.`);
}

check(templateReport.templatePath === "apps/dashboard/data/local/reviewed-local-agent-health.template.json", "template report must include template path.");
check(templateReport.commitPolicy === "local-only-do-not-commit", "template report must include local-only commit policy.");
check(templateReport.redactionApplied === true && templateReport.rawValuesPrinted === false, "template report must apply redaction and avoid raw values.");
check(dryRunReport.readinessStatus === "missing-local-input", "default dry-run must be missing-local-input when real local file is absent.");
check(dryRunReport.redactionApplied === true && dryRunReport.rawValuesPrinted === false, "dry-run report must apply redaction and avoid raw values.");
check(dryRunReport.fallbackBehavior.includes("local-file-only"), "missing dry-run must document local-file-only fallback.");
check(checklist.localInputPath === "apps/dashboard/data/local/reviewed-local-agent-health.json", "checklist must include local input path.");
check(checklist.commitPolicy === "local-only-do-not-commit", "checklist must forbid committing real local input.");
check(checklist.operatorChecks.some((item) => item.includes("不 commit")), "checklist must include Chinese do-not-commit instruction.");

const tempDir = join(tmpdir(), `openclaw-reviewed-health-assistant-${Date.now()}`);
await mkdir(tempDir, { recursive: true });
const validPath = join(tempDir, "valid-reviewed-health.json");
await writeFile(validPath, `${JSON.stringify({ ...template, generatedAt: "2026-06-11T00:00:00.000Z" }, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs", "--data", validPath]);
let tempReport = await readJson("apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json");
check(tempReport.readinessStatus === "ready-for-local-use", "valid reviewed health input must be ready-for-local-use.");
check(tempReport.acceptedForLocalUse === true, "valid reviewed health input must be accepted.");
check(tempReport.actualAgentCount === 1, "valid reviewed health input must have one agent.");

const unsafeValue = "SHOULD_NOT_PRINT_THIS_SECRET_VALUE";
const unsafePath = join(tempDir, "unsafe-reviewed-health.json");
await writeFile(unsafePath, `${JSON.stringify({
  ...template,
  agentHealth: [{ ...template.agentHealth[0], apiKey: unsafeValue }]
}, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs", "--data", unsafePath]);
tempReport = await readJson("apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json");
check(tempReport.readinessStatus === "unsafe-rejected", "unsafe key must be rejected.");
check(tempReport.validationFindings.some((finding) => finding.key === "apiKey" && finding.rawValuePrinted === false), "unsafe finding must include key only and rawValuePrinted false.");
check(!JSON.stringify(tempReport).includes(unsafeValue), "dry-run report must not leak unsafe raw value.");

const invalidPath = join(tempDir, "invalid-reviewed-health.json");
await writeFile(invalidPath, `${JSON.stringify({ ...template, agentHealth: [] }, null, 2)}\n`, "utf8");
runNode(["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs", "--data", invalidPath]);
tempReport = await readJson("apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json");
check(tempReport.readinessStatus === "invalid-fallback-required", "invalid agent count must require fallback.");
check(tempReport.validationFindings.some((finding) => finding.key === "agentHealth"), "invalid agent count must report agentHealth key.");

await rm(tempDir, { recursive: true, force: true });
runNode(["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs"]);

const app = await readText("apps/dashboard/src/app.js");
for (const marker of [
  "Reviewed Health Input Assistant",
  "reviewed-local-agent-health.template.json",
  "reviewed-local-agent-health.json",
  "Dry-run readiness",
  "Redaction applied",
  "Raw values printed",
  "local-only-do-not-commit",
  "missing-local-input",
  "unsafe-rejected"
]) {
  check(app.includes(marker), `UI must contain reviewed health assistant marker: ${marker}`);
}

const dailySummary = await readJson("apps/dashboard/data/generated/daily-operator-summary-report.json");
const dailyChecklist = await readJson("apps/dashboard/data/generated/daily-operator-runbook-checklist.json");
check(dailySummary.reviewedHealthDryRunReportPath === "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json", "daily summary must include dry-run report path.");
check(dailySummary.reviewedHealthInputReadiness, "daily summary must include reviewed input readiness.");
check(dailyChecklist.reviewedHealthDryRunReportPath === "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json", "daily checklist must include dry-run report path.");

const qualityGate = await readText("apps/dashboard/scripts/run-dashboard-quality-gates.mjs");
for (const marker of [
  "generate-reviewed-local-health-template.mjs",
  "validate-reviewed-local-health-input-dry-run.mjs",
  "generate-operator-reviewed-health-input-checklist.mjs",
  "test-reviewed-health-input-assistant.mjs",
  "reviewedLocalHealthTemplateReport",
  "reviewedLocalHealthInputDryRunReport",
  "operatorReviewedHealthInputChecklist",
  "reviewedHealthInputAssistantTests"
]) {
  check(qualityGate.includes(marker), `quality gate must reference ${marker}.`);
}

const safetyScan = await readText("apps/dashboard/scripts/safety-scan-dashboard.mjs");
for (const marker of [
  "local-reviewed-health-input-assistant.js",
  "reviewed-local-agent-health.template.json",
  "reviewed-local-health-input-dry-run-report.json",
  "operator-reviewed-health-input-checklist.json",
  "reviewed-health-raw-values-printed",
  "real-reviewed-health-input-tracked"
]) {
  check(safetyScan.includes(marker), `safety scan must reference ${marker}.`);
}

const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
check(!(tracked.stdout || "").trim(), "real reviewed local health input must not be tracked.");

const generatedText = JSON.stringify({
  templateReport,
  dryRunReport: await readJson("apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json"),
  checklist
});
check(!/[A-Za-z]:\\Users\\|\/home\//i.test(generatedText), "reviewed health reports must not contain absolute machine paths.");
check(!/SHOULD_NOT_PRINT|sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+/i.test(generatedText), "reviewed health reports must not leak secret-like raw values.");
check(!/https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(generatedText), "reviewed health reports must not contain external endpoints.");
check(!/"mutationEnabled":true|"productionDeploy":true/i.test(generatedText.replace(/\s+/g, "")), "reviewed health reports must not enable mutation or deploy.");

if (failures.length) {
  console.error("OpenClaw reviewed health input assistant tests failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw reviewed health input assistant tests passed.");
