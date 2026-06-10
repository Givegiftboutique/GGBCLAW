import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const dashboardRoot = resolve(here, "..");
const outputPath = join(dashboardRoot, "data", "generated", "release-manifest.json");

function gitValue(args) {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) return "unknown";
  return result.stdout.trim() || "unknown";
}

function assertSafeManifestText(body) {
  const issues = [];
  if (/C:\\Users\\/i.test(body)) issues.push("manifest contains an absolute machine path");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|0\.0\.0\.0\b|dev\.local\b|openclaw-dev\.local\b)/i.test(body)) issues.push("manifest contains a production-like endpoint");
  if (/(password|token|cookie|api[_-]?key)\s*[:=]/i.test(body)) issues.push("manifest contains a secret-like assignment");
  if (issues.length) {
    console.error("OpenClaw release manifest generation failed.");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exit(1);
  }
}

const generatedAt = new Date().toISOString();
const releaseId = `dashboard-local-release-${generatedAt.replace(/[:.]/g, "-")}`;

let qualityReport = { result: "unknown" };
let safetyReport = { result: "unknown" };
try {
  qualityReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "quality-gate-report.json"), "utf8"));
} catch {}
try {
  safetyReport = JSON.parse(await readFile(join(dashboardRoot, "data", "generated", "safety-scan-report.json"), "utf8"));
} catch {}

const manifest = {
  schemaVersion: "dashboard-local-release-manifest-v1",
  releaseId,
  generatedAt,
  git: {
    branch: gitValue(["branch", "--show-current"]),
    commit: gitValue(["rev-parse", "--short", "HEAD"]),
    tag: gitValue(["describe", "--tags", "--abbrev=0"])
  },
  dashboard: {
    mode: "static-read-only",
    safetyMode: "read-only",
    mutationEnabled: false,
    productionWiring: "disabled",
    supportedSources: ["mock", "json", "artifact", "gateway-stub", "local-ingest", "dev-gateway"]
  },
  quality: {
    qualityGateReportPath: "apps/dashboard/data/generated/quality-gate-report.json",
    safetyScanReportPath: "apps/dashboard/data/generated/safety-scan-report.json",
    qualityGateResult: qualityReport.result ?? "unknown",
    safetyScanResult: safetyReport.result ?? "unknown"
  },
  artifacts: [
    "apps/dashboard/data/generated/dashboard-export.generated.json",
    "apps/dashboard/data/generated/action-drafts.sample.json",
    "apps/dashboard/data/generated/gateway-fixture-diff-report.json"
  ],
  rollback: {
    recommendedTagPattern: "sprint-12a-internal-release-workflow",
    rollbackCommand: "git checkout <tag>"
  },
  operator: {
    manualRunUrl: "http://localhost:5173/",
    qualityGateCommand: "node apps/dashboard/scripts/run-dashboard-quality-gates.mjs",
    releaseVerificationCommand: "node apps/dashboard/scripts/verify-local-release.mjs"
  }
};

const body = `${JSON.stringify(manifest, null, 2)}\n`;
assertSafeManifestText(body);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body, "utf8");

console.log("OpenClaw release manifest generated.");
