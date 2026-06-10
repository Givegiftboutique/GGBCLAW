# OpenClaw Dashboard Repo Hygiene

Task: `TASK-20260609-OC-DASH-FINAL-BETA-AUDIT`

## Purpose

Keep the internal operator beta commit review clean and reversible.

## Required Checks

- Root should only contain expected repository files and folders.
- Check `git status --short`.
- Check root odd files before staging.
- Check no `.env` file is included.
- Check no secrets are present.
- Check no production endpoints are present.
- Check no generated large bundles are under `apps/dashboard/release/`.
- Check no GitHub Actions / CI files were added.
- Check release tags before creating the final beta tag.
- Run quality gates and safety scan before commit.

## Git Staging Rules

Do not commit odd root-level command artifacts.

Do not use git add .

Use precision git add paths.

Example:

```bash
git add apps/dashboard/scripts/generate-final-beta-audit.mjs
git add apps/dashboard/scripts/verify-final-beta.mjs
git add apps/dashboard/data/generated/final-beta-audit-report.json
git add docs/dashboard/README.md
git add docs/dashboard/openclaw-dashboard-repo-hygiene.md
git add docs/dashboard/openclaw-dashboard-operator-handoff.md
git add ops/tasks/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT.md
git add artifacts/TASK-20260609-OC-DASH-FINAL-BETA-AUDIT/README.md
```

Then review:

```bash
git status --short
git diff --stat
git diff --name-only
```

## Final Beta Tag Guidance

Suggested tag:

```text
v0.1.0-beta
```

Only create the tag after final beta verification, manual browser acceptance, and human Git review.

## Safety Boundary

Production remains no-go. Do not add production API, production Gateway, mutation endpoint, deploy workflow, CI, secrets, auth token handling, cookie handling, or external alert delivery.
