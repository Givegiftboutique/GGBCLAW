import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "security-privacy-audit-report.json");

const scanRoots = [
  "apps/dashboard/src",
  "apps/dashboard/scripts",
  "apps/dashboard/data/generated",
  "apps/dashboard/data/local-ingest",
  "apps/dashboard/data/gateway-stub",
  "apps/dashboard/release",
  "docs/dashboard",
  "tests/manual-smoke-tests.md",
  "docs/phase-log.md",
  "ops/tasks",
  "artifacts"
];

const ignoredSegments = new Set([".git", "node_modules", ".venv", "__pycache__"]);
const textExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html", ".css", ".md", ".txt"]);
const generatedReportPrefix = "apps/dashboard/data/generated/";

const checks = [
  ["secret-like values", /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i, "fail"],
  ["auth header reference", /\bAuthorization\b/i, "fail"],
  ["credentials include", /credentials\s*:\s*["']include["']/i, "fail"],
  ["cookie handling", /document\.cookie/i, "fail"],
  ["token storage", /localStorage|sessionStorage/i, "fail"],
  ["runtime config usage", /\.env\b|process\.env|dotenv/i, "fail"],
  ["production endpoint", /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i, "fail"],
  ["mutation endpoint", /\b(approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway)\s*\(/i, "fail"],
  ["gateway mutation method", /\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i, "fail"],
  ["external notification delivery", /\b(sendWebhook|sendSlack|sendEmail|sendSms|deliverNotification)\s*\(/i, "fail"],
  ["GitHub Actions / CI workflow", /\.github\/workflows|GitHub Actions workflow/i, "fail"],
  ["production deploy command", /\b(deployProduction|runProductionDeploy|publishProduction|pushStaticRelease)\s*\(/i, "fail"],
  ["absolute machine paths", /[A-Za-z]:\\Users\\|\/home\//i, "warning"],
  ["large release bundle", /apps\/dashboard\/release\/.*\.(zip|tar|tgz|gz|7z|rar)|apps\/dashboard\/release\/(dist|build)\//i, "fail"],
  ["PII-like phone values", /\b(?:phone|tel|mobile|whatsapp|contact)\b.{0,24}(?:\+?\d[\s().-]?){8,}/i, "warning"],
  ["email-like values", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "warning"]
];

const docAllowPattern = /blocked|forbidden|not allowed|not supported|disabled|no |do not|future|example|placeholder|redacted|omit|checklist|review|warning|no-go-for-production|read-only|internal/i;

function rel(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

async function pathExists(relativePath) {
  try {
    return await stat(join(repoRoot, relativePath));
  } catch {
    return null;
  }
}

async function collectFiles(relativePath) {
  const start = join(repoRoot, relativePath);
  const output = [];
  async function walk(path) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredSegments.has(entry.name) || entry.name.startsWith(".env")) continue;
      const child = join(path, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else if (!entry.name.startsWith(".") && textExtensions.has(extname(entry.name).toLowerCase())) {
        output.push(child);
      }
    }
  }
  const info = await pathExists(relativePath);
  if (!info) return output;
  if (info.isDirectory()) await walk(start);
  if (info.isFile() && textExtensions.has(extname(start).toLowerCase())) output.push(start);
  return output;
}

function classifyFinding(relativePath, line, severity) {
  if (relativePath.startsWith(generatedReportPrefix)) return severity === "fail" ? "fail" : "warning";
  return "warning";
}

function summarizeContext(line) {
  if (!line.trim()) return "";
  return "redacted audit context; review source file and line locally";
}

function isAllowedSafetyStatement(relativePath, line) {
  if (relativePath === "apps/dashboard/data/generated/operator-agent-health-checklist.json" && /不含|不可|Do not|no |No |API key|token|cookie|secret|Authorization|restart|stop|start|production gateway|mutation/.test(line)) {
    return true;
  }
  if ([
    "apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json",
    "apps/dashboard/data/generated/reviewed-local-health-input-template-report.json",
    "apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json"
  ].includes(relativePath) && /notAllowed|forbiddenFields|Do not include|不含|不可|token|cookie|secret|apiKey|Authorization|authorization|endpoint|privateKey|credentials|session|rawValuesPrinted|redactionApplied/i.test(line)) {
    return true;
  }
  if (relativePath.startsWith("ops/tasks/") && /No restart|no restart|no mutation|no production|not read|not printed|disabled|forbidden|blocked|Do not|do not|read-only|no-go-for-production|token|cookie|secret|Authorization/i.test(line)) {
    return true;
  }
  if (relativePath.startsWith("docs/") && docAllowPattern.test(line)) {
    return true;
  }
  return false;
}

const files = [];
for (const root of scanRoots) {
  files.push(...await collectFiles(root));
}

const findings = [];
const warnings = [];

for (const file of [...new Set(files)]) {
  const relativePath = rel(file);
  if ([
    "apps/dashboard/data/generated/quality-gate-report.json",
    "apps/dashboard/data/generated/security-privacy-audit-report.json",
    "apps/dashboard/data/generated/safety-scan-report.json"
  ].includes(relativePath)) continue;
  const body = await readFile(file, "utf8");
  const lines = body.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [name, pattern, severity] of checks) {
      if (!pattern.test(line)) continue;
      if (isAllowedSafetyStatement(relativePath, line)) continue;
      const result = classifyFinding(relativePath, line, severity);
      const record = {
        category: name,
        file: relativePath,
        line: index + 1,
        severity: result,
        context: summarizeContext(line)
      };
      if (result === "fail") findings.push(record);
      else warnings.push(record);
    }
  });
}

const blockedItems = [
  { name: "production API/Gateway", status: "blocked" },
  { name: "mutation endpoint", status: "blocked" },
  { name: "production deploy", status: "blocked" },
  { name: "auth/token/cookie handling", status: "blocked" },
  { name: "external notification delivery", status: "blocked" }
];

const report = {
  reportId: `security-privacy-audit-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-operator-beta-security-review",
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  productionStatus: "no-go-for-production",
  auditStatus: findings.length ? "fail" : warnings.length ? "warning" : "pass",
  checks: checks.map(([name]) => ({ name, scope: "local repository text scan" })),
  findings,
  warnings,
  blockedItems,
  recommendations: [
    "Review warning items before sharing generated reports.",
    "Keep only latest committed beta generated reports.",
    "Do not commit .env, secrets, private data, or raw logs.",
    "Production still requires a separate formal security and privacy review."
  ]
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("OpenClaw security privacy audit generated.");
console.log(`Report: ${rel(reportPath)}`);
