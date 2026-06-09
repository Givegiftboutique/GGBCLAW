---
task_id: TASK-20260609-OC-DASH-11A
title: OpenClaw Dashboard Auth / RBAC Stub and Safe Review Action Draft
status: verified
created_at: 2026-06-09
updated_at: 2026-06-09
scope: local dashboard scaffold
safety_mode: read-only
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 11A adds local RBAC simulation and safe action draft previews. It does not add real sign-in wiring, credential handling, browser session handling, production gateway calls, or mutation endpoints.

# Acceptance Criteria

- [x] RBAC model files exist.
- [x] Roles include viewer, operator, reviewer, admin, and audit-only.
- [x] Permission matrix exists.
- [x] No real mutation permissions are granted.
- [x] Simulated role UI exists and is memory-only.
- [x] RBAC route shows role and permission matrix.
- [x] Action draft model files exist.
- [x] Review decision draft generation exists.
- [x] Backup verification draft generation exists.
- [x] Settings change request draft generation exists.
- [x] Draft preview shows JSON safety flags.
- [x] Generated action draft sample exists.
- [x] RBAC policy tests pass.
- [x] Action draft tests pass.
- [x] Quality gate includes RBAC and action draft tests.
- [x] Safety scan and verifier updated.

# Execution Plan

1. Add RBAC role, permission, policy, and memory-only state modules.
2. Add action draft type, builder, validation, and store modules.
3. Add draft preview UI to Reviews, Backups, and Settings.
4. Add role simulation and role matrix UI to RBAC and Settings.
5. Add local scripts for policy tests, draft sample generation, and draft tests.
6. Update quality gate, safety scan, verifier, docs, manual smoke tests, and phase log.

# Execution History

- Git preflight attempted in PowerShell, but Git was unavailable on shell path.
- Added read-only RBAC stub and safe action draft modules.
- Generated `apps/dashboard/data/generated/action-drafts.sample.json`.
- Updated Dashboard routes with simulated-only and draft-only markers.

# Files Changed

- `apps/dashboard/index.html`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/src/lib/rbac/*`
- `apps/dashboard/src/lib/action-drafts/*`
- `apps/dashboard/scripts/test-rbac-policy.mjs`
- `apps/dashboard/scripts/generate-action-draft-samples.mjs`
- `apps/dashboard/scripts/test-action-drafts.mjs`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `docs/dashboard/openclaw-dashboard-rbac.md`
- `docs/dashboard/openclaw-dashboard-action-drafts.md`
- Supporting README, runbook, troubleshooting, release checklist, roadmap, phase log, and manual smoke test updates.

# Commands Executed

```bash
node apps/dashboard/scripts/test-rbac-policy.mjs
node apps/dashboard/scripts/generate-action-draft-samples.mjs
node apps/dashboard/scripts/test-action-drafts.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

# Test Results

- `node apps/dashboard/scripts/test-rbac-policy.mjs`: passed.
- `node apps/dashboard/scripts/generate-action-draft-samples.mjs`: passed.
- `node apps/dashboard/scripts/test-action-drafts.mjs`: passed.
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`: passed.
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`: passed.
- `node apps/dashboard/verify-dashboard.mjs`: passed.
- Manual browser acceptance: passed for RBAC, Reviews, Backups, Settings, and Runbook routes.

# Risk Notes

- Git is unavailable in the current PowerShell PATH. Manual Git review must be run in Git Bash or VS Code terminal before commit.
- Role state is simulated and memory-only.
- Drafts are not submitted and do not write from browser.
- No deploy, CI, production API, production gateway, secret, credential, browser session, or mutation work is included.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-11A/README.md`
- `apps/dashboard/data/generated/action-drafts.sample.json`

# RBAC Notes

Roles: viewer, operator, reviewer, admin, audit-only.

Forbidden non-goal permissions are documented but never granted.

# Action Draft Notes

Drafts require `dryRun: true`, `mutationEnabled: false`, `productionWiring: disabled`, `requiresHumanApproval: true`, and `notSubmitted: true`.

# Reviewer Notes

_Pending human review._
