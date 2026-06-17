import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "quality-gate-report.json");
const nodeExe = process.execPath;

const commands = [
  ["apps/dashboard/scripts/generate-dashboard-snapshot.mjs"],
  ["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/dashboard-export.sample.json"],
  ["apps/dashboard/scripts/validate-dashboard-snapshot.mjs", "apps/dashboard/data/generated/dashboard-export.generated.json"],
  ["apps/dashboard/scripts/test-gateway-contract.mjs"],
  ["apps/dashboard/scripts/diff-gateway-fixtures.mjs"],
  ["apps/dashboard/scripts/test-local-ingest.mjs"],
  ["apps/dashboard/scripts/test-dev-gateway-config.mjs"],
  ["apps/dashboard/scripts/test-rbac-policy.mjs"],
  ["apps/dashboard/scripts/generate-action-draft-samples.mjs"],
  ["apps/dashboard/scripts/test-action-drafts.mjs"],
  ["apps/dashboard/scripts/generate-release-manifest.mjs"],
  ["apps/dashboard/scripts/create-local-release-bundle.mjs"],
  ["apps/dashboard/scripts/verify-local-release.mjs"],
  ["apps/dashboard/scripts/generate-observability-report.mjs"],
  ["apps/dashboard/scripts/test-observability.mjs"],
  ["apps/dashboard/scripts/generate-production-readiness-report.mjs"],
  ["apps/dashboard/scripts/test-production-readiness.mjs"],
  ["apps/dashboard/scripts/generate-final-beta-audit.mjs"],
  ["apps/dashboard/scripts/verify-final-beta.mjs"],
  ["apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs"],
  ["apps/dashboard/scripts/test-real-local-data-pilot.mjs"],
  ["apps/dashboard/scripts/test-dashboard-localization.mjs"],
  ["apps/dashboard/scripts/run-dev-gateway-live-drill.mjs"],
  ["apps/dashboard/scripts/test-dev-gateway-live-drill.mjs"],
  ["apps/dashboard/scripts/run-operator-daily-workflow.mjs"],
  ["apps/dashboard/scripts/run-operator-incident-drill.mjs"],
  ["apps/dashboard/scripts/generate-operator-evidence-manifest.mjs"],
  ["apps/dashboard/scripts/test-operator-workflow.mjs"],
  ["apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs"],
  ["apps/dashboard/scripts/generate-operator-access-checklist.mjs"],
  ["apps/dashboard/scripts/test-internal-static-hosting.mjs"],
  ["apps/dashboard/scripts/generate-security-privacy-audit.mjs"],
  ["apps/dashboard/scripts/test-generated-report-sanitization.mjs"],
  ["apps/dashboard/scripts/generate-data-retention-review.mjs"],
  ["apps/dashboard/scripts/generate-operator-security-checklist.mjs"],
  ["apps/dashboard/scripts/test-security-privacy-audit.mjs"],
  ["apps/dashboard/scripts/generate-internal-release-candidate.mjs"],
  ["apps/dashboard/scripts/generate-internal-signoff-package.mjs"],
  ["apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs"],
  ["apps/dashboard/scripts/test-internal-release-candidate.mjs"],
  ["apps/dashboard/scripts/generate-production-track-plan.mjs"],
  ["apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs"],
  ["apps/dashboard/scripts/generate-production-entry-gates.mjs"],
  ["apps/dashboard/scripts/test-production-track-planning.mjs"],
  ["apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs"],
  ["apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs"],
  ["apps/dashboard/scripts/generate-single-agent-truth-report.mjs", "--data", "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json"],
  ["apps/dashboard/scripts/generate-fixture-quarantine-report.mjs"],
  ["apps/dashboard/scripts/test-single-agent-local-snapshot.mjs"],
  ["apps/dashboard/scripts/test-fixture-quarantine.mjs"],
  ["apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs"],
  ["apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs"],
  ["apps/dashboard/scripts/test-operator-source-lockdown.mjs"],
  ["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"],
  ["apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs"],
  ["apps/dashboard/scripts/generate-reviewed-local-health-template.mjs"],
  ["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs"],
  ["apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs"],
  ["apps/dashboard/scripts/test-reviewed-health-input-assistant.mjs"],
  ["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"],
  ["apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs"],
  ["apps/dashboard/scripts/test-local-health-evidence-review.mjs"],
  ["apps/dashboard/scripts/test-local-real-agent-health.mjs"],
  ["apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs"],
  ["apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs"],
  ["apps/dashboard/scripts/test-operator-usability-mvp.mjs"],
  ["apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs"],
  ["apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs"],
  ["apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs"],
  ["apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs"],
  ["apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs"],
  ["apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs"],
  ["apps/dashboard/scripts/generate-production-entry-gate-report.mjs"],
  ["apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs"],
  ["apps/dashboard/scripts/generate-daily-operator-summary-report.mjs"],
  ["apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs"],
  ["apps/dashboard/scripts/test-daily-operator-runbook.mjs"],
  ["apps/dashboard/scripts/build-whatsapp-local-task-import.mjs"],
  ["apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs"],
  ["apps/dashboard/scripts/generate-local-task-inbox-report.mjs"],
  ["apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs"],
  ["apps/dashboard/scripts/generate-whatsapp-sync-mock-contract-report.mjs"],
  ["apps/dashboard/scripts/run-whatsapp-fake-webhook-fixture-runner.mjs"],
  ["apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs"],
  ["apps/dashboard/scripts/check-whatsapp-real-api-preflight-gate.mjs"],
  ["apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs"],
  ["apps/dashboard/scripts/generate-provider-balance-center-report.mjs"],
  ["apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-sync-mock-contract.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-fake-webhook-fixture-runner.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-real-api-preflight-gate.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-secret-manager-design.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-local-task-import.mjs"],
  ["apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs"],
  ["apps/dashboard/scripts/test-chinese-operator-ux-copy.mjs"],
  ["apps/dashboard/scripts/test-operator-console-visual-ux.mjs"],
  ["apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs"],
  ["apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs"],
  ["apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs", "--distro", "Ubuntu-24.04", "--state-dir", "__WSL_OPENCLAW_STATE_DIR__", "--dry-run"],
  ["apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs", "--distro", "Ubuntu-24.04", "--state-dir", "__WSL_OPENCLAW_STATE_DIR__", "--dry-run"],
  ["apps/dashboard/scripts/run-local-openclaw-connector.mjs"],
  ["apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs"],
  ["apps/dashboard/scripts/test-local-openclaw-connector.mjs"],
  ["apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs"],
  ["apps/dashboard/scripts/test-wsl-openclaw-local-export-adapter.mjs"],
  ["apps/dashboard/scripts/test-wsl-openclaw-task-metadata-discovery.mjs"],
  ["apps/dashboard/scripts/test-local-openclaw-activation-assistant.mjs"],
  ["apps/dashboard/scripts/test-production-adapter-simulator.mjs"],
  ["apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs"],
  ["apps/dashboard/scripts/test-production-entry-gates.mjs"],
  ["apps/dashboard/scripts/run-local-operator-rc-audit.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-final-checklist.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-report-index.mjs"],
  ["apps/dashboard/scripts/test-local-operator-rc-audit.mjs"],
  ["apps/dashboard/scripts/safety-scan-dashboard.mjs"],
  ["apps/dashboard/verify-dashboard.mjs"]
];

