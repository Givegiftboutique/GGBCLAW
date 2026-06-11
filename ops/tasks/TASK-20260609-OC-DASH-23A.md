---
task_id: TASK-20260609-OC-DASH-23A
title: OpenClaw Dashboard Operator Usability MVP
status: completed
created: 2026-06-11
scope: dashboard
safety_mode: read-only
production_status: no-go-for-production
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 23A adds an operator home / command center, a Windows local launch script, a daily usability checklist, and an operator troubleshooting report.

# Acceptance Criteria

- Operator Home is visible.
- Recommended single-agent `local-ingest` URL is visible.
- Default `/` does not silently imply mock truth.
- Launch script starts a local static preview or gives a clear local error.
- Daily usability checklist and troubleshooting report are generated.
- Production remains `no-go-for-production`.
- Restart, mutation, and production gateway remain disabled.

# Execution Plan

1. Add operator usability config.
2. Add Operator Home UI and troubleshooting panel.
3. Add local PowerShell launch script.
4. Add checklist and troubleshooting generators.
5. Add tests, quality gate, safety scan, and verifier coverage.
6. Update docs and smoke tests.

# Execution History

- Added `operator-usability` helper module.
- Added `start-operator-dashboard.ps1`.
- Added generated operator usability reports.
- Updated Dashboard UI, docs, safety scan, verifier, and quality gate.

# Files Changed

- `apps/dashboard/src/lib/operator-usability/operator-usability.js`
- `apps/dashboard/src/lib/operator-usability/operator-usability.ts`
- `apps/dashboard/scripts/start-operator-dashboard.ps1`
- `apps/dashboard/scripts/generate-operator-daily-usability-checklist.mjs`
- `apps/dashboard/scripts/generate-operator-usability-troubleshooting-report.mjs`
- `apps/dashboard/scripts/test-operator-usability-mvp.mjs`
- `docs/dashboard/openclaw-dashboard-operator-usability-mvp.md`

# Commands Executed

See final Sprint 23A closeout notes.

# Test Results

Pending final closeout at time of task note creation.

# Risk Notes

- The launch script is local-only and uses localhost static preview.
- `mock` and `gateway-stub` remain available but explicitly marked fixture-only.
- Production remains blocked.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-23A/README.md`

# Operator Usability Notes

Recommended daily URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

# Launch Script Notes

The PowerShell script does not read `.env`, does not use secrets, does not connect to production, and does not restart agents.

# Troubleshooting Notes

If 8 agents appear, the operator is in fixture/demo mode and should open the recommended URL.

# Blocked Action Notes

- restart-agent
- stop-agent
- start-agent
- mutation
- production-gateway-connect
- deploy

# Safety Notes

Production is `no-go-for-production`; mutation is disabled; production wiring is disabled.

# Reviewer Notes

Manual reviewer notes placeholder.

