import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "production-entry-gates-report.json");

const gates = [
  { gateId: "internal-v1-tag", title: "internal v1 tag exists", status: "pass", evidence: "v1.0.0-internal" },
  { gateId: "security-privacy-reviewed", title: "security/privacy audit reviewed", status: "blocked", evidence: "manual security reviewer approval required" },
  { gateId: "data-retention-reviewed", title: "data retention reviewed", status: "blocked", evidence: "retention policy remains draft-for-internal-review" },
  { gateId: "gateway-contract-approved", title: "production gateway contract approved", status: "blocked", evidence: "contract review not complete" },
  { gateId: "fixture-quarantine-single-agent", title: "Fixture Quarantine + Single Agent Truth Alignment", status: "blocked", evidence: "current real operator environment is expected to have only 1 real agent; 8-agent data is fixture test data only" },
  { gateId: "secrets-architecture-approved", title: "secrets architecture approved", status: "blocked", evidence: "frontend must not hold secrets" },
  { gateId: "auth-rbac-approved", title: "auth/RBAC architecture approved", status: "blocked", evidence: "current RBAC is simulation only" },
  { gateId: "readonly-dry-run-complete", title: "read-only gateway dry run completed", status: "blocked", evidence: "no production gateway drill has been run" },
  { gateId: "monitoring-approved", title: "production monitoring plan approved", status: "blocked", evidence: "monitoring owner required" },
  { gateId: "incident-owner", title: "incident response owner assigned", status: "blocked", evidence: "owner placeholder only" },
  { gateId: "rollback-approved", title: "rollback plan approved", status: "blocked", evidence: "rollback owner required" },
  { gateId: "deploy-plan-approved", title: "production deploy plan approved", status: "blocked", evidence: "deployment owner and plan required" },
  { gateId: "mutation-future-only", title: "controlled mutation plan future only", status: "future-only", evidence: "not in production entry scope" }
];

const report = {
  reportId: `production-entry-gates-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "production-entry-gates",
  productionStatus: "no-go-for-production",
  entryGateStatus: "blocked",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  gates,
  hardBlockers: gates.filter((gate) => gate.status === "blocked").map((gate) => gate.title),
  manualSignoffs: [
    "operator-owner",
    "technical-owner",
    "security-reviewer",
    "business-owner",
    "deployment-owner",
    "rollback-owner",
    "monitoring-owner"
  ],
  futureOnlyItems: [
    "read-only production gateway implementation after fixture quarantine",
    "controlled mutation design",
    "production deployment automation",
    "external alert delivery",
    "production gateway connection"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw production entry gates generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
