import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const nodeExe = process.execPath;

const dashboardFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "src/lib/mock-data.js",
  "src/lib/mock-data.ts",
  "src/lib/adapters/types.js",
  "src/lib/adapters/mock-adapter.js",
  "src/lib/adapters/adapter-registry.js",
  "src/lib/adapters/validation.js",
  "src/lib/adapters/json-adapter.js",
  "src/lib/adapters/artifact-adapter.js",
  "src/lib/adapters/gateway-contract-mapper.js",
  "src/lib/adapters/gateway-contract-validation.js",
  "src/lib/adapters/gateway-stub-adapter.js",
  "src/lib/adapters/local-ingest-mapper.js",
  "src/lib/adapters/local-ingest-validation.js",
  "src/lib/adapters/local-ingest-adapter.js",
  "src/lib/adapters/dev-gateway-config.js",
  "src/lib/adapters/dev-gateway-client.js",
  "src/lib/adapters/dev-gateway-validation.js",
  "src/lib/adapters/dev-gateway-adapter.js",
  "src/lib/adapters/source-config.js",
  "src/lib/adapters/source-status.js",
  "src/lib/rbac/roles.js",
  "src/lib/rbac/permissions.js",
  "src/lib/rbac/rbac-policy.js",
  "src/lib/rbac/rbac-state.js",
  "src/lib/action-drafts/action-draft-types.js",
  "src/lib/action-drafts/action-draft-builder.js",
  "src/lib/action-drafts/action-draft-validation.js",
  "src/lib/action-drafts/action-draft-store.js",
  "src/lib/observability/observability-types.js",
  "src/lib/observability/observability-rules.js",
  "src/lib/observability/observability-evaluator.js",
  "src/lib/observability/observability-summary.js",
  "src/lib/readiness/readiness-types.js",
  "src/lib/readiness/readiness-checklist.js",
  "src/lib/readiness/readiness-evaluator.js",
  "src/lib/readiness/readiness-summary.js"
];

