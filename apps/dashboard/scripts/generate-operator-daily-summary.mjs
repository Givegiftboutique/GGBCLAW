import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "operator-daily-summary.json");

async function readJson(relPath, fallback = null) {
  try {
    return JSON.parse(await readFile(join(dashboardRoot, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

function resultOf(report, passKey = "result") {
  if (!report) return "missing";
  const value = report[passKey] ?? report.status ?? report.summary?.status;
  if (value === "pass" || value === "ok" || value === "internal-beta-ready") return "pass";
  return "warning";
}

function assertSafeBody(body) {
  const issues = [];
  if (/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(body)) issues.push("unexpected external endpoint detected");
  if (/[A-Za-z]:\\Users\\|\/home\//i.test(body)) issues.push("absolute machine path detected");
  if (/"mutationEnabled": true/.test(body)) issues.push("mutationEnabled must remain false");
  return issues;
}

const qualityGate = await readJson("data/generated/quality-gate-report.json");
const safetyScan = await readJson("data/generated/safety-scan-report.json");
const releaseManifest = await readJson("data/generated/release-manifest.json");
const observability = await readJson("data/generated/observability-report.json");
const readiness = await readJson("data/generated/production-readiness-report.json");
const realLocalPilot = await readJson("data/generated/real-local-data-pilot-report.json");
const devGatewayDrill = await readJson("data/generated/dev-gateway-live-drill-report.json");
const finalBetaAudit = await readJson("data/generated/final-beta-audit-report.json");

const summary = {
  qualityGate: resultOf(qualityGate),
  safetyScan: resultOf(safetyScan),
  observabilityCritical: observability?.summary?.critical ?? 0,
  observabilityWarning: observability?.summary?.warning ?? 0,
  readinessRecommendation: readiness?.recommendation ?? "missing",
  realLocalPilot: resultOf(realLocalPilot),
  devGatewayDrill: devGatewayDrill?.summary?.failed === 0 ? "pass" : "warning"
};

const report = {
  reportId: `operator-daily-summary-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  language: "zh-Hant",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  productionStatus: "no-go-for-production",
  summary,
  dailyChecklist: [
    "Run local quality gate.",
    "Review safety scan result.",
    "Review Observability alert preview.",
    "Review Production readiness no-go blockers.",
    "Refresh real local snapshot if local source files changed.",
    "Run dev gateway read-only live drill when fixture server is available.",
    "Capture local evidence manifest before handoff."
  ],
  recommendedOperatorActions: [
    summary.qualityGate === "pass" ? "Quality gate is pass; continue local review." : "Rerun quality gate and inspect failures.",
    summary.safetyScan === "pass" ? "Safety scan is pass; keep guardrails unchanged." : "Inspect safety scan findings before handoff.",
    "Keep production recommendation no-go-for-production until required blockers are cleared.",
    "Do not submit action drafts; keep all actions local-only."
  ],
  evidenceRefs: [
    "apps/dashboard/data/generated/quality-gate-report.json",
    "apps/dashboard/data/generated/safety-scan-report.json",
    "apps/dashboard/data/generated/observability-report.json",
    "apps/dashboard/data/generated/production-readiness-report.json",
    "apps/dashboard/data/generated/real-local-data-pilot-report.json",
    "apps/dashboard/data/generated/dev-gateway-live-drill-report.json",
    "apps/dashboard/data/generated/final-beta-audit-report.json"
  ],
  knownBlockers: readiness?.requiredBeforeProduction ?? [
    "real auth design review",
    "production gateway security review",
    "secrets management plan",
    "operator signoff"
  ],
  sourceReports: {
    releaseManifest: releaseManifest ? "present" : "missing",
    finalBetaAudit: finalBetaAudit ? "present" : "missing"
  }
};

const body = `${JSON.stringify(report, null, 2)}\n`;
const issues = assertSafeBody(body);
if (report.productionStatus !== "no-go-for-production") issues.push("productionStatus must remain no-go-for-production");
if (issues.length) {
  console.error("OpenClaw operator daily summary generation failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");
console.log("OpenClaw operator daily summary generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
