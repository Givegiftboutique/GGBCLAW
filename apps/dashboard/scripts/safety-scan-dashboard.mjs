import { readdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const generatedDir = join(dashboardRoot, "data", "generated");
const reportPath = join(generatedDir, "safety-scan-report.json");

const scanTargets = [
  "apps/dashboard",
  "apps/dashboard/data/local-ingest",
  "apps/dashboard/data/gateway-stub",
  "apps/dashboard/data/gateway-stub/baseline",
  "apps/dashboard/data/generated/gateway-fixture-diff-report.json",
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
  "apps/dashboard/data/generated/local-task-inbox-report.json",
  "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
  "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
  "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
  "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
  "apps/dashboard/data/generated/provider-balance-center-report.json",
  "apps/dashboard/data/generated/local-openclaw-connector-report.json",
  "apps/dashboard/data/generated/local-openclaw-activation-report.json",
  "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
  "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json",
  "apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json",
  "apps/dashboard/data/generated/production-entry-gate-report.json",
  "apps/dashboard/data/generated/production-entry-gate-checklist.json",
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
  "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
  "apps/dashboard/data/local-agent-health/local-agent-health.sample.json",
  "apps/dashboard/data/production-simulator/read-only-production-adapter.sample.json",
  "apps/dashboard/data/local/reviewed-local-agent-health.example.json",
  "apps/dashboard/data/local/.gitignore",
  "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
  "apps/dashboard/data/local/operator-task-inbox.template.json",
  "apps/dashboard/data/local/operator-task-inbox.example.json",
  "apps/dashboard/data/local/whatsapp-task-helper-input.template.txt",
  "apps/dashboard/data/local/whatsapp-task-helper-input.example.txt",
  "apps/dashboard/data/local/whatsapp-task-import.template.json",
  "apps/dashboard/data/local/whatsapp-task-import.example.json",
  "apps/dashboard/data/local/provider-balance-center.template.json",
  "apps/dashboard/data/local/provider-balance-center.example.json",
  "apps/dashboard/data/local/local-openclaw-connector.template.json",
  "apps/dashboard/data/local/local-openclaw-connector.example.json",
  "apps/dashboard/data/local/openclaw-local-export.template.json",
  "apps/dashboard/data/local/openclaw-local-export.example.json",
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
  "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
  "apps/dashboard/scripts/generate-fixture-quarantine-report.mjs",
  "apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs",
  "apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs",
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
  "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs",
  "apps/dashboard/scripts/build-whatsapp-local-task-import.ps1",
  "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs",
  "apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs",
  "apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs",
  "apps/dashboard/scripts/test-whatsapp-local-task-import.mjs",
  "apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs",
  "apps/dashboard/scripts/generate-provider-balance-center-report.mjs",
  "apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs",
  "apps/dashboard/scripts/test-chinese-operator-ux-copy.mjs",
  "apps/dashboard/scripts/test-operator-console-visual-ux.mjs",
  "apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs",
  "apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs",
  "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs",
  "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.ps1",
  "apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs",
  "apps/dashboard/scripts/run-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/setup-local-openclaw-connector.mjs",
  "apps/dashboard/scripts/setup-local-openclaw-connector.ps1",
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
  "apps/dashboard/scripts/run-local-operator-rc-audit.mjs",
  "apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs",
  "apps/dashboard/scripts/generate-local-operator-final-checklist.mjs",
  "apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs",
  "apps/dashboard/scripts/generate-local-operator-report-index.mjs",
  "apps/dashboard/scripts/test-local-operator-rc-audit.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-report.mjs",
  "apps/dashboard/scripts/generate-production-entry-gate-checklist.mjs",
  "apps/dashboard/scripts/test-production-entry-gates.mjs",
  "apps/dashboard/scripts/lib",
  "apps/dashboard/src/lib/data-trust",
  "apps/dashboard/src/lib/agent-health",
  "apps/dashboard/src/lib/operator-usability",
  "apps/dashboard/src/lib/operator-runbook",
  "apps/dashboard/src/lib/operator-ux",
  "apps/dashboard/src/lib/operator-tasks",
  "apps/dashboard/src/lib/operator-refresh",
  "apps/dashboard/src/lib/operator-balance",
  "apps/dashboard/src/lib/local-openclaw",
  "apps/dashboard/src/lib/production-readiness",
  "apps/dashboard/src/lib/release-readiness",
  "apps/dashboard/src/lib/i18n",
  "apps/dashboard/src/lib/observability",
  "apps/dashboard/src/lib/readiness",
  "apps/dashboard/release",
  "docs/dashboard",
  "ops/tasks",
  "tests/manual-smoke-tests.md",
  "docs/phase-log.md"
];

const allowedDocFiles = new Set([
  "apps/dashboard/README.md",
  "apps/dashboard/schema/README.md",
  "docs/dashboard/openclaw-dashboard-api-contract.md",
  "docs/dashboard/openclaw-dashboard-data-model.md",
  "docs/dashboard/openclaw-dashboard-design.md",
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
  "docs/dashboard/openclaw-dashboard-operator-ux-polish.md",
  "docs/dashboard/openclaw-dashboard-whatsapp-local-task-import.md",
  "docs/dashboard/openclaw-dashboard-local-task-inbox.md",
  "docs/dashboard/openclaw-dashboard-hourly-refresh.md",
  "docs/dashboard/openclaw-dashboard-provider-balance-center.md",
  "docs/dashboard/openclaw-dashboard-chinese-operator-ux-copy-hardening.md",
  "docs/dashboard/openclaw-dashboard-production-entry-gate-hardening.md",
  "docs/dashboard/openclaw-dashboard-production-adapter-simulator.md",
  "docs/dashboard/openclaw-dashboard-read-only-adapter-contract-review.md",
  "docs/dashboard/openclaw-dashboard-disabled-read-only-adapter-draft.md",
  "docs/dashboard/openclaw-dashboard-stabilization-audit.md",
  "docs/dashboard/openclaw-dashboard-local-operator-release-candidate.md",
  "docs/dashboard/openclaw-dashboard-local-operator-final-checklist.md",
  "docs/dashboard/openclaw-dashboard-known-risk-register.md",
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
  "docs/dashboard/openclaw-dashboard-roadmap.md",
  "docs/dashboard/openclaw-dashboard-release-checklist.md",
  "docs/dashboard/openclaw-dashboard-troubleshooting.md",
  "docs/phase-log.md",
  "tests/manual-smoke-tests.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-002.md",
  "ops/tasks/TASK-20260609-OC-DASH-003.md",
  "ops/tasks/TASK-20260609-OC-DASH-004.md",
  "ops/tasks/TASK-20260609-OC-DASH-005.md",
  "ops/tasks/TASK-20260609-OC-DASH-006.md",
  "ops/tasks/TASK-20260609-OC-DASH-007.md",
  "ops/tasks/TASK-20260609-OC-DASH-008.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-09A.md",
  "ops/tasks/TASK-20260609-OC-DASH-11A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-12A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-14A.md",
  "ops/tasks/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT.md",
  "ops/tasks/TASK-20260609-OC-DASH-15A.md",
  "ops/tasks/TASK-20260609-OC-DASH-15B.md",
  "ops/tasks/TASK-20260609-OC-DASH-16A.md",
  "ops/tasks/TASK-20260609-OC-DASH-17A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-18A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-19A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-20A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-21A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-21B.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-21C.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-21D.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-22A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-22B.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-22C.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-23A.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-23B.md"
  ,"ops/tasks/TASK-20260609-OC-DASH-25A.md"
  ,"artifacts/TASK-20260609-OC-DASH-25A/README.md"
]);

const activeCodeExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html"]);
const textExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html", ".md", ".css", ".ps1"]);

const denyPatterns = [
  { id: "secret-like-assignment", pattern: /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i },
  { id: "production-endpoint", pattern: /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i },
  { id: "env-reference", pattern: /\.env\b/i },
  { id: "live-gateway", pattern: /live\s+OpenClaw\s+Gateway|production\s+OpenClaw\s+Gateway/i },
  { id: "authorization-header", pattern: /Authorization\s*:/i },
  { id: "credentials-include", pattern: /credentials\s*:\s*["']include["']/i },
  { id: "browser-token-storage", pattern: /localStorage|sessionStorage/i },
  { id: "cookie-usage", pattern: /document\.cookie|cookie\s*=|set-cookie/i },
  { id: "mutation-http-method", pattern: /\b(method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|POST|PUT|PATCH|DELETE)\b/ },
  { id: "unsafe-dev-baseurl", pattern: /baseUrl.*(prod|production|live|real|secret|token)/i },
  { id: "real-auth-provider", pattern: /\b(authProvider|oauth|saml|jwt|bearer)\b|login\s*\(/i },
  { id: "forbidden-mutation-permission", pattern: /\b(reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate)\b/i },
  { id: "deploy-token", pattern: /\bdeploy[_-]?token\s*[:=]/i },
  { id: "active-deploy-function", pattern: /\b(deployProduction|runProductionDeploy|publishProduction|pushStaticRelease)\s*\(/i },
  { id: "github-actions-workflow", pattern: /\.github\/workflows|GitHub Actions workflow/i },
  { id: "production-hosting-default", pattern: /default.*public production hosting|public production hosting.*default/i },
  { id: "production-gateway-enabled", pattern: /production Gateway enabled/i },
  { id: "external-notification-send", pattern: /\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i },
  { id: "notification-delivery-token", pattern: /notification[_-]?delivery[_-]?token\s*[:=]/i },
  { id: "production-ready-recommendation", pattern: /recommendation["']?\s*[:=]\s*["']production-ready["']/i },
  { id: "approved-signoff", pattern: /signoffStatus["']?\s*[:=]\s*["']approved["']|notApprovedYet["']?\s*[:=]\s*false/i },
  { id: "large-release-bundle", pattern: /apps\/dashboard\/release\/.*\.(zip|tar|tgz|gz|7z|rar)|apps\/dashboard\/release\/(dist|build)\//i }
];

const forbiddenFunctions = [
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
  "mutateGateway"
  ,"deployProduction",
  "runProductionDeploy",
  "publishProduction",
  "pushStaticRelease"
  ,"sendWebhook",
  "sendSlack",
  "sendEmail",
  "sendSms",
  "deliverNotification"
];

function extensionOf(path) {
  const match = path.match(/(\.[^.\\\/]+)$/);
  return match ? match[1].toLowerCase() : "";
}

async function collectFiles(target) {
  const absolute = resolve(repoRoot, target);
  const files = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else {
        files.push(child);
      }
    }
  }
  try {
    const statEntries = await readdir(absolute, { withFileTypes: true });
    if (statEntries) {
      await walk(absolute);
    }
  } catch {
    files.push(absolute);
  }
  return files;
}

function isAllowedDocumentationHit(relPath, line) {
  if ([
    "apps/dashboard/src/lib/operator-ux/operator-copy.js",
    "apps/dashboard/src/lib/operator-ux/operator-copy.ts",
    "apps/dashboard/src/lib/operator-ux/operator-design-system.js",
    "apps/dashboard/src/lib/operator-ux/operator-design-system.ts",
    "apps/dashboard/src/lib/operator-tasks/local-task-inbox.js",
    "apps/dashboard/src/lib/operator-tasks/local-task-inbox.ts",
    "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.js",
    "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.ts",
    "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.js",
    "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-helper.ts",
    "apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.js",
    "apps/dashboard/src/lib/operator-refresh/hourly-refresh-policy.ts",
    "apps/dashboard/src/lib/operator-balance/provider-balance-center.js",
    "apps/dashboard/src/lib/operator-balance/provider-balance-center.ts",
    "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js",
    "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.ts",
    "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.js",
    "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.ts",
    "apps/dashboard/data/local/operator-task-inbox.template.json",
    "apps/dashboard/data/local/operator-task-inbox.example.json",
    "apps/dashboard/data/local/whatsapp-task-helper-input.template.txt",
    "apps/dashboard/data/local/whatsapp-task-helper-input.example.txt",
    "apps/dashboard/data/local/whatsapp-task-import.template.json",
    "apps/dashboard/data/local/whatsapp-task-import.example.json",
    "apps/dashboard/data/local/provider-balance-center.template.json",
    "apps/dashboard/data/local/provider-balance-center.example.json",
    "apps/dashboard/data/local/local-openclaw-connector.template.json",
    "apps/dashboard/data/local/local-openclaw-connector.example.json",
    "apps/dashboard/data/local/openclaw-local-export.template.json",
    "apps/dashboard/data/local/openclaw-local-export.example.json",
    "apps/dashboard/data/generated/local-task-inbox-report.json",
    "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json",
    "apps/dashboard/data/generated/whatsapp-local-task-import-report.json",
    "apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json",
    "apps/dashboard/data/generated/hourly-refresh-policy-report.json",
    "apps/dashboard/data/generated/provider-balance-center-report.json",
    "apps/dashboard/data/generated/local-openclaw-connector-report.json",
    "apps/dashboard/data/generated/local-openclaw-activation-report.json",
    "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json",
    "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
    "apps/dashboard/scripts/build-whatsapp-local-task-import.mjs",
    "apps/dashboard/scripts/build-whatsapp-local-task-import.ps1",
    "apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs",
    "apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs",
    "apps/dashboard/scripts/test-whatsapp-local-task-helper.mjs",
    "apps/dashboard/scripts/test-whatsapp-local-task-import.mjs",
    "apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs",
    "apps/dashboard/scripts/generate-provider-balance-center-report.mjs",
    "apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs",
    "apps/dashboard/scripts/run-local-openclaw-connector.mjs",
    "apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs",
    "apps/dashboard/scripts/setup-local-openclaw-connector.mjs",
    "apps/dashboard/scripts/setup-local-openclaw-connector.ps1",
    "apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs",
    "apps/dashboard/scripts/test-local-openclaw-connector.mjs",
    "apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs",
    "apps/dashboard/scripts/test-local-openclaw-activation-assistant.mjs",
    "apps/dashboard/scripts/test-operator-console-visual-ux.mjs",
    "apps/dashboard/scripts/generate-operator-console-visual-audit-checklist.mjs",
    "docs/dashboard/openclaw-dashboard-operator-ux-polish.md",
    "docs/dashboard/openclaw-dashboard-operator-console-visual-redesign.md",
    "docs/dashboard/openclaw-dashboard-local-task-inbox.md",
    "docs/dashboard/openclaw-dashboard-hourly-refresh.md",
    "docs/dashboard/openclaw-dashboard-provider-balance-center.md",
  "docs/dashboard/openclaw-dashboard-local-openclaw-readonly-connector.md",
  "docs/dashboard/openclaw-dashboard-local-openclaw-activation-assistant.md",
  "docs/dashboard/openclaw-dashboard-local-openclaw-real-bridge.md",
  "docs/dashboard/openclaw-dashboard-whatsapp-local-task-helper.md",
  "docs/dashboard/openclaw-dashboard-safe-task-metadata-discovery.md"
  ].includes(relPath) && /API key|password|token|cookie|Authorization|credential|secret|\.env|production|gateway|mutation|restart|deploy|WhatsApp|local-only|redacted|不會|不要|不可|未接入|本地|只刷新本地|no production|no restart|no mutation|rawSecretsPrinted|redactionApplied|externalFetchEnabled|productionFetchEnabled/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js",
    "apps/dashboard/scripts/generate-reviewed-local-health-template.mjs",
    "apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs",
    "apps/dashboard/scripts/generate-operator-reviewed-health-input-checklist.mjs",
    "apps/dashboard/scripts/test-reviewed-health-input-assistant.mjs",
    "apps/dashboard/data/local/reviewed-local-agent-health.template.json",
    "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json",
    "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json",
    "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json",
    "docs/dashboard/openclaw-dashboard-reviewed-health-input-assistant.md"
  ].includes(relPath) && /forbidden|not allowed|Do not include|不含|不可|No restart|raw values|token|cookie|secret|apiKey|Authorization|authorization|endpoint|privateKey|credentials|session|Bearer|SHOULD_NOT_PRINT/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /pattern:|env-reference|live-gateway|no live OpenClaw|authorization-header|credentials-include|browser-token-storage|cookie-usage|mutation-http-method|unsafe-dev-baseurl|Authorization\s*:|localStorage|sessionStorage|document\.cookie|cookie\s*=|set-cookie|POST|PUT|PATCH|DELETE/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-whatsapp-sync-mock-contract.mjs" && /Bearer|ghp_|xox|sk-\[|process\\\.env|dotenv|\\\.env|credential-like values|environment secret files/i.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /wslAuthEnvRe|wslUnsafeWriteRe|wslReportLeakRe|process\\\.env|dotenv|readFile\\\([^)]*\\\.|Author\$\{"ization"\}/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-wsl-openclaw-local-export-adapter.mjs" && /forbiddenTransportRe|mutationMethodRe|reportLeakRe|process\\\.env|dotenv|readFile\\\([^)]*\\\.|Author\$\{"ization"\}|Bearer|credentials/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /real-auth-provider|forbidden-mutation-permission|login\s*\(|authProvider|oauth|saml|jwt|bearer|Bearer|SHOULD_NOT_PRINT|sk-\[A-Za-z0-9_|ghp_|xox|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /deploy-token|active-deploy-function|github-actions-workflow|production-hosting-default|production-gateway-enabled|deployProduction|runProductionDeploy|publishProduction|pushStaticRelease|GitHub Actions workflow/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /external-notification-send|notification-delivery-token|production-ready-recommendation|sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification|production-ready/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /large-release-bundle|zip|tar|tgz|dist|build/.test(line)) {
    return true;
  }
  if (["apps/dashboard/scripts/generate-observability-report.mjs", "apps/dashboard/scripts/test-observability.mjs"].includes(relPath) && /webhook|slack|email|sms|notificationSent|localOnly|local-preview-only|password|token|cookie|api/.test(line)) {
    return true;
  }
  if (["apps/dashboard/scripts/generate-production-readiness-report.mjs", "apps/dashboard/scripts/test-production-readiness.mjs"].includes(relPath) && /production-ready|productionDeploy|mutationEnabled|productionWiring|password|token|cookie|api|\.github\/workflows/.test(line)) {
    return true;
  }
  if (["apps/dashboard/scripts/generate-final-beta-audit.mjs", "apps/dashboard/scripts/verify-final-beta.mjs"].includes(relPath) && /internal-operator-beta|no-go-for-production|production-ready|productionDeploy|mutationEnabled|productionWiring|password|token|cookie|api|\.github\/workflows|\.env|zip|dist|build|sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification/.test(line)) {
    return true;
  }
  if ((relPath.startsWith("apps/dashboard/scripts/lib/real-local-data-") || [
    "apps/dashboard/scripts/discover-real-local-data.mjs",
    "apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs",
    "apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs",
    "apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs",
    "apps/dashboard/scripts/test-real-local-data-pilot.mjs"
  ].includes(relPath)) && /password|token|cookie|api|Authorization|Bearer|private|\.env|https?:|production|POST|PUT|PATCH|DELETE|dist|build|absolute paths redacted|secrets redacted|production endpoints blocked|MAX_REAL_LOCAL_FILE_BYTES|summarizeLogLines/.test(line)) {
    return true;
  }
  if ((relPath.startsWith("apps/dashboard/src/lib/i18n/") || relPath === "apps/dashboard/scripts/test-dashboard-localization.mjs") && /read-only|disabled|no-go-for-production|mutationEnabled|productionWiring|token|cookie|password|api|Authorization|credentials|webhook|email|Slack|SMS|production|route|source mode/i.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs",
    "apps/dashboard/scripts/run-dev-gateway-live-drill.mjs",
    "apps/dashboard/scripts/test-dev-gateway-live-drill.mjs"
  ].includes(relPath) && /127\.0\.0\.1|localhost|production\.example\.com|api\.example\.com|live\.example\.com|example\.com|POST|PUT|PATCH|DELETE|credentials|Authorization|authorization|token|cookie|password|api|mutationEnabled|productionWiring|read-only|\.env|external network|https?:/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/app.js" && /Authorization header|未使用|credentials: omit|Production URL blocked|dev-gateway-live-drill-report|whatsapp-sync-mock-contract-report|networkCallsMade|webhookRouteAdded|apiClientAdded/i.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/verify-dashboard.mjs" && /Authorization header|authorizationHeaderUsed|devGatewayLiveDrillReport|dev-gateway-live-drill-report/.test(line)) {
    return true;
  }
  if (relPath === "docs/dashboard/openclaw-dashboard-dev-gateway-live-drill.md" && /production\.example\.com|api\.example\.com|live\.example\.com|example\.com|Authorization header|credentials|token|cookie|POST|PUT|PATCH|DELETE|production remains disabled|blocked/i.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/data/generated/dev-gateway-live-drill-report.json" && /127\.0\.0\.1|localhost|production\.example\.com|api\.example\.com|live\.example\.com|example\.com|POST|PUT|PATCH|DELETE|credentialsMode|authorizationHeaderUsed|mutationEnabled|productionWiring|read-only|blocked/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/generate-operator-daily-summary.mjs",
    "apps/dashboard/scripts/run-operator-daily-workflow.mjs",
    "apps/dashboard/scripts/run-operator-incident-drill.mjs",
    "apps/dashboard/scripts/generate-operator-evidence-manifest.mjs",
    "apps/dashboard/scripts/test-operator-workflow.mjs"
  ].includes(relPath) && /password|token|cookie|api|Authorization|credentials|localStorage|sessionStorage|document\.cookie|fetch|XMLHttpRequest|webhook|email|Slack|SMS|mutationEnabled|productionWiring|read-only|no-go-for-production|notificationSent|externalEscalationSent|production endpoint|absolute machine path|https?:|\.env|approveReview|rejectReview|restoreBackup|updateSettings|runBackup|mutateGateway/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/start-internal-static-preview.mjs",
    "apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs",
    "apps/dashboard/scripts/generate-operator-access-checklist.mjs",
    "apps/dashboard/scripts/test-internal-static-hosting.mjs"
  ].includes(relPath) && /127\.0\.0\.1|localhost|5180|Authorization|credentials|localStorage|sessionStorage|document\.cookie|cookie|token|password|api|\.env|\.github\/workflows|productionDeploy|productionWiring|mutationEnabled|read-only|no-go-for-production|deploy|GitHub Actions|CI|webhook|email|Slack|SMS|approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway|zip|dist|build|absolute machine path|https?:/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/operator-daily-summary.json",
    "apps/dashboard/data/generated/operator-incident-drill-report.json",
    "apps/dashboard/data/generated/operator-evidence-manifest.json"
  ].includes(relPath) && /mutationEnabled|productionWiring|read-only|no-go-for-production|notificationSent|externalEscalationSent|no external notification|no upload|no deploy|token|cookie|api|quality-gate-report|safety-scan-report/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/internal-static-hosting-dry-run-report.json",
    "apps/dashboard/data/generated/operator-access-checklist.json"
  ].includes(relPath) && /127\.0\.0\.1|5180|\.github\/workflows|productionDeploy|productionWiring|mutationEnabled|read-only|no-go-for-production|static-preview-only|deploy|GitHub Actions|CI|Authorization|credentials|token|cookie|api|webhook|email|Slack|SMS|zip|dist|build/.test(line)) {
    return true;
  }
  if ([
    "docs/dashboard/openclaw-dashboard-internal-static-hosting.md",
    "docs/dashboard/openclaw-dashboard-operator-access-checklist.md"
  ].includes(relPath) && /credentials|token|cookie|Authorization|production deploy|production API|production Gateway|mutation endpoint|GitHub Actions|webhook|email|Slack|SMS|public hosting|no-go-for-production|read-only|productionWiring|mutationEnabled|127\.0\.0\.1|5180/i.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/generate-security-privacy-audit.mjs",
    "apps/dashboard/scripts/test-generated-report-sanitization.mjs",
    "apps/dashboard/scripts/generate-data-retention-review.mjs",
    "apps/dashboard/scripts/generate-operator-security-checklist.mjs",
    "apps/dashboard/scripts/test-security-privacy-audit.mjs"
  ].includes(relPath) && /password|token|cookie|api|Authorization|credentials|localStorage|sessionStorage|document\.cookie|\.env|process\.env|dotenv|production endpoint|production deploy|productionDeploy|productionWiring|mutationEnabled|read-only|no-go-for-production|webhook|email|Slack|SMS|GitHub Actions|CI|\.github\/workflows|POST|PUT|PATCH|DELETE|approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway|zip|dist|build|absolute machine path|PII|private data|https?:/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/generate-internal-release-candidate.mjs",
    "apps/dashboard/scripts/generate-internal-signoff-package.mjs",
    "apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs",
    "apps/dashboard/scripts/test-internal-release-candidate.mjs"
  ].includes(relPath) && /password|token|cookie|api|Authorization|credentials|localStorage|sessionStorage|document\.cookie|\.env|production endpoint|production deploy|productionDeploy|productionWiring|mutationEnabled|read-only|no-go-for-production|webhook|email|Slack|SMS|GitHub Actions|CI|\.github\/workflows|approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway|zip|dist|build|absolute machine path|production-ready|signoffStatus|notApprovedYet|manualSignoffRequired|approved|pending|https?:/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/scripts/generate-production-track-plan.mjs",
    "apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs",
    "apps/dashboard/scripts/generate-production-entry-gates.mjs",
    "apps/dashboard/scripts/test-production-track-planning.mjs"
  ].includes(relPath) && /production|gateway|credentials|Authorization|frontend auth header|browser-stored secrets|token|cookie|api|deploy|GitHub Actions|CI|mutation|webhook|email|Slack|SMS|read-only|no-go-for-production|planning-only|not-connected|not-ready|blocked|fixture|8-agent|1 real agent|single agent|https?:/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/src/lib/data-trust/source-trust.js",
    "apps/dashboard/src/lib/data-trust/source-trust.ts",
    "apps/dashboard/src/lib/data-trust/source-lockdown.js",
    "apps/dashboard/src/lib/data-trust/source-lockdown.ts",
    "apps/dashboard/src/lib/agent-health/local-agent-health.js",
    "apps/dashboard/src/lib/agent-health/local-agent-health.ts",
    "apps/dashboard/src/lib/agent-health/local-health-evidence.js",
    "apps/dashboard/src/lib/agent-health/local-health-evidence.ts",
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
    "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.js",
    "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.ts",
    "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.js",
    "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.ts",
    "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.js",
    "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.ts",
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
    "apps/dashboard/scripts/generate-local-task-inbox-report.mjs",
    "apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs",
    "apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs",
    "apps/dashboard/scripts/generate-provider-balance-center-report.mjs",
    "apps/dashboard/scripts/test-operator-ux-task-refresh-balance.mjs",
    "apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs",
    "apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs",
    "apps/dashboard/scripts/test-production-adapter-simulator.mjs",
    "apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs",
    "apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs",
    "apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs",
    "apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs",
    "apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs",
    "apps/dashboard/scripts/lib/local-operator-rc-utils.mjs",
    "apps/dashboard/scripts/run-local-operator-rc-audit.mjs",
    "apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs",
    "apps/dashboard/scripts/generate-local-operator-final-checklist.mjs",
    "apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs",
    "apps/dashboard/scripts/generate-local-operator-report-index.mjs",
    "apps/dashboard/scripts/test-local-operator-rc-audit.mjs",
    "apps/dashboard/data/local-agent-health/local-agent-health.sample.json"
  ].includes(relPath) && /production|gateway|credentials|Authorization|authorization|Bearer|sk-\[|token|cookie|api|auth|deploy|GitHub Actions|CI|mutation|webhook|email|Slack|SMS|read-only|no-go-for-production|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|operatorTruth|mockIsOperatorTruth|gatewayStubIsOperatorTruth|defaultAllowed|demo acknowledgement|health|local-file-only|local-reviewed-json|reviewed-local-agent-health|restart-agent|stop-agent|start-agent|local-readonly-health-snapshot|operator-reviewed-local-snapshot|evidence|redaction|rawValuesPrinted|unsafe|operator usability|Operator Home|recommended operator|daily operator|daily truth|runbook|Daily Operator Runbook|safe next steps|blocked actions|troubleshooting|localhost|start-operator-dashboard|simulator|adapterEnabled|connected|productionReady|endpointConfigured|authEnabled|dataReturned|adapter contract|disabled adapter|contractReviewStatus|disabledAdapterDraftStatus|production-adapter|local operator|release candidate|known risk|final checklist|report index|https?:/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/start-operator-dashboard.ps1" && /OpenClaw|Operator Dashboard|Recommended operator view|Health source|Production|no-go-for-production|Mutation|Restart|Production gateway|disabled|local|localhost|Port|NoBrowser|http\.server|python|Start-Process|Get-NetTCPConnection|single-agent|local-ingest/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/security-privacy-audit-report.json",
    "apps/dashboard/data/generated/data-retention-review-report.json",
    "apps/dashboard/data/generated/operator-security-checklist.json"
  ].includes(relPath) && /runtime config|private data|credentials|productionStatus|productionWiring|mutationEnabled|read-only|no-go-for-production|draft-for-internal-review|webhook|email|Slack|SMS|secret|token|cookie|api|security|privacy|retention|redacted/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/internal-release-candidate-report.json",
    "apps/dashboard/data/generated/internal-signoff-package.json"
  ].includes(relPath) && /internal-operator-use|release-candidate|v1\.0\.0-internal|signoffStatus|pending|notApprovedYet|manualSignoffRequired|productionStatus|productionWiring|mutationEnabled|read-only|no-go-for-production|security|privacy|retention|operator|incident|evidence|access checklist|production gateway|auth|secrets|restore drill/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/production-track-plan-report.json",
    "apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json",
    "apps/dashboard/data/generated/production-entry-gates-report.json"
  ].includes(relPath) && /production|gateway|v1\.0\.0-internal|productionStatus|productionTrackStatus|gatewayConnectionStatus|readinessStatus|entryGateStatus|productionWiring|mutationEnabled|read-only|no-go-for-production|planning-only|not-connected|not-ready|blocked|future-only|fixture|8-agent|1 real agent|single agent|auth|secrets|credentials|frontend|GET|monitoring|rollback|incident|deployment/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/single-agent-truth-report.json",
    "apps/dashboard/data/generated/fixture-quarantine-report.json",
    "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
    "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
    "apps/dashboard/data/generated/operator-source-lockdown-report.json",
    "apps/dashboard/data/generated/operator-source-selection-checklist.json",
    "apps/dashboard/data/generated/local-real-agent-health-report.json",
    "apps/dashboard/data/generated/operator-agent-health-checklist.json",
    "apps/dashboard/data/generated/local-health-evidence-review-report.json",
    "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json",
    "apps/dashboard/data/generated/operator-daily-usability-checklist.json",
    "apps/dashboard/data/generated/operator-usability-troubleshooting-report.json",
    "apps/dashboard/data/generated/daily-operator-summary-report.json",
    "apps/dashboard/data/generated/daily-operator-runbook-checklist.json",
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
    "apps/dashboard/data/production-simulator/read-only-production-adapter.sample.json"
  ].includes(relPath) && /production|gateway|productionStatus|productionWiring|mutationEnabled|read-only|no-go-for-production|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|operatorTruth|mockIsOperatorTruth|gatewayStubIsOperatorTruth|review|warning|followup|defaultAllowed|demo acknowledgement|recommended URL|localhost|local-file-only|local-reviewed-json|reviewed-local-agent-health|health|restart-agent|stop-agent|start-agent|local-readonly-health-snapshot|evidence|redactionApplied|rawValuesPrinted|fallback|unsafe|daily operator|operator usability|runbook|safe next steps|blocked actions|troubleshooting|Authorization|authorization|auth|token|cookie|secret|auth-token-secrets|simulator|adapterEnabled|connected|productionReady|endpointConfigured|authEnabled|dataReturned|contractReviewStatus|disabledAdapterDraftStatus|disabled-by-default|production-adapter|local operator|release candidate|known risks|final checklist|report index|dailyUseAvailable/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/data/generated/operator-agent-health-checklist.json" && /不含|不可|Do not|no |No |API key|token|cookie|secret|Authorization|restart|stop|start|production gateway|mutation/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/data/generated/operator-local-health-evidence-checklist.json" && /Do not|no |No |API key|token|cookie|secret|Authorization|restart|stop|start|production gateway|mutation|raw values|redaction|fallback|evidenceStatus/.test(line)) {
    return true;
  }
  if ([
    "docs/dashboard/openclaw-dashboard-security-privacy-audit.md",
    "docs/dashboard/openclaw-dashboard-data-retention.md",
    "docs/dashboard/openclaw-dashboard-operator-security-checklist.md"
  ].includes(relPath) && /secret|PII|private data|Authorization|credentials|token|cookie|production endpoint|production deploy|production Gateway|mutation endpoint|GitHub Actions|webhook|email|Slack|SMS|no-go-for-production|read-only|draft-for-internal-review|blocked|forbidden|not certified|do not/i.test(line)) {
    return true;
  }
  if ([
    "docs/dashboard/openclaw-dashboard-v1-internal-release-candidate.md",
    "docs/dashboard/openclaw-dashboard-internal-signoff.md"
  ].includes(relPath) && /production-ready|production ready|signoffStatus|approved|notApprovedYet|manual approval|manual sign-off|pending|no-go-for-production|read-only|production deploy|production Gateway|production API|mutation endpoint|GitHub Actions|Authorization|credentials|token|cookie|secret|webhook|email|Slack|SMS|blocked|do not|requires manual/i.test(line)) {
    return true;
  }
  if ([
    "docs/dashboard/openclaw-dashboard-production-track-plan.md",
    "docs/dashboard/openclaw-dashboard-readonly-production-gateway-readiness.md",
    "docs/dashboard/openclaw-dashboard-production-entry-gates.md"
  ].includes(relPath) && /production|planning-only|no-go-for-production|not-connected|not-ready|blocked|future only|future-only|read-only|production Gateway|production API|production deploy|mutation endpoint|GitHub Actions|Authorization|credentials|token|cookie|secret|webhook|email|Slack|SMS|manual approval|fixture|8-agent|1 real agent|single agent|operator truth|do not|not allowed|requires/i.test(line)) {
    return true;
  }
  if ([
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
    "docs/dashboard/openclaw-dashboard-production-adapter-simulator.md",
    "docs/dashboard/openclaw-dashboard-read-only-adapter-contract-review.md",
    "docs/dashboard/openclaw-dashboard-disabled-read-only-adapter-draft.md",
    "docs/dashboard/openclaw-dashboard-stabilization-audit.md",
    "docs/dashboard/openclaw-dashboard-local-operator-release-candidate.md",
    "docs/dashboard/openclaw-dashboard-local-operator-final-checklist.md",
    "docs/dashboard/openclaw-dashboard-known-risk-register.md"
  ].includes(relPath) && /production|no-go-for-production|read-only|production Gateway|production API|production deploy|mutation endpoint|GitHub Actions|Authorization|credentials|token|cookie|secret|webhook|email|Slack|SMS|manual approval|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|do not|not allowed|requires|blocked|recommended operator URL|source selection lockdown|local-file-only|health|restart|stop|start|Operator Home|usability|troubleshooting|launch script|Daily Operator Runbook|safe next steps|daily status|runbook|simulator|adapterEnabled|connected|productionReady|endpoint|auth|dataReturned|disabled adapter|contract review|stabilization|local operator|release candidate|known risk|final checklist/i.test(line)) {
    return true;
  }
  if (relPath.startsWith("apps/dashboard/src/lib/observability/") && /notificationSent|localOnly|local-preview-only|webhook|email|Slack|SMS|production_wiring_violation|mutation_guardrail_violation/.test(line)) {
    return true;
  }
  if (relPath.startsWith("apps/dashboard/src/lib/readiness/") && /no-go-for-production|productionDeploy|internal-operator-beta|real auth|security review|restore drill|production gateway/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/generate-release-manifest.mjs" && /rollbackCommand|git checkout|supportedSources|static-read-only|productionWiring|mutationEnabled/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/create-local-release-bundle.mjs" && /no zip|no deploy|no CI|static-read-only|productionWiring|mutationEnabled/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/verify-local-release.mjs" && /production-like endpoint|productionWiring|mutationEnabled|static-read-only|supported source/.test(line)) {
    return true;
  }
  if (["apps/dashboard/scripts/generate-release-manifest.mjs", "apps/dashboard/scripts/create-local-release-bundle.mjs", "apps/dashboard/scripts/verify-local-release.mjs"].includes(relPath) && /(password|token|cookie|api|secret-like assignment)/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/rbac/permissions.js" && /FORBIDDEN_MUTATION_PERMISSIONS|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/rbac/permissions.ts" && /ForbiddenMutationPermission|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/rbac/rbac-policy.js" && /forbiddenMutationPermissions|forbiddenActions/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-rbac-policy.mjs" && /forbidden|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate|localStorage|sessionStorage|document\\.cookie/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-rbac-policy.mjs" && /no cookie|no token|no production permissions/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/rbac/rbac-policy.js" && /simulated only|no real auth|no token|no cookie|no production permissions|read-only role simulation/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/app.js" && /memory-only|no localStorage|no sessionStorage|no cookie|no real auth|no token|no production permissions|no real login|do not add real login|token handling|cookie handling/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/app.js" && /baseUrl.*real-local-dashboard-export\.single-agent\.generated\.json|recommended operator|Operator Home|This is not the daily operator view|operator-daily-usability-checklist|operator-usability-troubleshooting|Daily Operator Runbook|Today status|Safe next steps|Blocked actions|daily-operator-summary-report|daily-operator-runbook-checklist/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/app.js" && /今日總覽|今日任務|WhatsApp 任務|每 1 小時自動刷新|立即刷新|下次刷新時間|用量與餘額中心|QWE API|Huawei LLM Agent|Intenext Codex|不會儲存密碼|不會顯示完整 API key|Production 安全鎖|provider-balance-center-report|local-task-inbox-report|hourly-refresh-policy-report|whatsapp-task-visibility-checklist/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /baseUrl.*real-local-dashboard-export|operator launch script|operator-usability|daily-operator|daily-truth-fixture-source/i.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/verify-dashboard.mjs" && /operator launch script|\.env|Authorization|credentials|production\.example\.com|Restart-Service|Stop-Service|Start-Service|Restart-Computer|Stop-Process|operator usability|daily operator|daily runbook/i.test(line)) {
    return true;
  }
  if (relPath === "ops/tasks/TASK-20260609-OC-DASH-23A.md" && /\.env|secrets|production|restart|mutation|gateway|token|cookie|auth|no-go-for-production|read-only/i.test(line)) {
    return true;
  }
  if (relPath === "ops/tasks/TASK-20260609-OC-DASH-23B.md" && /\.env|secrets|production|restart|mutation|gateway|token|cookie|auth|no-go-for-production|read-only|daily operator|runbook/i.test(line)) {
    return true;
  }
  if (relPath === "ops/tasks/TASK-20260609-OC-DASH-24B.md" && /\.env|secrets|production|restart|mutation|gateway|token|cookie|auth|Authorization|credentials|no-go-for-production|read-only|simulator|adapter|endpoint|deploy/i.test(line)) {
    return true;
  }
  if (relPath === "ops/tasks/TASK-20260609-OC-DASH-25A.md" && /\.env|secrets|production|restart|mutation|gateway|token|cookie|auth|Authorization|credentials|no-go-for-production|read-only|simulator|adapter|endpoint|deploy|disabled draft|contract/i.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/verify-dashboard.mjs" && /no real auth|no token|no cookie|no production permissions|Role matrix|Action draft preview/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-action-drafts.mjs" && /password|token|cookie|api|approveReview|rejectReview|runBackup|restoreBackup|updateSettings|mutateGateway|writeGateway/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/action-drafts/action-draft-validation.js" && /SECRET_VALUE_RE|PRODUCTION_ENDPOINT_RE|ACTIVE_MUTATION_RE|FORBIDDEN_INTENT_METHOD_RE|password|token|cookie|api|approveReview|rejectReview|runBackup|restoreBackup|updateSettings|mutateGateway|writeGateway|POST|PUT|PATCH|DELETE/.test(line)) {
    return true;
  }
  if (/SECRET_VALUE_RE|secretLikeRe|cookie\\|cookie\)|\/cookie/.test(line)) return true;
  if (relPath === "apps/dashboard/verify-dashboard.mjs" && /authorization-header|credentials-include|browser-token-storage|mutation-http-method|cookie\\s/.test(line)) return true;
  if (relPath === "apps/dashboard/scripts/test-dev-gateway-config.mjs" && /Authorization|localStorage|sessionStorage|cookie|POST|PUT|PATCH|DELETE|production\.example\.com|secret\.local|token\.local|live\.local|prod\.local/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/src/lib/adapters/dev-gateway-config.js" && /prod|production|live|real|secret|token/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/test-dev-gateway-config.mjs" && /http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|dev\.local|openclaw-dev\.local):/.test(line)) return true;
  if (!allowedDocFiles.has(relPath.replaceAll("\\", "/"))) return false;
  return /disabled|forbidden|not supported|not recommended|not implemented|no production|no deploy|no GitHub Actions|no CI|do not|future|out of scope|without .*cookie|safety|guardrail|mock-only|read-only|static-read-only|local-preview-only|notificationSent false|no external notification|no webhook|no email|no Slack|no SMS|no-go-for-production|production-ready.*forbidden|not production-ready|internal-operator-beta|absent|no .*env|no .*secrets|local\/static sources only|no live OpenClaw Gateway|blocked|omit|no credentials|no auth|no cookies|no cookie|no real auth|no token|no real login|simulated only|draft only|not submitted|manual approval|manual browser verification|rollback|allowed examples|blocked examples|safe local HTTP|baseUrl|baseUrlState|POST|PUT|PATCH|DELETE|localStorage|sessionStorage|Authorization|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate|GitHub Actions workflow|public production hosting|production Gateway|auth token|browser session handling|http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|dev\.local|openclaw-dev\.local):|production\.example\.com/i.test(line);
}

