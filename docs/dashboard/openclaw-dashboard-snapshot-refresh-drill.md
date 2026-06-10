# OpenClaw Dashboard Snapshot Refresh Drill

Task: `TASK-20260609-OC-DASH-15A`

## Purpose

The snapshot refresh drill verifies that local real data can be discovered, sanitized, mapped, and loaded through the existing `local-ingest` source.

## Commands

```bash
node apps/dashboard/scripts/discover-real-local-data.mjs
node apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs
node apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
```

Expected outputs:

- `apps/dashboard/data/generated/real-local-data-discovery-report.json`
- `apps/dashboard/data/generated/real-local-dashboard-export.generated.json`
- `apps/dashboard/data/generated/real-local-data-pilot-report.json`

## Review Pilot Report

Open:

```text
apps/dashboard/data/generated/real-local-data-pilot-report.json
```

Confirm:

- `safetyMode: read-only`
- `mutationEnabled: false`
- `productionWiring: disabled`
- absolute paths redacted
- secrets redacted
- production endpoints blocked

## Browser URL

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

## Rollback

Use the previous reviewed Git tag in Git Bash or another terminal where Git is available. Do not patch a failed drill by enabling production wiring.

## Failure Modes

- Source file exceeds 2MB pilot limit.
- Unsupported file extension.
- Secret-like or hidden file ignored.
- Generated output contains unsafe values.
- Snapshot does not pass dashboard shape validation.

## Safety Guardrails

No production API, production Gateway, mutation endpoint, deploy workflow, CI, auth token handling, cookie handling, external alert delivery, or new dependency is added.
