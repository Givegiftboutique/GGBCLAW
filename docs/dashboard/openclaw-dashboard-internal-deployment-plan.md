# OpenClaw Dashboard Internal Deployment Plan

Task: `TASK-20260609-OC-DASH-12A`

## Purpose

Define a safe internal handoff plan for the static read-only OpenClaw Dashboard. This plan prepares release metadata and operator verification steps only. It does not perform production deployment.

## Supported Deployment Modes

- Local operator machine using `python -m http.server 5173`.
- Internal static server after manual review.
- Private LAN static hosting for trusted operators.
- Demo-only GitHub Pages is possible for non-sensitive examples, but it is not recommended for sensitive data.

## Not Supported

- Public production hosting.
- Live production Gateway.
- Mutation endpoints.
- Secrets in frontend files.
- Production deploy workflow.
- GitHub Actions or CI.
- Real login, auth token, or browser session handling.

## Local Release Bundle Process

Run from the repository root:

```bash
node apps/dashboard/scripts/generate-release-manifest.mjs
node apps/dashboard/scripts/create-local-release-bundle.mjs
node apps/dashboard/scripts/verify-local-release.mjs
```

Generated records:

- `apps/dashboard/data/generated/release-manifest.json`
- `apps/dashboard/release/local-release-index.json`

The release folder records a small local index only. Do not commit large generated build bundles or zipped release files.

## Manual Browser Verification

Open:

```text
http://localhost:5173/?source=local-ingest#/dashboard
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
```

Confirm Release / Health panel markers, read-only status, production wiring disabled, rollback tag suggestion, and disabled deploy controls.

## Security Guardrails

- No production deploy.
- No production API or Gateway.
- No mutation endpoint.
- No secrets in frontend.
- No Authorization header.
- No credentials include.
- No real auth token or browser session handling.
- No active approve, reject, backup, restore, or settings update.

## Rollback Using Git Tags

Recommended tag pattern:

```text
sprint-12a-internal-release-workflow
```

Manual rollback command:

```bash
git checkout <tag>
```

Run this only in Git Bash or another terminal where Git is available.

## Operator Handoff

Hand off:

- Release manifest.
- Local release index.
- Observability report.
- Production readiness report.
- Quality gate report.
- Safety scan report.
- Manual browser test notes.
- Suggested rollback tag.

## Production Readiness Gate

Before any production discussion, review:

- `apps/dashboard/data/generated/observability-report.json`
- `apps/dashboard/data/generated/production-readiness-report.json`

Sprint 14A keeps `productionDeploy: false` and `recommendation: no-go-for-production`. Internal operator beta can continue only as a reviewed read-only workflow.
