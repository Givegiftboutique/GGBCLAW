import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "data-retention-review-report.json");

const dataClasses = [
  ["generated reports", "beta evidence and local verification", "low-to-medium", "keep latest committed beta reports only", "regenerate locally; remove stale reports before sharing", true, true],
  ["dashboard snapshots", "static dashboard review data", "medium", "review before commit; keep latest approved snapshot", "delete snapshots containing private data", true, true],
  ["local ingest samples", "safe example ingest shapes", "low", "keep sanitized examples", "replace unsafe samples with placeholder values", true, false],
  ["operator evidence manifest", "relative evidence references", "low", "keep latest local manifest", "delete if refs point to private local files", true, true],
  ["incident drill report", "local incident rehearsal", "medium", "internal-only; review before sharing", "delete after handoff if no longer needed", true, true],
  ["daily summary", "operator daily review summary", "low-to-medium", "keep latest committed beta summary", "regenerate instead of preserving stale copies", true, true],
  ["release manifest", "local release handoff evidence", "low", "keep latest release manifest", "replace on next internal beta release", true, true],
  ["gateway fixture reports", "contract and fixture diff evidence", "low", "keep latest baseline and diff report", "regenerate only for intentional contract changes", true, true],
  ["local dev gateway drill reports", "localhost read-only drill evidence", "low", "keep latest drill report", "regenerate for new fixture drill", true, true],
  ["docs / runbooks", "operator guidance", "low", "keep as source-controlled docs", "update when process changes", true, true],
  ["task memory", "implementation memory", "low-to-medium", "keep task records", "avoid private data and machine paths", true, true],
  ["artifact notes", "task artifact references", "low", "keep notes only", "do not attach private raw data", true, true]
].map(([name, purpose, sensitivity, retention, cleanup, safeToCommit, operatorReviewRequired]) => ({
  name,
  purpose,
  sensitivity,
  recommendedRetention: retention,
  deletionCleanupNote: cleanup,
  safeToCommit,
  operatorReviewRequired
}));

const report = {
  reportId: `data-retention-review-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  retentionPolicyStatus: "draft-for-internal-review",
  dataClasses,
  recommendedRetention: [
    "generated reports: keep latest committed beta reports only",
    "local real snapshots: review before commit; avoid private data",
    "incident drill reports: internal-only; review before sharing",
    "evidence manifest: local-only references; no upload",
    "logs: summarize only; no raw secret-bearing logs"
  ],
  deletionGuidance: [
    "Delete generated reports that contain private data before commit.",
    "Regenerate sanitized reports instead of editing raw private values into docs.",
    "Remove stale local snapshots before sharing handoff bundles.",
    "Never commit runtime config files, secrets, private keys, raw credentials, or machine-local paths."
  ],
  operatorResponsibilities: [
    "Run quality gate, safety scan, verifier, and security privacy audit before handoff.",
    "Review generated reports before sharing.",
    "Keep production no-go visible until formal review clears blockers.",
    "Escalate suspected private data exposure for manual review."
  ],
  notAllowed: [
    "raw secret-bearing logs",
    "unreviewed private data",
    "absolute machine paths",
    "runtime config files",
    "production endpoints",
    "public sharing without review"
  ]
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw data retention review generated.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
