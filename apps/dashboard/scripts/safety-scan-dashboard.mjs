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
  "docs/dashboard",
  "ops/tasks",
  "tests/manual-smoke-tests.md",
  "docs/phase-log.md"
];

const allowedDocFiles = new Set([
  "apps/dashboard/README.md",
  "apps/dashboard/schema/README.md",
  "docs/dashboard/openclaw-dashboard-api-contract.md",
  "docs/dashboard/openclaw-dashboard-design.md",
  "docs/dashboard/openclaw-dashboard-roadmap.md",
  "docs/phase-log.md",
  "tests/manual-smoke-tests.md",
  "ops/tasks/TASK-20260609-OC-DASH-001.md",
  "ops/tasks/TASK-20260609-OC-DASH-002.md",
  "ops/tasks/TASK-20260609-OC-DASH-003.md",
  "ops/tasks/TASK-20260609-OC-DASH-004.md",
  "ops/tasks/TASK-20260609-OC-DASH-005.md"
]);

const activeCodeExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html"]);
const textExtensions = new Set([".js", ".mjs", ".ts", ".json", ".html", ".md", ".css"]);

const denyPatterns = [
  { id: "secret-like-assignment", pattern: /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i },
  { id: "production-endpoint", pattern: /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b)/i },
  { id: "env-reference", pattern: /\.env\b/i },
  { id: "live-gateway", pattern: /live\s+OpenClaw\s+Gateway|production\s+OpenClaw\s+Gateway/i }
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
  "exportSnapshotToProduction"
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
  if (relPath === "apps/dashboard/scripts/safety-scan-dashboard.mjs" && /pattern:|env-reference|live-gateway|no live OpenClaw/.test(line)) {
    return true;
  }
  if (!allowedDocFiles.has(relPath.replaceAll("\\", "/"))) return false;
  return /disabled|forbidden|not implemented|no production|do not|future|safety|guardrail|mock-only|read-only|absent|no .*env|no .*secrets|local\/static sources only|no live OpenClaw Gateway/i.test(line);
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