const syntaxFiles = [
  "apps/dashboard/src/app.js",
  "apps/dashboard/src/lib/mock-data.js",
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
  "apps/dashboard/src/lib/adapters/dev-gateway-config.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-client.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-validation.js",
  "apps/dashboard/src/lib/adapters/dev-gateway-adapter.js",
  "apps/dashboard/src/lib/adapters/source-config.js",
  "apps/dashboard/src/lib/adapters/source-status.js",
  "apps/dashboard/src/lib/rbac/roles.js",
  "apps/dashboard/src/lib/rbac/permissions.js",
  "apps/dashboard/src/lib/rbac/rbac-policy.js",
  "apps/dashboard/src/lib/rbac/rbac-state.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-types.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-builder.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-validation.js",
  "apps/dashboard/src/lib/action-drafts/action-draft-store.js",
  "apps/dashboard/src/lib/observability/observability-types.js",
  "apps/dashboard/src/lib/observability/observability-rules.js",
  "apps/dashboard/src/lib/observability/observability-evaluator.js",
  "apps/dashboard/src/lib/observability/observability-summary.js",
  "apps/dashboard/src/lib/readiness/readiness-types.js",
  "apps/dashboard/src/lib/readiness/readiness-checklist.js",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.js",
  "apps/dashboard/src/lib/readiness/readiness-summary.js",
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
  "apps/dashboard/src/lib/data-trust/source-lockdown.js",
  "apps/dashboard/src/lib/agent-health/local-agent-health.js",
  "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js",
  "apps/dashboard/src/lib/operator-usability/operator-usability.js",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js",
  "apps/dashboard/src/lib/operator-ux/operator-copy.js",
  "apps/dashboard/src/lib/operator-ux/operator-design-system.js",
  "apps/dashboard/src/lib/operator-tasks/local-task-inbox.js",
  "apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.js",
  "apps/dashboard/src/lib/operator-balance/provider-balance-center.js",
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js",
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.js",
  "apps/dashboard/src/lib/local-openclaw/local-openclaw-task-metadata-safety.js",
  "apps/dashboard/src/lib/production-readiness/production-entry-gates.js",
  "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.js",
  "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.js",
  "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.js",
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
  "apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs",
  "apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs",
  "apps/dashboard/scripts/test-operator-usability-mvp.mjs",
  "apps/dashboard/scripts/generate-daily-operator-summary-report.mjs",
  "apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs",
  "apps/dashboard/scripts/test-daily-operator-runbook.mjs",
  "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs",
  "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs",
  "apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs",
  "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-fake-provider.js",
  "apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs",
  "apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs",
  "apps/dashboard/src/lib/whatsapp-sync/whatsapp-real-api-preflight-gate.js",
  "apps/dashboard/scripts/check-whatsapp-real-api-preflight-gate.mjs",
  "apps/dashboard/scripts/test-whatsapp-real-api-preflight-gate.mjs",
  "apps/dashboard/scripts/generate-provider-balance-center-report.mjs",
  "apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs",
  "apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs",
  "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.js",
  "apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-fake-provider.js",
  "apps/dashboard/src/lib/whatsapp-sync/whatsapp-real-api-preflight-gate.js",
  "apps/dashboard/scripts/test-chinese-operator-ux-copy.mjs",
  "apps/dashboard/scripts/test-operator-console-visual-ux.mjs",
  "apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs",
  "apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs",
  "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs",
  "apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs",
  "apps/dashboard/scripts/run-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/setup-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs",
  "apps/dashboard/scripts/test-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs",
  "apps/dashboard/scripts/test-wsl-openclaw-local-export-adapter.mjs",
  "apps/dashboard/scripts/test-wsl-openclaw-task-metadata-discovery.mjs",
  "apps/dashboard/scripts/test-local-openclaw-activation-assistant.mjs",
  "apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs",
  "apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs",
  "apps/dashboard/scripts/test-production-adapter-simulator.mjs",
  "apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs",
  "apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs",
  "apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs",
  "apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs",
  "apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs",
  "apps/dashboard/src/lib/release-readiness/local-operator-rc-audit.js",
  "apps/dashboard/scripts/lib/local-operator-rc-utils.mjs",
  "apps/dashboard/scripts/run-local-operator-rc-audit.mjs",
  "apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs",
  "apps/dashboard/scripts/generate-local-operator-final-checklist.mjs",
  "apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs",
  "apps/dashboard/scripts/generate-local-operator-report-index.mjs",
  "apps/dashboard/scripts/test-local-operator-rc-audit.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-report.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs",
  "apps/dashboard/scripts/test-production-entry-gates.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs"
];

