---
taskId: TASK-20260609-OC-DASH-20A
title: OpenClaw Dashboard v1.0.0 Internal Release Candidate and Sign-off
status: completed
date: 2026-06-10
scope: internal-operator-use
safetyMode: read-only
mutationEnabled: false
productionWiring: disabled
productionStatus: no-go-for-production
releaseCandidate: v1.0.0-internal-rc1
signoffStatus: pending
---

# TASK-20260609-OC-DASH-20A

## Summary

Sprint 20A prepares the OpenClaw Dashboard v1.0.0 internal release candidate and manual sign-off package while keeping production no-go and all read-only guardrails in place.

## Acceptance Criteria

- [x] Internal release candidate generator exists.
- [x] Internal sign-off package generator exists.
- [x] v1 internal verifier exists.
- [x] Internal release candidate tests exist.
- [x] RC report generated.
- [x] Sign-off package generated.
- [x] v1 verifier passes.
- [x] Quality gate includes RC steps.
- [x] Safety scan includes RC files.
- [x] Dashboard verifier passes.
- [x] UI Chinese/bilingual markers added.
- [x] Docs added and README/manual smoke/phase log updated.
- [x] `signoffStatus` remains pending.
- [x] `notApprovedYet` remains true.
- [x] `manualSignoffRequired` remains true.
- [x] Production remains `no-go-for-production`.
- [x] No production deploy, production API/Gateway, mutation endpoint, secrets, auth/token/cookie handling, external notification delivery, deploy/CI, dependency, or absolute machine paths in generated reports.

## Execution Plan

1. Add RC report generator.
2. Add internal sign-off package generator.
3. Add v1 internal verifier and RC tests.
4. Add UI RC panel.
5. Wire quality gate, safety scan, and dashboard verifier.
6. Add docs, task memory, and artifact note.
7. Run required checks and browser acceptance.

## Execution History

- Added RC and sign-off scripts.
- Added generated RC report and sign-off package.
- Added docs for v1 internal RC and internal sign-off.
- Added RC UI panel and quality/safety/verifier integration.
- Ran required local verification commands successfully.
- Git is unavailable in the current PowerShell PATH; manual Git review is required before commit.

## Files Changed

- `apps/dashboard/scripts/generate-internal-release-candidate.mjs`
- `apps/dashboard/scripts/generate-internal-signoff-package.mjs`
- `apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs`
- `apps/dashboard/scripts/test-internal-release-candidate.mjs`
- `apps/dashboard/data/generated/internal-release-candidate-report.json`
- `apps/dashboard/data/generated/internal-signoff-package.json`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/src/lib/i18n/zh-hant.js`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `docs/dashboard/openclaw-dashboard-v1-internal-release-candidate.md`
- `docs/dashboard/openclaw-dashboard-internal-signoff.md`
- `apps/dashboard/README.md`
- `docs/dashboard/README.md`
- `docs/phase-log.md`
- `tests/manual-smoke-tests.md`
- `ops/tasks/TASK-20260609-OC-DASH-20A.md`
- `artifacts/TASK-20260609-OC-DASH-20A/README.md`

## Commands Executed

- `node apps/dashboard/scripts/generate-internal-release-candidate.mjs`
- `node apps/dashboard/scripts/generate-internal-signoff-package.mjs`
- `node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs`
- `node apps/dashboard/scripts/test-internal-release-candidate.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`
- Syntax checks for Sprint 20A scripts and touched dashboard files.

## Test Results

- Initial RC report generation passed.
- Initial sign-off package generation passed.
- v1 internal verification passed.
- Internal release candidate tests passed.
- Quality gate passed.
- Safety scan passed.
- Dashboard verifier passed.
- Manual browser acceptance passed for local-ingest, Settings, Help, and Observability URLs.

## Risk Notes

- This release candidate does not approve production.
- Sign-off placeholders must remain pending until humans review and approve.
- `v1.0.0-internal` tag must be created only after manual sign-off.

## Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-20A/README.md`

## Release Candidate Notes

- Candidate tag: `v1.0.0-internal-rc1`
- Final internal tag after sign-off: `v1.0.0-internal`

## Sign-off Package Notes

- Required reviewers: operator-owner, technical-owner, security-reviewer, business-owner.
- Generated package is not an approval.

## Production Blockers

- real auth design review
- production gateway security review
- secrets management plan
- backup restore drill
- incident response plan
- deployment owner
- rollback owner
- monitoring owner

## Manual Reviewer Notes

- Reviewer should confirm RC panel visibility and verify no sign-off approval button exists.
