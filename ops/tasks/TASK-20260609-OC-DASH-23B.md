---
task_id: TASK-20260609-OC-DASH-23B
title: OpenClaw Dashboard Daily Operator Runbook Mode
status: completed
created_at: 2026-06-11
scope: dashboard
safety_mode: read-only
production_status: no-go-for-production
---

# Summary

Sprint 23B adds Daily Operator Runbook Mode so non-engineering operators can see today's status, status reasons, safe next steps, and blocked actions after opening the Dashboard.

# Acceptance Criteria

- Daily operator runbook module exists.
- Daily Runbook panel is visible.
- Daily summary report is generated.
- Daily runbook checklist is generated.
- Daily runbook test passes.
- Local-ingest remains recommended daily source.
- Expected and actual real agent count remain 1.
- Mock and gateway-stub remain fixture mode, not daily truth.
- Restart, mutation, production gateway, and deploy remain blocked.
- Production remains `no-go-for-production`.

# Execution Plan

1. Add daily operator runbook module.
2. Add daily summary and runbook checklist generators.
3. Add UI Daily Runbook panel.
4. Add tests, quality gate, safety scan, and verifier coverage.
5. Add docs and manual smoke test updates.
6. Run final checks and Git closeout.

# Execution History

- Added Daily Runbook helper module and TypeScript declarations.
- Added daily summary report generator.
- Added daily runbook checklist generator.
- Added Daily Runbook panel to Overview, Agents, Settings, Observability, and Help.
- Added test and verification coverage.
- Added operator docs and task artifacts.

# Files Changed

- `apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.js`
- `apps/dashboard/src/lib/operator-runbook/daily-operator-runbook.ts`
- `apps/dashboard/scripts/generate-daily-operator-summary-report.mjs`
- `apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs`
- `apps/dashboard/scripts/test-daily-operator-runbook.mjs`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/src/lib/i18n/zh-hant.js`
- `apps/dashboard/index.html`
- docs and generated reports listed in artifact refs

# Commands Executed

- `node apps/dashboard/scripts/generate-daily-operator-summary-report.mjs`
- `node apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs`
- `node apps/dashboard/scripts/test-daily-operator-runbook.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`

# Test Results

Final command results are recorded in the sprint closeout response.

# Risk Notes

- Health or evidence fallback can legitimately produce `Review Required`.
- `mock` and `gateway-stub` remain useful fixtures but must never be treated as daily truth.
- Production remains no-go and is not connected.

# Artifact Refs

- `apps/dashboard/data/generated/daily-operator-summary-report.json`
- `apps/dashboard/data/generated/daily-operator-runbook-checklist.json`
- `docs/dashboard/openclaw-dashboard-daily-operator-runbook-mode.md`
- `artifacts/TASK-20260609-OC-DASH-23B/README.md`

# Daily Runbook Notes

Statuses are `ok`, `review-required`, `blocked`, `fixture-mode`, and `unknown`. UI labels present them as OK, Review Required, Blocked, Fixture Mode, and Unknown.

# Safe Next Step Notes

Safe next steps are read-only actions: open recommended operator view, review local health checklist, review evidence checklist, inspect sanitized reviewed JSON example, and read troubleshooting.

# Blocked Action Notes

Blocked actions include restart-agent, stop-agent, start-agent, production-gateway-connect, mutation, deploy, and auth/token/secrets handling.

# Safety Notes

No production API/Gateway, mutation endpoint, restart/stop/start action, deploy/CI, secrets, token/cookie/auth handling, source mode change, or route hash change was added.

# Reviewer Notes

- Reviewer:
- Review date:
- Notes:
