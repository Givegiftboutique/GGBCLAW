---
task_id: TASK-20260609-OC-DASH-21D
title: OpenClaw Dashboard Operator Source Selection Lockdown
status: completed
scope: dashboard-internal-operator
production_status: no-go-for-production
safety_mode: read-only
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 21D locks down operator source selection so default entry does not silently imply `mock` is real data. The operator recommended view is the `local-ingest` single-agent snapshot.

# Acceptance Criteria

- Source lockdown module exists.
- Operator source lockdown report generator exists.
- Operator source selection checklist generator exists.
- Operator source lockdown test exists.
- Reports are generated.
- Recommended source is `local-ingest`.
- Recommended data is `real-local-dashboard-export.single-agent.generated.json`.
- `mock` and `gateway-stub` require demo acknowledgement and have `defaultAllowed: false`.
- UI shows recommended source and high fixture warnings.
- Quality gate, safety scan, and verifier cover the lockdown.
- Production remains `no-go-for-production`.

# Execution Plan

1. Add source lockdown policy.
2. Add report and checklist generators.
3. Add source lockdown tests.
4. Update UI warning panels.
5. Update quality gate, safety scan, verifier, docs, task memory, and artifacts.
6. Run local checks and browser acceptance.

# Execution History

- Added source lockdown policy and TypeScript contract.
- Added local report/checklist generation.
- Added source lockdown regression test.
- Updated UI source trust and operator source recommendation panels.
- Updated docs and manual smoke tests.

# Files Changed

- `apps/dashboard/src/lib/data-trust/source-lockdown.js`
- `apps/dashboard/src/lib/data-trust/source-lockdown.ts`
- `apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs`
- `apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs`
- `apps/dashboard/scripts/test-operator-source-lockdown.mjs`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/src/lib/i18n/zh-hant.js`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `docs/dashboard/openclaw-dashboard-operator-source-selection.md`
- `docs/dashboard/openclaw-dashboard-source-lockdown.md`

# Commands Executed

```bash
node apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs
node apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs
node apps/dashboard/scripts/test-operator-source-lockdown.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

# Test Results

Sprint 21D final checks passed: operator source lockdown test, full dashboard quality gate, safety scan, dashboard verifier, syntax checks, and browser acceptance.

# Risk Notes

- `mock` and `gateway-stub` are retained for fixture coverage and must not be interpreted as real inventory.
- The single-agent snapshot is still a candidate and requires operator review.
- Production remains no-go.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-21D/README.md`
- `apps/dashboard/data/generated/operator-source-lockdown-report.json`
- `apps/dashboard/data/generated/operator-source-selection-checklist.json`

# Source Lockdown Notes

Default entry behavior is `operator-safe-notice`. The recommended URL is:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

# Operator Source Selection Notes

If 8 agents are visible, the source is fixture/demo data only. Operator truth review should use the single-agent `local-ingest` snapshot.

# Safety Notes

No production Gateway/API, mutation endpoint, deploy/CI, secrets, auth/token/cookie handling, Authorization header, credentials include, or production-ready status was added.

# Reviewer Notes

Reviewer:
Date:
Notes:
