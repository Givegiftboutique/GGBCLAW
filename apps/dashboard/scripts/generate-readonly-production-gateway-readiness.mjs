import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "readonly-production-gateway-readiness-report.json");

const report = {
  reportId: `readonly-production-gateway-readiness-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "read-only-production-gateway-readiness",
  productionStatus: "no-go-for-production",
  gatewayConnectionStatus: "not-connected",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  readinessStatus: "not-ready",
  requiredControls: [
    "production gateway URL approval required",
    "network allowlist required",
    "Fixture Quarantine + Single Agent Truth Alignment required before any read-only production gateway implementation",
    "production track must not assume 8 real agents",
    "no browser-stored secrets",
    "frontend auth header remains absent until security design approval",
    "credentials remain omitted unless future approved architecture exists",
    "read-only GET endpoints only",
    "mutation endpoints not exposed",
    "fallback behavior documented"
  ],
  requiredGatewayContract: [
    "/dashboard/metrics GET",
    "/dashboard/agents GET",
    "/dashboard/agents/:id GET",
    "/dashboard/tasks GET",
    "/dashboard/tasks/:id GET",
    "/dashboard/reviews GET",
    "/dashboard/logs GET",
    "/dashboard/backups GET",
    "/dashboard/settings GET",
    "/dashboard/rbac GET",
    "/dashboard/source-status GET",
    "response schema stable",
    "source status endpoint required",
    "audit event endpoint read-only only"
  ],
  requiredSecurityControls: [
    "approved secrets architecture outside frontend code",
    "approved auth/RBAC architecture outside this scaffold",
    "browser credential mode reviewed before any future live connection",
    "no frontend key material",
    "no mutation method exposure",
    "security reviewer approval required"
  ],
  requiredOperationalControls: [
    "current real operator environment expected to have only 1 real agent",
    "8-agent mock / fixture / gateway-stub lifecycle data quarantined from operator truth",
    "operator incident response owner assigned",
    "rollback owner assigned",
    "monitoring owner assigned",
    "gateway fallback runbook approved",
    "quality gate and safety scan remain required before release",
    "manual go/no-go review remains required"
  ],
  blockedUntil: [
    "production gateway contract approved",
    "security and secrets architecture approved",
    "auth/RBAC architecture approved",
    "fixture data quarantined from operator truth",
    "single agent truth alignment completed",
    "read-only gateway dry run completed",
    "monitoring owner assigned",
    "rollback owner assigned",
    "incident response owner assigned"
  ],
  notAllowedYet: [
    "live production gateway connection",
    "frontend secret handling",
    "credentialed browser requests",
    "mutation endpoints",
    "production deployment",
    "automated production approval"
  ]
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw read-only production gateway readiness generated.");
console.log(`Report: ${relative(repoRoot, outputPath)}`);
