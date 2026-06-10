import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-evidence-manifest.json");

const evidencePaths = [
  ["quality-gate-report", "apps/dashboard/data/generated/quality-gate-report.json", true],
  ["safety-scan-report", "apps/dashboard/data/generated/safety-scan-report.json", true],
  ["release-manifest", "apps/dashboard/data/generated/release-manifest.json", true],
  ["observability-report", "apps/dashboard/data/generated/observability-report.json", true],
  ["production-readiness-report", "apps/dashboard/data/generated/production-readiness-report.json", true],
  ["real-local-data-pilot-report", "apps/dashboard/data/generated/real-local-data-pilot-report.json", true],
  ["dev-gateway-live-drill-report", "apps/dashboard/data/generated/dev-gateway-live-drill-report.json", true],
  ["final-beta-audit-report", "apps/dashboard/data/generated/final-beta-audit-report.json", true],
  ["operator-daily-summary", "apps/dashboard/data/generated/operator-daily-summary.json", false],
  ["operator-incident-drill-report", "apps/dashboard/data/generated/operator-incident-drill-report.json", false]
];

async function fileStatus(path) {
  try {
    await access(resolve(repoRoot, path));
    return "present";
  } catch {
    return "missing";
  }
}

function assertSafeBody(body) {
  const issues = [];
  if (/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(body)) issues.push("unexpected external endpoint detected");
  if (/[A-Za-z]:\\Users\\|\/home\//i.test(body)) issues.push("absolute machine path detected");
  return issues;
}

const evidence = [];
for (const [type, path, required] of evidencePaths) {
  evidence.push({ type, path, required, status: await fileStatus(path) });
}

const manifest = {
  manifestId: `operator-evidence-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  evidence,
  notes: [
    "Local evidence only.",
    "No upload, no deploy, no external notification.",
    "Relative repository paths only."
  ]
};

const body = `${JSON.stringify(manifest, null, 2)}\n`;
const issues = assertSafeBody(body);
if (issues.length) {
  console.error("OpenClaw operator evidence manifest generation failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");
console.log("OpenClaw operator evidence manifest generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
