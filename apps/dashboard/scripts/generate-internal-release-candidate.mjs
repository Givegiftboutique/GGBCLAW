import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "internal-release-candidate-report.json");

const reportRefs = {
  qualityGate: "apps/dashboard/data/generated/quality-gate-report.json",
  safetyScan: "apps/dashboard/data/generated/safety-scan-report.json",
  finalBetaAudit: "apps/dashboard/data/generated/final-beta-audit-report.json",
  productionReadiness: "apps/dashboard/data/generated/production-readiness-report.json",
  securityPrivacyAudit: "apps/dashboard/data/generated/security-privacy-audit-report.json",
  dataRetentionReview: "apps/dashboard/data/generated/data-retention-review-report.json",
  operatorSecurityChecklist: "apps/dashboard/data/generated/operator-security-checklist.json",
  operatorDailySummary: "apps/dashboard/data/generated/operator-daily-summary.json",
  incidentDrill: "apps/dashboard/data/generated/operator-incident-drill-report.json",
  evidenceManifest: "apps/dashboard/data/generated/operator-evidence-manifest.json",
  internalStaticHostingDryRun: "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  operatorAccessChecklist: "apps/dashboard/data/generated/operator-access-checklist.json",
  realLocalDataPilot: "apps/dashboard/data/generated/real-local-data-pilot-report.json",
  devGatewayLiveDrill: "apps/dashboard/data/generated/dev-gateway-live-drill-report.json"
};

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(repoRoot, relativePath), "utf8"));
}

async function summarizeReport(name, relativePath) {
  try {
    const data = await readJson(relativePath);
    return {
      name,
      path: relativePath,
      present: true,
      generatedAt: data.generatedAt ?? null,
      result: data.result ?? data.auditStatus ?? data.recommendation ?? data.overallStatus ?? data.status ?? "available",
      safetyMode: data.safetyMode ?? data.dashboard?.safetyMode ?? null,
      mutationEnabled: data.mutationEnabled ?? data.dashboard?.mutationEnabled ?? null,
      productionWiring: data.productionWiring ?? data.dashboard?.productionWiring ?? null
    };
  } catch (error) {
    return {
      name,
      path: relativePath,
      present: false,
      result: "missing",
      generatedAt: null,
      note: error.message
    };
  }
}

const requiredEvidence = [];
for (const [name, path] of Object.entries(reportRefs)) {
  requiredEvidence.push(await summarizeReport(name, path));
}

const readiness = await readJson(reportRefs.productionReadiness);
const qualityGate = await readJson(reportRefs.qualityGate);
const safetyScan = await readJson(reportRefs.safetyScan);
const securityAudit = await readJson(reportRefs.securityPrivacyAudit);
const retention = await readJson(reportRefs.dataRetentionReview);

const releaseChecks = [
  { name: "quality gate", result: qualityGate.result === "pass" ? "pass" : "warning", evidence: reportRefs.qualityGate },
  { name: "safety scan", result: safetyScan.result === "pass" ? "pass" : "warning", evidence: reportRefs.safetyScan },
  { name: "security privacy audit", result: ["pass", "warning"].includes(securityAudit.auditStatus) ? "pass" : "warning", evidence: reportRefs.securityPrivacyAudit },
  { name: "data retention review", result: retention.retentionPolicyStatus === "draft-for-internal-review" ? "pass" : "warning", evidence: reportRefs.dataRetentionReview },
  { name: "production readiness", result: readiness.recommendation === "no-go-for-production" ? "pass" : "warning", evidence: reportRefs.productionReadiness },
  { name: "manual sign-off", result: "pending", evidence: "apps/dashboard/data/generated/internal-signoff-package.json" }
];

const report = {
  reportId: `internal-release-candidate-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  releaseCandidate: "v1.0.0-internal-rc1",
  scope: "internal-operator-use",
  internalStatus: "release-candidate",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  supportedSources: ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"],
  requiredEvidence,
  releaseChecks,
  knownBlockersBeforeProduction: readiness.requiredBeforeProduction ?? [
    "real auth design review",
    "production gateway security review",
    "secrets management plan",
    "operator signoff",
    "backup restore drill",
    "incident response plan",
    "deployment owner",
    "rollback owner",
    "monitoring owner"
  ],
  manualSignoffRequired: true,
  signoffStatus: "pending",
  recommendedTags: {
    releaseCandidate: "v1.0.0-internal-rc1",
    finalInternal: "v1.0.0-internal"
  }
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw internal release candidate report generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
