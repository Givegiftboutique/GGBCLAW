# OpenClaw Dashboard Release Checklist

Task: `TASK-20260609-OC-DASH-006`

Use this checklist before a manual commit of the Phase 01 through Phase 06 dashboard scaffold.

## Local Verification

- [ ] Open `http://localhost:5173/`.
- [ ] Confirm sidebar navigation shows Overview, Agents, Tasks, Reviews, Logs, Backups, Settings, RBAC, and Runbook.
- [ ] Confirm `#/dashboard/help` renders the Operator runbook page.
- [ ] Confirm `http://localhost:5173/?source=gateway-stub` renders with Data source `gateway-stub`.
- [ ] Confirm source status, safety mode, quality gate status, and Import / Export Contract are visible.
- [ ] Confirm Production wiring displays disabled.
- [ ] Confirm Reviews controls are disabled or mock-only.
- [ ] Confirm Backups show evidence chain only.
- [ ] Confirm Settings clearly says read-only and production mutation disabled.
- [ ] Confirm browser console has no red errors.

## Commands

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
node apps/dashboard/scripts/test-gateway-contract.mjs
node apps/dashboard/scripts/diff-gateway-fixtures.mjs
node apps/dashboard/scripts/test-local-ingest.mjs
node apps/dashboard/scripts/test-dev-gateway-config.mjs
node --check apps/dashboard/src/app.js
node --check apps/dashboard/src/lib/mock-data.js
```

## Gateway Baseline

- [ ] Review `apps/dashboard/data/generated/gateway-fixture-diff-report.json`.
- [ ] Confirm gateway fixture diff passes.
- [ ] Confirm baseline was not regenerated just to hide a breaking change.
- [ ] Regenerate baseline only for intentional gateway contract fixture updates.
- [ ] Confirm local-ingest source renders.
- [ ] Confirm dev-gateway missing baseUrl falls back safely.
- [ ] Confirm production-like dev gateway URL is blocked.

## Git Hygiene

- [ ] Review `git status`.
- [ ] Review `git diff --stat`.
- [ ] Review `git diff --name-only`.
- [ ] Do not commit junk root files.
- [ ] Do not include secrets, production config, deploy workflow changes, or unrelated cleanup.

Suggested commit message:

```text
docs(dashboard): add operator runbook and UX polish
```
