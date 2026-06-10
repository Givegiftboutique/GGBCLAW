import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "final-beta-audit-report.json");

const relativeReports = {
  qualityGate: "apps/dashboard/data/generated/quality-gate-report.json",
  safetyScan: "apps/dashboard/data/generated/safety-scan-report.json",
  releaseManifest: "apps/dashboard/data/generated/release-manifest.json",
  observability: "apps/dashboard/data/generated/observability-report.json",
  productionReadiness: "apps/dashboard/data/generated/production-readiness-report.json"
};

async function readJsonFromRepo(relativePath) {
  const absolute = resolve(dashboardRoot, "../..", relativePath);
  return JSON.parse(await readFile(absolute, "utf8"));
}

async function optionalSummary(relativePath) {
  try {
    const data = await readJsonFromRepo(relativePath);
    return {
      present: true,
      result: data.result ?? data.recommendation ?? data.dashboard?.mode ?? "available",
      generatedAt: data.generatedAt ?? null
    };
  } catch (error) {
    return {
      present: false,
      result: "missing",
      generatedAt: null,
      note: error.message
    };
  }
}

const reportSummaries = {};
for (const [key, relativePath] of Object.entries(relativeReports)) {
  reportSummaries[key] = await optionalSummary(relativePath);
}

const productionReadiness = await readJsonFromRepo(relativeReports.productionReadiness);

const report = {
  reportId: `dashboard-final-beta-audit-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  statusNote: "Internal operator beta only; production remains blocked.",
  overallStatus: "internal-beta-ready",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  supportedSources: ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"],
  requiredReports: relativeReports,
  reportSummaries,
  completedMilestones: [
    "Phase 01 scaffold and visual verification",
    "Phase 02 read-only data adapter layer",
    "Phase 03 local JSON and artifact sources",
    "Phase 04 import/export contract and snapshot generator",
    "Phase 05 local quality gates and safety scan",
    "Phase 06 operator runbook and UX polish",
    "Phase 07 read-only gateway contract stub",
    "Phase 08 gateway contract tests and fixture diff",
    "Sprint 09A local ingest and read-only dev gateway",
    "Sprint 11A RBAC simulation and safe action drafts",
    "Sprint 12A internal release workflow",
    "Sprint 14A observability preview and production readiness review"
  ],
  repoHygiene: {
    gitReviewRequired: true,
    gitReviewNote: "Run git status, git diff --stat, and git diff --name-only in Git Bash or VS Code terminal before commit.",
    usePrecisionGitAdd: true,
    doNotUseGitAddDot: true,
    oddRootCommandArtifactsAllowed: false,
    largeReleaseBundlesAllowed: false,
    docsEntrypoint: "docs/dashboard/README.md",
    hygieneDoc: "docs/dashboard/openclaw-dashboard-repo-hygiene.md"
  },
  operatorHandoff: {
    handoffDoc: "docs/dashboard/openclaw-dashboard-operator-handoff.md",
    runbook: "docs/dashboard/openclaw-dashboard-operator-runbook.md",
    releaseChecklist: "docs/dashboard/openclaw-dashboard-release-checklist.md",
    troubleshooting: "docs/dashboard/openclaw-dashboard-troubleshooting.md",
    recommendedLocalUrl: "http://localhost:5173/?source=local-ingest#/dashboard",
    finalVerificationCommand: "node apps/dashboard/scripts/verify-final-beta.mjs"
  },
  knownProductionBlockers: productionReadiness.requiredBeforeProduction ?? [
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
  recommendedNextTracks: [
    "manual operator beta review",
    "real auth design proposal",
    "production gateway security review plan",
    "secrets management plan",
    "backup restore drill planning",
    "incident response and ownership plan"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw final beta audit report generated.");
