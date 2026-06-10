import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const nodeExe = process.execPath;
const commands = [
  ["apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs"],
  ["apps/dashboard/scripts/run-dev-gateway-live-drill.mjs"],
  ["apps/dashboard/scripts/generate-observability-report.mjs"],
  ["apps/dashboard/scripts/generate-production-readiness-report.mjs"],
  ["apps/dashboard/scripts/generate-operator-evidence-manifest.mjs"],
  ["apps/dashboard/scripts/generate-operator-daily-summary.mjs"]
];

function assertSafeSummary(summary) {
  const body = JSON.stringify(summary);
  const issues = [];
  if (summary.safetyMode !== "read-only") issues.push("safetyMode must be read-only");
  if (summary.mutationEnabled !== false) issues.push("mutationEnabled must be false");
  if (summary.productionWiring !== "disabled") issues.push("productionWiring must be disabled");
  if (summary.productionStatus !== "no-go-for-production") issues.push("productionStatus must be no-go-for-production");
  if (/(password|token|cookie|api[_-]?key|private[_-]?key)\s*[:=]/i.test(body)) issues.push("secret-like assignment detected");
  if (/https?:\/\/(?!localhost\b|127\.0\.0\.1\b|json-schema\.org\b|production\.example\.com\b|api\.example\.com\b|live\.example\.com\b|example\.com\b)/i.test(body)) issues.push("unexpected external endpoint detected");
  if (/[A-Za-z]:\\Users\\|\/home\//i.test(body)) issues.push("absolute machine path detected");
  return issues;
}

for (const args of commands) {
  const result = spawnSync(nodeExe, args, { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Operator daily workflow command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
}

const summary = JSON.parse(await readFile(resolve(repoRoot, "apps/dashboard/data/generated/operator-daily-summary.json"), "utf8"));
const issues = assertSafeSummary(summary);
if (issues.length) {
  console.error("OpenClaw operator daily workflow failed.");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log("OpenClaw operator daily workflow passed.");
