---
task_id: TASK-20260609-OC-DASH-21B
title: OpenClaw Dashboard Fixture Quarantine and Single Agent Truth Alignment
status: completed
scope: internal-operator-use
production_status: no-go-for-production
safety_mode: read-only
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 21B separates fixture/demo data from operator truth. Mock and gateway-stub data are retained for lifecycle and contract tests, but the UI, reports, and docs now label them as fixtures only. Local ingest is treated as an operator truth candidate with expected real agent count 1.

# Acceptance Criteria

- [x] Source trust module exists.
- [x] Mock classified as `fixture-demo`.
- [x] Gateway-stub classified as `fixture-contract`.
- [x] Local-ingest classified as `operator-truth-candidate`.
- [x] Single-agent truth report generated.
- [x] Fixture quarantine report generated.
- [x] Expected real agent count is 1.
- [x] Fixture agent count remains 8 for lifecycle tests.
- [x] Mock and gateway-stub are not operator truth.
- [x] UI warning markers added.
- [x] Quality gate, safety scan, and verifier updated.
- [x] Production remains no-go.

# Execution Plan

1. Add source trust classification.
2. Generate single-agent truth and fixture quarantine reports.
3. Add fixture quarantine tests.
4. Add UI trust warnings.
5. Update quality gate, safety scan, verifier, docs, and task memory.
6. Run local checks and manual browser review.

# Execution History

- Added data trust module for all existing source modes without changing source mode values.
- Added local report generators and quarantine tests.
- Added UI panels for Data trust / 資料可信分類.
- Added docs for fixture quarantine and single-agent truth.

# Files Changed

- `apps/dashboard/src/lib/data-trust/source-trust.js`
- `apps/dashboard/src/lib/data-trust/source-trust.ts`
- `apps/dashboard/scripts/generate-single-agent-truth-report.mjs`
- `apps/dashboard/scripts/generate-fixture-quarantine-report.mjs`
- `apps/dashboard/scripts/test-fixture-quarantine.mjs`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/src/lib/i18n/zh-hant.js`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- dashboard docs and generated reports

# Commands Executed

See final completion report for exact command results.

# Test Results

Pending final verification at time of task memory creation.

# Risk Notes

The current real local snapshot may contain a count other than 1. Sprint 21B does not edit that data automatically; it reports warning/fail follow-up instead.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-21B/README.md`
- `apps/dashboard/data/generated/single-agent-truth-report.json`
- `apps/dashboard/data/generated/fixture-quarantine-report.json`

# Fixture Quarantine Notes

8 agents are fixture only and must not be interpreted as real operator inventory.

# Single-Agent Truth Notes

The current real operator environment is expected to have 1 real agent. Local ingest is a truth candidate only after validation and human review.

# Production Blocker Notes

Fixture Quarantine + Single Agent Truth Alignment is required before any read-only production gateway implementation.

# Safety Notes

No production gateway, production API, mutation endpoint, deploy workflow, secrets, auth/token/cookie handling, or external notification delivery is in scope.

# Reviewer Notes

Reviewer:

Decision:

Notes:
