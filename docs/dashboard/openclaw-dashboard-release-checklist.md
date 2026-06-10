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
- [ ] Confirm `#/dashboard/rbac` shows role matrix and permission matrix.
- [ ] Confirm simulated role switching is memory-only and no browser storage/cookie write occurs.
- [ ] Confirm Reviews can generate draft preview but do not submit approve/reject.
- [ ] Confirm Backups can generate verification draft but do not run backup/restore.
- [ ] Confirm Settings can generate change request draft but do not update settings.
- [ ] Confirm draft JSON shows dryRun true, mutationEnabled false, productionWiring disabled, requiresHumanApproval true, and notSubmitted true.

## Sprint 11A Commands

```bash
node apps/dashboard/scripts/test-rbac-policy.mjs
node apps/dashboard/scripts/generate-action-draft-samples.mjs
node apps/dashboard/scripts/test-action-drafts.mjs
```

## Sprint 12A Local Release Workflow

- [ ] Run `node apps/dashboard/scripts/generate-release-manifest.mjs`.
- [ ] Run `node apps/dashboard/scripts/create-local-release-bundle.mjs`.
- [ ] Run `node apps/dashboard/scripts/verify-local-release.mjs`.
- [ ] Confirm `apps/dashboard/data/generated/release-manifest.json` exists.
- [ ] Confirm `apps/dashboard/release/local-release-index.json` exists.
- [ ] Confirm Release / Health panel is visible on Overview, Settings, and Runbook.
- [ ] Confirm deploy controls are disabled.
- [ ] Confirm rollback tag suggestion is `sprint-12a-internal-release-workflow`.
- [ ] Confirm no production deploy, GitHub Actions, CI, production Gateway, production API, or mutation endpoint was added.

## Sprint 14A Observability and Readiness

- [ ] Run `node apps/dashboard/scripts/generate-observability-report.mjs`.
- [ ] Run `node apps/dashboard/scripts/test-observability.mjs`.
- [ ] Run `node apps/dashboard/scripts/generate-production-readiness-report.mjs`.
- [ ] Run `node apps/dashboard/scripts/test-production-readiness.mjs`.
- [ ] Confirm `apps/dashboard/data/generated/observability-report.json` exists.
- [ ] Confirm `apps/dashboard/data/generated/production-readiness-report.json` exists.
- [ ] Open `http://localhost:5173/?source=gateway-stub#/dashboard/observability`.
- [ ] Confirm notification mode local-preview-only and notificationSent false.
- [ ] Confirm production deploy false and recommendation no-go-for-production.
- [ ] Confirm no webhook, email, Slack, SMS, production deploy, production Gateway, production API, mutation endpoint, or auth/token/cookie handling was added.

## Final Beta Audit

- [ ] Run `node apps/dashboard/scripts/generate-final-beta-audit.mjs`.
- [ ] Run `node apps/dashboard/scripts/verify-final-beta.mjs`.
- [ ] Confirm `apps/dashboard/data/generated/final-beta-audit-report.json` exists.
- [ ] Confirm app README says Internal Operator Beta.
- [ ] Confirm `docs/dashboard/README.md` exists.
- [ ] Confirm repo hygiene and operator handoff docs exist.
- [ ] Confirm final beta report says internal-beta-ready.
- [ ] Confirm production status remains no-go-for-production.
- [ ] Confirm suggested final beta tag is `v0.1.0-beta`.

## Sprint 15A Real Local Data Pilot

- [ ] Run `node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs`.
- [ ] Run `node apps/dashboard/scripts/test-real-local-data-pilot.mjs`.
- [ ] Confirm `apps/dashboard/data/generated/real-local-dashboard-export.generated.json` exists.
- [ ] Open `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json`.
- [ ] Confirm Real Local Data Pilot markers, absolute paths redacted, secrets redacted, production endpoints blocked, safety mode read-only, mutation enabled false, and production wiring disabled.

## Sprint 19A Security / Privacy / Retention Audit

- [ ] Run `node apps/dashboard/scripts/generate-security-privacy-audit.mjs`.
- [ ] Run `node apps/dashboard/scripts/test-generated-report-sanitization.mjs`.
- [ ] Run `node apps/dashboard/scripts/generate-data-retention-review.mjs`.
- [ ] Run `node apps/dashboard/scripts/generate-operator-security-checklist.mjs`.
- [ ] Run `node apps/dashboard/scripts/test-security-privacy-audit.mjs`.
- [ ] Confirm `apps/dashboard/data/generated/security-privacy-audit-report.json` exists.
- [ ] Confirm `apps/dashboard/data/generated/data-retention-review-report.json` exists.
- [ ] Confirm `apps/dashboard/data/generated/operator-security-checklist.json` exists.
- [ ] Confirm generated reports do not expose secrets, private data, production endpoints, or absolute machine paths.
- [ ] Confirm retention status is `draft-for-internal-review`.
- [ ] Confirm this is not legal compliance certification and production remains `no-go-for-production`.

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