for (const file of syntaxFiles) {
  commands.push(["--check", file]);
}

const requiredFiles = [
  "AGENTS.md",
  "apps/dashboard/README.md",
  "apps/dashboard/verify-dashboard.mjs",
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
  "apps/dashboard/src/lib/operator-usability/operator-usability.js",
  "apps/dashboard/src/lib/operator-usability/operator-usability.ts",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js",
  "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.ts",
  "apps/dashboard/src/lib/operator-ux/operator-copy.js",
  "apps/dashboard/src/lib/operator-ux/operator-copy.ts",
  "apps/dashboard/src/lib/operator-tasks/local-task-inbox.js",
  "apps/dashboard/src/lib/operator-tasks/local-task-inbox.ts",
  "apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.js",
  "apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.ts",
  "apps/dashboard/src/lib/operator-balance/provider-balance-center.js",
  "apps/dashboard/src/lib/operator-balance/provider-balance-center.ts",
  "apps/dashboard/src/lib/production-readiness/production-entry-gates.js",
  "apps/dashboard/src/lib/production-readiness/production-entry-gates.ts",
  "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.js",
  "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.ts",
  "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.js",
  "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.ts",
  "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.js",
  "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.ts",
  "apps/dashboard/scripts/start-operator-dashboard.ps1",
  "apps/dashboard/data/local-agent-health/local-agent-health.sample.json",
  "apps/dashboard/data/local/.gitignore",
  "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  "apps/dashboard/data/local/operator-task-inbox.template.json",
  "apps/dashboard/data/local/operator-task-inbox.example.json",
  "apps/dashboard/data/local/whatsapp-task-helper-input.template.txt",
  "apps/dashboard/data/local/whatsapp-task-helper-input.example.txt",
  "apps/dashboard/data/local/provider-balance-center.template.json",
  "apps/dashboard/data/local/provider-balance-center.example.json",
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "apps/dashboard/scripts/generate-fixture-quarantine-report.mjs",
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
  "apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs",
  "apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs",
  "apps/dashboard/scripts/test-operator-usability-mvp.mjs",
  "apps/dashboard/scripts/generate-daily-operator-summary-report.mjs",
  "apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs",
  "apps/dashboard/scripts/test-daily-operator-runbook.mjs",
  "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs",
  "apps/dashboard/scripts/build-whatsapp-local-task-import.ps1",
  "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs",
  "apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs",
  "apps/dashboard/scripts/generate-provider-balance-center-report.mjs",
  "apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs",
  "apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs",
  "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.js",
  "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.ts",
  "apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs",
  "apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs",
  "apps/dashboard/scripts/test-production-adapter-simulator.mjs",
  "apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs",
  "apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs",
  "apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs",
  "apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs",
  "apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-report.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs",
  "apps/dashboard/scripts/test-production-entry-gates.mjs",
  "apps/dashboard/scripts/lib/real-local-data-parsers.mjs",
  "apps/dashboard/scripts/lib/real-local-data-sanitizer.mjs",
  "apps/dashboard/scripts/lib/real-local-data-mapper.mjs",
  "apps/dashboard/scripts/lib/real-local-data-validation.mjs",
  "apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
  "apps/dashboard/scripts/safety-scan-dashboard.mjs",
  "apps/dashboard/schema/README.md",
  "apps/dashboard/schema/dashboard-export.schema.json",
  "apps/dashboard/schema/artifact-manifest.schema.json",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.js",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.js",
  "apps/dashboard/src/lib/adapters/gateway-contract-mapper.ts",
  "apps/dashboard/src/lib/adapters/gateway-contract-validation.ts",
  "apps/dashboard/src/lib/adapters/gateway-stub-adapter.ts",
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
  "apps/dashboard/src/lib/observability/observability-types.js",
  "apps/dashboard/src/lib/observability/observability-rules.js",
  "apps/dashboard/src/lib/observability/observability-evaluator.js",
  "apps/dashboard/src/lib/observability/observability-summary.js",
  "apps/dashboard/src/lib/observability/observability-types.ts",
  "apps/dashboard/src/lib/observability/observability-rules.ts",
  "apps/dashboard/src/lib/observability/observability-evaluator.ts",
  "apps/dashboard/src/lib/observability/observability-summary.ts",
  "apps/dashboard/src/lib/readiness/readiness-types.js",
  "apps/dashboard/src/lib/readiness/readiness-checklist.js",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.js",
  "apps/dashboard/src/lib/readiness/readiness-summary.js",
  "apps/dashboard/src/lib/readiness/readiness-types.ts",
  "apps/dashboard/src/lib/readiness/readiness-checklist.ts",
  "apps/dashboard/src/lib/readiness/readiness-evaluator.ts",
  "apps/dashboard/src/lib/readiness/readiness-summary.ts",
  "apps/dashboard/src/lib/i18n/zh-hant.js",
  "apps/dashboard/src/lib/i18n/i18n.js",
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
  "apps/dashboard/data/generated/local-real-agent-health-report.json",
  "apps/dashboard/data/generated/operator-agent-health-checklist.json",
  "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json",
  "apps/dashboard/data/generated/operator-daily-usability-checklist.json",
  "apps/dashboard/data/generated/operator-usability-troubleshooting-report.json",
  "apps/dashboard/data/generated/daily-operator-summary-report.json",
  "apps/dashboard/data/generated/daily-operator-runbook-checklist.json",
  "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
  "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
  "apps/dashboard/data/generated/local-task-inbox-report.json",
  "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  "apps/dashboard/data/generated/provider-balance-center-report.json",
  "apps/dashboard/data/generated/production-adapter-simulator-report.json",
  "apps/dashboard/data/generated/production-adapter-simulator-checklist.json",
  "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  "apps/dashboard/data/generated/read-only-adapter-contract-checklist.json",
  "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json",
  "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
  "apps/dashboard/data/generated/local-operator-final-checklist.json",
  "apps/dashboard/data/generated/local-operator-known-risk-register.json",
  "apps/dashboard/data/generated/local-operator-report-index.json",
  "apps/dashboard/data/generated/production-entry-gate-report.json",
  "apps/dashboard/data/generated/production-entry-gate-checklist.json",
  "apps/dashboard/data/production-simulator/read-only-production-adapter.sample.json",
  "apps/dashboard/release/README.md",
  "apps/dashboard/release/local-release-index.json",
  "apps/dashboard/data/local-ingest/local-dashboard-ingest.sample.json",
  "apps/dashboard/data/local-ingest/crawler-output.sample.json",
  "apps/dashboard/data/local-ingest/agent-run-log.sample.json",
  "apps/dashboard/data/local-ingest/task-memory-index.sample.json",
  "apps/dashboard/data/local-ingest/artifact-index.sample.json",
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
  "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
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
  "docs/dashboard/openclaw-dashboard-rbac.md",
  "docs/dashboard/openclaw-dashboard-action-drafts.md",
  "docs/dashboard/openclaw-dashboard-internal-deployment-plan.md",
  "docs/dashboard/openclaw-dashboard-operator-release-workflow.md",
  "docs/dashboard/openclaw-dashboard-observability.md",
  "docs/dashboard/openclaw-dashboard-production-readiness.md",
  "docs/dashboard/README.md",
  "docs/dashboard/openclaw-dashboard-repo-hygiene.md",
  "docs/dashboard/openclaw-dashboard-operator-handoff.md",
  "docs/dashboard/openclaw-dashboard-real-local-data-pilot.md",
  "docs/dashboard/openclaw-dashboard-snapshot-refresh-drill.md",
  "docs/dashboard/openclaw-dashboard-operator-runbook.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "docs/dashboard/openclaw-dashboard-local-agent-health.md",
  "docs/dashboard/openclaw-dashboard-local-health-evidence-review.md",
  "docs/dashboard/openclaw-dashboard-operator-usability-mvp.md",
  "docs/dashboard/openclaw-dashboard-daily-operator-runbook-mode.md",
  "docs/dashboard/openclaw-dashboard-operator-ux-polish.md",
  "docs/dashboard/openclaw-dashboard-local-task-inbox.md",
  "docs/dashboard/openclaw-dashboard-hourly-refresh.md",
  "docs/dashboard/openclaw-dashboard-provider-balance-center.md",
  "docs/dashboard/openclaw-dashboard-production-adapter-simulator.md",
  "docs/dashboard/openclaw-dashboard-read-only-adapter-contract-review.md",
  "docs/dashboard/openclaw-dashboard-disabled-read-only-adapter-draft.md",
  "docs/dashboard/openclaw-dashboard-stabilization-audit.md",
  "docs/dashboard/openclaw-dashboard-production-entry-gate-hardening.md",
  "docs/phase-log.md",
  "tests/manual-smoke-tests.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-002.md",
  "ops/tasks/TASK-20260609-OC-DASH-003.md",
  "ops/tasks/TASK-20260609-OC-DASH-004.md",
  "ops/tasks/TASK-20260609-OC-DASH-005.md",
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
  "ops/tasks/TASK-20260609-OC-DASH-21D.md",
  "ops/tasks/TASK-20260609-OC-DASH-22A.md",
  "ops/tasks/TASK-20260609-OC-DASH-22B.md",
  "ops/tasks/TASK-20260609-OC-DASH-22C.md",
  "ops/tasks/TASK-20260609-OC-DASH-23A.md",
  "ops/tasks/TASK-20260609-OC-DASH-23B.md",
  "ops/tasks/TASK-20260609-OC-DASH-25A.md",
  "artifacts/TASK-20260609-OC-DASH-006/README.md",
  "artifacts/TASK-20260609-OC-DASH-007/README.md",
  "artifacts/TASK-20260609-OC-DASH-008/README.md",
  "artifacts/TASK-20260609-OC-DASH-09A/README.md",
  "artifacts/TASK-20260609-OC-DASH-11A/README.md",
  "artifacts/TASK-20260609-OC-DASH-12A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-14A/README.md",
  "artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-15A/README.md",
  "artifacts/TASK-20260609-OC-DASH-15B/README.md",
  "artifacts/TASK-20260609-OC-DASH-16A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-17A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-18A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-19A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-20A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-21B/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-21C/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-21D/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-22A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-22B/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-22C/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-23A/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-23B/README.md"
  ,"artifacts/TASK-20260609-OC-DASH-25A/README.md"
];

