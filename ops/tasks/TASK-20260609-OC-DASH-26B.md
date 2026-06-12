---
task_id: TASK-20260609-OC-DASH-26B
title: OpenClaw Dashboard Local OpenClaw Connector Activation Assistant
status: completed
scope: local-only-readonly-connector-activation
production_status: no-go-for-production
---

# Summary

Sprint 26B adds a local-only activation assistant for the Sprint 26A read-only connector.

# Acceptance Criteria

- Activation assistant module exists.
- Setup script and PowerShell helper exist.
- Activation validator generates `apps/dashboard/data/generated/local-openclaw-activation-report.json`.
- Local export template/example exist.
- Real local connector config and export files are ignored and not committed.
- Unsafe external URLs and secret-like URLs are rejected.
- Production, mutation, restart, deploy, auth, and gateway remain disabled.

# Execution Plan

1. Add activation assistant module.
2. Add safe setup scripts.
3. Add activation validation report.
4. Add local export template support.
5. Integrate UI, RC reports, quality gate, safety scan, and verifier.
6. Run tests and browser smoke.

# Execution History

- Implemented local activation assistant and reports.
- Added setup helper for localhost endpoint or repo-local export file.
- Verified local export support with temporary ignored local files, then removed them.

# Files Changed

See Sprint 26B commit.

# Commands Executed

See final response.

# Test Results

All required checks passed before commit.

# Risk Notes

Real local endpoint is still operator-provided. If no endpoint is known, use local export file mode.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-26B/README.md`
- `docs/dashboard/openclaw-dashboard-local-openclaw-activation-assistant.md`

# Safety Notes

No secrets, no env files, no auth headers, no credentials include, no external API, no Production Gateway, no mutation, no restart, and no deploy.

# Reviewer Notes

Reviewer to confirm local-only config and export files remain untracked.