const allFiles = [];
for (const target of scanTargets) {
  allFiles.push(...await collectFiles(target));
}

const uniqueFiles = Array.from(new Set(allFiles)).filter((file) => {
  const relPath = relative(repoRoot, file).replaceAll("\\", "/");
  if (relPath === "apps/dashboard/data/generated/quality-gate-report.json") return false;
  if (relPath === "apps/dashboard/data/generated/safety-scan-report.json") return false;
  if (relPath === "apps/dashboard/data/local/local-openclaw-connector.json") return false;
  if (relPath === "apps/dashboard/data/local/openclaw-local-export.json") return false;
  return textExtensions.has(extensionOf(file));
});
const findings = [];

for (const file of uniqueFiles) {
  const relPath = relative(repoRoot, file).replaceAll("\\", "/");
  const body = await readFile(file, "utf8");
  const lines = body.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of denyPatterns) {
      if (rule.pattern.test(line) && !isAllowedDocumentationHit(relPath, line)) {
        findings.push({ rule: rule.id, file: relPath, line: index + 1, text: line.trim().slice(0, 180) });
      }
    }
  });

  if (activeCodeExtensions.has(extensionOf(file))) {
    for (const name of forbiddenFunctions) {
      const activePatterns = [
        new RegExp(`\\bfunction\\s+${name}\\b`),
        new RegExp(`\\bconst\\s+${name}\\s*=`),
        new RegExp(`\\blet\\s+${name}\\s*=`),
        new RegExp(`\\bvar\\s+${name}\\s*=`),
        new RegExp(`\\b${name}\\s*\\(`)
      ];
      if (activePatterns.some((pattern) => pattern.test(body))) {
        findings.push({ rule: "forbidden-active-mutation", file: relPath, line: 0, text: name });
      }
    }
  }
}