const requiredRepoFiles = [
  "apps/dashboard/index.html",
  "apps/dashboard/README.md",
  "apps/dashboard/src/lib/mock-data.ts",
  "apps/dashboard/src/lib/adapters/types.js",
  "apps/dashboard/src/lib/adapters/mock-adapter.js",
  "apps/dashboard/src/lib/adapters/adapter-registry.js",
  "apps/dashboard/src/lib/adapters/validation.js",
  "apps/dashboard/src/lib/adapters/json-adapter.js",
  "apps/dashboard/src/lib/adapters/artifact-adapter.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.js",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.js",
  "apps/dashboard/src/lib/adapters/local-ingest-mapper.js",
  "apps/dashboard/src/lib/adapters/local-ingest-validation.js",
  "apps/dashboard/src/lib/adapters/local-ingest-adapter.js",
  "apps/dashboard/src/lib/adapters/local-ingest-mapper.ts",
  "apps/dashboard/src/lib/adapters/local-ingest-validation.ts",
  "apps/dashboard/src/lib/adapters/local-ingest-adapter.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-config.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-config.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.ts",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.ts",
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/data/gateway-stub/metrics.json",
  "apps/dashboard/data/gateway-stub/agents.json",
  "apps/dashboard/data/gateway-stub/agent-detail.json",
  "apps/dashboard/data/gateway-stub/tasks.json",
  "apps/dashboard/data/gateway-stub/task-detail.json",
  "apps/dashboard/data/gateway-stub/reviews.json",
  "apps/dashboard/data/gateway-stub/logs.json",
  "apps/dashboard/data/gateway-stub/backups.json",
  "apps/dashboard/data/gateway-stub/settings.json",
  "apps/dashboard/data/gateway-stub/rbac.json",
  "apps/dashboard/data/gateway-stub/source-status.json",
  "apps/dashboard/data/gateway-stub/gateway-export.sample.json",
  "apps/dashboard/data/local-ingest/local-dashboard-ingest.sample.json",
  "apps/dashboard/data/local-ingest/crawler-output.sample.json",
  "apps/dashboard/data/local-ingest/agent-run-log.sample.json",
  "apps/dashboard/data/local-ingest/task-memory-index.sample.json",
  "apps/dashboard/data/local-ingest/artifact-index.sample.json",
  "apps/dashboard/data/dashboard-export.sample.json",
  "apps/dashboard/data/agent-registry.sample.json",
  "apps/dashboard/data/task-runs.sample.json",
  "apps/dashboard/data/audit-events.sample.json",
  "apps/dashboard/data/backup-manifests.sample.json",
  "apps/dashboard/data/dashboard-artifact-manifest.sample.json",
  "apps/dashboard/schema/dashboard-export.schema.json",
  "apps/dashboard/schema/artifact-manifest.schema.json",
  "apps/dashboard/schema/README.md",
  "apps/dashboard/scripts/generate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/validate-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/gateway-contract-utils.mjs",
  "apps/dashboard/scripts/generate-gateway-contract-baseline.mjs",
  "apps/dashboard/scripts/test-gateway-contract.mjs",
  "apps/dashboard/scripts/diff-gateway-fixtures.mjs",
  "apps/dashboard/scripts/test-local-ingest.mjs",
  "apps/dashboard/scripts/test-dev-gateway-config.mjs",
  "apps/dashboard/scripts/test-rbac-policy.mjs",
  "apps/dashboard/scripts/generate-action-draft-samples.mjs",
  "apps/dashboard/scripts/test-action-drafts.mjs",
  "apps/dashboard/scripts/generate-release-manifest.mjs",
  "apps/dashboard/scripts/create-local-release-bundle.mjs",
  "apps/dashboard/scripts/verify-local-release.mjs",
  "apps/dashboard/scripts/generate-observability-report.mjs",
  "apps/dashboard/scripts/test-observability.mjs",
  "apps/dashboard/scripts/generate-production-readiness-report.mjs",
  "apps/dashboard/scripts/test-production-readiness.mjs",
  "apps/dashboard/scripts/generate-final-beta-audit.mjs",
  "apps/dashboard/scripts/verify-final-beta.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  "apps/dashboard/src/lib/rbac/roles.js",
  "apps/dashboard/src/lib/rbac/permissions.js",
  "apps/dashboard/src/lib/rbac/rbac-policy.js",
  "apps/dashboard/src/lib/rbac/rbac-state.js",
  "apps/dashboard/src/lib/rbac/roles.ts",
  "apps/dashboard/src/lib/rbac/permissions.ts",
  "apps/dashboard/src/lib/rbac/rbac-policy.ts",
  "apps/dashboard/src/lib/rbac/rbac-state.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.ts",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.ts",
  "apps/dashboard/data/generated/action-drafts.sample.json",
  "apps/dashboard/data/generated/release-manifest.json",
  "apps/dashboard/data/generated/observability-report.json",
  "apps/dashboard/data/generated/production-readiness-report.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/release/README.md",
  "apps/dashboard/release/local-release-index.json",
  "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
  "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
  "docs/dashboard/openclaw-dashboard-design.md",
  "docs/dashboard/openclaw-dashboard-roadmap.md",
  "docs/dashboard/openclaw-dashboard-data-model.md",
  "docs/dashboard/openclaw-dashboard-api-contract.md",
  "docs/dashboard/openclaw-dashboard-gateway-contract.md",
  "docs/dashboard/openclaw-dashboard-local-ingest.md",
  "docs/dashboard/openclaw-dashboard-dev-gateway.md",
  "docs/dashboard/openclaw-dashboard-rbac.md",
  "docs/dashboard/openclaw-dashboard-action-drafts.md",
  "docs/dashboard/openclaw-dashboard-observability.md",
  "docs/dashboard/openclaw-dashboard-production-readiness.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "docs/dashboard/openclaw-dashboard-internal-deployment-plan.md",
  "docs/dashboard/openclaw-dashboard-operator-release-workflow.md",
  "docs/dashboard/openclaw-dashboard-ui-spec.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-006.md",
  "ops/tasks/TASK-20260609-OC-DASH-007.md",
  "ops/tasks/TASK-20260609-OC-DASH-008.md",
  "ops/tasks/TASK-20260609-OC-DASH-09A.md",
  "ops/tasks/TASK-20260609-OC-DASH-11A.md",
  "ops/tasks/TASK-20260609-OC-DASH-12A.md",
  "ops/tasks/TASK-20260609-OC-DASH-14A.md",
  "ops/tasks/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT.md",
  "ops/specs/dashboard-agent-registry-v1.md",
  "ops/specs/dashboard-task-workflow-v1.md",
  "ops/specs/dashboard-md-memory-v1.md",
  "artifacts/TASK-20260609-OC-DASH-001/README.md",
  "artifacts/TASK-20260609-OC-DASH-006/README.md",
  "artifacts/TASK-20260609-OC-DASH-007/README.md",
  "artifacts/TASK-20260609-OC-DASH-008/README.md",
  "artifacts/TASK-20260609-OC-DASH-09A/README.md",
  "artifacts/TASK-20260609-OC-DASH-11A/README.md",
  "artifacts/TASK-20260609-OC-DASH-12A/README.md",
  "artifacts/TASK-20260609-OC-DASH-14A/README.md",
  "artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md"
];

for (const file of dashboardFiles) {
  const body = await readFile(join(here, file), "utf8");
  if (!body.trim()) {
    throw new Error(`${file} is empty`);
  }
}

for (const file of requiredRepoFiles) {
  const body = await readFile(join(root, file), "utf8");
  if (!body.trim()) {
    throw new Error(`${file} is missing or empty`);
  }
}

const runtimeModule = await readFile(join(here, "src/lib/mock-data.js"), "utf8");
const adapterTypes = await readFile(join(here, "src/lib/adapters/types.js"), "utf8");
const validationModule = await readFile(join(here, "src/lib/adapters/validation.js"), "utf8");
const sourceConfigModule = await readFile(join(here, "src/lib/adapters/source-config.js"), "utf8");
const sourceStatusModule = await readFile(join(here, "src/lib/adapters/source-status.js"), "utf8");
const mockAdapterModule = await readFile(join(here, "src/lib/adapters/mock-adapter.js"), "utf8");
const jsonAdapterModule = await readFile(join(here, "src/lib/adapters/json-adapter.js"), "utf8");
const artifactAdapterModule = await readFile(join(here, "src/lib/adapters/artifact-adapter.js"), "utf8");
const gatewayMapperModule = await readFile(join(here, "src/lib/adapters/gateway-contract-mapper.js"), "utf8");
const gatewayValidationModule = await readFile(join(here, "src/lib/adapters/gateway-contract-validation.js"), "utf8");
const gatewayStubAdapterModule = await readFile(join(here, "src/lib/adapters/gateway-stub-adapter.js"), "utf8");
const localIngestMapperModule = await readFile(join(here, "src/lib/adapters/local-ingest-mapper.js"), "utf8");
const localIngestValidationModule = await readFile(join(here, "src/lib/adapters/local-ingest-validation.js"), "utf8");
const localIngestAdapterModule = await readFile(join(here, "src/lib/adapters/local-ingest-adapter.js"), "utf8");
const devGatewayConfigModule = await readFile(join(here, "src/lib/adapters/dev-gateway-config.js"), "utf8");
const devGatewayClientModule = await readFile(join(here, "src/lib/adapters/dev-gateway-client.js"), "utf8");
const devGatewayValidationModule = await readFile(join(here, "src/lib/adapters/dev-gateway-validation.js"), "utf8");
const devGatewayAdapterModule = await readFile(join(here, "src/lib/adapters/dev-gateway-adapter.js"), "utf8");
const rbacPermissionsModule = await readFile(join(here, "src/lib/rbac/permissions.js"), "utf8");
const rbacRolesModule = await readFile(join(here, "src/lib/rbac/roles.js"), "utf8");
const rbacPolicyModule = await readFile(join(here, "src/lib/rbac/rbac-policy.js"), "utf8");
const rbacStateModule = await readFile(join(here, "src/lib/rbac/rbac-state.js"), "utf8");
const actionDraftTypesModule = await readFile(join(here, "src/lib/action-drafts/action-draft-types.js"), "utf8");
const actionDraftBuilderModule = await readFile(join(here, "src/lib/action-drafts/action-draft-builder.js"), "utf8");
const actionDraftValidationModule = await readFile(join(here, "src/lib/action-drafts/action-draft-validation.js"), "utf8");
const actionDraftStoreModule = await readFile(join(here, "src/lib/action-drafts/action-draft-store.js"), "utf8");
const observabilityTypesModule = await readFile(join(here, "src/lib/observability/observability-types.js"), "utf8");
const observabilityRulesModule = await readFile(join(here, "src/lib/observability/observability-rules.js"), "utf8");
const observabilitySummaryModule = await readFile(join(here, "src/lib/observability/observability-summary.js"), "utf8");
const observabilityEvaluatorModule = await readFile(join(here, "src/lib/observability/observability-evaluator.js"), "utf8");
const readinessTypesModule = await readFile(join(here, "src/lib/readiness/readiness-types.js"), "utf8");
const readinessChecklistModule = await readFile(join(here, "src/lib/readiness/readiness-checklist.js"), "utf8");
const readinessSummaryModule = await readFile(join(here, "src/lib/readiness/readiness-summary.js"), "utf8");
const readinessEvaluatorModule = await readFile(join(here, "src/lib/readiness/readiness-evaluator.js"), "utf8");
const adapterRegistryModule = await readFile(join(here, "src/lib/adapters/adapter-registry.js"), "utf8");
const requiredAgents = [
  "Orchestrator Agent",
  "Research Agent",
  "Spec Agent",
  "Builder Agent",
  "Reviewer Agent",
  "Release Agent",
  "Monitor Agent",
  "Backup Audit Agent"
];

for (const agent of requiredAgents) {
  if (!runtimeModule.includes(agent)) {
    throw new Error(`Missing mock agent: ${agent}`);
  }
}

const requiredAgentFields = [
  "role",
  "responsibilities",
  "allowedActions",
  "deniedActions",
  "workspace",
  "toolsProfile",
  "riskLevel"
];

for (const field of requiredAgentFields) {
  if (!runtimeModule.includes(`${field}:`)) {
    throw new Error(`Missing agent profile field: ${field}`);
  }
}

const app = await readFile(join(here, "src/app.js"), "utf8");
const html = await readFile(join(here, "index.html"), "utf8");
const dashboardReadme = await readFile(join(here, "README.md"), "utf8");
const docsIndex = await readFile(join(root, "docs/dashboard/README.md"), "utf8");
const qualityGateScript = await readFile(join(here, "scripts/run-dashboard-quality-gates.mjs"), "utf8");
const safetyScanScript = await readFile(join(here, "scripts/safety-scan-dashboard.mjs"), "utf8");
if (!app.includes("getDashboardDataAdapter") || !app.includes("dashboardAdapter.getAgents") || !app.includes("dashboardAdapter.getTasks")) {
  throw new Error("app.js must read dashboard data through the adapter registry.");
}

for (const marker of ["types.js", "validation.js", "mock-adapter.js", "adapter-registry.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load adapter file: ${marker}`);
  }
}

for (const marker of ["json-adapter.js", "artifact-adapter.js", "source-config.js", "source-status.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Phase 03 adapter file: ${marker}`);
  }
}

for (const marker of ["gateway-contract-mapper.js", "gateway-contract-validation.js", "gateway-stub-adapter.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Phase 07 gateway file: ${marker}`);
  }
}

for (const marker of ["local-ingest-mapper.js", "local-ingest-validation.js", "local-ingest-adapter.js", "dev-gateway-config.js", "dev-gateway-client.js", "dev-gateway-validation.js", "dev-gateway-adapter.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Sprint 09A adapter file: ${marker}`);
  }
}

for (const marker of ["rbac/permissions.js", "rbac/roles.js", "rbac/rbac-policy.js", "rbac/rbac-state.js", "action-drafts/action-draft-types.js", "action-drafts/action-draft-builder.js", "action-drafts/action-draft-validation.js", "action-drafts/action-draft-store.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Sprint 11A file: ${marker}`);
  }
}

