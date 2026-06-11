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
  "src/lib/readiness/readiness-summary.js",
  "src/lib/data-trust/source-trust.js",
  "src/lib/i18n/zh-hant.js",
  "src/lib/i18n/i18n.js"
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
  "apps/dashboard/scripts/discover-real-local-data.mjs",
  "apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
  "apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs",
  "apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
  "apps/dashboard/scripts/test-real-local-data-pilot.mjs",
  "apps/dashboard/scripts/test-dashboard-localization.mjs",
  "apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs",
  "apps/dashboard/scripts/run-dev-gateway-live-drill.mjs",
  "apps/dashboard/scripts/test-dev-gateway-live-drill.mjs",
  "apps/dashboard/scripts/generate-operator-daily-summary.mjs",
  "apps/dashboard/scripts/run-operator-daily-workflow.mjs",
  "apps/dashboard/scripts/run-operator-incident-drill.mjs",
  "apps/dashboard/scripts/generate-operator-evidence-manifest.mjs",
  "apps/dashboard/scripts/test-operator-workflow.mjs",
  "apps/dashboard/scripts/start-internal-static-preview.mjs",
  "apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs",
  "apps/dashboard/scripts/generate-operator-access-checklist.mjs",
  "apps/dashboard/scripts/test-internal-static-hosting.mjs",
  "apps/dashboard/scripts/generate-security-privacy-audit.mjs",
  "apps/dashboard/scripts/test-generated-report-sanitization.mjs",
  "apps/dashboard/scripts/generate-data-retention-review.mjs",
  "apps/dashboard/scripts/generate-operator-security-checklist.mjs",
  "apps/dashboard/scripts/test-security-privacy-audit.mjs",
  "apps/dashboard/scripts/generate-internal-release-candidate.mjs",
  "apps/dashboard/scripts/generate-internal-signoff-package.mjs",
  "apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs",
  "apps/dashboard/scripts/test-internal-release-candidate.mjs",
  "apps/dashboard/scripts/generate-production-track-plan.mjs",
  "apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs",
  "apps/dashboard/scripts/generate-production-entry-gates.mjs",
  "apps/dashboard/scripts/test-production-track-planning.mjs",
  "apps/dashboard/src/lib/data-trust/source-trust.js",
  "apps/dashboard/src/lib/data-trust/source-trust.ts",
  "apps/dashboard/src/lib/data-trust/source-lockdown.js",
  "apps/dashboard/src/lib/data-trust/source-lockdown.ts",
  "apps/dashboard/src/lib/agent-health/local-agent-health.js",
  "apps/dashboard/src/lib/agent-health/local-agent-health.ts",
  "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js",
  "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.ts",
  "apps/dashboard/src/lib/agent-health/local-health-evidence.js",
  "apps/dashboard/src/lib/agent-health/local-health-evidence.ts",
  "apps/dashboard/src/lib/operator-usability/operator-usability.js",
  "apps/dashboard/src/lib/operator-usability/operator-usability.ts",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.ts",
  "apps/dashboard/src/lib/production-readiness/production-entry-gates.js",
  "apps/dashboard/src/lib/production-readiness/production-entry-gates.ts",
  "apps/dashboard/data/local-agent-health/local-agent-health.sample.json",
  "apps/dashboard/data/local/.gitignore",
  "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  "apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs",
  "apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs",
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "apps/dashboard/scripts/generate-fixture-quarantine-report.mjs",
  "apps/dashboard/scripts/test-single-agent-local-snapshot.mjs",
  "apps/dashboard/scripts/test-fixture-quarantine.mjs",
  "apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs",
  "apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs",
  "apps/dashboard/scripts/test-operator-source-lockdown.mjs",
  "apps/dashboard/scripts/generate-local-real-agent-health-report.mjs",
  "apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs",
  "apps/dashboard/scripts/generate-reviewed-local-health-template.mjs",
  "apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs",
  "apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs",
  "apps/dashboard/scripts/test-reviewed-health-input-assistant.mjs",
  "apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs",
  "apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs",
  "apps/dashboard/scripts/test-local-health-evidence-review.mjs",
  "apps/dashboard/scripts/test-local-real-agent-health.mjs",
  "apps/dashboard/scripts/start-operator-dashboard.ps1",
  "apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs",
  "apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs",
  "apps/dashboard/scripts/test-operator-usability-mvp.mjs",
  "apps/dashboard/scripts/generate-daily-operator-summary-report.mjs",
  "apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs",
  "apps/dashboard/scripts/test-daily-operator-runbook.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-report.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs",
  "apps/dashboard/scripts/test-production-entry-gates.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  "apps/dashboard/src/lib/i18n/zh-hant.js",
  "apps/dashboard/src/lib/i18n/i18n.js",
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
  "apps/dashboard/data/generated/real-local-data-discovery-report.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  "apps/dashboard/data/generated/real-local-data-pilot-report.json",
  "apps/dashboard/data/generated/dev-gateway-live-drill-report.json",
  "apps/dashboard/data/generated/operator-daily-summary.json",
  "apps/dashboard/data/generated/operator-incident-drill-report.json",
  "apps/dashboard/data/generated/operator-evidence-manifest.json",
  "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  "apps/dashboard/data/generated/operator-access-checklist.json",
  "apps/dashboard/data/generated/security-privacy-audit-report.json",
  "apps/dashboard/data/generated/data-retention-review-report.json",
  "apps/dashboard/data/generated/operator-security-checklist.json",
  "apps/dashboard/data/generated/internal-release-candidate-report.json",
  "apps/dashboard/data/generated/internal-signoff-package.json",
  "apps/dashboard/data/generated/production-track-plan-report.json",
  "apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json",
  "apps/dashboard/data/generated/production-entry-gates-report.json",
  "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  "apps/dashboard/data/generated/single-agent-truth-report.json",
  "apps/dashboard/data/generated/fixture-quarantine-report.json",
  "apps/dashboard/data/generated/operator-source-lockdown-report.json",
  "apps/dashboard/data/generated/operator-source-selection-checklist.json",
  "apps/dashboard/data/generated/local-real-agent-health-report.json",
  "apps/dashboard/data/generated/operator-agent-health-checklist.json",
  "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json",
  "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json",
  "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json",
  "apps/dashboard/data/generated/operator-daily-usability-checklist.json",
  "apps/dashboard/data/generated/operator-usability-troubleshooting-report.json",
  "apps/dashboard/data/generated/daily-operator-summary-report.json",
  "apps/dashboard/data/generated/daily-operator-runbook-checklist.json",
  "apps/dashboard/data/generated/production-entry-gate-report.json",
  "apps/dashboard/data/generated/production-entry-gate-checklist.json",
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
  "docs/dashboard/openclaw-dashboard-dev-gateway-live-drill.md",
  "docs/dashboard/openclaw-dashboard-operator-daily-workflow.md",
  "docs/dashboard/openclaw-dashboard-operator-incident-drill.md",
  "docs/dashboard/openclaw-dashboard-internal-static-hosting.md",
  "docs/dashboard/openclaw-dashboard-operator-access-checklist.md",
  "docs/dashboard/openclaw-dashboard-security-privacy-audit.md",
  "docs/dashboard/openclaw-dashboard-data-retention.md",
  "docs/dashboard/openclaw-dashboard-operator-security-checklist.md",
  "docs/dashboard/openclaw-dashboard-v1-internal-release-candidate.md",
  "docs/dashboard/openclaw-dashboard-internal-signoff.md",
  "docs/dashboard/openclaw-dashboard-production-track-plan.md",
  "docs/dashboard/openclaw-dashboard-readonly-production-gateway-readiness.md",
  "docs/dashboard/openclaw-dashboard-production-entry-gates.md",
  "docs/dashboard/openclaw-dashboard-fixture-quarantine.md",
  "docs/dashboard/openclaw-dashboard-single-agent-truth.md",
  "docs/dashboard/openclaw-dashboard-single-agent-local-snapshot.md",
  "docs/dashboard/openclaw-dashboard-operator-source-selection.md",
  "docs/dashboard/openclaw-dashboard-source-lockdown.md",
  "docs/dashboard/openclaw-dashboard-local-agent-health.md",
  "docs/dashboard/openclaw-dashboard-reviewed-health-input-assistant.md",
  "docs/dashboard/openclaw-dashboard-local-health-evidence-review.md",
  "docs/dashboard/openclaw-dashboard-operator-usability-mvp.md",
  "docs/dashboard/openclaw-dashboard-daily-operator-runbook-mode.md",
  "docs/dashboard/openclaw-dashboard-production-entry-gate-hardening.md",
  "docs/dashboard/openclaw-dashboard-rbac.md",
  "docs/dashboard/openclaw-dashboard-action-drafts.md",
  "docs/dashboard/openclaw-dashboard-observability.md",
  "docs/dashboard/openclaw-dashboard-production-readiness.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "docs/dashboard/openclaw-dashboard-real-local-data-pilot.md",
  "docs/dashboard/openclaw-dashboard-snapshot-refresh-drill.md",
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
  "ops/tasks/TASK-20260609-OC-DASH-15A.md",
  "ops/tasks/TASK-20260609-OC-DASH-15B.md",
  "ops/tasks/TASK-20260609-OC-DASH-16A.md",
  "ops/tasks/TASK-20260609-OC-DASH-17A.md",
  "ops/tasks/TASK-20260609-OC-DASH-18A.md",
  "ops/tasks/TASK-20260609-OC-DASH-19A.md",
  "ops/tasks/TASK-20260609-OC-DASH-20A.md",
  "ops/tasks/TASK-20260609-OC-DASH-21A.md",
  "ops/tasks/TASK-20260609-OC-DASH-21B.md",
  "ops/tasks/TASK-20260609-OC-DASH-23A.md",
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
  "artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md",
  "artifacts/TASK-20260609-OC-DASH-15A/README.md",
  "artifacts/TASK-20260609-OC-DASH-15B/README.md",
  "artifacts/TASK-20260609-OC-DASH-16A/README.md",
  "artifacts/TASK-20260609-OC-DASH-17A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-18A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-19A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-20A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-21B/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-23A/README.md"
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
const sourceTrustModule = await readFile(join(here, "src/lib/data-trust/source-trust.js"), "utf8");
const zhHantModule = await readFile(join(here, "src/lib/i18n/zh-hant.js"), "utf8");
const i18nModule = await readFile(join(here, "src/lib/i18n/i18n.js"), "utf8");
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

for (const marker of ["src/lib/i18n/zh-hant.js", "src/lib/i18n/i18n.js", "zh-Hant"]) {
  if (!html.includes(marker)) {
    throw new Error(`index.html does not load Sprint 15B localization marker: ${marker}`);
  }
}

if (!app.includes("parseDashboardSourceConfig") || !app.includes("sourceStatus") || !zhHantModule.includes("資料來源")) {
  throw new Error("app.js must support source query strings and source status UI.");
}

if (!app.includes("gateway-stub") || !app.includes("Production wiring")) {
  throw new Error("app.js must render gateway-stub and production wiring status markers.");
}

for (const marker of ["local-ingest", "dev-gateway", "Mutation enabled", "本地匯入檔案", "Base URL"]) {
  if (!app.includes(marker) && !zhHantModule.includes(marker) && !sourceConfigModule.includes(marker)) {
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

for (const marker of ["run-real-local-snapshot-refresh-drill.mjs", "test-real-local-data-pilot.mjs", "realLocalSnapshotRefreshDrill", "realLocalDataPilotTests", "realLocalSnapshotPath", "realLocalPilotReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 15A marker: ${marker}`);
  }
}

for (const marker of ["test-dashboard-localization.mjs", "dashboardLocalization"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 15B marker: ${marker}`);
  }
}

for (const marker of ["run-dev-gateway-live-drill.mjs", "test-dev-gateway-live-drill.mjs", "devGatewayLiveDrill", "devGatewayLiveDrillTests", "devGatewayLiveDrillReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 16A marker: ${marker}`);
  }
}

for (const marker of ["run-operator-daily-workflow.mjs", "run-operator-incident-drill.mjs", "generate-operator-evidence-manifest.mjs", "test-operator-workflow.mjs", "operatorDailyWorkflow", "operatorIncidentDrill", "operatorEvidenceManifest", "operatorWorkflowTests"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 17A marker: ${marker}`);
  }
}

for (const marker of ["run-internal-static-hosting-dry-run.mjs", "generate-operator-access-checklist.mjs", "test-internal-static-hosting.mjs", "internalStaticHostingDryRun", "operatorAccessChecklist", "internalStaticHostingTests", "internalStaticHostingDryRunReportPath", "operatorAccessChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 18A marker: ${marker}`);
  }
}

for (const marker of ["generate-security-privacy-audit.mjs", "test-generated-report-sanitization.mjs", "generate-data-retention-review.mjs", "generate-operator-security-checklist.mjs", "test-security-privacy-audit.mjs", "securityPrivacyAudit", "generatedReportSanitization", "dataRetentionReview", "operatorSecurityChecklist", "securityPrivacyAuditTests", "securityPrivacyAuditReportPath", "dataRetentionReviewReportPath", "operatorSecurityChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 19A marker: ${marker}`);
  }
}

for (const marker of ["generate-internal-release-candidate.mjs", "generate-internal-signoff-package.mjs", "verify-v1-internal-release-candidate.mjs", "test-internal-release-candidate.mjs", "internalReleaseCandidate", "internalSignoffPackage", "v1InternalReleaseCandidateVerification", "internalReleaseCandidateTests", "internalReleaseCandidateReportPath", "internalSignoffPackagePath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 20A marker: ${marker}`);
  }
}

for (const marker of ["generate-production-track-plan.mjs", "generate-readonly-production-gateway-readiness.mjs", "generate-production-entry-gates.mjs", "test-production-track-planning.mjs", "productionTrackPlan", "readonlyProductionGatewayReadiness", "productionEntryGates", "productionTrackPlanningTests", "productionTrackPlanReportPath", "readonlyProductionGatewayReadinessReportPath", "productionEntryGatesReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 21A marker: ${marker}`);
  }
}

for (const marker of ["generate-single-agent-truth-report.mjs", "generate-fixture-quarantine-report.mjs", "test-fixture-quarantine.mjs", "singleAgentTruthReport", "fixtureQuarantineReport", "fixtureQuarantineTests", "singleAgentTruthReportPath", "fixtureQuarantineReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 21B marker: ${marker}`);
  }
}

for (const marker of ["inspect-real-local-agent-inventory.mjs", "generate-single-agent-local-snapshot.mjs", "test-single-agent-local-snapshot.mjs", "realLocalAgentInventoryInspection", "singleAgentLocalSnapshot", "singleAgentLocalSnapshotTests", "realLocalAgentInventoryInspectionPath", "singleAgentLocalSnapshotPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 21C marker: ${marker}`);
  }
}

for (const marker of ["generate-operator-source-lockdown-report.mjs", "generate-operator-source-selection-checklist.mjs", "test-operator-source-lockdown.mjs", "operatorSourceLockdownReport", "operatorSourceSelectionChecklist", "operatorSourceLockdownTests", "operatorSourceLockdownReportPath", "operatorSourceSelectionChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 21D marker: ${marker}`);
  }
}

for (const marker of ["generate-local-real-agent-health-report.mjs", "generate-operator-agent-health-checklist.mjs", "test-local-real-agent-health.mjs", "generate-local-health-evidence-review-report.mjs", "generate-operator-local-health-evidence-checklist.mjs", "test-local-health-evidence-review.mjs", "localRealAgentHealthReport", "operatorAgentHealthChecklist", "localRealAgentHealthTests", "localHealthEvidenceReviewReport", "operatorLocalHealthEvidenceChecklist", "localHealthEvidenceReviewTests", "localRealAgentHealthReportPath", "operatorAgentHealthChecklistPath", "localHealthEvidenceReviewReportPath", "operatorLocalHealthEvidenceChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 22A marker: ${marker}`);
  }
}

for (const marker of ["generate-reviewed-local-health-template.mjs", "validate-reviewed-local-health-input-dry-run.mjs", "generate-operator-reviewed-health-input-checklist.mjs", "test-reviewed-health-input-assistant.mjs", "reviewedLocalHealthTemplateReport", "reviewedLocalHealthInputDryRunReport", "operatorReviewedHealthInputChecklist", "reviewedHealthInputAssistantTests", "reviewedLocalHealthTemplateReportPath", "reviewedLocalHealthInputDryRunReportPath", "operatorReviewedHealthInputChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 23C marker: ${marker}`);
  }
}

for (const marker of ["generate-operator-daily-usability-checklist.mjs", "generate-operator-usability-troubleshooting-report.mjs", "test-operator-usability-mvp.mjs", "operatorDailyUsabilityChecklist", "operatorUsabilityTroubleshootingReport", "operatorUsabilityMvpTests", "operatorDailyUsabilityChecklistPath", "operatorUsabilityTroubleshootingReportPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 23A marker: ${marker}`);
  }
}

for (const marker of ["generate-daily-operator-summary-report.mjs", "generate-daily-operator-runbook-checklist.mjs", "test-daily-operator-runbook.mjs", "dailyOperatorSummaryReport", "dailyOperatorRunbookChecklist", "dailyOperatorRunbookTests", "dailyOperatorSummaryReportPath", "dailyOperatorRunbookChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 23B marker: ${marker}`);
  }
}

for (const marker of ["generate-production-entry-gate-report.mjs", "generate-production-entry-gate-checklist.mjs", "test-production-entry-gates.mjs", "productionEntryGateReport", "productionEntryGateChecklist", "productionEntryGateTests", "productionEntryGateReportPath", "productionEntryGateChecklistPath"]) {
  if (!qualityGateScript.includes(marker)) {
    throw new Error(`Quality gate missing Sprint 24A marker: ${marker}`);
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

for (const marker of ["discover-real-local-data.mjs", "real-local-data-discovery-report.json", "real-local-dashboard-export.generated.json", "real-local-data-pilot-report.json", "openclaw-dashboard-real-local-data-pilot.md", "openclaw-dashboard-snapshot-refresh-drill.md"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 15A marker: ${marker}`);
  }
}

for (const marker of ["apps/dashboard/src/lib/i18n", "test-dashboard-localization.mjs"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 15B marker: ${marker}`);
  }
}

for (const marker of ["start-dev-gateway-fixture-server.mjs", "run-dev-gateway-live-drill.mjs", "test-dev-gateway-live-drill.mjs", "dev-gateway-live-drill-report.json", "openclaw-dashboard-dev-gateway-live-drill.md"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 16A marker: ${marker}`);
  }
}

for (const marker of ["generate-operator-daily-summary.mjs", "run-operator-daily-workflow.mjs", "run-operator-incident-drill.mjs", "generate-operator-evidence-manifest.mjs", "test-operator-workflow.mjs", "operator-daily-summary.json", "operator-incident-drill-report.json", "operator-evidence-manifest.json", "openclaw-dashboard-operator-daily-workflow.md", "openclaw-dashboard-operator-incident-drill.md"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 17A marker: ${marker}`);
  }
}

for (const marker of ["start-internal-static-preview.mjs", "run-internal-static-hosting-dry-run.mjs", "generate-operator-access-checklist.mjs", "test-internal-static-hosting.mjs", "internal-static-hosting-dry-run-report.json", "operator-access-checklist.json", "openclaw-dashboard-internal-static-hosting.md", "openclaw-dashboard-operator-access-checklist.md"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 18A marker: ${marker}`);
  }
}

for (const marker of ["generate-security-privacy-audit.mjs", "test-generated-report-sanitization.mjs", "generate-data-retention-review.mjs", "generate-operator-security-checklist.mjs", "test-security-privacy-audit.mjs", "security-privacy-audit-report.json", "data-retention-review-report.json", "operator-security-checklist.json", "openclaw-dashboard-security-privacy-audit.md", "openclaw-dashboard-data-retention.md", "openclaw-dashboard-operator-security-checklist.md"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 19A marker: ${marker}`);
  }
}

for (const marker of ["generate-internal-release-candidate.mjs", "generate-internal-signoff-package.mjs", "verify-v1-internal-release-candidate.mjs", "test-internal-release-candidate.mjs", "internal-release-candidate-report.json", "internal-signoff-package.json", "openclaw-dashboard-v1-internal-release-candidate.md", "openclaw-dashboard-internal-signoff.md", "signoffStatus", "notApprovedYet"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 20A marker: ${marker}`);
  }
}

for (const marker of ["generate-production-track-plan.mjs", "generate-readonly-production-gateway-readiness.mjs", "generate-production-entry-gates.mjs", "test-production-track-planning.mjs", "production-track-plan-report.json", "readonly-production-gateway-readiness-report.json", "production-entry-gates-report.json", "openclaw-dashboard-production-track-plan.md", "openclaw-dashboard-readonly-production-gateway-readiness.md", "openclaw-dashboard-production-entry-gates.md", "planning-only", "not-connected", "not-ready", "entryGateStatus"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 21A marker: ${marker}`);
  }
}

for (const marker of ["source-trust.js", "generate-single-agent-truth-report.mjs", "generate-fixture-quarantine-report.mjs", "test-fixture-quarantine.mjs", "single-agent-truth-report.json", "fixture-quarantine-report.json", "openclaw-dashboard-fixture-quarantine.md", "openclaw-dashboard-single-agent-truth.md", "mock-marked-operator-truth", "gateway-stub-marked-operator-truth"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 21B marker: ${marker}`);
  }
}

for (const marker of ["inspect-real-local-agent-inventory.mjs", "generate-single-agent-local-snapshot.mjs", "test-single-agent-local-snapshot.mjs", "real-local-dashboard-export.single-agent.generated.json", "real-local-agent-inventory-inspection.json", "openclaw-dashboard-single-agent-local-snapshot.md", "single-agent-truth-snapshot-agent-count"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 21C marker: ${marker}`);
  }
}

for (const marker of ["source-lockdown.js", "generate-operator-source-lockdown-report.mjs", "generate-operator-source-selection-checklist.mjs", "test-operator-source-lockdown.mjs", "operator-source-lockdown-report.json", "operator-source-selection-checklist.json", "openclaw-dashboard-operator-source-selection.md", "openclaw-dashboard-source-lockdown.md", "mock-default-operator-truth-violation", "gateway-stub-default-operator-truth-violation"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 21D marker: ${marker}`);
  }
}

for (const marker of ["local-agent-health.js", "local-health-evidence.js", "local-agent-health.sample.json", "reviewed-local-agent-health.example.json", "generate-local-real-agent-health-report.mjs", "generate-operator-agent-health-checklist.mjs", "test-local-real-agent-health.mjs", "generate-local-health-evidence-review-report.mjs", "generate-operator-local-health-evidence-checklist.mjs", "test-local-health-evidence-review.mjs", "local-real-agent-health-report.json", "operator-agent-health-checklist.json", "local-health-evidence-review-report.json", "operator-local-health-evidence-checklist.json", "openclaw-dashboard-local-agent-health.md", "openclaw-dashboard-local-health-evidence-review.md", "restart-agent-enabled", "mock-health-truth", "local-health-source-invalid", "raw-reviewed-health-values-printed"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 22A marker: ${marker}`);
  }
}

for (const marker of ["local-reviewed-health-input-assistant.js", "reviewed-local-agent-health.template.json", "reviewed-local-health-input-template-report.json", "reviewed-local-health-input-dry-run-report.json", "operator-reviewed-health-input-checklist.json", "openclaw-dashboard-reviewed-health-input-assistant.md", "reviewed-health-raw-values-printed", "real-reviewed-health-input-tracked"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 23C marker: ${marker}`);
  }
}

for (const marker of ["operator-usability.js", "start-operator-dashboard.ps1", "generate-operator-daily-usability-checklist.mjs", "generate-operator-usability-troubleshooting-report.mjs", "test-operator-usability-mvp.mjs", "operator-daily-usability-checklist.json", "operator-usability-troubleshooting-report.json", "openclaw-dashboard-operator-usability-mvp.md", "operator-launch-restart-enabled", "operator-usability-blocked-action-missing"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 23A marker: ${marker}`);
  }
}

for (const marker of ["daily-operator-runbook.js", "generate-daily-operator-summary-report.mjs", "generate-daily-operator-runbook-checklist.mjs", "test-daily-operator-runbook.mjs", "daily-operator-summary-report.json", "daily-operator-runbook-checklist.json", "openclaw-dashboard-daily-operator-runbook-mode.md", "daily-truth-fixture-source", "daily-operator-blocked-action-missing"]) {
  if (!safetyScanScript.includes(marker)) {
    throw new Error(`Safety scan missing Sprint 23B marker: ${marker}`);
  }
}

for (const marker of ["Internal Operator Beta", "Production: no-go", "Safety mode: read-only", "Mutation enabled: false", "Production wiring: disabled"]) {
  if (!dashboardReadme.includes(marker)) {
    throw new Error(`README missing final beta marker: ${marker}`);
  }
}

for (const marker of ["內部 Operator Beta", "快速開始", "Production 暫不可上線"]) {
  if (!dashboardReadme.includes(marker) && !docsIndex.includes(marker)) {
    throw new Error(`Docs missing Sprint 15B Chinese marker: ${marker}`);
  }
}

for (const marker of ["Quick start", "Source modes", "Operator handoff", "Repo hygiene", "Production readiness"]) {
  if (!docsIndex.toLowerCase().includes(marker.toLowerCase())) {
    throw new Error(`Docs index missing final beta marker: ${marker}`);
  }
}

if ((!app.includes("Import / Export Contract") && !app.includes("匯入 / 匯出合約")) || (!app.includes("Mutation enabled") && !app.includes("mutationEnabled") && !zhHantModule.includes("寫入操作啟用")) || !app.includes("false")) {
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

const requiredRouteLabels = ["總覽", "Agents / 代理程式", "任務", "審核", "日誌", "備份", "觀測 / Observability", "設定", "權限 / RBAC", "操作手冊"];
for (const label of requiredRouteLabels) {
  if (!zhHantModule.includes(label) && !app.includes(label)) {
    throw new Error(`Missing localized route label: ${label}`);
  }
}

const lifecycle = ["queued", "running", "review_pending", "succeeded", "failed", "timed_out", "cancelled", "lost"];
for (const status of lifecycle) {
  if (!runtimeModule.includes(`"${status}"`) || !app.includes(`"${status}"`)) {
    throw new Error(`Missing task lifecycle status: ${status}`);
  }
}

const safetyChecks = [
  "Approve mock",
  "Reject mock",
  "mutation disabled / 寫入已停用",
  "Production mutation",
  "read-only",
  "mock evidence / 模擬證據"
];

for (const text of safetyChecks) {
  if (!app.includes(text)) {
    throw new Error(`Missing safety UI text: ${text}`);
  }
}

const visibleMarkers = [
  "總覽",
  "Agents / 代理程式",
  "任務",
  "審核",
  "日誌",
  "備份",
  "觀測 / Observability",
  "設定",
  "權限 / RBAC",
  "操作手冊",
  "Production mutation",
  "read-only",
  "mock-only scaffold / 唯讀腳手架",
  "品質閘門狀態",
  "資料來源",
  "健康狀態",
  "驗證",
  "回退",
  "回退原因",
  "安全模式",
  "Production wiring",
  "gateway-stub",
  "local-ingest",
  "dev-gateway",
  "寫入操作啟用",
  "本地匯入檔案",
  "Base URL",
  "角色矩陣",
  "權限矩陣",
  "唯讀角色模擬",
  "只作模擬",
  "no real auth",
  "no token",
  "no cookie",
  "no production permissions",
  "產生 approve 操作草稿",
  "產生 reject 操作草稿",
  "產生 needs changes 操作草稿",
  "產生備份驗證草稿",
  "產生設定變更草稿",
  "操作草稿預覽",
  "dryRun",
  "mutationEnabled",
  "productionWiring",
  "notSubmitted",
  "requiresHumanApproval",
  "Release / Health",
  "Release / Health 發佈健康狀態",
  "static-read-only",
  "release-manifest.json",
  "local-release-index.json",
  "Rollback tag 建議",
  "Deploy disabled in scaffold（部署已停用）",
  "Production release requires manual approval（Production 發佈需要人工批准）",
  "觀測摘要",
  "警示預覽清單",
  "local-preview-only",
  "notificationSent false",
  "Acknowledge disabled in scaffold（確認功能已停用）",
  "External alert delivery disabled（外部通知已停用）",
  "Production 就緒狀態摘要",
  "no-go-for-production",
  "internal-operator-beta",
  "production deploy false",
  "真實本地資料試行",
  "Dev Gateway Read-only Live Drill / 開發 Gateway 唯讀演練",
  "本機 fixture server",
  "只允許 localhost / 127.0.0.1",
  "credentials: omit",
  "Authorization header",
  "Production URL blocked",
  "apps/dashboard/data/generated/dev-gateway-live-drill-report.json",
  "Live production gateway disabled",
  "Local drill only",
  "Operator Daily Workflow / Operator 每日流程",
  "Incident drill / 事故演練",
  "Evidence manifest / 證據清單",
  "apps/dashboard/data/generated/operator-daily-summary.json",
  "apps/dashboard/data/generated/operator-incident-drill-report.json",
  "apps/dashboard/data/generated/operator-evidence-manifest.json",
  "notificationSent false",
  "External escalation disabled",
  "Production incident action disabled",
  "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  "node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
  "absolute paths redacted",
  "secrets redacted",
  "production endpoints blocked",
  "Live import disabled（即時匯入已停用）",
  "Refresh via local script only（只可用本地 script 更新）",
  "最後載入",
  "匯入 / 匯出合約",
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
  ["zh-hant.js", zhHantModule],
  ["i18n.js", i18nModule],
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
vm.runInContext(zhHantModule, context, { filename: "zh-hant.js" });
vm.runInContext(i18nModule, context, { filename: "i18n.js" });
vm.runInContext(app, context, { filename: "app.js" });
await new Promise((resolve) => setTimeout(resolve, 0));

const adapter = context.window.OpenClawDashboardAdapters.getDashboardDataAdapter("mock");
for (const method of ["getMetrics", "getAgents", "getAgentById", "getTasks", "getTaskById", "getReviews", "getLogs", "getBackups", "getSettings", "getRbacSummary"]) {
  if (typeof adapter[method] !== "function") {
    throw new Error(`Rendered adapter missing method: ${method}`);
  }
}

if (!elements.navList.innerHTML.includes("總覽") || !elements.navList.innerHTML.includes("權限 / RBAC") || !elements.navList.innerHTML.includes("操作手冊")) {
  throw new Error("Dashboard nav did not render required labels.");
}

const renderedOverview = elements.routeView.innerHTML;
for (const marker of ["Gateway status", "Active agents", "Running tasks", "Failed / lost", "Backup verification", "Recent activity", "品質閘門狀態"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Overview did not render marker: ${marker}`);
  }
}

for (const marker of ["Internal Static Hosting Dry Run / 內部靜態 Hosting 演練", "start-internal-static-preview.mjs --port 5180", "run-internal-static-hosting-dry-run.mjs", "generate-operator-access-checklist.mjs", "internal-static-hosting-dry-run-report.json", "operator-access-checklist.json", "productionDeploy", "Production deploy disabled", "Public hosting disabled"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Static hosting panel missing marker: ${marker}`);
  }
}

for (const marker of ["Security / Privacy Audit / 安全與私隱審核", "Data Retention Review", "Operator Security Checklist", "generate-security-privacy-audit.mjs", "test-generated-report-sanitization.mjs", "generate-data-retention-review.mjs", "generate-operator-security-checklist.mjs", "security-privacy-audit-report.json", "data-retention-review-report.json", "operator-security-checklist.json", "draft-for-internal-review", "Production security approval disabled", "Public sharing disabled"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Security privacy panel missing marker: ${marker}`);
  }
}

for (const marker of ["資料來源", "健康狀態", "驗證", "回退", "回退原因", "安全模式", "最後載入"]) {
  if (!elements.statusStrip.innerHTML.includes(marker) && !renderedOverview.includes(marker)) {
    throw new Error(`Source status UI missing marker: ${marker}`);
  }
}

for (const marker of ["v1.0.0 Internal Release Candidate", "內部正式候選版", "v1.0.0-internal-rc1", "v1.0.0-internal", "signoffStatus", "pending", "Manual sign-off required", "manualSignoffRequired", "internal-release-candidate-report.json", "internal-signoff-package.json", "generate-internal-release-candidate.mjs", "generate-internal-signoff-package.mjs", "verify-v1-internal-release-candidate.mjs", "Production release disabled", "Sign-off cannot be automated", "Mutation remains disabled"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Internal RC panel missing marker: ${marker}`);
  }
}

for (const marker of ["Production Track Planning", "planning-only", "v1.0.0-internal", "no-go-for-production", "not-connected", "not-ready", "blocked", "only 1 real agent", "8-agent data is mock", "Fixture Quarantine + Single Agent Truth Alignment", "production-track-plan-report.json", "readonly-production-gateway-readiness-report.json", "production-entry-gates-report.json", "generate-production-track-plan.mjs", "generate-readonly-production-gateway-readiness.mjs", "generate-production-entry-gates.mjs", "Production gateway connection disabled", "Production deploy disabled", "Production approval cannot be automated"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Production track panel missing marker: ${marker}`);
  }
}

for (const marker of ["Data trust / 資料可信分類", "Demo Fixture Data / 示範測試資料", "Not real agents / 並非真實 agents", "8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試", "Fixture data cannot be promoted to operator truth"]) {
  if (!renderedOverview.includes(marker)) {
    throw new Error(`Source trust overview panel missing marker: ${marker}`);
  }
}

context.window.location.hash = "#/dashboard/help";
windowEventListeners.get("hashchange")?.();
const renderedRunbook = elements.routeView.innerHTML;
for (const marker of ["Data trust / 資料可信分類", "Demo Fixture Data / 示範測試資料", "8 agents are lifecycle test fixtures / 8 個 agents 只作生命週期測試"]) {
  if (!renderedRunbook.includes(marker)) {
    throw new Error(`Runbook route missing source trust marker: ${marker}`);
  }
}
for (const marker of ["Operator 操作手冊", "What this dashboard is", "What this dashboard is not", "Safe operating rules", "資料來源", "How to run local server", "How to run quality gates", "How to generate snapshot", "How to validate snapshot", "儀表板空白時", "source validation 失敗時", "Git 有奇怪 root-level 檔案時", "不要做甚麼"]) {
  if (!renderedRunbook.includes(marker)) {
    throw new Error(`Runbook route did not render marker: ${marker}`);
  }
}

context.window.location.hash = "#/dashboard/observability";
windowEventListeners.get("hashchange")?.();
const renderedObservability = elements.routeView.innerHTML;
for (const marker of ["Data trust / 資料可信分類", "Demo Fixture Data / 示範測試資料"]) {
  if (!renderedObservability.includes(marker)) {
    throw new Error(`Observability route missing source trust marker: ${marker}`);
  }
}
for (const marker of ["觀測摘要", "警示預覽清單", "local-preview-only", "notificationSent false", "Production 就緒狀態摘要", "no-go-for-production", "Acknowledge disabled in scaffold", "External alert delivery disabled"]) {
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
runRequiredCommand(["apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-real-local-data-pilot.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-dashboard-localization.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/run-dev-gateway-live-drill.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-dev-gateway-live-drill.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-operator-daily-summary.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/run-operator-daily-workflow.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/run-operator-incident-drill.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-operator-evidence-manifest.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-operator-workflow.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-operator-access-checklist.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-internal-static-hosting.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-security-privacy-audit.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-generated-report-sanitization.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-data-retention-review.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-operator-security-checklist.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-security-privacy-audit.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-internal-release-candidate.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-internal-signoff-package.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-internal-release-candidate.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-production-track-plan.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-production-entry-gates.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-production-track-planning.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/generate-single-agent-truth-report.mjs", "--data", "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json"]);
runRequiredCommand(["apps/dashboard/scripts/generate-fixture-quarantine-report.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-single-agent-local-snapshot.mjs"]);
runRequiredCommand(["apps/dashboard/scripts/test-fixture-quarantine.mjs"]);

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

const realLocalDiscovery = JSON.parse(await readFile(join(here, "data/generated/real-local-data-discovery-report.json"), "utf8"));
if (realLocalDiscovery.safetyMode !== "read-only" || realLocalDiscovery.mutationEnabled !== false || realLocalDiscovery.productionWiring !== "disabled" || realLocalDiscovery.absolutePathsRedacted !== true) {
  throw new Error("Real local discovery report must be read-only with absolute paths redacted.");
}
const realLocalSnapshot = JSON.parse(await readFile(join(here, "data/generated/real-local-dashboard-export.generated.json"), "utf8"));
if (realLocalSnapshot.source?.safetyMode !== "read-only" || realLocalSnapshot.source?.mutationEnabled !== false || realLocalSnapshot.source?.productionWiring !== "disabled") {
  throw new Error("Real local snapshot must keep read-only safety flags.");
}
if (realLocalSnapshot.sourceStatus?.dataUrl !== "./data/generated/real-local-dashboard-export.generated.json") {
  throw new Error("Real local snapshot must expose the local-ingest data URL marker.");
}
const realLocalPilot = JSON.parse(await readFile(join(here, "data/generated/real-local-data-pilot-report.json"), "utf8"));
if (realLocalPilot.safetyMode !== "read-only" || realLocalPilot.mutationEnabled !== false || realLocalPilot.productionWiring !== "disabled") {
  throw new Error("Real local pilot report must keep read-only safety flags.");
}
const realLocalGeneratedText = JSON.stringify({ realLocalDiscovery, realLocalSnapshot, realLocalPilot });
if (/[A-Za-z]:\\Users\\|\/home\/|https?:\/\/(?:[^"'\s]*(?:prod|production|live|real|api\.openclaw)[^"'\s]*)|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|Authorization\s*:/i.test(realLocalGeneratedText)) {
  throw new Error("Real local generated files contain unsafe path, secret, or production endpoint markers.");
}

const devGatewayLiveDrillReport = JSON.parse(await readFile(join(here, "data/generated/dev-gateway-live-drill-report.json"), "utf8"));
if (devGatewayLiveDrillReport.scope !== "localhost-read-only-drill" || devGatewayLiveDrillReport.safetyMode !== "read-only" || devGatewayLiveDrillReport.mutationEnabled !== false || devGatewayLiveDrillReport.productionWiring !== "disabled") {
  throw new Error("Dev gateway live drill report must be localhost read-only with mutation and production wiring disabled.");
}
if (devGatewayLiveDrillReport.credentialsMode !== "omit" || devGatewayLiveDrillReport.authorizationHeaderUsed !== false || devGatewayLiveDrillReport.summary?.failed !== 0) {
  throw new Error("Dev gateway live drill report must verify credentials omit, no auth header, and zero failed checks.");
}
for (const check of [...(devGatewayLiveDrillReport.allowedUrlChecks ?? []), ...(devGatewayLiveDrillReport.blockedUrlChecks ?? []), ...(devGatewayLiveDrillReport.endpointChecks ?? []), ...(devGatewayLiveDrillReport.mutationMethodChecks ?? []), ...(devGatewayLiveDrillReport.fallbackChecks ?? [])]) {
  if (check.result !== "pass") {
    throw new Error(`Dev gateway live drill check did not pass: ${check.name}`);
  }
}

const operatorDailySummary = JSON.parse(await readFile(join(here, "data/generated/operator-daily-summary.json"), "utf8"));
if (operatorDailySummary.scope !== "internal-operator-beta" || operatorDailySummary.language !== "zh-Hant" || operatorDailySummary.safetyMode !== "read-only" || operatorDailySummary.mutationEnabled !== false || operatorDailySummary.productionWiring !== "disabled" || operatorDailySummary.productionStatus !== "no-go-for-production") {
  throw new Error("Operator daily summary must remain zh-Hant internal beta read-only with production no-go.");
}
const operatorIncidentDrill = JSON.parse(await readFile(join(here, "data/generated/operator-incident-drill-report.json"), "utf8"));
if (operatorIncidentDrill.scope !== "local-incident-drill" || operatorIncidentDrill.safetyMode !== "read-only" || operatorIncidentDrill.mutationEnabled !== false || operatorIncidentDrill.productionWiring !== "disabled" || operatorIncidentDrill.notificationSent !== false || operatorIncidentDrill.externalEscalationSent !== false || operatorIncidentDrill.productionStatus !== "no-go-for-production") {
  throw new Error("Operator incident drill must remain local-only with no notifications and production no-go.");
}
const operatorEvidenceManifest = JSON.parse(await readFile(join(here, "data/generated/operator-evidence-manifest.json"), "utf8"));
if (operatorEvidenceManifest.scope !== "internal-operator-beta" || operatorEvidenceManifest.safetyMode !== "read-only" || operatorEvidenceManifest.mutationEnabled !== false || operatorEvidenceManifest.productionWiring !== "disabled") {
  throw new Error("Operator evidence manifest must remain read-only internal beta.");
}
const operatorReportsText = JSON.stringify({ operatorDailySummary, operatorIncidentDrill, operatorEvidenceManifest });
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|Authorization\s*:|"notificationSent":true|"externalEscalationSent":true|"mutationEnabled":true/i.test(operatorReportsText.replace(/\s+/g, ""))) {
  throw new Error("Operator workflow reports contain unsafe path, secret, auth, notification, or mutation markers.");
}

const staticHostingDryRun = JSON.parse(await readFile(join(here, "data/generated/internal-static-hosting-dry-run-report.json"), "utf8"));
if (staticHostingDryRun.scope !== "internal-static-hosting-dry-run" || staticHostingDryRun.hostingMode !== "static-preview-only" || staticHostingDryRun.productionDeploy !== false || staticHostingDryRun.safetyMode !== "read-only" || staticHostingDryRun.mutationEnabled !== false || staticHostingDryRun.productionWiring !== "disabled" || staticHostingDryRun.summary?.failed !== 0) {
  throw new Error("Internal static hosting dry-run report must pass with static-preview-only safety flags.");
}
const operatorAccessChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-access-checklist.json"), "utf8"));
if (operatorAccessChecklist.scope !== "internal-operator-beta" || operatorAccessChecklist.language !== "zh-Hant" || operatorAccessChecklist.productionStatus !== "no-go-for-production" || operatorAccessChecklist.safetyMode !== "read-only" || operatorAccessChecklist.mutationEnabled !== false || operatorAccessChecklist.productionWiring !== "disabled") {
  throw new Error("Operator access checklist must remain zh-Hant internal beta read-only with production no-go.");
}
for (const url of operatorAccessChecklist.recommendedUrls ?? []) {
  if (!url.startsWith("http://127.0.0.1:5180/")) {
    throw new Error(`Operator access checklist URL must stay local preview only: ${url}`);
  }
}
const staticHostingReportsText = JSON.stringify({ staticHostingDryRun, operatorAccessChecklist });
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|Authorization\s*:|"productionDeploy":true|"mutationEnabled":true/i.test(staticHostingReportsText.replace(/\s+/g, ""))) {
  throw new Error("Static hosting reports contain unsafe path, secret, auth, deploy, or mutation markers.");
}

const securityPrivacyAudit = JSON.parse(await readFile(join(here, "data/generated/security-privacy-audit-report.json"), "utf8"));
if (securityPrivacyAudit.scope !== "internal-operator-beta-security-review" || securityPrivacyAudit.safetyMode !== "read-only" || securityPrivacyAudit.mutationEnabled !== false || securityPrivacyAudit.productionWiring !== "disabled" || securityPrivacyAudit.productionStatus !== "no-go-for-production" || !["pass", "warning"].includes(securityPrivacyAudit.auditStatus)) {
  throw new Error("Security privacy audit report must remain internal beta read-only with production no-go.");
}
const dataRetentionReview = JSON.parse(await readFile(join(here, "data/generated/data-retention-review-report.json"), "utf8"));
if (dataRetentionReview.scope !== "internal-operator-beta" || dataRetentionReview.safetyMode !== "read-only" || dataRetentionReview.mutationEnabled !== false || dataRetentionReview.productionWiring !== "disabled" || dataRetentionReview.retentionPolicyStatus !== "draft-for-internal-review") {
  throw new Error("Data retention review must remain draft-for-internal-review with read-only safety flags.");
}
const operatorSecurityChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-security-checklist.json"), "utf8"));
if (operatorSecurityChecklist.scope !== "internal-operator-beta" || operatorSecurityChecklist.language !== "zh-Hant" || operatorSecurityChecklist.productionStatus !== "no-go-for-production" || operatorSecurityChecklist.safetyMode !== "read-only" || operatorSecurityChecklist.mutationEnabled !== false || operatorSecurityChecklist.productionWiring !== "disabled") {
  throw new Error("Operator security checklist must remain zh-Hant internal beta read-only with production no-go.");
}
const securityReportsText = JSON.stringify({ securityPrivacyAudit, dataRetentionReview, operatorSecurityChecklist });
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|api[_-]?key\s*[:=]|Authorization\s*:|"productionDeploy":true|"mutationEnabled":true/i.test(securityReportsText.replace(/\s+/g, ""))) {
  throw new Error("Security privacy generated reports contain unsafe path, secret, auth, deploy, or mutation markers.");
}

const internalReleaseCandidate = JSON.parse(await readFile(join(here, "data/generated/internal-release-candidate-report.json"), "utf8"));
if (internalReleaseCandidate.releaseCandidate !== "v1.0.0-internal-rc1" || internalReleaseCandidate.scope !== "internal-operator-use" || internalReleaseCandidate.internalStatus !== "release-candidate" || internalReleaseCandidate.productionStatus !== "no-go-for-production" || internalReleaseCandidate.safetyMode !== "read-only" || internalReleaseCandidate.mutationEnabled !== false || internalReleaseCandidate.productionWiring !== "disabled" || internalReleaseCandidate.manualSignoffRequired !== true || internalReleaseCandidate.signoffStatus !== "pending") {
  throw new Error("Internal release candidate report must remain pending, read-only, and production no-go.");
}
const internalSignoffPackage = JSON.parse(await readFile(join(here, "data/generated/internal-signoff-package.json"), "utf8"));
if (internalSignoffPackage.candidateTag !== "v1.0.0-internal-rc1" || internalSignoffPackage.finalInternalTag !== "v1.0.0-internal" || internalSignoffPackage.signoffStatus !== "pending" || internalSignoffPackage.notApprovedYet !== true || internalSignoffPackage.productionStatus !== "no-go-for-production" || internalSignoffPackage.safetyMode !== "read-only" || internalSignoffPackage.mutationEnabled !== false || internalSignoffPackage.productionWiring !== "disabled") {
  throw new Error("Internal sign-off package must remain pending and not approved.");
}
for (const mode of ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]) {
  if (!internalReleaseCandidate.supportedSources?.includes(mode)) {
    throw new Error(`Internal release candidate missing source mode: ${mode}`);
  }
}
const internalReleaseCandidateText = JSON.stringify({ internalReleaseCandidate, internalSignoffPackage });
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|api[_-]?key\s*[:=]|Authorization\s*:|"productionDeploy":true|"mutationEnabled":true|"signoffStatus":"approved"|"notApprovedYet":false|production-ready/i.test(internalReleaseCandidateText.replace(/\s+/g, ""))) {
  throw new Error("Internal RC generated reports contain unsafe status, path, secret, deploy, mutation, or approval markers.");
}

const productionTrackPlan = JSON.parse(await readFile(join(here, "data/generated/production-track-plan-report.json"), "utf8"));
const readonlyGatewayReadiness = JSON.parse(await readFile(join(here, "data/generated/readonly-production-gateway-readiness-report.json"), "utf8"));
const productionEntryGates = JSON.parse(await readFile(join(here, "data/generated/production-entry-gates-report.json"), "utf8"));
if (productionTrackPlan.currentRelease !== "v1.0.0-internal" || productionTrackPlan.productionStatus !== "no-go-for-production" || productionTrackPlan.productionTrackStatus !== "planning-only" || productionTrackPlan.safetyMode !== "read-only" || productionTrackPlan.mutationEnabled !== false || productionTrackPlan.productionWiring !== "disabled") {
  throw new Error("Production track plan must remain planning-only, read-only, and production no-go.");
}
if (readonlyGatewayReadiness.productionStatus !== "no-go-for-production" || readonlyGatewayReadiness.gatewayConnectionStatus !== "not-connected" || readonlyGatewayReadiness.readinessStatus !== "not-ready" || readonlyGatewayReadiness.safetyMode !== "read-only" || readonlyGatewayReadiness.mutationEnabled !== false || readonlyGatewayReadiness.productionWiring !== "disabled") {
  throw new Error("Read-only production gateway readiness must remain not-connected, not-ready, read-only, and production no-go.");
}
if (productionEntryGates.productionStatus !== "no-go-for-production" || productionEntryGates.entryGateStatus !== "blocked" || productionEntryGates.safetyMode !== "read-only" || productionEntryGates.mutationEnabled !== false || productionEntryGates.productionWiring !== "disabled") {
  throw new Error("Production entry gates must remain blocked, read-only, and production no-go.");
}
const productionTrackReportsText = JSON.stringify({ productionTrackPlan, readonlyGatewayReadiness, productionEntryGates });
for (const marker of ["only 1 real agent", "8-agent data is mock", "Fixture Quarantine + Single Agent Truth Alignment"]) {
  if (!productionTrackReportsText.includes(marker)) {
    throw new Error(`Production track reports missing reality alignment marker: ${marker}`);
  }
}
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|api[_-]?key\s*[:=]|Authorization\s*:|"productionDeploy":true|"mutationEnabled":true|production-ready|https?:\/\//i.test(productionTrackReportsText.replace(/\s+/g, ""))) {
  throw new Error("Production track generated reports contain unsafe status, endpoint, path, secret, deploy, mutation, or production-ready markers.");
}

for (const marker of ["fixture-demo", "fixture-contract", "operator-truth-candidate", "expectedAgentCount: 8", "expectedAgentCount: 1", "operatorTruth: false"]) {
  if (!sourceTrustModule.includes(marker)) {
    throw new Error(`Source trust module missing marker: ${marker}`);
  }
}
if (/"mock"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceTrustModule) || /"gateway-stub"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceTrustModule)) {
  throw new Error("Mock and gateway-stub must not be marked as operator truth.");
}

const sourceLockdownModule = await readFile(join(here, "src/lib/data-trust/source-lockdown.js"), "utf8");
for (const marker of ["operatorRecommendedSource", "local-ingest", "operator-safe-notice", "requiresDemoAcknowledgement", "defaultAllowed: false", "warningLevel: \"high\"", "real-local-dashboard-export.single-agent.generated.json"]) {
  if (!sourceLockdownModule.includes(marker)) {
    throw new Error(`Source lockdown module missing marker: ${marker}`);
  }
}
if (/mock:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceLockdownModule) || /"gateway-stub"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceLockdownModule)) {
  throw new Error("Source lockdown must not mark mock or gateway-stub as operator truth.");
}
if (/mock:\s*{[\s\S]{0,900}?defaultAllowed:\s*true/.test(sourceLockdownModule) || /"gateway-stub"\s*:\s*{[\s\S]{0,900}?defaultAllowed:\s*true/.test(sourceLockdownModule)) {
  throw new Error("Source lockdown must keep mock and gateway-stub defaultAllowed false.");
}

const singleAgentTruthReport = JSON.parse(await readFile(join(here, "data/generated/single-agent-truth-report.json"), "utf8"));
const fixtureQuarantineReport = JSON.parse(await readFile(join(here, "data/generated/fixture-quarantine-report.json"), "utf8"));
const operatorSourceLockdownReport = JSON.parse(await readFile(join(here, "data/generated/operator-source-lockdown-report.json"), "utf8"));
const operatorSourceSelectionChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-source-selection-checklist.json"), "utf8"));
const localRealAgentHealthReport = JSON.parse(await readFile(join(here, "data/generated/local-real-agent-health-report.json"), "utf8"));
const operatorAgentHealthChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-agent-health-checklist.json"), "utf8"));
const reviewedLocalHealthTemplateReport = JSON.parse(await readFile(join(here, "data/generated/reviewed-local-health-input-template-report.json"), "utf8"));
const reviewedLocalHealthInputDryRunReport = JSON.parse(await readFile(join(here, "data/generated/reviewed-local-health-input-dry-run-report.json"), "utf8"));
const operatorReviewedHealthInputChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-reviewed-health-input-checklist.json"), "utf8"));
const localHealthEvidenceReviewReport = JSON.parse(await readFile(join(here, "data/generated/local-health-evidence-review-report.json"), "utf8"));
const operatorLocalHealthEvidenceChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-local-health-evidence-checklist.json"), "utf8"));
const operatorDailyUsabilityChecklist = JSON.parse(await readFile(join(here, "data/generated/operator-daily-usability-checklist.json"), "utf8"));
const operatorUsabilityTroubleshootingReport = JSON.parse(await readFile(join(here, "data/generated/operator-usability-troubleshooting-report.json"), "utf8"));
const dailyOperatorSummaryReport = JSON.parse(await readFile(join(here, "data/generated/daily-operator-summary-report.json"), "utf8"));
const dailyOperatorRunbookChecklist = JSON.parse(await readFile(join(here, "data/generated/daily-operator-runbook-checklist.json"), "utf8"));
const productionEntryGateReport = JSON.parse(await readFile(join(here, "data/generated/production-entry-gate-report.json"), "utf8"));
const productionEntryGateChecklist = JSON.parse(await readFile(join(here, "data/generated/production-entry-gate-checklist.json"), "utf8"));
const realLocalAgentInspection = JSON.parse(await readFile(join(here, "data/generated/real-local-agent-inventory-inspection.json"), "utf8"));
const singleAgentLocalSnapshot = JSON.parse(await readFile(join(here, "data/generated/real-local-dashboard-export.single-agent.generated.json"), "utf8"));
if (realLocalAgentInspection.expectedRealAgentCount !== 1 || realLocalAgentInspection.actualAgentCountBeforeCleanup < 1) {
  throw new Error("Real local inventory inspection must record expected count 1 and the pre-cleanup inventory.");
}
if (!Array.isArray(singleAgentLocalSnapshot.agents) || singleAgentLocalSnapshot.agents.length !== 1) {
  throw new Error("Single-agent local snapshot must contain exactly 1 agent.");
}
if (singleAgentLocalSnapshot.sourceStatus?.actualRealAgentCount !== 1 || singleAgentLocalSnapshot.sourceStatus?.dataUrl !== "./data/generated/real-local-dashboard-export.single-agent.generated.json") {
  throw new Error("Single-agent local snapshot must expose actual count 1 and the single-agent data URL marker.");
}
if (singleAgentLocalSnapshot.singleAgentCleanup?.reviewRequired !== true || singleAgentLocalSnapshot.source?.productionStatus !== "no-go-for-production") {
  throw new Error("Single-agent local snapshot must keep reviewRequired true and production no-go.");
}
if (singleAgentTruthReport.productionStatus !== "no-go-for-production" || singleAgentTruthReport.safetyMode !== "read-only" || singleAgentTruthReport.mutationEnabled !== false || singleAgentTruthReport.productionWiring !== "disabled") {
  throw new Error("Single-agent truth report must remain read-only and production no-go.");
}
if (singleAgentTruthReport.expectedRealAgentCount !== 1 || singleAgentTruthReport.fixtureAgentCount !== 8 || singleAgentTruthReport.mockIsOperatorTruth !== false || singleAgentTruthReport.gatewayStubIsOperatorTruth !== false) {
  throw new Error("Single-agent truth report must preserve expected count 1, fixture count 8, and fixture operatorTruth false.");
}
if (singleAgentTruthReport.status !== "pass" || singleAgentTruthReport.actualRealAgentCount !== 1 || singleAgentTruthReport.operatorTruthSnapshot !== "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json") {
  throw new Error("Single-agent truth report must pass against the single-agent snapshot.");
}
if (fixtureQuarantineReport.productionStatus !== "no-go-for-production" || fixtureQuarantineReport.safetyMode !== "read-only" || fixtureQuarantineReport.mutationEnabled !== false || fixtureQuarantineReport.productionWiring !== "disabled") {
  throw new Error("Fixture quarantine report must remain read-only and production no-go.");
}
if (operatorSourceLockdownReport.productionStatus !== "no-go-for-production" || operatorSourceLockdownReport.safetyMode !== "read-only" || operatorSourceLockdownReport.mutationEnabled !== false || operatorSourceLockdownReport.productionWiring !== "disabled") {
  throw new Error("Operator source lockdown report must remain read-only and production no-go.");
}
if (operatorSourceLockdownReport.operatorRecommendedSource !== "local-ingest" || operatorSourceLockdownReport.operatorRecommendedData !== "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json" || operatorSourceLockdownReport.expectedRealAgentCount !== 1 || operatorSourceLockdownReport.lockdownStatus !== "pass") {
  throw new Error("Operator source lockdown report must recommend local-ingest single-agent data and pass.");
}
if (!operatorSourceLockdownReport.fixtureSources?.some((source) => source.source === "mock" && source.requiresDemoAcknowledgement === true && source.defaultAllowed === false && source.warningLevel === "high")) {
  throw new Error("Operator source lockdown report must mark mock as high warning and defaultAllowed false.");
}
if (!operatorSourceLockdownReport.fixtureSources?.some((source) => source.source === "gateway-stub" && source.requiresDemoAcknowledgement === true && source.defaultAllowed === false && source.warningLevel === "high")) {
  throw new Error("Operator source lockdown report must mark gateway-stub as high warning and defaultAllowed false.");
}
if (operatorSourceSelectionChecklist.operatorRecommendedSource !== "local-ingest" || !operatorSourceSelectionChecklist.operatorRecommendedUrl.includes("?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json")) {
  throw new Error("Operator source selection checklist must include the recommended single-agent local-ingest URL.");
}
const localAgentHealthModule = await readFile(join(here, "src/lib/agent-health/local-agent-health.js"), "utf8");
const reviewedHealthInputAssistantModule = await readFile(join(here, "src/lib/agent-health/local-reviewed-health-input-assistant.js"), "utf8");
const localHealthEvidenceModule = await readFile(join(here, "src/lib/agent-health/local-health-evidence.js"), "utf8");
const operatorUsabilityModule = await readFile(join(here, "src/lib/operator-usability/operator-usability.js"), "utf8");
const dailyOperatorRunbookModule = await readFile(join(here, "src/lib/operator-runbook/daily-operator-runbook.js"), "utf8");
const operatorLaunchScript = await readFile(join(here, "scripts/start-operator-dashboard.ps1"), "utf8");
for (const marker of ["evaluateLocalAgentHealth", "summarizeLocalAgentHealth", "classifyHeartbeat", "validateReviewedLocalAgentHealth", "reviewedHealthToLocalInput", "local-file-only", "local-reviewed-json", "restart-agent", "stop-agent", "start-agent", "production-gateway-connect"]) {
  if (!localAgentHealthModule.includes(marker)) {
    throw new Error(`Local agent health module missing marker: ${marker}`);
  }
}
for (const marker of ["buildLocalHealthEvidenceReview", "summarizeReviewedHealthInput", "redactValidationEvidence", "classifyEvidenceStatus", "reviewed-valid", "reviewed-invalid-fallback", "missing-fallback", "unsafe-rejected", "rawValuesPrinted"]) {
  if (!localHealthEvidenceModule.includes(marker)) {
    throw new Error(`Local health evidence module missing marker: ${marker}`);
  }
}
if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(localAgentHealthModule)) {
  throw new Error("Local agent health module must not fetch, notify, or expose restart/start/stop functions.");
}
for (const marker of ["buildReviewedHealthInputTemplate", "buildReviewedHealthInputGuide", "validateReviewedHealthInputDryRun", "buildRedactedReviewedHealthPreview", "classifyReviewedHealthInputReadiness", "local-only-do-not-commit", "missing-local-input", "unsafe-rejected"]) {
  if (!reviewedHealthInputAssistantModule.includes(marker)) {
    throw new Error(`Reviewed health input assistant module missing marker: ${marker}`);
  }
}
if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(reviewedHealthInputAssistantModule)) {
  throw new Error("Reviewed health input assistant must not fetch, notify, or expose restart/start/stop functions.");
}
if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(localHealthEvidenceModule)) {
  throw new Error("Local health evidence module must not fetch, notify, or expose restart/start/stop functions.");
}
if (localRealAgentHealthReport.productionStatus !== "no-go-for-production" || localRealAgentHealthReport.safetyMode !== "read-only" || localRealAgentHealthReport.mutationEnabled !== false || localRealAgentHealthReport.productionWiring !== "disabled") {
  throw new Error("Local real agent health report must remain read-only and production no-go.");
}
if (localRealAgentHealthReport.operatorTruthSource !== "local-ingest" || localRealAgentHealthReport.operatorTruthSnapshot !== "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json") {
  throw new Error("Local real agent health report must align to the local-ingest single-agent snapshot.");
}
if (localRealAgentHealthReport.expectedRealAgentCount !== 1 || localRealAgentHealthReport.actualRealAgentCount !== 1 || localRealAgentHealthReport.healthConnectionStatus !== "local-file-only") {
  throw new Error("Local real agent health report must be local-file-only and aligned to exactly 1 real agent.");
}
if (!["local-file-only", "local-reviewed-json"].includes(localRealAgentHealthReport.healthSource) || !["missing-fallback-to-sample", "valid", "invalid-review-required"].includes(localRealAgentHealthReport.reviewedInputStatus)) {
  throw new Error("Local real agent health report must expose reviewed intake source and status.");
}
if (localRealAgentHealthReport.reviewedHealthInputPath !== "apps/dashboard/data/local/reviewed-local-agent-health.json" || localRealAgentHealthReport.reviewedHealthExamplePath !== "apps/dashboard/data/local/reviewed-local-agent-health.example.json") {
  throw new Error("Local real agent health report must document reviewed health input and example paths.");
}
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
  if (!localRealAgentHealthReport.blockedActions?.includes(blocked)) {
    throw new Error(`Local real agent health report must block ${blocked}.`);
  }
}
if (JSON.stringify(localRealAgentHealthReport.agents ?? []).includes("gateway-stub") || JSON.stringify(localRealAgentHealthReport.agents ?? []).includes("\"source\":\"mock\"")) {
  throw new Error("Local real agent health must not use mock or gateway-stub as health truth.");
}
if (operatorAgentHealthChecklist.operatorRecommendedSource !== "local-ingest" || operatorAgentHealthChecklist.healthReportPath !== "apps/dashboard/data/generated/local-real-agent-health-report.json") {
  throw new Error("Operator agent health checklist must recommend local-ingest and include the health report path.");
}
if (operatorAgentHealthChecklist.reviewedHealthInputPath !== "apps/dashboard/data/local/reviewed-local-agent-health.json" || !operatorAgentHealthChecklist.operatorChecks?.includes("確認 reviewed-local-agent-health.json 由 operator 本地生成。")) {
  throw new Error("Operator agent health checklist must include reviewed local health intake checks.");
}
if (reviewedLocalHealthTemplateReport.productionStatus !== "no-go-for-production" || reviewedLocalHealthTemplateReport.safetyMode !== "read-only" || reviewedLocalHealthTemplateReport.mutationEnabled !== false || reviewedLocalHealthTemplateReport.productionWiring !== "disabled") {
  throw new Error("Reviewed local health template report must preserve read-only and production no-go.");
}
if (reviewedLocalHealthTemplateReport.templatePath !== "apps/dashboard/data/local/reviewed-local-agent-health.template.json" || reviewedLocalHealthTemplateReport.commitPolicy !== "local-only-do-not-commit") {
  throw new Error("Reviewed local health template report must include template path and local-only commit policy.");
}
if (reviewedLocalHealthTemplateReport.redactionApplied !== true || reviewedLocalHealthTemplateReport.rawValuesPrinted !== false) {
  throw new Error("Reviewed local health template report must apply redaction and avoid raw values.");
}
if (!["ready-for-local-use", "needs-template-copy", "needs-operator-edit", "invalid-fallback-required", "unsafe-rejected", "missing-local-input", "review-required"].includes(reviewedLocalHealthInputDryRunReport.readinessStatus)) {
  throw new Error("Reviewed local health dry-run report must use a valid readiness enum.");
}
if (reviewedLocalHealthInputDryRunReport.productionStatus !== "no-go-for-production" || reviewedLocalHealthInputDryRunReport.mutationEnabled !== false || reviewedLocalHealthInputDryRunReport.productionWiring !== "disabled") {
  throw new Error("Reviewed local health dry-run report must preserve read-only and production no-go.");
}
if (reviewedLocalHealthInputDryRunReport.redactionApplied !== true || reviewedLocalHealthInputDryRunReport.rawValuesPrinted !== false) {
  throw new Error("Reviewed local health dry-run report must apply redaction and avoid raw values.");
}
if (operatorReviewedHealthInputChecklist.localInputPath !== "apps/dashboard/data/local/reviewed-local-agent-health.json" || operatorReviewedHealthInputChecklist.commitPolicy !== "local-only-do-not-commit") {
  throw new Error("Operator reviewed health input checklist must include local input path and local-only commit policy.");
}
if (localHealthEvidenceReviewReport.productionStatus !== "no-go-for-production" || localHealthEvidenceReviewReport.safetyMode !== "read-only" || localHealthEvidenceReviewReport.mutationEnabled !== false || localHealthEvidenceReviewReport.productionWiring !== "disabled") {
  throw new Error("Local health evidence review report must remain read-only and production no-go.");
}
if (localHealthEvidenceReviewReport.operatorTruthSource !== "local-ingest" || localHealthEvidenceReviewReport.operatorTruthSnapshot !== "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json") {
  throw new Error("Local health evidence review report must align to the local-ingest single-agent snapshot.");
}
if (localHealthEvidenceReviewReport.expectedRealAgentCount !== 1 || localHealthEvidenceReviewReport.actualRealAgentCount !== 1) {
  throw new Error("Local health evidence review report must align to exactly 1 real agent.");
}
if (!["reviewed-valid", "reviewed-invalid-fallback", "missing-fallback", "sample-fallback", "review-required", "unsafe-rejected"].includes(localHealthEvidenceReviewReport.evidenceStatus)) {
  throw new Error("Local health evidence review report must use a valid evidenceStatus.");
}
if (!["local-reviewed-json", "local-file-only"].includes(localHealthEvidenceReviewReport.acceptedHealthSource)) {
  throw new Error("Local health evidence review report must use a safe acceptedHealthSource.");
}
if (localHealthEvidenceReviewReport.fallbackUsed === true && !localHealthEvidenceReviewReport.fallbackReason) {
  throw new Error("Local health evidence review report must include fallbackReason when fallbackUsed is true.");
}
if (localHealthEvidenceReviewReport.redactionApplied !== true || localHealthEvidenceReviewReport.rawValuesPrinted !== false) {
  throw new Error("Local health evidence review report must apply redaction and never print raw values.");
}
if (localHealthEvidenceReviewReport.reviewedInputPath !== "apps/dashboard/data/local/reviewed-local-agent-health.json" || localHealthEvidenceReviewReport.reviewedInputExamplePath !== "apps/dashboard/data/local/reviewed-local-agent-health.example.json") {
  throw new Error("Local health evidence review report must document reviewed input paths.");
}
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
  if (!localHealthEvidenceReviewReport.blockedActions?.includes(blocked)) {
    throw new Error(`Local health evidence review report must block ${blocked}.`);
  }
}
if (operatorLocalHealthEvidenceChecklist.evidenceReviewReportPath !== "apps/dashboard/data/generated/local-health-evidence-review-report.json" || !operatorLocalHealthEvidenceChecklist.operatorChecks?.some((item) => item.includes("evidenceStatus"))) {
  throw new Error("Operator local health evidence checklist must include evidence review steps.");
}
for (const marker of ["operatorHomeEnabled: true", "operatorRecommendedSource: \"local-ingest\"", "real-local-dashboard-export.single-agent.generated.json", "restartEnabled: false", "productionGatewayEnabled: false", "getOperatorRecommendedUrl", "buildOperatorHomeCards"]) {
  if (!operatorUsabilityModule.includes(marker)) {
    throw new Error(`Operator usability module missing marker: ${marker}`);
  }
}
if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(operatorUsabilityModule)) {
  throw new Error("Operator usability module must not fetch, notify, or expose restart/start/stop functions.");
}
for (const marker of ["OpenClaw Operator Dashboard local preview", "Recommended operator view", "http://localhost:", "no-go-for-production", "Mutation: disabled", "Restart: disabled", "Production gateway: disabled"]) {
  if (!operatorLaunchScript.includes(marker)) {
    throw new Error(`Operator launch script missing marker: ${marker}`);
  }
}
if (/\.env\b|process\.env|Authorization|credentials\s*:\s*["']include["']|production\.example\.com|api\.example\.com|live\.example\.com|Restart-Service|Stop-Service|Start-Service|Restart-Computer|Stop-Process/i.test(operatorLaunchScript)) {
  throw new Error("Operator launch script must not use env, auth, credentials, production endpoints, or restart commands.");
}
if (operatorDailyUsabilityChecklist.scope !== "operator-daily-dashboard-usability" || operatorDailyUsabilityChecklist.language !== "zh-Hant") {
  throw new Error("Operator daily usability checklist must be zh-Hant and scoped to daily dashboard usability.");
}
if (!operatorDailyUsabilityChecklist.operatorRecommendedUrl?.includes("?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json") || operatorDailyUsabilityChecklist.expectedRealAgentCount !== 1) {
  throw new Error("Operator daily usability checklist must recommend the single-agent local-ingest URL.");
}
if (operatorDailyUsabilityChecklist.productionStatus !== "no-go-for-production" || operatorDailyUsabilityChecklist.mutationEnabled !== false || operatorDailyUsabilityChecklist.restartEnabled !== false || operatorDailyUsabilityChecklist.productionGatewayEnabled !== false) {
  throw new Error("Operator daily usability checklist must keep production, mutation, restart, and gateway disabled.");
}
if (!operatorDailyUsabilityChecklist.doNotDo?.some((item) => item.includes("restart")) || !operatorDailyUsabilityChecklist.doNotDo?.some((item) => item.includes("mutation"))) {
  throw new Error("Operator daily usability checklist must block restart and mutation.");
}
if (operatorUsabilityTroubleshootingReport.scope !== "operator-dashboard-usability-troubleshooting" || operatorUsabilityTroubleshootingReport.productionStatus !== "no-go-for-production") {
  throw new Error("Operator usability troubleshooting report must be scoped and production no-go.");
}
if (!operatorUsabilityTroubleshootingReport.commonIssues?.some((issue) => String(issue.issue).includes("8 agents"))) {
  throw new Error("Operator usability troubleshooting report must explain 8 fixture agents.");
}
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"]) {
  if (!operatorUsabilityTroubleshootingReport.blockedActions?.includes(blocked)) {
    throw new Error(`Operator usability troubleshooting report must block ${blocked}.`);
  }
}
for (const marker of ["buildDailyOperatorRunbook", "classifyDailyOperatorStatus", "buildSafeNextSteps", "buildBlockedActionSummary", "buildRunbookCards", "fixture-mode", "review-required", "production-gateway-connect"]) {
  if (!dailyOperatorRunbookModule.includes(marker)) {
    throw new Error(`Daily operator runbook module missing marker: ${marker}`);
  }
}
if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|restartAgent\s*\(|stopAgent\s*\(|startAgent\s*\(/.test(dailyOperatorRunbookModule)) {
  throw new Error("Daily operator runbook module must not fetch, notify, or expose restart/start/stop functions.");
}
if (!["ok", "review-required", "blocked", "fixture-mode", "unknown"].includes(dailyOperatorSummaryReport.dailyStatus)) {
  throw new Error("Daily operator summary report must use a valid dailyStatus.");
}
if (dailyOperatorSummaryReport.operatorRecommendedSource !== "local-ingest" || dailyOperatorSummaryReport.operatorRecommendedData !== "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json") {
  throw new Error("Daily operator summary report must recommend local-ingest single-agent data.");
}
if (dailyOperatorSummaryReport.expectedRealAgentCount !== 1 || dailyOperatorSummaryReport.actualRealAgentCount !== 1) {
  throw new Error("Daily operator summary report must align to exactly 1 real agent.");
}
if (dailyOperatorSummaryReport.productionStatus !== "no-go-for-production" || dailyOperatorSummaryReport.mutationEnabled !== false || dailyOperatorSummaryReport.restartEnabled !== false || dailyOperatorSummaryReport.productionGatewayEnabled !== false) {
  throw new Error("Daily operator summary report must keep production, mutation, restart, and gateway disabled.");
}
if (dailyOperatorSummaryReport.reviewedHealthDryRunReportPath !== "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json" || !dailyOperatorSummaryReport.reviewedHealthInputReadiness) {
  throw new Error("Daily operator summary report must include reviewed health input dry-run readiness.");
}
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"]) {
  if (!dailyOperatorSummaryReport.blockedActions?.includes(blocked)) {
    throw new Error(`Daily operator summary report must block ${blocked}.`);
  }
}
if (["mock", "gateway-stub"].includes(dailyOperatorSummaryReport.operatorRecommendedSource) || ["mock", "gateway-stub"].includes(dailyOperatorSummaryReport.operatorTruthSource)) {
  throw new Error("Daily operator summary report must not use mock or gateway-stub as daily truth.");
}
if (!["ok", "review-required", "blocked", "fixture-mode", "unknown"].includes(dailyOperatorRunbookChecklist.dailyStatus)) {
  throw new Error("Daily operator runbook checklist must use a valid dailyStatus.");
}
if (dailyOperatorRunbookChecklist.reviewedHealthDryRunReportPath !== "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json" || !dailyOperatorRunbookChecklist.reviewedHealthInputReadiness) {
  throw new Error("Daily operator runbook checklist must include reviewed health dry-run readiness.");
}
if (dailyOperatorRunbookChecklist.scope !== "daily-operator-runbook" || dailyOperatorRunbookChecklist.language !== "zh-Hant") {
  throw new Error("Daily operator runbook checklist must be zh-Hant and scoped to daily runbook.");
}
for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy", "auth-token-secrets"]) {
  if (!dailyOperatorRunbookChecklist.notAllowed?.includes(blocked)) {
    throw new Error(`Daily operator runbook checklist must block ${blocked}.`);
  }
}
if (!dailyOperatorRunbookChecklist.operatorChecks?.some((item) => item.includes("source = local-ingest")) || !dailyOperatorRunbookChecklist.operatorChecks?.some((item) => item.includes("agent count = 1"))) {
  throw new Error("Daily operator runbook checklist must ask operator to confirm local-ingest and one agent.");
}
if (!["blocked", "review-required", "local-only-ready", "not-evaluated"].includes(productionEntryGateReport.gateStatus)) {
  throw new Error("Production entry gate report must use a valid gateStatus.");
}
if (productionEntryGateReport.productionReady !== false || productionEntryGateChecklist.productionReady !== false) {
  throw new Error("Production entry gate reports must keep productionReady false.");
}
if (productionEntryGateReport.productionStatus !== "no-go-for-production" || productionEntryGateReport.productionGatewayEnabled !== false || productionEntryGateReport.mutationEnabled !== false || productionEntryGateReport.restartEnabled !== false || productionEntryGateReport.productionWiring !== "disabled") {
  throw new Error("Production entry gate report must keep production no-go and disabled gateway/mutation/restart/wiring.");
}
if (productionEntryGateReport.operatorRecommendedSource !== "local-ingest" || productionEntryGateReport.expectedRealAgentCount !== 1 || productionEntryGateReport.actualRealAgentCount !== 1) {
  throw new Error("Production entry gate report must use local-ingest single-agent truth.");
}
for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
  if (!productionEntryGateReport.blockedActions?.includes(blocked)) {
    throw new Error(`Production entry gate report must block ${blocked}.`);
  }
  if (!productionEntryGateChecklist.notAllowed?.includes(blocked)) {
    throw new Error(`Production entry gate checklist must block ${blocked}.`);
  }
}
if (productionEntryGateChecklist.scope !== "production-entry-gate" || productionEntryGateChecklist.language !== "zh-Hant") {
  throw new Error("Production entry gate checklist must be zh-Hant and scoped to production-entry-gate.");
}
if (dailyOperatorSummaryReport.productionEntryGateReportPath !== "apps/dashboard/data/generated/production-entry-gate-report.json" || dailyOperatorSummaryReport.productionReady !== false || !dailyOperatorSummaryReport.productionEntryGateStatus) {
  throw new Error("Daily operator summary must reference production entry gate and keep productionReady false.");
}
if (dailyOperatorRunbookChecklist.productionEntryGateReportPath !== "apps/dashboard/data/generated/production-entry-gate-report.json" || dailyOperatorRunbookChecklist.productionReady !== false || !dailyOperatorRunbookChecklist.productionEntryGateStatus) {
  throw new Error("Daily runbook checklist must reference production entry gate and keep productionReady false.");
}
for (const marker of ["Local Real Agent Health / 本地真實 Agent 健康狀態", "Health source:", "local-reviewed-json", "reviewed-local-agent-health.json", "invalid reviewed local health input", "Operator truth source: local-ingest single-agent snapshot", "Expected real agent count: 1", "Actual real agent count: 1", "No restart action available", "No production gateway connection", "No mutation action"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 22A marker: ${marker}`);
  }
}
for (const marker of ["Local Health Evidence Review", "Evidence status:", "Accepted health source:", "Fallback used:", "Fallback reason:", "Redaction applied:", "Raw values printed:", "Reviewed local health JSON not provided.", "Reviewed local health JSON rejected.", "Reviewed local health JSON accepted."]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 22C marker: ${marker}`);
  }
}
for (const marker of ["Reviewed Health Input Assistant", "reviewed-local-agent-health.template.json", "reviewed-local-agent-health.json", "Dry-run readiness", "Redaction applied", "Raw values printed", "local-only-do-not-commit", "missing-local-input", "unsafe-rejected"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 23C marker: ${marker}`);
  }
}
for (const marker of ["Production Entry Gate", "Gate status", "Production ready", "No / false", "production-entry-gate-report.json", "production-entry-gate-checklist.json", "Manual approval required", "Deploy disabled", "Approve disabled"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 24A marker: ${marker}`);
  }
}
if (!fixtureQuarantineReport.fixtureSources?.some((source) => source.source === "mock" && source.trustLevel === "fixture-demo" && source.operatorTruth === false && source.expectedAgentCount === 8)) {
  throw new Error("Fixture quarantine report must classify mock as fixture-demo with 8-agent fixture coverage.");
}
if (!fixtureQuarantineReport.fixtureSources?.some((source) => source.source === "gateway-stub" && source.trustLevel === "fixture-contract" && source.operatorTruth === false && source.expectedAgentCount === 8)) {
  throw new Error("Fixture quarantine report must classify gateway-stub as fixture-contract with 8-agent fixture coverage.");
}
if (!fixtureQuarantineReport.operatorTruthSources?.some((source) => source.source === "local-ingest" && source.trustLevel === "operator-truth-candidate" && source.expectedAgentCount === 1)) {
  throw new Error("Fixture quarantine report must classify local-ingest as operator-truth-candidate with expected count 1.");
}
for (const marker of ["Actual real agent count: 1", "Single-agent snapshot: loaded", "Real local snapshot review required", "Expected 1 agent, found"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 21C marker: ${marker}`);
  }
}

