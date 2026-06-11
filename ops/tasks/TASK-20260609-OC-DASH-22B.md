---
task_id: TASK-20260609-OC-DASH-22B
title: OpenClaw Dashboard Sanitized Local Health JSON Intake
status: completed
scope: internal-operator-local-health
safety_mode: read-only
production_status: no-go-for-production
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 22B adds a sanitized local-only reviewed health JSON intake path for the single real agent health report.

# Acceptance Criteria

- Reviewed local health JSON example exists.
- Reviewed input validator rejects unsafe fields and invalid safety flags.
- Valid reviewed input can set `healthSource = local-reviewed-json`.
- Missing or invalid input falls back to `local-file-only`.
- Secret-like values are not printed in generated reports.
- Production remains `no-go-for-production`; restart, mutation, remote fetch, and production gateway connection remain disabled.

# Execution Plan

1. Add reviewed health JSON contract example.
2. Extend local health module with validator and reviewed-input mapper.
3. Update health report and checklist generators.
4. Add validation tests for valid, missing, invalid, and unsafe reviewed inputs.
5. Update UI, docs, quality gate, safety scan, and verifier.

# Execution History

- Added sanitized reviewed input example under `apps/dashboard/data/local`.
- Updated local health report generation to prefer valid reviewed input and safely fall back on missing or invalid input.
- Added Chinese operator checklist steps for reviewed JSON intake.
- Verified local-only/read-only guardrails with tests, safety scan, and dashboard verifier.

# Files Changed

- `apps/dashboard/src/lib/agent-health/local-agent-health.js`
- `apps/dashboard/scripts/generate-local-real-agent-health-report.mjs`
- `apps/dashboard/scripts/test-local-real-agent-health.mjs`
- `apps/dashboard/data/local/reviewed-local-agent-health.example.json`
- `apps/dashboard/data/generated/local-real-agent-health-report.json`
- `apps/dashboard/data/generated/operator-agent-health-checklist.json`
- `docs/dashboard/openclaw-dashboard-local-agent-health.md`

# Commands Executed

- `node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs`
- `node apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs`
- `node apps/dashboard/scripts/test-local-real-agent-health.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`

# Test Results

All Sprint 22B local health intake tests passed.

# Risk Notes

- The real reviewed input file is optional and local-only.
- Operators must not commit secret-bearing or private health snapshots.
- Unknown/stale/review-required health still needs manual runbook review.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-22B/README.md`

# Local Health Notes

Valid reviewed input must have exactly one local agent and safety flags disabling remote fetch, restart, mutation, and production gateway connection.

# Safety Notes

Dashboard remains read-only. No restart, stop, start, mutation, production gateway, deploy, auth token, cookie, or secret handling was added.

# Reviewer Notes

Reviewer to confirm local reviewed JSON remains sanitized before sharing or committing any operator-provided file.
