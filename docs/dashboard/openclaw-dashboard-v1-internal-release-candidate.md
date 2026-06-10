# OpenClaw Dashboard v1.0.0 Internal Release Candidate

Task: `TASK-20260609-OC-DASH-20A`

## Purpose

This document defines the internal release candidate package for OpenClaw Dashboard.

Candidate tag:

```text
v1.0.0-internal-rc1
```

Final internal tag after manual sign-off:

```text
v1.0.0-internal
```

## Scope

The release candidate is for internal operator use only. It confirms the dashboard has local quality gates, safety scan, final beta audit, security/privacy review, data retention draft, operator workflow evidence, internal static hosting dry run, and manual sign-off placeholders.

It does not mean production ready. Production remains:

```text
no-go-for-production
```

## Commands

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
```

## Generated Reports

```text
apps/dashboard/data/generated/internal-release-candidate-report.json
apps/dashboard/data/generated/internal-signoff-package.json
```

Required evidence includes:

- quality gate report
- safety scan report
- final beta audit
- production readiness report
- security privacy audit
- data retention review
- operator security checklist
- operator daily summary
- incident drill report
- evidence manifest
- internal static hosting dry-run report
- operator access checklist
- real local data pilot report
- dev gateway live drill report

## Safety Markers

- `safetyMode: read-only`
- `mutationEnabled: false`
- `productionWiring: disabled`
- `productionStatus: no-go-for-production`
- `manualSignoffRequired: true`
- `signoffStatus: pending`

## Manual Acceptance

Open the dashboard locally and confirm the v1.0.0 Internal Release Candidate panel is visible in Overview, Settings, Help, and Observability.

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
http://localhost:5173/?source=gateway-stub#/dashboard/settings
http://localhost:5173/?source=gateway-stub#/dashboard/help
http://localhost:5173/?source=gateway-stub#/dashboard/observability
```

## Known Blockers Before Production

- real auth design review
- production gateway security review
- secrets management plan
- operator signoff
- backup restore drill
- incident response plan
- deployment owner
- rollback owner
- monitoring owner

## Rollback

Use Git tags only after human Git review:

```bash
git checkout v1.0.0-internal-rc1
```

Run Git commands in Git Bash or VS Code terminal if PowerShell cannot find Git.

## Not Allowed

- do not mark production ready
- do not mark sign-off approved
- do not production deploy
- do not add GitHub Actions / CI
- do not connect production Gateway or production API
- do not add mutation endpoint
- do not add auth token, cookie handling, or credentials
- do not send webhook, email, Slack, or SMS

## Sprint 21A Follow-up

After `v1.0.0-internal`, Sprint 21A adds production track planning only. It does not change the RC or production status.

- Production track status: `planning-only`
- Gateway connection status: `not-connected`
- Readiness status: `not-ready`
- Entry gate status: `blocked`
- Production remains `no-go-for-production`

Additional blocker: Fixture Quarantine + Single Agent Truth Alignment. The current real operator environment is expected to have only 1 real agent, while the 8-agent dataset is mock / fixture / gateway-stub lifecycle test data only.