for (const marker of ["observability/observability-types.js", "observability/observability-rules.js", "observability/observability-summary.js", "observability/observability-evaluator.js", "readiness/readiness-types.js", "readiness/readiness-checklist.js", "readiness/readiness-summary.js", "readiness/readiness-evaluator.js"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Sprint 14A file: ${marker}`);
  }
}

if (!app.includes("parseDashboardSourceConfig") || !app.includes("sourceStatus") || !app.includes("Data source")) {
  throw new Error("app.js must support source query strings and source status UI.");
}

if (!app.includes("gateway-stub") || !app.includes("Production wiring")) {
  throw new Error("app.js must render gateway-stub and production wiring status markers.");
}

for (const marker of ["local-ingest", "dev-gateway", "Mutation enabled", "Ingest file", "Base URL"]) {
  if (!app.includes(marker) && !sourceConfigModule.includes(marker)) {
    throw new Error(`Missing Sprint 09A source marker: ${marker}`);
  }
}

for (const marker of ["test-gateway-contract.mjs", "diff-gateway-fixtures.mjs", "gatewayContractTests", "gatewayFixtureDiff", "gatewayBaselinePath", "gatewayDiffReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Phase 08 marker: ${marker}`);
  }
}

for (const marker of ["test-local-ingest.mjs", "test-dev-gateway-config.mjs", "localIngestTests", "devGatewayConfigTests"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 09A marker: ${marker}`);
  }
}

for (const marker of ["test-rbac-policy.mjs", "generate-action-draft-samples.mjs", "test-action-drafts.mjs", "rbacPolicyTests", "actionDraftTests"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 11A marker: ${marker}`);
  }
}

for (const marker of ["generate-release-manifest.mjs", "create-local-release-bundle.mjs", "verify-local-release.mjs", "releaseManifest", "localReleaseBundle", "releaseVerification"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 12A marker: ${marker}`);
  }
}

for (const marker of ["generate-observability-report.mjs", "test-observability.mjs", "generate-production-readiness-report.mjs", "test-production-readiness.mjs", "observabilityReport", "observabilityTests", "productionReadinessReport", "productionReadinessTests"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 14A marker: ${marker}`);
  }
}

for (const marker of ["generate-final-beta-audit.mjs", "verify-final-beta.mjs", "finalBetaAudit", "finalBetaVerification"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing final beta marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/data/gateway-stub", "gateway-fixture-diff-report.json", "secret-like-assignment", "forbiddenMutationFunctions"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Phase 08 marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/data/local-ingest", "authorization-header", "credentials-include", "browser-token-storage", "mutation-http-method", "unsafe-dev-baseurl"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 09A marker: ${marker}`);
  }
}

for (const marker of ["real-auth-provider", "forbidden-mutation-permission", "action-drafts.sample.json"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 11A marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/release", "release-manifest.json", "active-deploy-function", "github-actions-workflow", "production-hosting-default"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 12A marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/src/lib/observability", "apps/dashboard/src/lib/readiness", "observability-report.json", "production-readiness-report.json", "external-notification-send", "production-ready-recommendation"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 14A marker: ${marker}`);
  }
}

for (const marker of ["final-beta-audit-report.json", "openclaw-dashboard-repo-hygiene.md", "openclaw-dashboard-operator-handoff.md", "docs/dashboard/README.md", "large-release-bundle"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing final beta marker: ${marker}`);
  }
}

for (const marker of ["Internal Operator Beta", "Production: no-go", "Safety mode: read-only", "Mutation enabled: false", "Production wiring: disabled"]) {
  if (!dashboardReadme.includes(marker)) {
    throw new Error(`README missing final beta marker: ${marker}`);
  }
}

for (const marker of ["Quick start", "Source modes", "Operator handoff", "Repo hygiene", "Production readiness"]) {
  if (!docsIndex.toLowerCase().includes(marker.toLowerCase())) {
    throw new Error(`Docs index missing final beta marker: ${marker}`);
  }
}

if (!app.includes("Import / Export Contract") || !app.includes("Mutation enabled") || !app.includes("false")) {
  throw new Error("app.js must render the read-only Import / Export Contract section.");
}

const requiredRoutes = [
  "/dashboard",
  "/dashboard/agents",
  "/dashboard/tasks",
  "/dashboard/reviews",
  "/dashboard/logs",
  "/dashboard/backups",
  "/dashboard/observability",
  "/dashboard/settings",
  "/dashboard/rbac",
  "/dashboard/help"
];

for (const route of requiredRoutes) {
  if (!app.includes(route)) {
    throw new Error(`Missing route: ${route}`);
  }
}

const requiredRouteLabels = ["Overview", "Agents", "Tasks", "Reviews", "Logs", "Backups", "Observability", "Settings", "RBAC", "Runbook"];
for (const label of requiredRouteLabels) {
  if (!app.includes(`label: "${label}"`)) {
    throw new Error(`Missing route label: ${label}`);
  }
}

const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
for (const status of lifecycle) {
  if (!runtimeModule.includes(`"${status}"`) || !app.includes(`"${status}"`)) {
    throw new Error(`Missing task lifecycle status: ${status}`);
  }
}

const safetyChecks = [
  "<button disabled>Approve mock</button>",
  "<button disabled>Reject mock</button>",
  "mutation disabled",
  "Production mutation",
  "read-only",
  "mock evidence"
];

for (const text of safetyChecks) {
  if (!app.includes(text)) {
    throw new Error(`Missing safety UI text: ${text}`);
  }
}

const visibleMarkers = [
  "Overview",
  "Agents",
  "Tasks",
  "Reviews",
  "Logs",
  "Backups",
  "Observability",
  "Settings",
  "RBAC",
  "Runbook",
  "Production mutations disabled",
  "read-only",
  "mock-only scaffold",
  "Quality gate status",
  "Data source",
  "Health",
  "Validation",
  "Fallback",
  "Fallback reason",
  "Safety mode",
  "Production wiring",
  "gateway-stub",
  "local-ingest",
  "dev-gateway",
  "Mutation enabled",
  "Ingest file",
  "Base URL",
  "Role matrix",
  "Permission matrix",
  "Read-only role simulation",
  "simulated only",
  "no real auth",
  "no token",
  "no cookie",
  "no production permissions",
  "Generate approve draft",
  "Generate reject draft",
  "Generate needs changes draft",
  "Generate backup verification draft",
  "Generate settings change request draft",
  "Action draft preview",
  "dryRun",
  "mutationEnabled",
  "productionWiring",
  "notSubmitted",
  "requiresHumanApproval",
  "Release / Health",
  "Release mode",
  "static-read-only",
  "release-manifest.json",
  "local-release-index.json",
  "Rollback tag suggestion",
  "Deploy disabled in scaffold",
  "Production release requires manual approval",
  "Observability summary",
  "Alert preview list",
  "local-preview-only",
  "notificationSent false",
  "Acknowledge disabled in scaffold",
  "External alert delivery disabled",
  "Production readiness summary",
  "no-go-for-production",
  "internal-operator-beta",
  "production deploy false",
  "Last loaded",
  "Import / Export Contract",
  "What this dashboard is",
  "What this dashboard is not",
  "Safe operating rules",
  "do not connect production API",
  "do not enable mutation",
  "do not read secrets",
  "do not commit junk root files"
];

for (const marker of visibleMarkers) {
  if (!html.includes(marker) && !app.includes(marker)) {
    throw new Error(`Missing visible marker: ${marker}`);
  }
}

const forbiddenPatterns = [
  /password\s*[:=]/i,
  /token\s*[:=]/i,
  /cookie\s*[:=]/i,
  /api[_-]?key\s*[:=]/i,
  /https?:\/\/(?!localhost|127\.0\.0\.1)/i
];

const forbiddenActiveMutations = [
  "approveReview",
  "rejectReview",
  "runBackup",
  "restoreBackup",
  "updateSettings",
  "deleteTask",
  "cancelTask",
  "importSnapshot",
  "exportSnapshotToProduction",
  "connectProductionGateway",
  "productionGatewayClient",
  "fetchProduction",
  "writeGateway",
  "mutateGateway",
  "sendWebhook",
  "sendSlack",
  "sendEmail",
  "sendSms",
  "deliverNotification"
];
const activeMutationSources = new Map([
  ["app.js", app],
  ["types.js", adapterTypes],
  ["mock-adapter.js", mockAdapterModule],
  ["json-adapter.js", jsonAdapterModule],
  ["artifact-adapter.js", artifactAdapterModule],
  ["source-config.js", sourceConfigModule],
  ["source-status.js", sourceStatusModule],
  ["gateway-contract-mapper.js", gatewayMapperModule],
  ["gateway-contract-validation.js", gatewayValidationModule],
  ["gateway-stub-adapter.js", gatewayStubAdapterModule],
  ["local-ingest-mapper.js", localIngestMapperModule],
  ["local-ingest-validation.js", localIngestValidationModule],
  ["local-ingest-adapter.js", localIngestAdapterModule],
  ["dev-gateway-config.js", devGatewayConfigModule],
  ["dev-gateway-client.js", devGatewayClientModule],
  ["dev-gateway-validation.js", devGatewayValidationModule],
  ["dev-gateway-adapter.js", devGatewayAdapterModule],
  ["rbac-permissions.js", rbacPermissionsModule],
  ["rbac-roles.js", rbacRolesModule],
  ["rbac-policy.js", rbacPolicyModule],
  ["rbac-state.js", rbacStateModule],
  ["action-draft-types.js", actionDraftTypesModule],
  ["action-draft-builder.js", actionDraftBuilderModule],
  ["action-draft-validation.js", actionDraftValidationModule],
  ["action-draft-store.js", actionDraftStoreModule],
  ["observability-types.js", observabilityTypesModule],
  ["observability-rules.js", observabilityRulesModule],
  ["observability-summary.js", observabilitySummaryModule],
  ["observability-evaluator.js", observabilityEvaluatorModule],
  ["readiness-types.js", readinessTypesModule],
  ["readiness-checklist.js", readinessChecklistModule],
  ["readiness-summary.js", readinessSummaryModule],
  ["readiness-evaluator.js", readinessEvaluatorModule],
  ["adapter-registry.js", adapterRegistryModule],
  ["validation.js", validationModule]
]);

for (const [file, body] of activeMutationSources) {
  for (const mutation of forbiddenActiveMutations) {
    if (new RegExp(`\\b${mutation}\\s*\\(`).test(body) || new RegExp(`\\b${mutation}\\s*[:=]\\s*function`).test(body)) {
      throw new Error(`Forbidden active mutation function found in ${file}: ${mutation}`);
    }
  }
}

const scannedFiles = new Map();
for (const file of dashboardFiles) {
  scannedFiles.set(file, await readFile(join(here, file), "utf8"));
}

for (const [file, body] of scannedFiles) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(body)) {
      throw new Error(`Secret-like pattern found in ${file}: ${pattern}`);
    }
  }
}

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = tagName;
    this.id = id;
    this.dataset = {};
    this.listeners = {};
    this.value = "";
    this.className = "";
    this.textContent = "";
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  addEventListener(type, callback) {
    this.listeners[type] = callback;
  }
}

const elements = {
  navList: new FakeElement("nav", "navList"),
  routeView: new FakeElement("section", "routeView"),
  pageTitle: new FakeElement("h1", "pageTitle"),
  statusStrip: new FakeElement("div", "statusStrip")
};

const fakeDocument = {
  title: "OpenClaw Dashboard",
  querySelector(selector) {
    if (selector === "#navList") return elements.navList;
    if (selector === "#routeView") return elements.routeView;
    if (selector === "#pageTitle") return elements.pageTitle;
    if (selector === "#statusStrip") return elements.statusStrip;
    if (selector === "#taskStatus" || selector === "#taskPriority" || selector === "#logSearch" || selector === "#logSeverity") return null;
    return null;
  },
  querySelectorAll(selector) {
    if (selector === "[data-route]") {
      return requiredRouteLabels.map((label) => {
        const button = new FakeElement("button");
        button.dataset.route = label.toLowerCase();
        return button;
      });
    }
    if (selector === "[data-agent-id]" || selector === "[data-task-id]") {
      return [];
    }
    return [];
  }
};

const windowEventListeners = new Map();
const context = vm.createContext({
  window: {
    location: { hash: "", search: "" },
    addEventListener(type, callback) {
      windowEventListeners.set(type, callback);
    }
  },
  document: fakeDocument,
  history: {
    replaceState() {}
  },
  fetch: async (url) => {
    const text = await readFile(join(here, String(url).replace(/^\.\//, "")), "utf8");
    return {
      ok: true,
      status: 200,
      async json() {
        return JSON.parse(text);
      }
    };
  },
  URLSearchParams,
  console
});

vm.runInContext(runtimeModule, context, { filename: "mock-data.js" });
vm.runInContext(adapterTypes, context, { filename: "types.js" });
vm.runInContext(validationModule, context, { filename: "validation.js" });
vm.runInContext(sourceConfigModule, context, { filename: "source-config.js" });
vm.runInContext(sourceStatusModule, context, { filename: "source-status.js" });
vm.runInContext(mockAdapterModule, context, { filename: "mock-adapter.js" });
vm.runInContext(jsonAdapterModule, context, { filename: "json-adapter.js" });
vm.runInContext(artifactAdapterModule, context, { filename: "artifact-adapter.js" });
vm.runInContext(gatewayMapperModule, context, { filename: "gateway-contract-mapper.js" });
vm.runInContext(gatewayValidationModule, context, { filename: "gateway-contract-validation.js" });
vm.runInContext(gatewayStubAdapterModule, context, { filename: "gateway-stub-adapter.js" });
vm.runInContext(localIngestMapperModule, context, { filename: "local-ingest-mapper.js" });
vm.runInContext(localIngestValidationModule, context, { filename: "local-ingest-validation.js" });
vm.runInContext(localIngestAdapterModule, context, { filename: "local-ingest-adapter.js" });
vm.runInContext(devGatewayConfigModule, context, { filename: "dev-gateway-config.js" });
vm.runInContext(devGatewayClientModule, context, { filename: "dev-gateway-client.js" });
vm.runInContext(devGatewayValidationModule, context, { filename: "dev-gateway-validation.js" });
vm.runInContext(devGatewayAdapterModule, context, { filename: "dev-gateway-adapter.js" });
vm.runInContext(adapterRegistryModule, context, { filename: "adapter-registry.js" });
vm.runInContext(rbacPermissionsModule, context, { filename: "rbac-permissions.js" });
vm.runInContext(rbacRolesModule, context, { filename: "rbac-roles.js" });
vm.runInContext(rbacPolicyModule, context, { filename: "rbac-policy.js" });
vm.runInContext(rbacStateModule, context, { filename: "rbac-state.js" });
vm.runInContext(actionDraftTypesModule, context, { filename: "action-draft-types.js" });
vm.runInContext(actionDraftBuilderModule, context, { filename: "action-draft-builder.js" });
vm.runInContext(actionDraftValidationModule, context, { filename: "action-draft-validation.js" });
vm.runInContext(actionDraftStoreModule, context, { filename: "action-draft-store.js" });
vm.runInContext(observabilityTypesModule, context, { filename: "observability-types.js" });
vm.runInContext(observabilityRulesModule, context, { filename: "observability-rules.js" });
vm.runInContext(observabilitySummaryModule, context, { filename: "observability-summary.js" });
vm.runInContext(observabilityEvaluatorModule, context, { filename: "observability-evaluator.js" });
vm.runInContext(readinessTypesModule, context, { filename: "readiness-types.js" });
vm.runInContext(readinessChecklistModule, context, { filename: "readiness-checklist.js" });
vm.runInContext(readinessSummaryModule, context, { filename: "readiness-summary.js" });
vm.runInContext(readinessEvaluatorModule, context, { filename: "readiness-evaluator.js" });
vm.runInContext(app, context, { filename: "app.js" });
await new Promise((resolve) => setTimeout(resolve, 0));

const adapter = context.window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
for (const method of ["getMetrics", "getAgents", "getAgentById", "getTasks", "getTaskById", "getReviews", "getLogs", "getBackups", "getSettings", "getRbacSummary"]) {
  if (typeof adapter[method] !== "function") {
    throw new Error(`Rendered adapter missing method: ${method}`);
  }
}

if (!elements.navList.innerHTML.includes("Overview") || !elements.navList.innerHTML.includes("RBAC") || !elements.navList.innerHTML.includes("Runbook")) {
  throw new Error("Dashboard nav did not render required labels.");
}

const renderedOverview = elements.routeView.innerHTML;
for (const marker of ["Gateway status", "Active agents", "Running tasks", "Failed / lost", "Backup verification", "Recent activity", "Quality gate status"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Overview did not render marker: ${marker}`);
  }
}

for (const marker of ["Data source", "Health", "Validation", "Fallback", "Fallback reason", "Safety mode", "Last loaded"]) {
  if (!elements.statusStrip.innerHTML.includes(marker) && !renderedOverview.includes(marker)) {
    throw new Error(`Source status UI missing marker: ${marker}`);
  }
}

context.window.location.hash = "#/dashboard/help";
windowEventListeners.get("hashchange")?.();
const renderedRunbook = elements.routeView.innerHTML;
for (const marker of ["Operator runbook", "What this dashboard is", "What this dashboard is not", "Safe operating rules", "Data sources", "How to run local server", "How to run quality gates", "How to generate snapshot", "How to validate snapshot", "What to do if dashboard is blank", "What to do if source validation fails", "What to do if Git has odd root-level files", "What not to do"]) {
  if (!renderedRunbook.includes(marker)) {
    throw new Error(`Runbook route did not render marker: ${marker}`);
  }
}

context.window.location.hash = "#/dashboard/observability";
windowEventListeners.get("hashchange")?.();
const renderedObservability = elements.routeView.innerHTML;
for (const marker of ["Observability summary", "Alert preview list", "local-preview-only", "notificationSent false", "Production readiness summary", "no-go-for-production", "Acknowledge disabled in scaffold", "External alert delivery disabled"]) {
  if (!renderedObservability.includes(marker)) {
    throw new Error(`Observability route did not render marker: ${marker}`);
  }
}