const results = [];

function runNode(args) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(nodeExe, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const record = {
    command: `node ${args.join(" ")}`,
    startedAt,
    endedAt: new Date().toISOString(),
    exitCode: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
  results.push(record);
  if (record.exitCode !== 0) {
    console.error(`FAILED: ${record.command}`);
    if (record.stdout) console.error(record.stdout);
    if (record.stderr) console.error(record.stderr);
    return false;
  }
  console.log(`PASS: ${record.command}`);
  return true;
}

let failed = false;
for (const file of requiredFiles) {
  try {
    const body = await readFile(join(repoRoot, file), "utf8");
    if (!body.trim()) throw new Error("empty file");
  } catch (error) {
    failed = true;
    results.push({
      command: `required-file ${file}`,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      exitCode: 1,
      stdout: "",
      stderr: error.message
    });
    console.error(`FAILED: required file ${file} (${error.message})`);
  }
}

for (const args of commands) {
  if (!runNode(args)) failed = true;
}

let safetyReport = null;
try {
  safetyReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "safety-scan-report.json"), "utf8"));
} catch {
  safetyReport = { result: "missing" };
}

let gatewayDiffReport = null;
try {
  gatewayDiffReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "gateway-fixture-diff-report.json"), "utf8"));
} catch {
  gatewayDiffReport = { result: "missing" };
}

const gatewayContractTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-gateway-contract.mjs")?.exitCode === 0 ? "pass" : "fail";
const gatewayFixtureDiff = results.find((result) => result.command === "node apps/dashboard/scripts/diff-gateway-fixtures.mjs")?.exitCode === 0 ? "pass" : "fail";
const localIngestTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-ingest.mjs")?.exitCode === 0 ? "pass" : "fail";
const devGatewayConfigTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-dev-gateway-config.mjs")?.exitCode === 0 ? "pass" : "fail";
const rbacPolicyTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-rbac-policy.mjs")?.exitCode === 0 ? "pass" : "fail";
const actionDraftSampleGeneration = results.find((result) => result.command === "node apps/dashboard/scripts/generate-action-draft-samples.mjs")?.exitCode === 0 ? "pass" : "fail";
const actionDraftTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-action-drafts.mjs")?.exitCode === 0 ? "pass" : "fail";
const releaseManifest = results.find((result) => result.command === "node apps/dashboard/scripts/generate-release-manifest.mjs")?.exitCode === 0 ? "pass" : "fail";
const localReleaseBundle = results.find((result) => result.command === "node apps/dashboard/scripts/create-local-release-bundle.mjs")?.exitCode === 0 ? "pass" : "fail";
const releaseVerification = results.find((result) => result.command === "node apps/dashboard/scripts/verify-local-release.mjs")?.exitCode === 0 ? "pass" : "fail";
const observabilityReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-observability-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const observabilityTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-observability.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionReadinessReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-readiness-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionReadinessTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-production-readiness.mjs")?.exitCode === 0 ? "pass" : "fail";
const finalBetaAudit = results.find((result) => result.command === "node apps/dashboard/scripts/generate-final-beta-audit.mjs")?.exitCode === 0 ? "pass" : "fail";
const finalBetaVerification = results.find((result) => result.command === "node apps/dashboard/scripts/verify-final-beta.mjs")?.exitCode === 0 ? "pass" : "fail";
const realLocalSnapshotRefreshDrill = results.find((result) => result.command === "node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs")?.exitCode === 0 ? "pass" : "fail";
const realLocalDataPilotTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-real-local-data-pilot.mjs")?.exitCode === 0 ? "pass" : "fail";
const dashboardLocalization = results.find((result) => result.command === "node apps/dashboard/scripts/test-dashboard-localization.mjs")?.exitCode === 0 ? "pass" : "fail";
const devGatewayLiveDrill = results.find((result) => result.command === "node apps/dashboard/scripts/run-dev-gateway-live-drill.mjs")?.exitCode === 0 ? "pass" : "fail";
const devGatewayLiveDrillTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-dev-gateway-live-drill.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorDailyWorkflow = results.find((result) => result.command === "node apps/dashboard/scripts/run-operator-daily-workflow.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorIncidentDrill = results.find((result) => result.command === "node apps/dashboard/scripts/run-operator-incident-drill.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorEvidenceManifest = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorWorkflowTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-operator-workflow.mjs")?.exitCode === 0 ? "pass" : "fail";
const internalStaticHostingDryRun = results.find((result) => result.command === "node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorAccessChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-access-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const internalStaticHostingTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-internal-static-hosting.mjs")?.exitCode === 0 ? "pass" : "fail";
const securityPrivacyAudit = results.find((result) => result.command === "node apps/dashboard/scripts/generate-security-privacy-audit.mjs")?.exitCode === 0 ? "pass" : "fail";
const generatedReportSanitization = results.find((result) => result.command === "node apps/dashboard/scripts/test-generated-report-sanitization.mjs")?.exitCode === 0 ? "pass" : "fail";
const dataRetentionReview = results.find((result) => result.command === "node apps/dashboard/scripts/generate-data-retention-review.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorSecurityChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-security-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const securityPrivacyAuditTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-security-privacy-audit.mjs")?.exitCode === 0 ? "pass" : "fail";
const internalReleaseCandidate = results.find((result) => result.command === "node apps/dashboard/scripts/generate-internal-release-candidate.mjs")?.exitCode === 0 ? "pass" : "fail";
const internalSignoffPackage = results.find((result) => result.command === "node apps/dashboard/scripts/generate-internal-signoff-package.mjs")?.exitCode === 0 ? "pass" : "fail";
const v1InternalReleaseCandidateVerification = results.find((result) => result.command === "node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs")?.exitCode === 0 ? "pass" : "fail";
const internalReleaseCandidateTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-internal-release-candidate.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionTrackPlan = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-track-plan.mjs")?.exitCode === 0 ? "pass" : "fail";
const readonlyProductionGatewayReadiness = results.find((result) => result.command === "node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionEntryGates = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-entry-gates.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionTrackPlanningTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-production-track-planning.mjs")?.exitCode === 0 ? "pass" : "fail";
const realLocalAgentInventoryInspection = results.find((result) => result.command === "node apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs")?.exitCode === 0 ? "pass" : "fail";
const singleAgentLocalSnapshot = results.find((result) => result.command === "node apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs")?.exitCode === 0 ? "pass" : "fail";
const singleAgentTruthReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-single-agent-truth-report.mjs --data apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json")?.exitCode === 0 ? "pass" : "fail";
const fixtureQuarantineReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-fixture-quarantine-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const singleAgentLocalSnapshotTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-single-agent-local-snapshot.mjs")?.exitCode === 0 ? "pass" : "fail";
const fixtureQuarantineTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-fixture-quarantine.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorSourceLockdownReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorSourceSelectionChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorSourceLockdownTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-operator-source-lockdown.mjs")?.exitCode === 0 ? "pass" : "fail";
const localRealAgentHealthReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorAgentHealthChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const reviewedLocalHealthTemplateReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-reviewed-local-health-template.mjs")?.exitCode === 0 ? "pass" : "fail";
const reviewedLocalHealthInputDryRunReport = results.find((result) => result.command === "node apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorReviewedHealthInputChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const reviewedHealthInputAssistantTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-reviewed-health-input-assistant.mjs")?.exitCode === 0 ? "pass" : "fail";
const localHealthEvidenceReviewReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorLocalHealthEvidenceChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-local-health-evidence-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const localHealthEvidenceReviewTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-health-evidence-review.mjs")?.exitCode === 0 ? "pass" : "fail";
const localRealAgentHealthTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-real-agent-health.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorDailyUsabilityChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorUsabilityTroubleshootingReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorUsabilityMvpTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-operator-usability-mvp.mjs")?.exitCode === 0 ? "pass" : "fail";
const dailyOperatorSummaryReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-daily-operator-summary-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const dailyOperatorRunbookChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const dailyOperatorRunbookTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-daily-operator-runbook.mjs")?.exitCode === 0 ? "pass" : "fail";
const localTaskInboxReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-task-inbox-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappLocalTaskHelperReport = results.find((result) => result.command === "node apps/dashboard/scripts/build-whatsapp-local-task-import.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappLocalTaskImportReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappTaskVisibilityChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappSyncMockContractReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-whatsapp-sync-mock-contract-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappFakeWebhookFixtureRunnerReport = results.find((result) => result.command === "node apps/dashboard/scripts/run-whatsapp-fake-webhook-fixture-runner.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappReadonlyFakeProviderSandboxReport = results.find((result) => result.command === "node apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappRealApiPreflightGateReport = results.find((result) => result.command === "node apps/dashboard/scripts/check-whatsapp-real-api-preflight-gate.mjs")?.exitCode === 0 ? "pass" : "fail";
const hourlyRefreshPolicyReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const providerBalanceCenterReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-provider-balance-center-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorUxTaskRefreshBalanceTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappSyncMockContractTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-sync-mock-contract.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappFakeWebhookFixtureRunnerTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-fake-webhook-fixture-runner.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappReadonlyFakeProviderSandboxTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappRealApiPreflightGateTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-real-api-preflight-gate.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappSecretManagerDesignTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-secret-manager-design.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappLocalTaskImportTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-local-task-import.mjs")?.exitCode === 0 ? "pass" : "fail";
const whatsappLocalTaskHelperTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs")?.exitCode === 0 ? "pass" : "fail";
const chineseOperatorUxCopyTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-chinese-operator-ux-copy.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorConsoleVisualUxTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-operator-console-visual-ux.mjs")?.exitCode === 0 ? "pass" : "fail";
const operatorConsoleVisualAuditChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawExportBridgeReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs")?.exitCode === 0 ? "pass" : "fail";
const wslOpenClawLocalExportAdapterReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs --distro Ubuntu-24.04 --state-dir __WSL_OPENCLAW_STATE_DIR__ --dry-run")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawConnectorReport = results.find((result) => result.command === "node apps/dashboard/scripts/run-local-openclaw-connector.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawActivationReport = results.find((result) => result.command === "node apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawConnectorTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-openclaw-connector.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawRealBridgeTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs")?.exitCode === 0 ? "pass" : "fail";
const wslOpenClawLocalExportAdapterTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-wsl-openclaw-local-export-adapter.mjs")?.exitCode === 0 ? "pass" : "fail";
const wslOpenClawTaskMetadataDiscoveryReport = results.find((result) => result.command === "node apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs --distro Ubuntu-24.04 --state-dir __WSL_OPENCLAW_STATE_DIR__ --dry-run")?.exitCode === 0 ? "pass" : "fail";
const wslOpenClawTaskMetadataDiscoveryTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-wsl-openclaw-task-metadata-discovery.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOpenClawActivationTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-openclaw-activation-assistant.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionAdapterSimulatorReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionAdapterSimulatorChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionAdapterSimulatorTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-production-adapter-simulator.mjs")?.exitCode === 0 ? "pass" : "fail";
const readOnlyAdapterContractReviewReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const disabledReadOnlyAdapterDraftReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const readOnlyAdapterContractChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const dashboardStabilizationAuditReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const readOnlyAdapterContractAndDraftTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionEntryGateReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-entry-gate-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionEntryGateChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const productionEntryGateTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-production-entry-gates.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorRcAudit = results.find((result) => result.command === "node apps/dashboard/scripts/run-local-operator-rc-audit.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorReleaseCandidateReport = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorFinalChecklist = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-operator-final-checklist.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorKnownRiskRegister = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorReportIndex = results.find((result) => result.command === "node apps/dashboard/scripts/generate-local-operator-report-index.mjs")?.exitCode === 0 ? "pass" : "fail";
const localOperatorRcAuditTests = results.find((result) => result.command === "node apps/dashboard/scripts/test-local-operator-rc-audit.mjs")?.exitCode === 0 ? "pass" : "fail";

const report = {
  generatedAt: new Date().toISOString(),
  result: failed ? "fail" : "pass",
  checksPassed: results.filter((result) => result.exitCode === 0).length,
  checksFailed: results.filter((result) => result.exitCode !== 0).length,
  commandsExecuted: results.map((result) => result.command),
  filesChecked: requiredFiles,
  safetyScanSummary: safetyReport,
  gatewayContractTests,
  gatewayFixtureDiff,
  localIngestTests,
  devGatewayConfigTests,
  rbacPolicyTests,
  actionDraftSampleGeneration,
  actionDraftTests,
  releaseManifest,
  localReleaseBundle,
  releaseVerification,
  observabilityReport,
  observabilityTests,
  productionReadinessReport,
  productionReadinessTests,
  finalBetaAudit,
  finalBetaVerification,
  realLocalSnapshotRefreshDrill,
  realLocalDataPilotTests,
  dashboardLocalization,
  devGatewayLiveDrill,
  devGatewayLiveDrillTests,
  operatorDailyWorkflow,
  operatorIncidentDrill,
  operatorEvidenceManifest,
  operatorWorkflowTests,
  internalStaticHostingDryRun,
  operatorAccessChecklist,
  internalStaticHostingTests,
  securityPrivacyAudit,
  generatedReportSanitization,
  dataRetentionReview,
  operatorSecurityChecklist,
  securityPrivacyAuditTests,
  internalReleaseCandidate,
  internalSignoffPackage,
  v1InternalReleaseCandidateVerification,
  internalReleaseCandidateTests,
  productionTrackPlan,
  readonlyProductionGatewayReadiness,
  productionEntryGates,
  productionTrackPlanningTests,
  realLocalAgentInventoryInspection,
  singleAgentLocalSnapshot,
  singleAgentTruthReport,
  fixtureQuarantineReport,
  singleAgentLocalSnapshotTests,
  fixtureQuarantineTests,
  operatorSourceLockdownReport,
  operatorSourceSelectionChecklist,
  operatorSourceLockdownTests,
  localRealAgentHealthReport,
  operatorAgentHealthChecklist,
  reviewedLocalHealthTemplateReport,
  reviewedLocalHealthInputDryRunReport,
  operatorReviewedHealthInputChecklist,
  reviewedHealthInputAssistantTests,
  localHealthEvidenceReviewReport,
  operatorLocalHealthEvidenceChecklist,
  localHealthEvidenceReviewTests,
  localRealAgentHealthTests,
  operatorDailyUsabilityChecklist,
  operatorUsabilityTroubleshootingReport,
  operatorUsabilityMvpTests,
  dailyOperatorSummaryReport,
  dailyOperatorRunbookChecklist,
  dailyOperatorRunbookTests,
  localTaskInboxReport,
  whatsappLocalTaskHelperReport,
  whatsappLocalTaskImportReport,
  whatsappTaskVisibilityChecklist,
  whatsappSyncMockContractReport,
  whatsappFakeWebhookFixtureRunnerReport,
  whatsappReadonlyFakeProviderSandboxReport,
  whatsappRealApiPreflightGateReport,
  hourlyRefreshPolicyReport,
  providerBalanceCenterReport,
  operatorUxTaskRefreshBalanceTests,
  whatsappSyncMockContractTests,
  whatsappFakeWebhookFixtureRunnerTests,
  whatsappReadonlyFakeProviderSandboxTests,
  whatsappRealApiPreflightGateTests,
  whatsappSecretManagerDesignTests,
  whatsappLocalTaskImportTests,
  whatsappLocalTaskHelperTests,
  chineseOperatorUxCopyTests,
  operatorConsoleVisualUxTests,
  operatorConsoleVisualAuditChecklist,
  localOpenClawExportBridgeReport,
  wslOpenClawLocalExportAdapterReport,
  localOpenClawConnectorReport,
  localOpenClawActivationReport,
  localOpenClawConnectorTests,
  localOpenClawRealBridgeTests,
  wslOpenClawLocalExportAdapterTests,
  localOpenClawActivationTests,
  productionAdapterSimulatorReport,
  productionAdapterSimulatorChecklist,
  productionAdapterSimulatorTests,
  readOnlyAdapterContractReviewReport,
  disabledReadOnlyAdapterDraftReport,
  readOnlyAdapterContractChecklist,
  dashboardStabilizationAuditReport,
  readOnlyAdapterContractAndDraftTests,
  productionEntryGateReport,
  productionEntryGateChecklist,
  productionEntryGateTests,
  localOperatorRcAudit,
  localOperatorReleaseCandidateReport,
  localOperatorFinalChecklist,
  localOperatorKnownRiskRegister,
  localOperatorReportIndex,
  localOperatorRcAuditTests,
  releaseManifestPath: "apps/dashboard/data/generated/release-manifest.json",
  localReleaseIndexPath: "apps/dashboard/release/local-release-index.json",
  observabilityReportPath: "apps/dashboard/data/generated/observability-report.json",
  productionReadinessReportPath: "apps/dashboard/data/generated/production-readiness-report.json",
  finalBetaAuditReportPath: "apps/dashboard/data/generated/final-beta-audit-report.json",
  realLocalSnapshotPath: "apps/dashboard/data/generated/real-local-dashboard-export.generated.json",
  realLocalPilotReportPath: "apps/dashboard/data/generated/real-local-data-pilot-report.json",
  devGatewayLiveDrillReportPath: "apps/dashboard/data/generated/dev-gateway-live-drill-report.json",
  operatorDailySummaryPath: "apps/dashboard/data/generated/operator-daily-summary.json",
  operatorIncidentDrillReportPath: "apps/dashboard/data/generated/operator-incident-drill-report.json",
  operatorEvidenceManifestPath: "apps/dashboard/data/generated/operator-evidence-manifest.json",
  internalStaticHostingDryRunReportPath: "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
  operatorAccessChecklistPath: "apps/dashboard/data/generated/operator-access-checklist.json",
  securityPrivacyAuditReportPath: "apps/dashboard/data/generated/security-privacy-audit-report.json",
  dataRetentionReviewReportPath: "apps/dashboard/data/generated/data-retention-review-report.json",
  operatorSecurityChecklistPath: "apps/dashboard/data/generated/operator-security-checklist.json",
  internalReleaseCandidateReportPath: "apps/dashboard/data/generated/internal-release-candidate-report.json",
  internalSignoffPackagePath: "apps/dashboard/data/generated/internal-signoff-package.json",
  productionTrackPlanReportPath: "apps/dashboard/data/generated/production-track-plan-report.json",
  readonlyProductionGatewayReadinessReportPath: "apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json",
  productionEntryGatesReportPath: "apps/dashboard/data/generated/production-entry-gates-report.json",
  realLocalAgentInventoryInspectionPath: "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
  singleAgentLocalSnapshotPath: "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  singleAgentTruthReportPath: "apps/dashboard/data/generated/single-agent-truth-report.json",
  fixtureQuarantineReportPath: "apps/dashboard/data/generated/fixture-quarantine-report.json",
  operatorSourceLockdownReportPath: "apps/dashboard/data/generated/operator-source-lockdown-report.json",
  operatorSourceSelectionChecklistPath: "apps/dashboard/data/generated/operator-source-selection-checklist.json",
  localRealAgentHealthReportPath: "apps/dashboard/data/generated/local-real-agent-health-report.json",
  operatorAgentHealthChecklistPath: "apps/dashboard/data/generated/operator-agent-health-checklist.json",
  reviewedLocalHealthTemplateReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json",
  reviewedLocalHealthInputDryRunReportPath: "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
  operatorReviewedHealthInputChecklistPath: "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json",
  localHealthEvidenceReviewReportPath: "apps/dashboard/data/generated/local-health-evidence-review-report.json",
  operatorLocalHealthEvidenceChecklistPath: "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json",
  operatorDailyUsabilityChecklistPath: "apps/dashboard/data/generated/operator-daily-usability-checklist.json",
  operatorUsabilityTroubleshootingReportPath: "apps/dashboard/data/generated/operator-usability-troubleshooting-report.json",
  dailyOperatorSummaryReportPath: "apps/dashboard/data/generated/daily-operator-summary-report.json",
  dailyOperatorRunbookChecklistPath: "apps/dashboard/data/generated/daily-operator-runbook-checklist.json",
  localTaskInboxReportPath: "apps/dashboard/data/generated/local-task-inbox-report.json",
  whatsappLocalTaskHelperReportPath: "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
  whatsappLocalTaskImportReportPath: "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
  whatsappTaskVisibilityChecklistPath: "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  whatsappSyncMockContractReportPath: "apps/dashboard/data/generated/whatsapp-sync-mock-contract-report.json",
  whatsappFakeWebhookFixtureRunnerReportPath: "apps/dashboard/data/generated/whatsapp-fake-webhook-fixture-runner-report.json",
  whatsappFakeWebhookReviewQueueReportPath: "apps/dashboard/data/generated/whatsapp-fake-webhook-review-queue-report.json",
  whatsappReadonlyFakeProviderSandboxReportPath: "apps/dashboard/data/generated/whatsapp-readonly-fake-provider-sandbox-report.json",
  whatsappRealApiPreflightGateReportPath: "apps/dashboard/data/generated/whatsapp-real-api-preflight-gate-report.json",
  hourlyRefreshPolicyReportPath: "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  providerBalanceCenterReportPath: "apps/dashboard/data/generated/provider-balance-center-report.json",
  operatorConsoleVisualAuditChecklistPath: "apps/dashboard/data/generated/operator-console-visual-audit-checklist.json",
  localOpenClawExportBridgeReportPath: "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
  wslOpenClawLocalExportAdapterReportPath: "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json",
  wslOpenClawTaskMetadataDiscoveryReportPath: "apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json",
  wslOpenClawTaskMetadataDiscoveryReport,
  wslOpenClawTaskMetadataDiscoveryTests,
  localOpenClawConnectorReportPath: "apps/dashboard/data/generated/local-openclaw-connector-report.json",
  localOpenClawActivationReportPath: "apps/dashboard/data/generated/local-openclaw-activation-report.json",
  productionAdapterSimulatorReportPath: "apps/dashboard/data/generated/production-adapter-simulator-report.json",
  productionAdapterSimulatorChecklistPath: "apps/dashboard/data/generated/production-adapter-simulator-checklist.json",
  readOnlyAdapterContractReviewReportPath: "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  disabledReadOnlyAdapterDraftReportPath: "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  readOnlyAdapterContractChecklistPath: "apps/dashboard/data/generated/read-only-adapter-contract-checklist.json",
  dashboardStabilizationAuditReportPath: "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json",
  productionEntryGateReportPath: "apps/dashboard/data/generated/production-entry-gate-report.json",
  productionEntryGateChecklistPath: "apps/dashboard/data/generated/production-entry-gate-checklist.json",
  localOperatorReleaseCandidateReportPath: "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
  localOperatorFinalChecklistPath: "apps/dashboard/data/generated/local-operator-final-checklist.json",
  localOperatorKnownRiskRegisterPath: "apps/dashboard/data/generated/local-operator-known-risk-register.json",
  localOperatorReportIndexPath: "apps/dashboard/data/generated/local-operator-report-index.json",
  gatewayBaselinePath: "apps/dashboard/data/gateway-stub/baseline/gateway-contract-baseline.json",
  gatewayDiffReportPath: "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
  gatewayFixtureDiffSummary: gatewayDiffReport,
  snapshotValidationSummary: {
    sample: results.find((result) => result.command.includes("dashboard-export.sample.json"))?.exitCode === 0 ? "pass" : "fail",
    generated: results.find((result) => result.command.includes("dashboard-export.generated.json"))?.exitCode === 0 ? "pass" : "fail"
  },
  schemaValidationSummary: {
    schemaFilesPresent: requiredFiles.filter((file) => file.includes("schema/")).length >= 3
  }
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failed) {
  console.error(`OpenClaw Dashboard quality gates failed. Report: ${relative(repoRoot, reportPath)}`);
  process.exit(1);
}

console.log("OpenClaw Dashboard quality gates passed.");
console.log(`Report: ${relative(repoRoot, reportPath)}`);
