import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const modulePath = join(dashboardRoot, "src", "lib", "agent-health", "local-reviewed-health-input-assistant.js");
const defaultInputPath = join(dashboardRoot, "data", "local", "reviewed-local-agent-health.json");
const templatePath = join(dashboardRoot, "data", "local", "reviewed-local-agent-health.template.json");
const outputPath = join(dashboardRoot, "data", "generated", "reviewed-local-health-input-dry-run-report.json");

function parseDataPath(argv) {
  const index = argv.indexOf("--data");
  return index >= 0 && argv[index + 1] ? resolve(repoRoot, argv[index + 1]) : null;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

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
const explicitPath = parseDataPath(process.argv.slice(2));
const inputPath = explicitPath || defaultInputPath;
let inputPresent = false;
let parseStatus = "not-run";
let readinessStatus = "missing-local-input";
let acceptedForLocalUse = false;
let validationFindings = [];
let redactedPreview = assistant.buildRedactedReviewedHealthPreview(null);
let sourceUsed = "missing-local-input";
let fallbackBehavior = "Use local-file-only sample health input until reviewed local JSON is present and valid.";

if (await exists(inputPath)) {
  inputPresent = true;
  sourceUsed = "local-reviewed-json";
  try {
    const input = JSON.parse(await readFile(inputPath, "utf8"));
    parseStatus = "pass";
    const validation = assistant.validateReviewedHealthInputDryRun(input);
    readinessStatus = validation.readinessStatus;
    acceptedForLocalUse = validation.acceptedForLocalUse;
    validationFindings = validation.validationFindings;
    redactedPreview = assistant.buildRedactedReviewedHealthPreview(input);
    fallbackBehavior = acceptedForLocalUse
      ? "Reviewed local JSON is ready for local-only health report use."
      : "Reviewed local JSON is rejected for health truth; fall back to sample and review the dry-run findings.";
  } catch {
    parseStatus = "fail";
    readinessStatus = "invalid-fallback-required";
    validationFindings = [
      {
        path: "$",
        key: "json",
        ruleId: "parse-json",
        category: "schema-validation",
        message: "Reviewed local health input could not be parsed; raw content was not printed.",
        rawValuePrinted: false
      }
    ];
  }
}

const report = {
  reportId: `reviewed-local-health-input-dry-run-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "reviewed-local-health-input-dry-run",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  inputPath: "apps/dashboard/data/local/reviewed-local-agent-health.json",
  inputPathChecked: explicitPath ? normalizeRelative(inputPath) : "apps/dashboard/data/local/reviewed-local-agent-health.json",
  templatePath: "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  templateExists: await exists(templatePath),
  inputPresent,
  sourceUsed,
  parseStatus,
  readinessStatus,
  acceptedForLocalUse,
  expectedRealAgentCount: 1,
  actualAgentCount: redactedPreview.agentCount || 0,
  fallbackBehavior,
  redactionApplied: true,
  rawValuesPrinted: false,
  commitPolicy: "local-only-do-not-commit",
  redactedPreview,
  validationFindings,
  safeNextSteps: inputPresent
    ? [
        "Review dry-run findings.",
        "Regenerate local health report only after the input is ready for local use.",
        "Keep reviewed-local-agent-health.json local-only and uncommitted."
      ]
    : [
        "Copy apps/dashboard/data/local/reviewed-local-agent-health.template.json to apps/dashboard/data/local/reviewed-local-agent-health.json locally.",
        "Edit only sanitized local health fields.",
        "Run this dry-run validator again.",
        "Do not commit the real reviewed-local-agent-health.json file."
      ],
  blockedActions: [
    "restart-agent",
    "stop-agent",
    "start-agent",
    "production-gateway-connect",
    "mutation",
    "deploy"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw reviewed local health dry-run validation completed.");
console.log(`Report: ${normalizeRelative(outputPath)}`);
