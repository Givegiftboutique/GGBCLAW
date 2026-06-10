# OpenClaw Dashboard Operator Daily Workflow

Task: `TASK-20260609-OC-DASH-17A`

## Purpose

The operator daily workflow is a local-only, read-only routine for reviewing OpenClaw Dashboard Internal Operator Beta health, evidence, alerts, and production no-go status.

No production API, production Gateway, mutation endpoint, deploy, external notification, credentials, auth header, token, cookie, password, or secrets are used.

## Daily Commands

```bash
node apps/dashboard/scripts/run-operator-daily-workflow.mjs
node apps/dashboard/scripts/generate-operator-daily-summary.mjs
node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs
```

Generated reports:

```text
apps/dashboard/data/generated/operator-daily-summary.json
apps/dashboard/data/generated/operator-evidence-manifest.json
```

## Review Daily Summary

Check:

- quality gate status
- safety scan status
- observability critical / warning counts
- readiness recommendation
- real local pilot status
- dev gateway drill status
- known production blockers

Production remains `no-go-for-production`.

## Review Observability Alerts

Use the Observability route:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json#/dashboard/observability
```

Review alert preview locally. Do not send webhook, email, Slack, or SMS from the dashboard.

## Capture Evidence

Run:

```bash
node apps/dashboard/scripts/generate-operator-evidence-manifest.mjs
```

The evidence manifest uses relative paths only. It does not upload, zip, deploy, or notify.

## Safety Caveats

- `safetyMode: read-only`
- `mutationEnabled: false`
- `productionWiring: disabled`
- `productionStatus: no-go-for-production`
- Local evidence only.
- No production and no mutation.
