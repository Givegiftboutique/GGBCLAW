---
task_id: TASK-20260609-OC-DASH-12A
title: OpenClaw Dashboard Internal Deployment Plan and Operator Release Workflow
status: verified
created_at: 2026-06-09
updated_at: 2026-06-09
scope: local release workflow
safety_mode: read-only
mutation_enabled: false
production_wiring: disabled
---

# Summary

Sprint 12A adds local static release metadata, an operator release workflow, a release manifest, a local release index, a release verification script, and a read-only Release / Health panel. It does not deploy anything.

# Acceptance Criteria

- [x] Release manifest generator exists.
- [x] Local release bundle script exists.
- [x] Release verification script exists.
- [x] Release manifest generated.
- [x] Local release index generated.
- [x] Quality gate references release steps.
- [x] Release / Health panel visible.
- [x] Internal deployment plan doc exists.
- [x] Operator release workflow doc exists.
- [x] Safety scan and verifier updated.
- [x] Final command rerun complete.
- [x] Manual browser acceptance complete.

# Execution Plan

1. Add local release folder and README.
2. Add release manifest generator.
3. Add local release index generator.
4. Add local release verification script.
5. Add Release / Health panel.
6. Update quality gate, safety scan, verifier, docs, task memory, and artifacts.
7. Run required commands and browser acceptance.

# Execution History

- Git preflight attempted in PowerShell; Git was unavailable on shell path.
- Added local release manifest and release index scripts.
- Added local release verification script.
- Added read-only Release / Health panel to Dashboard UI.

# Files Changed

- `apps/dashboard/release/README.md`
- `apps/dashboard/scripts/generate-release-manifest.mjs`
- `apps/dashboard/scripts/create-local-release-bundle.mjs`
- `apps/dashboard/scripts/verify-local-release.mjs`
- `apps/dashboard/src/app.js`
- `apps/dashboard/src/styles.css`
- `apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `apps/dashboard/verify-dashboard.mjs`
- `docs/dashboard/openclaw-dashboard-internal-deployment-plan.md`
- `docs/dashboard/openclaw-dashboard-operator-release-workflow.md`

# Commands Executed

```bash
node apps/dashboard/scripts/generate-release-manifest.mjs
node apps/dashboard/scripts/create-local-release-bundle.mjs
node apps/dashboard/scripts/verify-local-release.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

# Test Results

- Release manifest generation: passed.
- Local release index generation: passed.
- Local release verification: passed.
- Quality gate: passed.
- Safety scan: passed.
- Verifier: passed.
- Browser manual acceptance: passed for Overview, Settings, and Runbook release panels.

# Risk Notes

- Git is unavailable in the current PowerShell PATH; manual Git review is required in Git Bash or VS Code terminal.
- The release folder must not be used for large generated build bundles.
- No production deploy, production Gateway, production API, mutation endpoint, secret, auth token, browser session handling, deploy workflow, CI, or new dependency is included.

# Artifact Refs

- `artifacts/TASK-20260609-OC-DASH-12A/README.md`
- `apps/dashboard/data/generated/release-manifest.json`
- `apps/dashboard/release/local-release-index.json`

# Release Manifest Notes

Manifest records static-read-only mode, read-only safety mode, mutationEnabled false, production wiring disabled, supported local sources, quality report paths, and rollback guidance.

# Deployment Plan Notes

Deployment plan covers local operator machine, internal static server, private LAN static hosting, and demo-only GitHub Pages as not recommended for sensitive data.

# Rollback Notes

Suggested tag pattern: `sprint-12a-internal-release-workflow`.

# Reviewer Notes

_Pending human review._
