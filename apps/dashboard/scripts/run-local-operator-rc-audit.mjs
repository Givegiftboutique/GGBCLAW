import { spawnSync } from "node:child_process";

const steps = [
  ["apps/dashboard/scripts/run-local-openclaw-connector.mjs"],
  ["apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs"],
  ["apps/dashboard/scripts/generate-local-real-agent-health-report.mjs"],
  ["apps/dashboard/scripts/generate-local-health-evidence-review-report.mjs"],
  ["apps/dashboard/scripts/validate-reviewed-local-health-input-dry-run.mjs"],
  ["apps/dashboard/scripts/generate-local-task-inbox-report.mjs"],
  ["apps/dashboard/scripts/generate-whatsapp-task-visibility-checklist.mjs"],
  ["apps/dashboard/scripts/generate-hourly-refresh-policy-report.mjs"],
  ["apps/dashboard/scripts/generate-provider-balance-center-report.mjs"],
  ["apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs", "--distro", "Ubuntu-24.04", "--state-dir", "__WSL_OPENCLAW_STATE_DIR__", "--dry-run"],
  ["apps/dashboard/scripts/generate-daily-operator-summary-report.mjs"],
  ["apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs"],
  ["apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs"],
  ["apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs"],
  ["apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs"],
  ["apps/dashboard/scripts/generate-dashboard-stabilization-audit-report.mjs"],
  ["apps/dashboard/scripts/generate-production-entry-gate-report.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-final-checklist.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-known-risk-register.mjs"],
  ["apps/dashboard/scripts/generate-local-operator-report-index.mjs"]
];

for (const args of steps) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("OpenClaw local operator RC audit completed.");
