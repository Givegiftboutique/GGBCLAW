---
task_id: TASK-20260609-OC-DASH-26A
title: OpenClaw Dashboard Local OpenClaw Read-only Connector MVP
status: completed
scope: local-only-readonly-connector
production_status: no-go-for-production
---

# Summary

Sprint 26A adds a local-only read-only OpenClaw connector MVP. The connector accepts only localhost / 127.0.0.1, only GET, and never uses ????????????mutation, restart, deploy, or production Gateway wiring.

# Acceptance Criteria

- Local connector module exists.
- Local config template/example exists.
- Real local config is ignored and not committed.
- Connector runner generates `apps/dashboard/data/generated/local-openclaw-connector-report.json`.
- Dashboard shows "本機 OpenClaw 連接".
- Hourly refresh watches the connector report.
- RC audit and quality gate include the connector.
- Production remains no-go-for-production.

# Execution Plan

1. Add safe local connector config templates.
2. Add connector validation/mapping helpers.
3. Add connector runner and generated report.
4. Integrate UI, refresh, RC reports, quality gate, safety scan, and verifier.
5. Run checks and browser smoke.

# Execution History

- Added the connector module and runner.
- Added report generation for missing local config as `not-connected` / `needs-local-config`.
- Integrated connector status into operator console, Agents, Tasks, Settings, and Help views.
- Added quality, safety, and verifier coverage.

# Files Changed

See sprint commit for the full file list.

# Commands Executed

Recorded in the final sprint response.

# Test Results

Recorded in the final sprint response.

# Risk Notes

- If local OpenClaw has no read-only endpoint or export file, the connector stays `not-connected`.
- This sprint does not define production Gateway wiring.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-26A/README.md`
- `apps/dashboard/data/generated/local-openclaw-connector-report.json`

# Safety Notes

- No production API/Gateway.
- No sensitive sign-in material use.
- No mutation/restart/deploy.
- No endpoint input.
- Real `local-openclaw-connector.json` remains local-only.

# Reviewer Notes

Reviewer placeholder.