for (const marker of ["Operator recommended source / Operator 建議資料來源", "local-ingest single-agent snapshot", "?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json", "High warning: Demo fixture data only.", "High warning: Contract fixture data only.", "Operator truth candidate loaded.", "No query param => show operator source selection notice + recommended single-agent URL."]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 21D marker: ${marker}`);
  }
}

for (const marker of ["Operator Home", "Recommended operator view", "Open recommended operator view", "This is not the daily operator view", "operator-daily-usability-checklist.json", "operator-usability-troubleshooting-report.json", "Local Real Agent Health", "Local Health Evidence Review", "Restart", "Mutation", "Production gateway"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 23A marker: ${marker}`);
  }
}
for (const marker of ["Daily Operator Runbook", "Today status", "Why this status", "Safe next steps", "Blocked actions", "daily-operator-summary-report.json", "daily-operator-runbook-checklist.json"]) {
  if (!app.includes(marker)) {
    throw new Error(`UI missing Sprint 23B marker: ${marker}`);
  }
}
if (!html.includes("operator-usability.js?v=23A")) {
  throw new Error("Dashboard shell missing Sprint 23A operator usability module marker.");
}
if (!html.includes("sprint-23a-operator-usability-mvp") && !html.includes("sprint-23b-daily-operator-runbook-mode") && !html.includes("sprint-23c-reviewed-health-input-assistant") && !html.includes("sprint-24a-production-entry-gate-hardening")) {
  throw new Error("Dashboard shell missing Sprint 23A or later app cache marker.");
}
if (!html.includes("daily-operator-runbook.js?v=23B")) {
  throw new Error("Dashboard shell missing Sprint 23B daily runbook module marker.");
}
if (!html.includes("sprint-23b-daily-operator-runbook-mode") && !html.includes("sprint-23c-reviewed-health-input-assistant") && !html.includes("sprint-24a-production-entry-gate-hardening")) {
  throw new Error("Dashboard shell missing Sprint 23B or later app cache marker.");
}
if (!html.includes("local-reviewed-health-input-assistant.js?v=23C")) {
  throw new Error("Dashboard shell missing Sprint 23C reviewed health assistant module marker.");
}
if (!html.includes("sprint-23c-reviewed-health-input-assistant") && !html.includes("sprint-24a-production-entry-gate-hardening")) {
  throw new Error("Dashboard shell missing Sprint 23C or later app cache marker.");
}
for (const marker of ["production-entry-gates.js?v=24A", "sprint-24a-production-entry-gate-hardening"]) {
  if (!html.includes(marker)) {
    throw new Error(`Dashboard shell missing Sprint 24A marker: ${marker}`);
  }
}
for (const marker of ["Operator 首頁", "建議 Operator 檢視", "每日 Operator 檢視", "重啟：已停用"]) {
  if (!zhHantModule.includes(marker)) {
    throw new Error(`i18n missing Sprint 23A marker: ${marker}`);
  }
}
for (const marker of ["每日 Operator Runbook", "今日狀態", "狀態原因", "安全下一步", "已封鎖操作"]) {
  if (!zhHantModule.includes(marker) && !app.includes(marker)) {
    throw new Error(`i18n/app missing Sprint 23B marker: ${marker}`);
  }
}

const fixtureQuarantineText = JSON.stringify({ singleAgentTruthReport, fixtureQuarantineReport, operatorSourceLockdownReport, operatorSourceSelectionChecklist, localRealAgentHealthReport, operatorAgentHealthChecklist, reviewedLocalHealthTemplateReport, reviewedLocalHealthInputDryRunReport, operatorReviewedHealthInputChecklist, localHealthEvidenceReviewReport, operatorLocalHealthEvidenceChecklist, operatorDailyUsabilityChecklist, operatorUsabilityTroubleshootingReport, dailyOperatorSummaryReport, dailyOperatorRunbookChecklist, productionEntryGateReport, productionEntryGateChecklist, realLocalAgentInspection, singleAgentLocalSnapshot });
if (/[A-Za-z]:\\Users\\|\/home\/|password\s*[:=]|token\s*[:=]|cookie\s*[:=]|api[_-]?key\s*[:=]|Authorization\s*:|"productionDeploy":true|"mutationEnabled":true|production-ready|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(fixtureQuarantineText.replace(/\s+/g, ""))) {
  throw new Error("Fixture quarantine reports contain unsafe status, endpoint, path, secret, deploy, mutation, or production-ready markers.");
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