const dashboardExport = JSON.parse(await readFile(join(here, "data/dashboard-export.sample.json"), "utf8"));
const artifactManifest = JSON.parse(await readFile(join(here, "data/dashboard-artifact-manifest.sample.json"), "utf8"));
const gatewayExport = JSON.parse(await readFile(join(here, "data/gateway-stub/gateway-export.sample.json"), "utf8"));
for (const sample of ["agent-registry.sample.json", "task-runs.sample.json", "audit-events.sample.json", "backup-manifests.sample.json"]) {
  JSON.parse(await readFile(join(here, "data", sample), "utf8"));
}

const exportResult = context.window.OpenClawDashboardValidation.validateDashboardExport(dashboardExport);
if (!exportResult.ok) {
  throw new Error(`Sample dashboard export failed validation: ${exportResult.issues.join("; ")}`);
}

const artifactResult = context.window.OpenClawDashboardValidation.validateArtifactManifest(artifactManifest);
if (!artifactResult.ok) {
  throw new Error(`Sample artifact manifest failed validation: ${artifactResult.issues.join("; ")}`);
}

const gatewayFixtureFiles = {
  metrics: "metrics.json",
  agents: "agents.json",
  agentDetail: "agent-detail.json",
  tasks: "tasks.json",
  taskDetail: "task-detail.json",
  reviews: "reviews.json",
  logs: "logs.json",
  backups: "backups.json",
  settings: "settings.json",
  rbac: "rbac.json",
  sourceStatus: "source-status.json"
};
const gatewayFixtures = {};
for (const [key, fileName] of Object.entries(gatewayFixtureFiles)) {
  gatewayFixtures[key] = JSON.parse(await readFile(join(here, "data/gateway-stub", fileName), "utf8"));
}
const gatewayResult = context.window.OpenClawGatewayContractValidation.validateGatewayFixtureSet(gatewayFixtures);
if (!gatewayResult.ok) {
  throw new Error(`Gateway fixture validation failed: ${gatewayResult.issues.join("; ")}`);
}
if (gatewayExport.metadata?.schemaVersion !== "gateway-read-only-v1" || gatewayExport.metadata?.mutationEnabled !== false || gatewayExport.metadata?.productionWiring !== "disabled") {
  throw new Error("Gateway export sample must be read-only with production wiring disabled.");
}

const gatewayAdapter = await context.window.OpenClawDashboardAdapters.resolveDashboardDataAdapter({
  requestedSource: "gateway-stub",
  source: "gateway-stub",
  dataUrl: "./data/gateway-stub",
  fallbackSource: "mock"
});
if (gatewayAdapter.source !== "gateway-stub" || gatewayAdapter.sourceStatus.currentSource !== "gateway-stub") {
  throw new Error("Gateway-stub adapter did not resolve as current source.");
}
if (gatewayAdapter.getAgents().length !== 8) {
  throw new Error("Gateway-stub adapter must expose 8 agents.");
}
for (const status of lifecycle) {
  if (!gatewayAdapter.getTasks().some((task) => task.status === status)) {
    throw new Error(`Gateway-stub adapter missing lifecycle status: ${status}`);
  }
}

