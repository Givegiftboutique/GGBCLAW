import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const reportPath = join(dashboardRoot, "data", "generated", "internal-static-hosting-dry-run-report.json");

const requiredFiles = [
  "apps/dashboard/index.html",
  "apps/dashboard/src/app.js",
  "apps/dashboard/src/styles.css",
  "apps/dashboard/src/lib",
  "apps/dashboard/data",
  "apps/dashboard/schema",
  "apps/dashboard/README.md"
];

const requiredReports = [
  "apps/dashboard/data/generated/release-manifest.json",
  "apps/dashboard/data/generated/final-beta-audit-report.json",
  "apps/dashboard/data/generated/operator-daily-summary.json",
  "apps/dashboard/data/generated/production-readiness-report.json"
];

const releaseOutputs = [
  "apps/dashboard/release/local-release-index.json"
];

const scanRoots = [
  "apps/dashboard/index.html",
  "apps/dashboard/src",
  "apps/dashboard/data",
  "apps/dashboard/schema",
  "apps/dashboard/release",
  "apps/dashboard/README.md"
];

const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".md", ".txt"]);
const failures = [];
const warnings = [];

function rel(path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

async function exists(relativePath) {
  try {
    return await stat(join(repoRoot, relativePath));
  } catch {
    return null;
  }
}

function addCheck(list, name, result, details = "") {
  list.push({ name, result, details });
  if (result === "fail") failures.push(`${name}: ${details}`);
  if (result === "warning") warnings.push(`${name}: ${details}`);
}

async function collectFiles(relativePath) {
  const target = join(repoRoot, relativePath);
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
  const info = await exists(relativePath);
  if (!info) return files;
  if (info.isDirectory()) {
    await walk(target);
  } else {
    files.push(target);
  }
  return files;
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(repoRoot, relativePath), "utf8"));
}

const requiredFileChecks = [];
for (const file of requiredFiles) {
  const info = await exists(file);
  addCheck(requiredFileChecks, file, info ? "pass" : "fail", info ? "present" : "missing");
}

const requiredReportChecks = [];
for (const file of requiredReports) {
  const info = await exists(file);
  addCheck(requiredReportChecks, file, info ? "pass" : "fail", info ? "present" : "missing");
}

const staticChecks = [];
for (const file of releaseOutputs) {
  const info = await exists(file);
  addCheck(staticChecks, file, info ? "pass" : "fail", info ? "present" : "missing");
}

let releaseManifest = null;
let finalBetaAudit = null;
let dailySummary = null;
let readiness = null;
try {
  releaseManifest = await readJson("apps/dashboard/data/generated/release-manifest.json");
  finalBetaAudit = await readJson("apps/dashboard/data/generated/final-beta-audit-report.json");
  dailySummary = await readJson("apps/dashboard/data/generated/operator-daily-summary.json");
  readiness = await readJson("apps/dashboard/data/generated/production-readiness-report.json");
} catch (error) {
  addCheck(staticChecks, "generated report parse", "fail", error.message);
}

for (const [name, report] of [
  ["release manifest", releaseManifest?.dashboard ?? releaseManifest],
  ["final beta audit", finalBetaAudit],
  ["operator daily summary", dailySummary],
  ["production readiness", readiness]
]) {
  if (!report) continue;
  addCheck(staticChecks, `${name} safetyMode read-only`, report.safetyMode === "read-only" ? "pass" : "fail", String(report.safetyMode));
  addCheck(staticChecks, `${name} mutationEnabled false`, report.mutationEnabled === false ? "pass" : "fail", String(report.mutationEnabled));
  addCheck(staticChecks, `${name} productionWiring disabled`, report.productionWiring === "disabled" ? "pass" : "fail", String(report.productionWiring));
}
addCheck(staticChecks, "production deploy disabled", readiness?.productionDeploy === false ? "pass" : "fail", String(readiness?.productionDeploy));
addCheck(staticChecks, "production no-go preserved", readiness?.recommendation === "no-go-for-production" && finalBetaAudit?.productionStatus === "no-go-for-production" ? "pass" : "fail", "production remains no-go");

const files = [];
for (const root of scanRoots) {
  files.push(...await collectFiles(root));
}
const uniqueFiles = [...new Set(files)].filter((file) => textExtensions.has(extname(file).toLowerCase()));
const combined = (await Promise.all(uniqueFiles.map(async (file) => `${rel(file)}\n${await readFile(file, "utf8")}`))).join("\n");
const generatedReportText = JSON.stringify({ releaseManifest, finalBetaAudit, dailySummary, readiness });

const blockedItems = [];
function blockCheck(name, pattern, details) {
  const found = pattern.test(combined);
  blockedItems.push({ name, result: found ? "fail" : "pass", details });
  if (found) failures.push(`${name}: ${details}`);
}

const absolutePathFound = /[A-Za-z]:\\Users\\|\/home\//i.test(generatedReportText);
blockedItems.push({ name: "no absolute machine paths in generated reports", result: absolutePathFound ? "fail" : "pass", details: "generated static handoff reports must not expose machine paths" });
if (absolutePathFound) failures.push("no absolute machine paths in generated reports: generated report path leak");
blockCheck("no secret-like assignments", /(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i, "no frontend secret values");
blockCheck("no production endpoints", /https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i, "no production endpoint values");
blockCheck("no mutation endpoint", /\b(approveReview|rejectReview|restoreBackup|updateSettings|mutateGateway|writeGateway)\s*\(/i, "no active mutation function");

const workflows = await exists(".github/workflows");
blockedItems.push({ name: "no workflow directory", result: workflows ? "fail" : "pass", details: workflows ? "workflow directory exists" : "not present" });
if (workflows) failures.push("no workflow directory: directory exists");

const releaseFiles = await collectFiles("apps/dashboard/release");
for (const file of releaseFiles) {
  const info = await stat(file);
  const releaseRel = rel(file);
  if (/\.(zip|tar|tgz|gz|7z|rar)$/i.test(releaseRel) || /\/(dist|build)\//i.test(releaseRel) || info.size > 5 * 1024 * 1024) {
    blockedItems.push({ name: "no large release bundle", result: "fail", details: releaseRel });
    failures.push(`no large release bundle: ${releaseRel}`);
  }
}
if (!blockedItems.some((item) => item.name === "no large release bundle")) {
  blockedItems.push({ name: "no large release bundle", result: "pass", details: "no zip/dist/build bundle found under apps/dashboard/release" });
}

const report = {
  reportId: `internal-static-hosting-dry-run-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
  generatedAt: new Date().toISOString(),
  scope: "internal-static-hosting-dry-run",
  hostingMode: "static-preview-only",
  productionDeploy: false,
  safetyMode: "read-only",
  mutationEnabled: false,
  productionWiring: "disabled",
  requiredFiles: requiredFileChecks,
  requiredReports: requiredReportChecks,
  staticChecks,
  blockedItems,
  summary: {
    passed: [...requiredFileChecks, ...requiredReportChecks, ...staticChecks, ...blockedItems].filter((item) => item.result === "pass").length,
    failed: failures.length,
    warnings: warnings.length
  }
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error("OpenClaw internal static hosting dry run failed.");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("OpenClaw internal static hosting dry run passed.");
console.log(`Report: ${rel(reportPath)}`);
