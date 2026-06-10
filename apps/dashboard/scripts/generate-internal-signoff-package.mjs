import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "internal-signoff-package.json");

const evidenceRefs = [
  "apps/dashboard/data/generated/internal-release-candidate-report.json",
  "apps/dashboard/data/generated/quality-gate-report.json",
  "apps/dashboard/data/generated/safety-scan-report.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/data/generated/security-privacy-audit-report.json",
  "apps/dashboard/data/generated/data-retention-review-report.json",
  "apps/dashboard/data/generated/operator-daily-summary.json",
  "apps/dashboard/data/generated/operator-incident-drill-report.json",
  "apps/dashboard/data/generated/operator-evidence-manifest.json",
  "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  "apps/dashboard/data/generated/operator-access-checklist.json",
  "apps/dashboard/data/generated/production-readiness-report.json"
];

const signoffChecklist = [
  "quality gate pass",
  "safety scan pass",
  "final beta verification pass",
  "security/privacy audit reviewed",
  "data retention reviewed",
  "operator workflow reviewed",
  "incident drill reviewed",
  "static hosting dry-run reviewed",
  "access checklist reviewed",
  "production readiness remains no-go",
  "rollback tag confirmed",
  "operator owner assigned",
  "monitoring owner assigned",
  "rollback owner assigned",
  "incident response owner assigned"
].map((name) => ({
  name,
  status: "pending-human-review",
  required: true
}));

const signoffPackage = {
  packageId: `internal-signoff-package-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  candidateTag: "v1.0.0-internal-rc1",
  finalInternalTag: "v1.0.0-internal",
  scope: "internal-operator-use",
  productionStatus: "no-go-for-production",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  signoffStatus: "pending",
  requiredReviewers: [
    "operator-owner",
    "technical-owner",
    "security-reviewer",
    "business-owner"
  ],
  signoffChecklist,
  evidenceRefs,
  manualApprovalNotes: [
    "Placeholder only; no approval has been granted by this generated package.",
    "Final internal tag requires human review in Git Bash or VS Code terminal.",
    "Production remains no-go-for-production after internal sign-off."
  ],
  notApprovedYet: true
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(signoffPackage, null, 2)}\n`, "utf8");

console.log("OpenClaw internal sign-off package generated.");
console.log(`Package: ${relative(repoRoot, outputPath)}`);
