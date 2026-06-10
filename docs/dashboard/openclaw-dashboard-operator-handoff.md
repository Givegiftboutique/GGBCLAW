# OpenClaw Dashboard Operator Handoff

Task: `TASK-20260609-OC-DASH-FINAL-BETA-AUDIT`

## What This Dashboard Is

OpenClaw Dashboard is an internal operator beta for reviewing local and static OpenClaw operational data. It supports mock, json, artifact, gateway-stub, local-ingest, and dev-gateway source modes.

## What It Is Not

It is not a production console. It does not connect production API or production Gateway, does not submit mutations, does not deploy, does not provide real login, and does not send webhook, email, Slack, or SMS alerts.

## Internal Operator Beta Scope

- Internal operator beta: allowed with review.
- Production: no-go.
- Safety mode: read-only.
- Mutation enabled: false.
- Production wiring: disabled.

## How To Run Locally

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

Recommended browser URLs:

```text
http://localhost:5173/?source=local-ingest#/dashboard
http://localhost:5173/?source=local-ingest#/dashboard/observability
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
```

## Supported Data Sources

- `mock`
- `json`
- `artifact`
- `gateway-stub`
- `local-ingest`
- `dev-gateway`

## Commands

Quality gate:

```bash
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

Safety scan:

```bash
node apps/dashboard/scripts/safety-scan-dashboard.mjs
```

Local release verification:

```bash
node apps/dashboard/scripts/verify-local-release.mjs
```

Observability report:

```bash
node apps/dashboard/scripts/generate-observability-report.mjs
```

Production readiness report:

```bash
node apps/dashboard/scripts/generate-production-readiness-report.mjs
```

Final beta verification:

```bash
node apps/dashboard/scripts/generate-final-beta-audit.mjs
node apps/dashboard/scripts/verify-final-beta.mjs
```

## How To Interpret Alerts

Observability alerts are local preview only. Use them to decide which local source, task, agent, backup evidence, quality report, safety scan, or release record needs review. No notification is sent.

## How To Interpret Production No-go

`no-go-for-production` means internal beta can continue with review, but production must not be enabled. It is a blocker state, not a release approval.

## Rollback Using Git Tag

After final beta tag creation, rollback can use:

```bash
git checkout v0.1.0-beta
```

Run Git commands only in Git Bash or another terminal where Git is available.

## Who Should Use This

Operators, reviewers, and maintainers who need local read-only visibility into OpenClaw dashboard artifacts.

## Required Before Production

- real auth design review
- production gateway security review
- secrets management plan
- deployment owner
- rollback owner
- monitoring owner
- incident response plan
- backup restore drill
- operator signoff
