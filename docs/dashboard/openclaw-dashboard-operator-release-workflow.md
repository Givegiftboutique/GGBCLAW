# OpenClaw Dashboard Operator Release Workflow

Task: `TASK-20260609-OC-DASH-12A`

## Pre-release Checklist

- Confirm working tree status in Git Bash or VS Code terminal.
- Confirm no odd root-level files are staged.
- Confirm no production API, Gateway, deploy workflow, CI, secret, auth token, or browser session handling was added.
- Confirm Dashboard still renders with supported local sources.

## Quality Gate Command

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

The quality gate includes observability and production readiness checks.

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
node apps/dashboard/scripts/test-observability.mjs
node apps/dashboard/scripts/generate-production-readiness-report.mjs
node apps/dashboard/scripts/test-production-readiness.mjs
```

## Release Manifest Generation

```bash
node apps/dashboard/scripts/generate-release-manifest.mjs
```

Output:

```text
apps/dashboard/data/generated/release-manifest.json
```

## Local Release Verification

```bash
node apps/dashboard/scripts/create-local-release-bundle.mjs
node apps/dashboard/scripts/verify-local-release.mjs
```

Expected:

```text
OpenClaw local dashboard release verification passed.
```

## Manual Browser Test URLs

```text
http://localhost:5173/?source=local-ingest#/dashboard
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
```

Check Release / Health panel, static-read-only mode, safety mode read-only, mutationEnabled false, production wiring disabled, release manifest path, rollback tag suggestion, disabled deploy button, sidebar routes, and no red console errors.

Also open:

```text
http://localhost:5173/?source=gateway-stub#/dashboard/observability
```

Check alert preview counts, local-preview-only notification mode, notificationSent false, production deploy false, recommendation no-go-for-production, and internal-operator-beta status.

## Git Status Review

Run manually if PowerShell cannot find Git:

```bash
git status
git diff --stat
git diff --name-only
```

## Commit / Push / Tag Steps

After human review only:

```bash
git add <reviewed-files>
git commit -m "chore(dashboard): add internal release workflow and local bundle checks"
git push
git tag sprint-12a-internal-release-workflow
git push --tags
```

Do not stage large generated build bundles or unrelated root-level files.

## Rollback Steps

```bash
git checkout <tag>
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

## Incident Notes

If a release handoff fails, keep the failed manifest, release index, quality report, and safety report for review. Do not patch the issue by enabling production wiring.

## Codex Handoff Checklist

- Summarize changed files.
- Record commands and test results.
- Record Git availability.
- Record manual browser acceptance.
- Repeat safety guardrails clearly.
