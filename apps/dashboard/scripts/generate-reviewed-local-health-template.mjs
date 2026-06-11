import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const modulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-reviewed-health-input-assistant.js");
const templatePath = join(dashboardRoot, "data", "local", "reviewed-local-agent-health.template.json");
const outputPath = join(dashboardRoot, "data", "generated", "reviewed-local-health-input-template-report.json");

function normalizeRelative(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

async function loadAssistant() {
  const source = await readFile(modulePath, "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "local-reviewed-health-input-assistant.js" });
  return context.window.OpenClawReviewedHealthInputAssistant;
}

const assistant = await loadAssistant();
const template = assistant.buildReviewedHealthInputTemplate();
const guide = assistant.buildReviewedHealthInputGuide();
const validation = assistant.validateReviewedHealthInputDryRun(template);

const report = {
  reportId: `reviewed-local-health-input-template-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "reviewed-local-health-input-template",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  templatePath: "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  localInputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  dryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  expectedRealAgentCount: 1,
  templateAgentCount: template.agentHealth.length,
  templateStatus: validation.acceptedForLocalUse ? "pass" : "review-required",
  readinessStatus: validation.readinessStatus,
  allowedFields: [
    "schemaVersion",
    "generatedAt",
    "scope",
    "productionStatus",
    "safetyMode",
    "mutationEnabled",
    "productionWiring",
    "agentHealth",
    "agentId",
    "displayName",
    "expectedRealAgent",
    "source",
    "status",
    "heartbeatStatus",
    "lastSeenAt",
    "healthNotes",
    "reviewRequired"
  ],
  forbiddenFields: guide.notAllowed,
  commitPolicy: "local-only-do-not-commit",
  redactionApplied: true,
  rawValuesPrinted: false,
  validationFindings: validation.validationFindings,
  safeNextSteps: guide.steps,
  blockedActions: [
    "restart-agent",
    "stop-agent",
    "start-agent",
    "production-gateway-connect",
    "mutation",
    "deploy"
  ]
};

await mkdir(dirname(templatePath), { recursive: true });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(templatePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw reviewed local health template generated.");
console.log(`Template: ${normalizeRelative(templatePath)}`);
console.log(`Report: ${normalizeRelative(outputPath)}`);