function runRequiredCommand(args) {
  const result = spawnSync(nodeExe, args, {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
}

runRequiredCommand(["apps/dashboard/scripts/generate-dashboard-snapshot.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/dashboard-export.sample.json"]);
runRequiredCommand(["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/generated/dashboard-export.generated.json"]);
runRequiredCommand(["apps/dashboard/scripts/test-gateway-contract.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/diff-gateway-fixtures.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-local-ingest.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-dev-gateway-config.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-rbac-policy.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-action-draft-samples.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-action-drafts.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-release-manifest.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/create-local-release-bundle.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/verify-local-release.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-observability-report.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-observability.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-production-readiness-report.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-production-readiness.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-final-beta-audit.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/verify-final-beta.mjs"]);

const actionDraftSample = JSON.parse(await readFile(join(here, "data/generated/action-drafts.sample.json"), "utf8"));
if (actionDraftSample.mutationEnabled !== false || actionDraftSample.productionWiring !== "disabled" || actionDraftSample.safetyMode !== "read-only") {
  throw new Error("Action draft sample must be read-only with mutation disabled.");
}
if (!actionDraftSample.drafts?.every((draft) => draft.dryRun === true && draft.notSubmitted === true && draft.requiresHumanApproval === true)) {
  throw new Error("Action draft sample must contain only dry-run, not-submitted drafts requiring human approval.");
}

const releaseManifest = JSON.parse(await readFile(join(here, "data/generated/release-manifest.json"), "utf8"));
if (releaseManifest.dashboard?.mode !== "static-read-only" || releaseManifest.dashboard?.safetyMode !== "read-only" || releaseManifest.dashboard?.mutationEnabled !== false || releaseManifest.dashboard?.productionWiring !== "disabled") {
  throw new Error("Release manifest must be static-read-only with production wiring disabled.");
}
const localReleaseIndex = JSON.parse(await readFile(join(here, "release/local-release-index.json"), "utf8"));
if (localReleaseIndex.mutationEnabled !== false || localReleaseIndex.productionWiring !== "disabled" || !localReleaseIndex.filesIncluded?.includes("index.html")) {
  throw new Error("Local release index must include static files and keep mutation disabled.");
}

const observabilityReport = JSON.parse(await readFile(join(here, "data/generated/observability-report.json"), "utf8"));
if (observabilityReport.safetyMode !== "read-only" || observabilityReport.notificationMode !== "local-preview-only" || observabilityReport.mutationEnabled !== false || observabilityReport.productionWiring !== "disabled") {
  throw new Error("Observability report must remain local-preview-only with production wiring disabled.");
}
for (const alert of observabilityReport.alerts ?? []) {
  if (alert.notificationSent !== false || alert.localOnly !== true || alert.mutationEnabled !== false || alert.productionWiring !== "disabled") {
    throw new Error(`Observability alert is missing local-only safety flags: ${alert.alertId ?? "unknown"}`);
  }
}

const readinessReport = JSON.parse(await readFile(join(here, "data/generated/production-readiness-report.json"), "utf8"));
if (readinessReport.productionDeploy !== false || readinessReport.safetyMode !== "read-only" || readinessReport.mutationEnabled !== false || readinessReport.productionWiring !== "disabled") {
  throw new Error("Production readiness report must keep production deploy and mutation disabled.");
}
if (readinessReport.recommendation !== "no-go-for-production" || String(readinessReport.recommendation).includes("production-ready")) {
  throw new Error("Production readiness recommendation must remain no-go-for-production.");
}
for (const blocker of ["real auth design review", "production gateway security review", "secrets management plan", "operator signoff", "backup restore drill", "incident response plan"]) {
  if (!readinessReport.requiredBeforeProduction?.includes(blocker)) {
    throw new Error(`Production readiness report missing blocker: ${blocker}`);
  }
}

const finalBetaAuditReport = JSON.parse(await readFile(join(here, "data/generated/final-beta-audit-report.json"), "utf8"));
if (finalBetaAuditReport.scope !== "internal-operator-beta" || finalBetaAuditReport.overallStatus !== "internal-beta-ready" || finalBetaAuditReport.productionStatus !== "no-go-for-production") {
  throw new Error("Final beta audit report must mark internal beta ready and production no-go.");
}
if (finalBetaAuditReport.safetyMode !== "read-only" || finalBetaAuditReport.mutationEnabled !== false || finalBetaAuditReport.productionWiring !== "disabled") {
  throw new Error("Final beta audit report must remain read-only with mutation and production wiring disabled.");
}
for (const mode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  if (!finalBetaAuditReport.supportedSources?.includes(mode) || !dashboardReadme.includes(mode) || !docsIndex.includes(mode)) {
    throw new Error(`Final beta source mode not documented: ${mode}`);
  }
}

const generatedSnapshot = JSON.parse(await readFile(join(here, "data/generated/dashboard-export.generated.json"), "utf8"));
if (generatedSnapshot.metadata?.mutationEnabled !== false || generatedSnapshot.metadata?.safetyMode !== "read-only") {
  throw new Error("Generated snapshot must be read-only with mutationEnabled false.");
}

const gatewayBaseline = JSON.parse(await readFile(join(here, "data/gateway-stub/baseline/gateway-contract-baseline.json"), "utf8"));
if (gatewayBaseline.schemaVersion !== "gateway-contract-baseline-v1" || gatewayBaseline.agentCount !== 8 || gatewayBaseline.mutationEnabled !== false || gatewayBaseline.safetyMode !== "read-only") {
  throw new Error("Gateway baseline summary must be read-only and include 8 agents.");
}
for (const status of lifecycle) {
  if (!gatewayBaseline.taskLifecycleCoverage.includes(status)) {
    throw new Error(`Gateway baseline missing lifecycle status: ${status}`);
  }
}
const gatewayDiffReport = JSON.parse(await readFile(join(here, "data/generated/gateway-fixture-diff-report.json"), "utf8"));
if (gatewayDiffReport.result !== "pass") {
  throw new Error("Gateway fixture diff report must pass.");
}

const renderedShellAndOverview = `${html}\n${renderedOverview}`;
for (const marker of ["mock-only", "read-only", "Production OpenClaw disconnected"]) {
  if (!renderedShellAndOverview.includes(marker)) {
    throw new Error(`Rendered dashboard is missing safety marker: ${marker}`);
  }
}

console.log("OpenClaw dashboard scaffold verification passed.");
