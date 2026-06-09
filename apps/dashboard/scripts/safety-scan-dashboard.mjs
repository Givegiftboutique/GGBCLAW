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
  "docs/dashboard/openclaw-dashboard-rbac.md",
  "docs/dashboard/openclaw-dashboard-action-drafts.md",
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
  { id: "forbidden-mutation-permission", pattern: /\b(reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate)\b/i }
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
  return /disabled|forbidden|not implemented|no production|do not|future|out of scope|without .*cookie|safety|guardrail|mock-only|read-only|absent|no .*env|no .*secrets|local\/static sources only|no live OpenClaw Gateway|blocked|omit|no credentials|no auth|no cookies|no cookie|no real auth|no token|no real login|simulated only|draft only|not submitted|allowed examples|blocked examples|safe local HTTP|baseUrl|baseUrlState|POST|PUT|PATCH|DELETE|localStorage|sessionStorage|Authorization|reviews:approve|reviews:reject|backups:restore|settings:update|gateway:write|production:mutate|http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|dev\.local|openclaw-dev\.local):|production\.example\.com/i.test(line);
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

const report = {
  generatedAt: new Date().toISOString(),
  result: findings.length ? "fail" : "pass",
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
