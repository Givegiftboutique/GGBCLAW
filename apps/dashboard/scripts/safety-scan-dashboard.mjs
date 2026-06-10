import { readdir, readFile, writeFile } from "node:fs/promises";
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
  "apps/dashboard/data/generated/real-local-agent-inventory-inspection.json",
  "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json",
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
  "apps/dashboard/scripts/lib",
  "apps/dashboard/src/lib/data-trust",
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
]);

const activeCodeExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html"]);
const textExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html", ".md", ".css"]);

const denyPatterns = [
  { id: "secret-like-assignment", pattern: /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i },
  { id: "production-endpoint", pattern: /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i },
  { id: "env-reference", pattern: /\.env\b/i },
  { id: "live-gateway", pattern: /live\s+OpenClaw\s+Gateway|production\s+OpenClaw\s+Gateway/i },
  { id: "authorization-header", pattern: /Authorization/i },
  { id: "credentials-include", pattern: /credentials\s*:\s*["']include["']/i },
  { id: "browser-token-storage", pattern: /localStorage|sessionStorage/i },
  { id: "cookie-usage", pattern: /document\.cookie|\bcookie\b/i },
  { id: "mutation-http-method", pattern: /\b(method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|POST|PUT|PATCH|DELETE)\b/ },
  { id: "unsafe-dev-baseurl", pattern: /baseUrl.*(prod|production|live|real|secret|token)/i },
  { id: "real-auth-provider", pattern: /\b(login|authProvider|oauth|saml|jwt|bearer)\b/i },
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
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /pattern:|env-reference|live-gateway|no live OpenClaw|authorization-header|credentials-include|browser-token-storage|cookie-usage|mutation-http-method|unsafe-dev-baseurl|Authorization|localStorage|sessionStorage|cookie|POST|PUT|PATCH|DELETE/.test(line)) {
    return true;
  }
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /real-auth-provider|forbidden-mutation-permission|login|authProvider|oauth|saml|jwt|bearer|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate/.test(line)) {
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
  if (relPath === "apps/dashboard/src/app.js" && /Authorization header|未使用|credentials: omit|Production URL blocked|dev-gateway-live-drill-report/.test(line)) {
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
    "apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs",
    "apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs",
    "apps/dashboard/scripts/generate-single-agent-truth-report.mjs",
    "apps/dashboard/scripts/generate-fixture-quarantine-report.mjs",
    "apps/dashboard/scripts/test-single-agent-local-snapshot.mjs",
    "apps/dashboard/scripts/test-fixture-quarantine.mjs"
  ].includes(relPath) && /production|gateway|credentials|Authorization|token|cookie|api|deploy|GitHub Actions|CI|mutation|webhook|email|Slack|SMS|read-only|no-go-for-production|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|operatorTruth|mockIsOperatorTruth|gatewayStubIsOperatorTruth|https?:/.test(line)) {
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
    "apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json"
  ].includes(relPath) && /production|gateway|productionStatus|productionWiring|mutationEnabled|read-only|no-go-for-production|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|operatorTruth|mockIsOperatorTruth|gatewayStubIsOperatorTruth|review|warning|followup/.test(line)) {
    return true;
  }
  if ([
    "docs/dashboard/openclaw-dashboard-security-privacy-audit.md",
    "docs/dashboard/openclaw-dashboard-data-retention.md",
    "docs/dashboard/openclaw-dashboard-operator-security-checklist.md"
  ].includes(relPath) && /secret|PII|private data|Authorization|credentials|token|cookie|\.env|production endpoint|production deploy|production Gateway|mutation endpoint|GitHub Actions|webhook|email|Slack|SMS|no-go-for-production|read-only|draft-for-internal-review|blocked|forbidden|not certified|do not/i.test(line)) {
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
    "docs/dashboard/openclaw-dashboard-single-agent-local-snapshot.md"
  ].includes(relPath) && /production|no-go-for-production|read-only|production Gateway|production API|production deploy|mutation endpoint|GitHub Actions|Authorization|credentials|token|cookie|secret|webhook|email|Slack|SMS|manual approval|fixture|8 agents|8-agent|1 real agent|single agent|operator truth|do not|not allowed|requires|blocked/i.test(line)) {
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

for (const relPath of [
  "apps/dashboard/data/generated/single-agent-truth-report.json",
  "apps/dashboard/data/generated/fixture-quarantine-report.json"
]) {
  try {
    const reportBody = await readFile(join(repoRoot, relPath), "utf8");
    if (/"mockIsOperatorTruth"\s*:\s*true|"gatewayStubIsOperatorTruth"\s*:\s*true/.test(reportBody)) {
      findings.push({ rule: "fixture-report-operator-truth-violation", file: relPath, line: 0, text: "fixture sources must not be operator truth" });
    }
  } catch {
    // The verifier and quality gate check report existence; safety scan handles content when present.
  }
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