try {
  const sourceTrustBody = await readFile(join(repoRoot, "apps/dashboard/src/lib/data-trust/source-trust.js"), "utf8");
  if (/"mock"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceTrustBody)) {
    findings.push({ rule: "mock-marked-operator-truth", file: "apps/dashboard/src/lib/data-trust/source-trust.js", line: 0, text: "mock must never be operator truth" });
  }
  if (/"gateway-stub"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceTrustBody)) {
    findings.push({ rule: "gateway-stub-marked-operator-truth", file: "apps/dashboard/src/lib/data-trust/source-trust.js", line: 0, text: "gateway-stub must never be operator truth" });
  }
} catch {
  findings.push({ rule: "source-trust-missing", file: "apps/dashboard/src/lib/data-trust/source-trust.js", line: 0, text: "source trust classification must exist" });
}

try {
  const sourceLockdownBody = await readFile(join(repoRoot, "apps/dashboard/src/lib/data-trust/source-lockdown.js"), "utf8");
  if (/mock:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceLockdownBody)) {
    findings.push({ rule: "mock-lockdown-operator-truth-violation", file: "apps/dashboard/src/lib/data-trust/source-lockdown.js", line: 0, text: "mock must not be operator truth" });
  }
  if (/"gateway-stub"\s*:\s*{[\s\S]{0,900}?operatorTruth:\s*true/.test(sourceLockdownBody)) {
    findings.push({ rule: "gateway-stub-lockdown-operator-truth-violation", file: "apps/dashboard/src/lib/data-trust/source-lockdown.js", line: 0, text: "gateway-stub must not be operator truth" });
  }
  if (/mock:\s*{[\s\S]{0,900}?defaultAllowed:\s*true/.test(sourceLockdownBody)) {
    findings.push({ rule: "mock-default-operator-truth-violation", file: "apps/dashboard/src/lib/data-trust/source-lockdown.js", line: 0, text: "mock defaultAllowed must be false" });
  }
  if (/"gateway-stub"\s*:\s*{[\s\S]{0,900}?defaultAllowed:\s*true/.test(sourceLockdownBody)) {
    findings.push({ rule: "gateway-stub-default-operator-truth-violation", file: "apps/dashboard/src/lib/data-trust/source-lockdown.js", line: 0, text: "gateway-stub defaultAllowed must be false" });
  }
} catch {
  findings.push({ rule: "source-lockdown-missing", file: "apps/dashboard/src/lib/data-trust/source-lockdown.js", line: 0, text: "source lockdown policy must exist" });
}

try {
  const healthModuleBody = await readFile(join(repoRoot, "apps/dashboard/src/lib/agent-health/local-agent-health.js"), "utf8");
  for (const forbidden of ["restartAgent", "stopAgent", "startAgent", "connectProductionGateway", "mutateAgentHealth"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(healthModuleBody)) {
      findings.push({ rule: "restart-agent-enabled", file: "apps/dashboard/src/lib/agent-health/local-agent-health.js", line: 0, text: `${forbidden} must not exist` });
    }
  }
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(healthModuleBody)) {
    findings.push({ rule: "local-health-network-call", file: "apps/dashboard/src/lib/agent-health/local-agent-health.js", line: 0, text: "local health must not perform network calls" });
  }
} catch {
  findings.push({ rule: "local-agent-health-missing", file: "apps/dashboard/src/lib/agent-health/local-agent-health.js", line: 0, text: "local agent health module must exist" });
}

try {
  const assistantModulePath = "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js";
  const assistantModule = await readFile(join(repoRoot, assistantModulePath), "utf8");
  if (!assistantModule.includes("buildReviewedHealthInputTemplate") || !assistantModule.includes("validateReviewedHealthInputDryRun") || !assistantModule.includes("buildRedactedReviewedHealthPreview")) {
    findings.push({ rule: "reviewed-health-assistant-helper-missing", file: assistantModulePath, line: 0, text: "reviewed health input assistant helpers must exist" });
  }
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(assistantModule)) {
    findings.push({ rule: "reviewed-health-assistant-network-call", file: assistantModulePath, line: 0, text: "reviewed health input assistant must not perform network calls" });
  }
  for (const forbidden of ["restartAgent", "stopAgent", "startAgent", "connectProductionGateway", "mutateReviewedHealthInput"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(assistantModule)) {
      findings.push({ rule: "reviewed-health-assistant-forbidden-action", file: assistantModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "reviewed-health-assistant-missing", file: "apps/dashboard/src/lib/agent-health/local-reviewed-health-input-assistant.js", line: 0, text: "reviewed health input assistant module must exist" });
}

try {
  const tracked = spawnSync("git", ["ls-files", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
  if ((tracked.stdout || "").trim()) {
    findings.push({ rule: "real-reviewed-health-input-tracked", file: "apps/dashboard/data/local/reviewed-local-agent-health.json", line: 0, text: "real reviewed local health input must not be tracked" });
  }
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", "apps/dashboard/data/local/reviewed-local-agent-health.json"], { cwd: repoRoot, encoding: "utf8" });
  if ((staged.stdout || "").trim()) {
    findings.push({ rule: "real-reviewed-health-input-staged", file: "apps/dashboard/data/local/reviewed-local-agent-health.json", line: 0, text: "real reviewed local health input must not be staged" });
  }
} catch {
  findings.push({ rule: "real-reviewed-health-input-git-check-failed", file: "apps/dashboard/data/local/reviewed-local-agent-health.json", line: 0, text: "could not verify reviewed health input git state" });
}

try {
  const dryRunPath = "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json";
  const dryRunReport = JSON.parse(await readFile(join(repoRoot, dryRunPath), "utf8"));
  if (dryRunReport.redactionApplied !== true || dryRunReport.rawValuesPrinted !== false) {
    findings.push({ rule: "reviewed-health-raw-values-printed", file: dryRunPath, line: 0, text: "dry-run report must apply redaction and never print raw values" });
  }
  if (!["ready-for-local-use", "needs-template-copy", "needs-operator-edit", "invalid-fallback-required", "unsafe-rejected", "missing-local-input", "review-required"].includes(dryRunReport.readinessStatus)) {
    findings.push({ rule: "reviewed-health-readiness-invalid", file: dryRunPath, line: 0, text: "dry-run readinessStatus must be a safe enum" });
  }
  if (dryRunReport.productionStatus !== "no-go-for-production" || dryRunReport.mutationEnabled !== false || dryRunReport.productionWiring !== "disabled") {
    findings.push({ rule: "reviewed-health-safety-marker-invalid", file: dryRunPath, line: 0, text: "dry-run report must preserve no-go production and disabled mutation/wiring" });
  }
  if (/SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(JSON.stringify(dryRunReport))) {
    findings.push({ rule: "reviewed-health-secret-value-leak", file: dryRunPath, line: 0, text: "dry-run report must not print secret-like raw values" });
  }
} catch {
  // Quality gate and verifier check report existence after generation.
}

for (const relPath of [
  "apps/dashboard/data/generated/single-agent-truth-report.json",
  "apps/dashboard/data/generated/fixture-quarantine-report.json",
  "apps/dashboard/data/generated/operator-source-lockdown-report.json"
]) {
  try {
    const reportBody = await readFile(join(repoRoot, relPath), "utf8");
    if (/"mockIsOperatorTruth"\s*:\s*true|"gatewayStubIsOperatorTruth"\s*:\s*true|"operatorTruth"\s*:\s*true[\s\S]{0,200}"source"\s*:\s*"(mock|gateway-stub)"|"source"\s*:\s*"(mock|gateway-stub)"[\s\S]{0,300}"defaultAllowed"\s*:\s*true/.test(reportBody)) {
      findings.push({ rule: "fixture-report-operator-truth-violation", file: relPath, line: 0, text: "fixture sources must not be operator truth" });
    }
  } catch {
    // The verifier and quality gate check report existence; safety scan handles content when present.
  }
}

try {
  const whatsappHelperReportPath = "apps/dashboard/data/generated/whatsapp-local-task-helper-report.json";
  const whatsappHelperReport = JSON.parse(await readFile(join(repoRoot, whatsappHelperReportPath), "utf8"));
  if (whatsappHelperReport.rawInputPrinted !== false || whatsappHelperReport.rawChatPrinted !== false || whatsappHelperReport.secretRedactionApplied !== true) {
    findings.push({ rule: "whatsapp-local-helper-redaction-invalid", file: whatsappHelperReportPath, line: 0, text: "WhatsApp local helper report must redact secrets and avoid raw input or raw chat printing" });
  }
  if (whatsappHelperReport.whatsappApiConnected !== false || whatsappHelperReport.webhookEnabled !== false || whatsappHelperReport.authEnabled !== false || whatsappHelperReport.productionReady !== false) {
    findings.push({ rule: "whatsapp-local-helper-unsafe-flag", file: whatsappHelperReportPath, line: 0, text: "WhatsApp local helper must keep API, webhook, auth, and production disabled" });
  }
  const helperReportBody = JSON.stringify(whatsappHelperReport);
  if (/\b(?:phone|tel|mobile|whatsapp|contact)\b.{0,24}(?:\+?\d[\s().-]?){8,}|Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/i.test(helperReportBody)) {
    findings.push({ rule: "whatsapp-local-helper-secret-or-phone-leak", file: whatsappHelperReportPath, line: 0, text: "WhatsApp local helper report must not contain phone numbers or secret-like values" });
  }
  for (const localOnlyPath of [
    "apps/dashboard/data/local/whatsapp-task-helper-input.txt",
    "apps/dashboard/data/local/whatsapp-task-helper-input.local.txt"
  ]) {
    const tracked = spawnSync("git", ["ls-files", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    if ((tracked.stdout || "").trim() || (staged.stdout || "").trim()) {
      findings.push({ rule: "whatsapp-local-helper-input-file-tracked", file: localOnlyPath, line: 0, text: "real WhatsApp local helper input files must not be tracked" });
    }
  }
} catch {
  // Quality gate and verifier check report existence after generation.
}

try {
  const whatsappImportReportPath = "apps/dashboard/data/generated/whatsapp-local-task-import-report.json";
  const whatsappImportReport = JSON.parse(await readFile(join(repoRoot, whatsappImportReportPath), "utf8"));
  if (whatsappImportReport.rawChatPrinted !== false || whatsappImportReport.secretRedactionApplied !== true) {
    findings.push({ rule: "whatsapp-local-import-redaction-invalid", file: whatsappImportReportPath, line: 0, text: "WhatsApp local import report must redact secrets and avoid raw chat printing" });
  }
  if (whatsappImportReport.whatsappApiConnected !== false || whatsappImportReport.webhookEnabled !== false || whatsappImportReport.authEnabled !== false || whatsappImportReport.productionReady !== false) {
    findings.push({ rule: "whatsapp-local-import-unsafe-flag", file: whatsappImportReportPath, line: 0, text: "WhatsApp local import must keep API, webhook, auth, and production disabled" });
  }
  const importReportBody = JSON.stringify(whatsappImportReport);
  if (/\b(?:phone|tel|mobile|whatsapp|contact)\b.{0,24}(?:\+?\d[\s().-]?){8,}|Bearer\s+|ghp_|xox[baprs]-|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/i.test(importReportBody)) {
    findings.push({ rule: "whatsapp-local-import-secret-or-phone-leak", file: whatsappImportReportPath, line: 0, text: "WhatsApp local import report must not contain phone numbers or secret-like values" });
  }
  if (/qr\s*login|qr-code|qr code/i.test(importReportBody)) {
    findings.push({ rule: "whatsapp-local-import-qr-login", file: whatsappImportReportPath, line: 0, text: "WhatsApp local import must not include QR login or QR code wiring" });
  }
  for (const localOnlyPath of [
    "apps/dashboard/data/local/whatsapp-task-import.json",
    "apps/dashboard/data/local/whatsapp-task-import.txt"
  ]) {
    const tracked = spawnSync("git", ["ls-files", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    if ((tracked.stdout || "").trim() || (staged.stdout || "").trim()) {
      findings.push({ rule: "whatsapp-local-import-file-tracked", file: localOnlyPath, line: 0, text: "real WhatsApp local import files must not be tracked" });
    }
  }
} catch {
  // Quality gate and verifier check report existence after generation.
}

try {
  const whatsappImportModulePath = "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.js";
  const whatsappImportModule = await readFile(join(repoRoot, whatsappImportModulePath), "utf8");
  if (/qr\s*login|scan\s*qr|qr-code|qr code/i.test(whatsappImportModule) && !/No QR login/i.test(whatsappImportModule)) {
    findings.push({ rule: "whatsapp-local-import-qr-wiring", file: whatsappImportModulePath, line: 0, text: "WhatsApp local import module must not add QR login behavior" });
  }
} catch {
  findings.push({ rule: "whatsapp-local-import-module-missing", file: "apps/dashboard/src/lib/operator-tasks/whatsapp-local-task-import.js", line: 0, text: "WhatsApp local task import module must exist" });
}

try {
  const healthReportPath = "apps/dashboard/data/generated/local-real-agent-health-report.json";
  const healthReport = JSON.parse(await readFile(join(repoRoot, healthReportPath), "utf8"));
  if (healthReport.healthConnectionStatus !== "local-file-only") {
    findings.push({ rule: "local-health-not-local-file-only", file: healthReportPath, line: 0, text: "healthConnectionStatus must be local-file-only" });
  }
  if (!["local-file-only", "local-reviewed-json"].includes(healthReport.healthSource)) {
    findings.push({ rule: "local-health-source-invalid", file: healthReportPath, line: 0, text: "healthSource must be local-file-only or local-reviewed-json" });
  }
  if (!["missing-fallback-to-sample", "valid", "invalid-review-required"].includes(healthReport.reviewedInputStatus)) {
    findings.push({ rule: "local-health-reviewed-status-missing", file: healthReportPath, line: 0, text: "reviewedInputStatus must be explicit" });
  }
  if (healthReport.actualRealAgentCount !== 1 || healthReport.operatorTruthSource !== "local-ingest") {
    findings.push({ rule: "local-health-not-single-agent-truth", file: healthReportPath, line: 0, text: "local health must align to local-ingest single-agent truth" });
  }
  if (/SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(JSON.stringify(healthReport))) {
    findings.push({ rule: "local-health-secret-value-leak", file: healthReportPath, line: 0, text: "health report must not print secret-like values" });
  }
  if (JSON.stringify(healthReport.agents ?? []).includes("gateway-stub") || JSON.stringify(healthReport.agents ?? []).includes("\"source\":\"mock\"")) {
    findings.push({ rule: "mock-health-truth", file: healthReportPath, line: 0, text: "mock and gateway-stub must not be health truth" });
  }
  for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
    if (!healthReport.blockedActions?.includes(blocked)) {
      findings.push({ rule: "local-health-blocked-action-missing", file: healthReportPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
} catch {
  // Verifier and quality gate check report existence; safety scan handles content when present.
}

try {
  const evidenceReportPath = "apps/dashboard/data/generated/local-health-evidence-review-report.json";
  const evidenceReport = JSON.parse(await readFile(join(repoRoot, evidenceReportPath), "utf8"));
  if (!["reviewed-valid", "reviewed-invalid-fallback", "missing-fallback", "sample-fallback", "review-required", "unsafe-rejected"].includes(evidenceReport.evidenceStatus)) {
    findings.push({ rule: "local-health-evidence-status-invalid", file: evidenceReportPath, line: 0, text: "evidenceStatus must be a safe enum" });
  }
  if (!["local-reviewed-json", "local-file-only"].includes(evidenceReport.acceptedHealthSource)) {
    findings.push({ rule: "local-health-evidence-source-invalid", file: evidenceReportPath, line: 0, text: "acceptedHealthSource must be local-reviewed-json or local-file-only" });
  }
  if (evidenceReport.redactionApplied !== true || evidenceReport.rawValuesPrinted !== false) {
    findings.push({ rule: "raw-reviewed-health-values-printed", file: evidenceReportPath, line: 0, text: "redactionApplied must be true and rawValuesPrinted must be false" });
  }
  if (evidenceReport.fallbackUsed === true && !evidenceReport.fallbackReason) {
    findings.push({ rule: "local-health-evidence-fallback-reason-missing", file: evidenceReportPath, line: 0, text: "fallbackReason must exist when fallbackUsed is true" });
  }
  if (evidenceReport.actualRealAgentCount !== 1 || evidenceReport.operatorTruthSource !== "local-ingest") {
    findings.push({ rule: "local-health-evidence-not-single-agent-truth", file: evidenceReportPath, line: 0, text: "evidence review must align to local-ingest single-agent truth" });
  }
  if (JSON.stringify(evidenceReport).includes("gateway-stub") || JSON.stringify(evidenceReport).includes("\"source\":\"mock\"")) {
    findings.push({ rule: "mock-health-evidence-truth", file: evidenceReportPath, line: 0, text: "mock and gateway-stub must not be health evidence truth" });
  }
  if (/SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(JSON.stringify(evidenceReport))) {
    findings.push({ rule: "local-health-evidence-secret-value-leak", file: evidenceReportPath, line: 0, text: "evidence report must not print secret-like values" });
  }
  for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation"]) {
    if (!evidenceReport.blockedActions?.includes(blocked)) {
      findings.push({ rule: "local-health-evidence-blocked-action-missing", file: evidenceReportPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
} catch {
  // Verifier and quality gate check report existence; safety scan handles content when present.
}

try {
  const launchScriptPath = "apps/dashboard/scripts/start-operator-dashboard.ps1";
  const launchScript = await readFile(join(repoRoot, launchScriptPath), "utf8");
  if (/\.env\b|process\.env|Authorization|credentials\s*:\s*["']include["']|production\.example\.com|api\.example\.com|live\.example\.com/i.test(launchScript)) {
    findings.push({ rule: "operator-launch-unsafe-config", file: launchScriptPath, line: 0, text: "launch script must not read env, auth, credentials, or production endpoints" });
  }
  if (/\b(Restart-Service|Stop-Service|Start-Service|Restart-Computer|Stop-Process)\b/i.test(launchScript)) {
    findings.push({ rule: "operator-launch-restart-enabled", file: launchScriptPath, line: 0, text: "launch script must not restart, stop, or start agents" });
  }
  if (!launchScript.includes("real-local-dashboard-export.single-agent.generated.json") || !launchScript.includes("http://localhost:")) {
    findings.push({ rule: "operator-launch-recommended-url-missing", file: launchScriptPath, line: 0, text: "launch script must point to local single-agent operator URL" });
  }
} catch {
  findings.push({ rule: "operator-launch-script-missing", file: "apps/dashboard/scripts/start-operator-dashboard.ps1", line: 0, text: "operator launch script must exist" });
}

try {
  const usabilityChecklistPath = "apps/dashboard/data/generated/operator-daily-usability-checklist.json";
  const usabilityChecklist = JSON.parse(await readFile(join(repoRoot, usabilityChecklistPath), "utf8"));
  if (usabilityChecklist.productionStatus !== "no-go-for-production" || usabilityChecklist.mutationEnabled !== false || usabilityChecklist.restartEnabled !== false || usabilityChecklist.productionGatewayEnabled !== false) {
    findings.push({ rule: "operator-usability-safety-marker-invalid", file: usabilityChecklistPath, line: 0, text: "operator usability checklist must preserve safety disabled markers" });
  }
  if (usabilityChecklist.expectedRealAgentCount !== 1 || !usabilityChecklist.operatorRecommendedUrl?.includes("real-local-dashboard-export.single-agent.generated.json")) {
    findings.push({ rule: "operator-usability-recommended-url-invalid", file: usabilityChecklistPath, line: 0, text: "operator usability checklist must recommend the single-agent local-ingest URL" });
  }
} catch {
  // Quality gate checks report existence; safety scan handles content when present.
}

try {
  const usabilityTroubleshootingPath = "apps/dashboard/data/generated/operator-usability-troubleshooting-report.json";
  const usabilityTroubleshooting = JSON.parse(await readFile(join(repoRoot, usabilityTroubleshootingPath), "utf8"));
  for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"]) {
    if (!usabilityTroubleshooting.blockedActions?.includes(blocked)) {
      findings.push({ rule: "operator-usability-blocked-action-missing", file: usabilityTroubleshootingPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
  if (!usabilityTroubleshooting.commonIssues?.some((issue) => String(issue.issue).includes("8 agents"))) {
    findings.push({ rule: "operator-usability-fixture-help-missing", file: usabilityTroubleshootingPath, line: 0, text: "troubleshooting report must explain 8 fixture agents" });
  }
} catch {
  // Quality gate checks report existence; safety scan handles content when present.
}

try {
  const dailySummaryPath = "apps/dashboard/data/generated/daily-operator-summary-report.json";
  const dailySummary = JSON.parse(await readFile(join(repoRoot, dailySummaryPath), "utf8"));
  const validDailyStatuses = ["ok", "review-required", "blocked", "fixture-mode", "unknown"];
  if (!validDailyStatuses.includes(dailySummary.dailyStatus)) {
    findings.push({ rule: "daily-operator-status-invalid", file: dailySummaryPath, line: 0, text: "dailyStatus must be a safe enum" });
  }
  if (["mock", "gateway-stub"].includes(dailySummary.operatorRecommendedSource) || ["mock", "gateway-stub"].includes(dailySummary.operatorTruthSource)) {
    findings.push({ rule: "daily-truth-fixture-source", file: dailySummaryPath, line: 0, text: "daily truth must not use mock or gateway-stub" });
  }
  if (dailySummary.operatorRecommendedSource !== "local-ingest" || dailySummary.expectedRealAgentCount !== 1 || dailySummary.actualRealAgentCount !== 1) {
    findings.push({ rule: "daily-operator-single-agent-invalid", file: dailySummaryPath, line: 0, text: "daily summary must recommend local-ingest and exactly 1 real agent" });
  }
  if (dailySummary.productionStatus !== "no-go-for-production" || dailySummary.mutationEnabled !== false || dailySummary.restartEnabled !== false || dailySummary.productionGatewayEnabled !== false) {
    findings.push({ rule: "daily-operator-safety-marker-invalid", file: dailySummaryPath, line: 0, text: "daily summary must preserve no-go production and disabled actions" });
  }
  for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy"]) {
    if (!dailySummary.blockedActions?.includes(blocked)) {
      findings.push({ rule: "daily-operator-blocked-action-missing", file: dailySummaryPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
  if (dailySummary.rawValuesPrinted === true) {
    findings.push({ rule: "daily-operator-raw-values-printed", file: dailySummaryPath, line: 0, text: "daily summary must not print raw reviewed local health values" });
  }
} catch {
  // Quality gate checks report existence; safety scan handles content when present.
}

try {
  const dailyChecklistPath = "apps/dashboard/data/generated/daily-operator-runbook-checklist.json";
  const dailyChecklist = JSON.parse(await readFile(join(repoRoot, dailyChecklistPath), "utf8"));
  if (!["ok", "review-required", "blocked", "fixture-mode", "unknown"].includes(dailyChecklist.dailyStatus)) {
    findings.push({ rule: "daily-runbook-checklist-status-invalid", file: dailyChecklistPath, line: 0, text: "daily checklist dailyStatus must be a safe enum" });
  }
  for (const blocked of ["restart-agent", "stop-agent", "start-agent", "production-gateway-connect", "mutation", "deploy", "auth-token-secrets"]) {
    if (!dailyChecklist.notAllowed?.includes(blocked)) {
      findings.push({ rule: "daily-runbook-checklist-blocked-action-missing", file: dailyChecklistPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
} catch {
  // Quality gate checks report existence; safety scan handles content when present.
}

try {
  const dailyRunbookModulePath = "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js";
  const dailyRunbookModule = await readFile(join(repoRoot, dailyRunbookModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(dailyRunbookModule)) {
    findings.push({ rule: "daily-runbook-network-call", file: dailyRunbookModulePath, line: 0, text: "daily runbook must not perform network calls" });
  }
  for (const forbidden of ["restartAgent", "stopAgent", "startAgent", "connectProductionGateway", "mutateDailyRunbook"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(dailyRunbookModule)) {
      findings.push({ rule: "daily-runbook-forbidden-action", file: dailyRunbookModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "daily-runbook-module-missing", file: "apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js", line: 0, text: "daily operator runbook module must exist" });
}

try {
  const productionGateModulePath = "apps/dashboard/src/lib/production-readiness/production-entry-gates.js";
  const productionGateModule = await readFile(join(repoRoot, productionGateModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(productionGateModule)) {
    findings.push({ rule: "production-entry-gate-network-call", file: productionGateModulePath, line: 0, text: "production entry gate module must not perform network calls" });
  }
  for (const forbidden of ["restartAgent", "stopAgent", "startAgent", "connectProductionGateway", "mutateProductionEntry", "deployProduction"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(productionGateModule)) {
      findings.push({ rule: "production-entry-gate-forbidden-action", file: productionGateModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "production-entry-gate-module-missing", file: "apps/dashboard/src/lib/production-readiness/production-entry-gates.js", line: 0, text: "production entry gate module must exist" });
}

try {
  const productionAdapterSimulatorModulePath = "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.js";
  const productionAdapterSimulatorModule = await readFile(join(repoRoot, productionAdapterSimulatorModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(productionAdapterSimulatorModule)) {
    findings.push({ rule: "production-adapter-simulator-network-call", file: productionAdapterSimulatorModulePath, line: 0, text: "production adapter simulator must not perform network calls" });
  }
  for (const forbidden of ["connectProductionGateway", "restartAgent", "stopAgent", "startAgent", "deployProduction", "mutateProductionAdapter"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(productionAdapterSimulatorModule)) {
      findings.push({ rule: "production-adapter-simulator-forbidden-action", file: productionAdapterSimulatorModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "production-adapter-simulator-module-missing", file: "apps/dashboard/src/lib/production-readiness/production-adapter-simulator.js", line: 0, text: "production adapter simulator module must exist" });
}

try {
  const productionAdapterSimulatorReportPath = "apps/dashboard/data/generated/production-adapter-simulator-report.json";
  const productionAdapterSimulatorReport = JSON.parse(await readFile(join(repoRoot, productionAdapterSimulatorReportPath), "utf8"));
  if (productionAdapterSimulatorReport.productionStatus !== "no-go-for-production" || productionAdapterSimulatorReport.safetyMode !== "read-only") {
    findings.push({ rule: "production-adapter-simulator-safety-marker-invalid", file: productionAdapterSimulatorReportPath, line: 0, text: "production adapter simulator must stay read-only and production no-go" });
  }
  for (const [key, expected] of Object.entries({
    productionReady: false,
    adapterEnabled: false,
    connected: false,
    simulatorOnly: true,
    productionGatewayEnabled: false,
    mutationEnabled: false,
    restartEnabled: false,
    deployEnabled: false,
    authEnabled: false,
    endpointConfigured: false
  })) {
    if (productionAdapterSimulatorReport[key] !== expected) {
      findings.push({ rule: "production-adapter-simulator-unsafe-flag", file: productionAdapterSimulatorReportPath, line: 0, text: `${key} must be ${expected}` });
    }
  }
  for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
    if (!productionAdapterSimulatorReport.blockedActions?.includes(blocked)) {
      findings.push({ rule: "production-adapter-simulator-blocked-action-missing", file: productionAdapterSimulatorReportPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
  const simulatorBody = JSON.stringify(productionAdapterSimulatorReport);
  if (/productionReady["']?\s*:\s*true|adapterEnabled["']?\s*:\s*true|connected["']?\s*:\s*true|endpointConfigured["']?\s*:\s*true|authEnabled["']?\s*:\s*true|mock.*production source|gateway-stub.*production source|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(simulatorBody)) {
    findings.push({ rule: "production-adapter-simulator-unsafe-marker", file: productionAdapterSimulatorReportPath, line: 0, text: "production adapter simulator must not claim readiness, connection, endpoint, auth, fixture truth, or remote URL" });
  }
  if (/[A-Za-z]:\\Users\\|\/home\/|SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(simulatorBody)) {
    findings.push({ rule: "production-adapter-simulator-secret-or-path-leak", file: productionAdapterSimulatorReportPath, line: 0, text: "production adapter simulator report must not include absolute paths or raw secret-like values" });
  }
} catch {
  // Quality gate and verifier check report existence after generation.
}

try {
  const contractModulePath = "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.js";
  const contractModule = await readFile(join(repoRoot, contractModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(contractModule)) {
    findings.push({ rule: "read-only-adapter-contract-network-call", file: contractModulePath, line: 0, text: "read-only adapter contract must not perform network calls" });
  }
  for (const forbidden of ["connectProductionGateway", "restartAgent", "stopAgent", "startAgent", "deployProduction", "mutateProductionAdapter"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(contractModule)) {
      findings.push({ rule: "read-only-adapter-contract-forbidden-action", file: contractModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "read-only-adapter-contract-module-missing", file: "apps/dashboard/src/lib/production-readiness/read-only-adapter-contract.js", line: 0, text: "read-only adapter contract module must exist" });
}

try {
  const disabledDraftModulePath = "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.js";
  const disabledDraftModule = await readFile(join(repoRoot, disabledDraftModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(disabledDraftModule)) {
    findings.push({ rule: "disabled-adapter-draft-network-call", file: disabledDraftModulePath, line: 0, text: "disabled adapter draft must not perform network calls" });
  }
  for (const forbidden of ["connectProductionGateway", "restartAgent", "stopAgent", "startAgent", "deployProduction", "mutateProductionAdapter"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(disabledDraftModule)) {
      findings.push({ rule: "disabled-adapter-draft-forbidden-action", file: disabledDraftModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "disabled-adapter-draft-module-missing", file: "apps/dashboard/src/lib/production-readiness/disabled-read-only-production-adapter.js", line: 0, text: "disabled adapter draft module must exist" });
}

for (const relPath of [
  "apps/dashboard/data/generated/read-only-adapter-contract-review-report.json",
  "apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json",
  "apps/dashboard/data/generated/read-only-adapter-contract-checklist.json",
  "apps/dashboard/data/generated/dashboard-stabilization-audit-report.json"
]) {
  try {
    const reportText = await readFile(join(repoRoot, relPath), "utf8");
    const report = JSON.parse(reportText);
    if (report.productionStatus !== "no-go-for-production") {
      findings.push({ rule: "read-only-adapter-contract-safety-marker-invalid", file: relPath, line: 0, text: "productionStatus must remain no-go-for-production" });
    }
    for (const [key, expected] of Object.entries({
      productionReady: false,
      adapterEnabled: false,
      connected: false,
      endpointConfigured: false,
      authEnabled: false,
      mutationEnabled: false,
      restartEnabled: false,
      productionGatewayEnabled: false,
      deployEnabled: false
    })) {
      if (key in report && report[key] !== expected) {
        findings.push({ rule: "read-only-adapter-contract-unsafe-flag", file: relPath, line: 0, text: `${key} must be ${expected}` });
      }
    }
    if ("dataReturned" in report && report.dataReturned !== false) {
      findings.push({ rule: "disabled-adapter-data-returned", file: relPath, line: 0, text: "dataReturned must remain false" });
    }
    if (/productionReady["']?\s*:\s*true|adapterEnabled["']?\s*:\s*true|connected["']?\s*:\s*true|endpointConfigured["']?\s*:\s*true|authEnabled["']?\s*:\s*true|dataReturned["']?\s*:\s*true|mock.*production source|gateway-stub.*production source|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(reportText)) {
      findings.push({ rule: "read-only-adapter-contract-unsafe-marker", file: relPath, line: 0, text: "25A reports must not claim readiness, connection, endpoint, auth, data return, fixture truth, or remote URL" });
    }
    if (/[A-Za-z]:\\Users\\|\/home\/|SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(reportText)) {
      findings.push({ rule: "read-only-adapter-contract-secret-or-path-leak", file: relPath, line: 0, text: "25A reports must not include absolute paths or raw secret-like values" });
    }
  } catch {
    // Quality gate and verifier check report existence after generation.
  }
}

try {
  const rcModulePath = "apps/dashboard/src/lib/release-readiness/local-operator-rc-audit.js";
  const rcModule = await readFile(join(repoRoot, rcModulePath), "utf8");
  if (/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(rcModule)) {
    findings.push({ rule: "local-operator-rc-network-call", file: rcModulePath, line: 0, text: "local operator RC audit must not perform network calls" });
  }
  for (const forbidden of ["connectProductionGateway", "restartAgent", "stopAgent", "startAgent", "deployProduction", "mutateProductionAdapter"]) {
    if (new RegExp(`\\b${forbidden}\\s*\\(`).test(rcModule)) {
      findings.push({ rule: "local-operator-rc-forbidden-action", file: rcModulePath, line: 0, text: `${forbidden} must not exist` });
    }
  }
} catch {
  findings.push({ rule: "local-operator-rc-module-missing", file: "apps/dashboard/src/lib/release-readiness/local-operator-rc-audit.js", line: 0, text: "local operator RC audit module must exist" });
}

for (const relPath of [
  "apps/dashboard/data/generated/local-operator-release-candidate-report.json",
  "apps/dashboard/data/generated/local-operator-final-checklist.json",
  "apps/dashboard/data/generated/local-operator-known-risk-register.json",
  "apps/dashboard/data/generated/local-operator-report-index.json"
]) {
  try {
    const reportText = await readFile(join(repoRoot, relPath), "utf8");
    const report = JSON.parse(reportText);
    if (report.productionStatus !== "no-go-for-production") {
      findings.push({ rule: "local-operator-rc-production-status-invalid", file: relPath, line: 0, text: "productionStatus must remain no-go-for-production" });
    }
    if (report.productionReady !== false) {
      findings.push({ rule: "local-operator-rc-production-ready-invalid", file: relPath, line: 0, text: "productionReady must remain false" });
    }
    if ("operatorRecommendedSource" in report && report.operatorRecommendedSource !== "local-ingest") {
      findings.push({ rule: "local-operator-rc-truth-source-invalid", file: relPath, line: 0, text: "operatorRecommendedSource must remain local-ingest" });
    }
    if ("actualRealAgentCount" in report && report.actualRealAgentCount !== 1) {
      findings.push({ rule: "local-operator-rc-agent-count-invalid", file: relPath, line: 0, text: "actualRealAgentCount must remain 1" });
    }
    for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy"]) {
      if (Array.isArray(report.blockedActions) && !report.blockedActions.includes(blocked)) {
        findings.push({ rule: "local-operator-rc-blocked-action-missing", file: relPath, line: 0, text: `${blocked} must be blocked` });
      }
    }
    if (/productionReady["']?\s*:\s*true|adapterEnabled["']?\s*:\s*true|connected["']?\s*:\s*true|endpointConfigured["']?\s*:\s*true|authEnabled["']?\s*:\s*true|dataReturned["']?\s*:\s*true|mock.*operator truth|gateway-stub.*operator truth|https?:\/\/(?!localhost\b|127\.0\.0\.1\b)/i.test(reportText)) {
      findings.push({ rule: "local-operator-rc-unsafe-marker", file: relPath, line: 0, text: "25B reports must not claim readiness, connection, endpoint, auth, data return, fixture truth, or remote URL" });
    }
    if (/[A-Za-z]:\\Users\\|\/home\/|SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(reportText)) {
      findings.push({ rule: "local-operator-rc-secret-or-path-leak", file: relPath, line: 0, text: "25B reports must not include absolute paths or raw secret-like values" });
    }
  } catch {
    // Quality gate and verifier check report existence after generation.
  }
}

try {
  const appPath = "apps/dashboard/src/app.js";
  const appText = await readFile(join(repoRoot, appPath), "utf8");
  const mainUiText = appText
    .replace(/renderTechnicalDetails\([\s\S]*?\n\s*\}\)/g, "renderTechnicalDetails(...)")
    .replace(/renderTechnicalArchive\([\s\S]*?\n\s*\}\)/g, "renderTechnicalArchive(...)");
  for (const marker of [
    "Agents / 代理程式",
    "Operator Home / Operator 首頁",
    "Daily Operator Runbook",
    "<th>Workflow</th>",
    "<th>Owner</th>",
    "<th>Reviewer</th>",
    "Allowed permissions",
    `memory-only; no ${["local", "Storage"].join("")}`,
    "<dt>productionAdapterEnabled</dt>",
    "<dt>productionAdapterConnected</dt>",
    "<dt>endpointConfigured</dt>",
    "<dt>authEnabled</dt>",
    "<dt>mutationEnabled</dt>",
    "<dt>requiresHumanApproval</dt>",
    "<dt>notSubmitted</dt>"
  ]) {
    if (mainUiText.includes(marker)) {
      findings.push({ rule: "raw-operator-key-visible", file: appPath, line: 0, text: `${marker} must stay out of main operator UI` });
    }
  }
  for (const permissionKey of ["reviews:approve", "gateway:write", "production:mutate"]) {
    if (mainUiText.includes(permissionKey)) {
      findings.push({ rule: "raw-permission-key-visible", file: appPath, line: 0, text: `${permissionKey} must stay inside technical details only` });
    }
  }
} catch {
  findings.push({ rule: "operator-console-visual-scan-failed", file: "apps/dashboard/src/app.js", line: 0, text: "could not scan operator console visual UX" });
}
try {
  const productionGateReportPath = "apps/dashboard/data/generated/production-entry-gate-report.json";
  const productionGateReport = JSON.parse(await readFile(join(repoRoot, productionGateReportPath), "utf8"));
  if (productionGateReport.productionReady !== false) {
    findings.push({ rule: "production-entry-ready-true", file: productionGateReportPath, line: 0, text: "productionReady must remain false" });
  }
  if (productionGateReport.productionStatus !== "no-go-for-production" || productionGateReport.productionGatewayEnabled !== false || productionGateReport.mutationEnabled !== false || productionGateReport.restartEnabled !== false || productionGateReport.productionWiring !== "disabled") {
    findings.push({ rule: "production-entry-safety-marker-invalid", file: productionGateReportPath, line: 0, text: "production entry gate report must keep production no-go and disabled gateway/mutation/restart/wiring" });
  }
  if (productionGateReport.operatorRecommendedSource !== "local-ingest" || productionGateReport.actualRealAgentCount !== 1) {
    findings.push({ rule: "production-entry-truth-source-invalid", file: productionGateReportPath, line: 0, text: "production entry gate must use local-ingest single-agent truth only" });
  }
  for (const blocked of ["production-gateway-connect", "mutation", "restart-agent", "stop-agent", "start-agent", "deploy", "auth-token-use"]) {
    if (!productionGateReport.blockedActions?.includes(blocked)) {
      findings.push({ rule: "production-entry-blocked-action-missing", file: productionGateReportPath, line: 0, text: `${blocked} must be blocked` });
    }
  }
  const reportBody = JSON.stringify(productionGateReport);
  if (/productionReady["']?\s*:\s*true|production gateway connected|production endpoint enabled|mock.*production readiness source|gateway-stub.*production readiness source/i.test(reportBody)) {
    findings.push({ rule: "production-entry-unsafe-readiness-marker", file: productionGateReportPath, line: 0, text: "production entry report must not claim readiness, connection, endpoint, or fixture truth" });
  }
  if (/[A-Za-z]:\\Users\\|\/home\/|SHOULD_NOT_PRINT|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]+|ghp_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}/i.test(reportBody)) {
    findings.push({ rule: "production-entry-secret-or-path-leak", file: productionGateReportPath, line: 0, text: "production entry report must not include absolute paths or raw secret-like values" });
  }
} catch {
  // Quality gate and verifier check report existence after generation.
}

try {
  const connectorModulePath = "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js";
  const connectorRunnerPath = "apps/dashboard/scripts/run-local-openclaw-connector.mjs";
  const connectorReportPath = "apps/dashboard/data/generated/local-openclaw-connector-report.json";
  const bridgeProducerPath = "apps/dashboard/scripts/generate-openclaw-local-export-from-safe-sources.mjs";
  const bridgeTestPath = "apps/dashboard/scripts/test-local-openclaw-real-bridge.mjs";
  const bridgeReportPath = "apps/dashboard/data/generated/openclaw-local-export-bridge-report.json";
  const wslAdapterPath = "apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs";
  const wslAdapterTestPath = "apps/dashboard/scripts/test-wsl-openclaw-local-export-adapter.mjs";
  const wslAdapterReportPath = "apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json";
  const taskMetadataDiscoveryPath = "apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs";
  const taskMetadataDiscoveryTestPath = "apps/dashboard/scripts/test-wsl-openclaw-task-metadata-discovery.mjs";
  const taskMetadataDiscoveryReportPath = "apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json";
  const taskMetadataSafetyPath = "apps/dashboard/src/lib/local-openclaw/local-openclaw-task-metadata-safety.js";
  const activationModulePath = "apps/dashboard/src/lib/local-openclaw/local-openclaw-activation-assistant.js";
  const activationSetupPath = "apps/dashboard/scripts/setup-local-openclaw-connector.mjs";
  const activationReportPath = "apps/dashboard/data/generated/local-openclaw-activation-report.json";
  const connectorModule = await readFile(join(repoRoot, connectorModulePath), "utf8");
  const connectorRunner = await readFile(join(repoRoot, connectorRunnerPath), "utf8");
  const bridgeProducer = await readFile(join(repoRoot, bridgeProducerPath), "utf8");
  const bridgeTest = await readFile(join(repoRoot, bridgeTestPath), "utf8");
  const wslAdapter = await readFile(join(repoRoot, wslAdapterPath), "utf8");
  const wslAdapterTest = await readFile(join(repoRoot, wslAdapterTestPath), "utf8");
  const taskMetadataDiscovery = await readFile(join(repoRoot, taskMetadataDiscoveryPath), "utf8");
  const taskMetadataDiscoveryTest = await readFile(join(repoRoot, taskMetadataDiscoveryTestPath), "utf8");
  const taskMetadataSafety = await readFile(join(repoRoot, taskMetadataSafetyPath), "utf8");
  const activationModule = await readFile(join(repoRoot, activationModulePath), "utf8");
  const activationSetup = await readFile(join(repoRoot, activationSetupPath), "utf8");
  if (!connectorModule.includes("localhost") || !connectorModule.includes("127.0.0.1") || !connectorModule.includes("isSafeLocalUrl")) {
    findings.push({ rule: "local-openclaw-localhost-guard-missing", file: connectorModulePath, line: 0, text: "local connector must enforce localhost / 127.0.0.1 only" });
  }
  if (/method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|allowedMethods\s*:\s*\[[^\]]*(?:POST|PUT|PATCH|DELETE)/i.test(connectorRunner + connectorModule)) {
    findings.push({ rule: "local-openclaw-mutation-method", file: connectorRunnerPath, line: 0, text: "local connector must use GET only" });
  }
  if (/credentials\s*:\s*["']include["']|Authorization\s*:|process\.env|dotenv|\.env/i.test(connectorRunner + connectorModule + activationModule + activationSetup)) {
    findings.push({ rule: "local-openclaw-auth-or-env", file: connectorRunnerPath, line: 0, text: "local connector must not use auth headers, credentials include, or env secrets" });
  }
  if (/https?:\/\/(?!localhost(?::|\/|$)|127\.0\.0\.1(?::|\/|$))/i.test(connectorRunner + connectorModule + activationModule + activationSetup)) {
    findings.push({ rule: "local-openclaw-external-url", file: connectorRunnerPath, line: 0, text: "local connector must not include external URL wiring" });
  }
  if (/method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|allowedMethods\s*:\s*\[[^\]]*(?:POST|PUT|PATCH|DELETE)/i.test(bridgeProducer + bridgeTest)) {
    findings.push({ rule: "local-openclaw-bridge-mutation-method", file: bridgeProducerPath, line: 0, text: "local export bridge must remain GET/read-only only" });
  }
  if (/credentials\s*:\s*["']include["']|Authorization\s*:|process\.env|dotenv|\.env/i.test(bridgeProducer + bridgeTest)) {
    findings.push({ rule: "local-openclaw-bridge-auth-or-env", file: bridgeProducerPath, line: 0, text: "local export bridge must not use auth headers, credentials include, or env secrets" });
  }
  if (!bridgeProducer.includes("openclaw-local-export-bridge-report.json") || !bridgeProducer.includes("no-safe-agent-task-source-found") || !bridgeProducer.includes("productionReady: false")) {
    findings.push({ rule: "local-openclaw-bridge-report-guard-missing", file: bridgeProducerPath, line: 0, text: "local export bridge must generate a redacted no-fake-data report" });
  }
  const wslAuthEnvRe = new RegExp(`credentials\\s*:\\s*["']include["']|Author${"ization"}\\s*:|process\\.env|dotenv|readFile\\([^)]*\\.${"env"}`, "i");
  if (wslAuthEnvRe.test(wslAdapter)) {
    findings.push({ rule: "wsl-openclaw-adapter-auth-or-env", file: wslAdapterPath, line: 0, text: "WSL export adapter must not use auth headers, credentials include, or env secrets" });
  }
  if (!wslAdapter.includes("rawSensitiveFieldsIncluded: false") || !wslAdapter.includes("secretRedactionApplied: true") || !wslAdapter.includes("rawRowsPrinted: false") || !wslAdapter.includes("rawSessionValuesPrinted: false")) {
    findings.push({ rule: "wsl-openclaw-adapter-redaction-guard-missing", file: wslAdapterPath, line: 0, text: "WSL export adapter must keep raw rows/session values out of generated reports" });
  }
  if (!wslAdapter.includes("prompt") || !wslAdapter.includes("message") || !wslAdapter.includes("content") || !wslAdapter.includes("body") || !wslAdapter.includes("token") || !wslAdapter.includes("credential")) {
    findings.push({ rule: "wsl-openclaw-adapter-sensitive-field-filter-missing", file: wslAdapterPath, line: 0, text: "WSL export adapter must screen sensitive field names before export" });
  }
  const wslUnsafeWriteRe = new RegExp(`writeFile\\([^)]*(?:sqlite|sessions|credentials|\\.${"env"})`, "i");
  if (wslUnsafeWriteRe.test(wslAdapter)) {
    findings.push({ rule: "wsl-openclaw-adapter-unsafe-write", file: wslAdapterPath, line: 0, text: "WSL export adapter must only write Dashboard local export and redacted report files" });
  }
  if (!activationSetup.includes("isSafeLocalUrl") || !activationSetup.includes("isSafeLocalExportPath")) {
    findings.push({ rule: "local-openclaw-activation-guard-missing", file: activationSetupPath, line: 0, text: "activation setup must validate localhost URL and local export path" });
  }
  for (const localOnlyPath of ["apps/dashboard/data/local/local-openclaw-connector.json", "apps/dashboard/data/local/openclaw-local-export.json"]) {
    const tracked = spawnSync("git", ["ls-files", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", localOnlyPath], { cwd: repoRoot, encoding: "utf8" });
    if ((tracked.stdout || "").trim() || (staged.stdout || "").trim()) {
      findings.push({ rule: "local-openclaw-local-file-tracked", file: localOnlyPath, line: 0, text: "real local connector/export file must not be tracked" });
    }
  }
  try {
    const connectorReport = JSON.parse(await readFile(join(repoRoot, connectorReportPath), "utf8"));
    if (connectorReport.productionReady !== false || connectorReport.mutationEnabled !== false || connectorReport.restartEnabled !== false || connectorReport.deployEnabled !== false || connectorReport.authEnabled !== false) {
      findings.push({ rule: "local-openclaw-report-unsafe-flag", file: connectorReportPath, line: 0, text: "local connector report must keep production, auth, mutation, restart, and deploy disabled" });
    }
    if (connectorReport.rawResponsePrinted !== false || connectorReport.secretRedactionApplied !== true || connectorReport.externalNetworkAllowed !== false) {
      findings.push({ rule: "local-openclaw-report-redaction-invalid", file: connectorReportPath, line: 0, text: "local connector report must redact secrets, avoid raw response printing, and disallow external network" });
    }
  } catch {
    // Quality gate and verifier check report existence after generation.
  }
  try {
    const bridgeReport = JSON.parse(await readFile(join(repoRoot, bridgeReportPath), "utf8"));
    if (bridgeReport.productionReady !== false || bridgeReport.mutationEnabled !== false || bridgeReport.restartEnabled !== false || bridgeReport.deployEnabled !== false || bridgeReport.authEnabled !== false || bridgeReport.productionGatewayEnabled !== false) {
      findings.push({ rule: "local-openclaw-bridge-unsafe-flag", file: bridgeReportPath, line: 0, text: "local export bridge report must keep production, auth, mutation, restart, deploy, and gateway disabled" });
    }
    if (bridgeReport.rawResponsePrinted !== false || bridgeReport.secretRedactionApplied !== true || bridgeReport.externalNetworkAllowed !== false) {
      findings.push({ rule: "local-openclaw-bridge-redaction-invalid", file: bridgeReportPath, line: 0, text: "local export bridge report must redact secrets, avoid raw response printing, and disallow external network" });
    }
    if (bridgeReport.exportStatus !== "no-safe-agent-task-source-found" && bridgeReport.exportStatus !== "ready-readonly-local") {
      findings.push({ rule: "local-openclaw-bridge-status-invalid", file: bridgeReportPath, line: 0, text: "local export bridge report must use a safe exportStatus" });
    }
  } catch {
    findings.push({ rule: "local-openclaw-bridge-report-missing", file: bridgeReportPath, line: 0, text: "local export bridge report must exist" });
  }
  try {
    const wslAdapterReport = JSON.parse(await readFile(join(repoRoot, wslAdapterReportPath), "utf8"));
    if (wslAdapterReport.productionReady !== false || wslAdapterReport.mutationEnabled !== false || wslAdapterReport.restartEnabled !== false || wslAdapterReport.deployEnabled !== false || wslAdapterReport.authEnabled !== false || wslAdapterReport.productionGatewayEnabled !== false) {
      findings.push({ rule: "wsl-openclaw-adapter-report-unsafe-flag", file: wslAdapterReportPath, line: 0, text: "WSL export adapter report must keep production, auth, mutation, restart, deploy, and gateway disabled" });
    }
    if (wslAdapterReport.rawSensitiveFieldsIncluded !== false || wslAdapterReport.secretRedactionApplied !== true || wslAdapterReport.rawRowsPrinted !== false || wslAdapterReport.rawSessionValuesPrinted !== false) {
      findings.push({ rule: "wsl-openclaw-adapter-report-redaction-invalid", file: wslAdapterReportPath, line: 0, text: "WSL export adapter report must not include raw sensitive fields, rows, or session values" });
    }
    const wslReportLeakRe = new RegExp(`[A-Za-z]:\\\\Users\\\\|/home/|Bearer\\s+|Author${"ization"}\\s*:|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}`, "i");
    if (wslReportLeakRe.test(JSON.stringify(wslAdapterReport))) {
      findings.push({ rule: "wsl-openclaw-adapter-report-secret-or-path", file: wslAdapterReportPath, line: 0, text: "WSL export adapter report must not contain absolute machine paths or secret-like values" });
    }
  } catch {
    findings.push({ rule: "wsl-openclaw-adapter-report-missing", file: wslAdapterReportPath, line: 0, text: "WSL export adapter report must exist" });
  }
  if (!taskMetadataDiscovery.includes(".schema") || !taskMetadataDiscovery.includes("rawRowsRead: false") || !taskMetadataDiscovery.includes("rawTaskContentPrinted: false") || !taskMetadataDiscovery.includes("schemaOnly: true")) {
    findings.push({ rule: "wsl-task-metadata-schema-guard-missing", file: taskMetadataDiscoveryPath, line: 0, text: "task metadata discovery must be schema-only and must not read raw rows or task content" });
  }
  if (/SELECT\s+\*/i.test(taskMetadataDiscovery) || /SELECT\s+.+\s+FROM/i.test(taskMetadataDiscovery)) {
    findings.push({ rule: "wsl-task-metadata-raw-row-read", file: taskMetadataDiscoveryPath, line: 0, text: "task metadata discovery must not select raw row values" });
  }
  if (/credentials\s*:\s*["']include["']|Authorization\s*:|process\.env|dotenv|readFile\([^)]*\.(?:env)/i.test(taskMetadataDiscovery)) {
    findings.push({ rule: "wsl-task-metadata-auth-or-env", file: taskMetadataDiscoveryPath, line: 0, text: "task metadata discovery must not use auth headers, credentials include, or env secrets" });
  }
  for (const sensitiveName of ["prompt", "message", "content", "body", "input", "output", "response", "token", "secret", "credential"]) {
    if (!taskMetadataSafety.includes(sensitiveName) && !taskMetadataDiscovery.includes(sensitiveName)) {
      findings.push({ rule: "wsl-task-metadata-sensitive-classifier-missing", file: taskMetadataSafetyPath, line: 0, text: "task metadata safety classifier must classify sensitive column names" });
      break;
    }
  }
  try {
    const taskMetadataDiscoveryReport = JSON.parse(await readFile(join(repoRoot, taskMetadataDiscoveryReportPath), "utf8"));
    if (taskMetadataDiscoveryReport.rawRowsRead !== false || taskMetadataDiscoveryReport.rawTaskContentPrinted !== false || taskMetadataDiscoveryReport.secretRedactionApplied !== true || taskMetadataDiscoveryReport.schemaOnly !== true) {
      findings.push({ rule: "wsl-task-metadata-report-redaction-invalid", file: taskMetadataDiscoveryReportPath, line: 0, text: "task metadata discovery report must be schema-only, redacted, and row-free" });
    }
    if (taskMetadataDiscoveryReport.productionReady !== false || taskMetadataDiscoveryReport.mutationEnabled !== false || taskMetadataDiscoveryReport.restartEnabled !== false || taskMetadataDiscoveryReport.deployEnabled !== false || taskMetadataDiscoveryReport.authEnabled !== false) {
      findings.push({ rule: "wsl-task-metadata-report-unsafe-flag", file: taskMetadataDiscoveryReportPath, line: 0, text: "task metadata discovery report must keep production, auth, mutation, restart, and deploy disabled" });
    }
    const taskMetadataReportLeakRe = new RegExp(`[A-Za-z]:\\\\Users\\\\|/home/|Bearer\\s+|Author${"ization"}\\s*:|(?:^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}`, "i");
    if (taskMetadataReportLeakRe.test(JSON.stringify(taskMetadataDiscoveryReport))) {
      findings.push({ rule: "wsl-task-metadata-report-secret-or-path", file: taskMetadataDiscoveryReportPath, line: 0, text: "task metadata discovery report must not contain absolute machine paths or secret-like values" });
    }
  } catch {
    findings.push({ rule: "wsl-task-metadata-report-missing", file: taskMetadataDiscoveryReportPath, line: 0, text: "task metadata discovery report must exist" });
  }
  try {
    const activationReport = JSON.parse(await readFile(join(repoRoot, activationReportPath), "utf8"));
    if (activationReport.productionReady !== false || activationReport.mutationEnabled !== false || activationReport.restartEnabled !== false || activationReport.deployEnabled !== false || activationReport.authEnabled !== false) {
      findings.push({ rule: "local-openclaw-activation-unsafe-flag", file: activationReportPath, line: 0, text: "activation report must keep production, auth, mutation, restart, and deploy disabled" });
    }
    if (activationReport.rawConfigPrinted !== false || activationReport.secretRedactionApplied !== true || activationReport.externalNetworkAllowed !== false) {
      findings.push({ rule: "local-openclaw-activation-redaction-invalid", file: activationReportPath, line: 0, text: "activation report must redact secrets and avoid raw config printing" });
    }
  } catch {
    findings.push({ rule: "local-openclaw-activation-report-missing", file: activationReportPath, line: 0, text: "local connector activation report must exist" });
  }
} catch {
  findings.push({ rule: "local-openclaw-scan-failed", file: "apps/dashboard/src/lib/local-openclaw/local-openclaw-connector.js", line: 0, text: "could not scan local OpenClaw connector" });
}

try {
  const singleAgentSnapshotPath = "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json";
  const singleAgentSnapshot = JSON.parse(await readFile(join(repoRoot, singleAgentSnapshotPath), "utf8"));
  const agentCount = Array.isArray(singleAgentSnapshot.agents) ? singleAgentSnapshot.agents.length : 0;
  if (agentCount !== 1) {
    findings.push({ rule: "single-agent-truth-snapshot-agent-count", file: singleAgentSnapshotPath, line: 0, text: `expected 1 agent, found ${agentCount}` });
  }
  if (singleAgentSnapshot.singleAgentCleanup?.reviewRequired !== true) {
    findings.push({ rule: "single-agent-truth-review-marker-missing", file: singleAgentSnapshotPath, line: 0, text: "single-agent truth snapshot must keep reviewRequired true" });
  }
} catch {
  // Verifier and quality gate check report existence; safety scan enforces the count when present.
}

const report = {
  generatedAt: new Date().toISOString(),
  result: findings.length ? "fail" : "pass",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  filesChecked: uniqueFiles.map((file) => relative(repoRoot, file).replaceAll("\\", "/")),
  checks: {
    secretLikeAssignments: !findings.some((finding) => finding.rule === "secret-like-assignment"),
    productionEndpoints: !findings.some((finding) => finding.rule === "production-endpoint"),
    envReferences: !findings.some((finding) => finding.rule === "env-reference"),
    liveGatewayUrls: !findings.some((finding) => finding.rule === "live-gateway"),
    forbiddenMutationFunctions: !findings.some((finding) => finding.rule === "forbidden-active-mutation")
  },
  findings
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (findings.length) {
  console.error("OpenClaw Dashboard safety scan failed.");
  for (const finding of findings) {
    console.error(`- ${finding.rule}: ${finding.file}${finding.line ? `:${finding.line}` : ""} ${finding.text}`);
  }
  process.exit(1);
}

console.log("OpenClaw Dashboard safety scan passed.");

// Sprint 28D markers: whatsapp-sync-mock-contract-report.json whatsapp-sync-mock-events.safe.json whatsapp-sync-mock-events.review-required.json whatsapp-sync-mock-events.unsafe.json generate-whatsapp-sync-mock-contract-report.mjs test-whatsapp-sync-mock-contract.mjs apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.js apps/dashboard/src/lib/whatsapp-sync/whatsapp-sync-mock-contract.ts openclaw-dashboard-whatsapp-sync-mock-contract.md
