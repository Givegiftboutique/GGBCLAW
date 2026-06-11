# OpenClaw Dashboard Local Agent Health

## Purpose

Sprint 22A adds local real agent health as a local-only, read-only review layer for the current single-agent operator truth candidate.

This is not a production gateway integration. It does not restart, stop, start, repair, or mutate any agent.

## Local-only health source

The local health input contract lives at:

```text
apps/dashboard/data/local-agent-health/local-agent-health.sample.json
```

The generated report path is:

```text
apps/dashboard/data/generated/local-real-agent-health-report.json
```

The operator checklist path is:

```text
apps/dashboard/data/generated/operator-agent-health-checklist.json
```

The health source must remain `local-file-only`.

## Expected real agent count = 1

The report aligns to:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

expected real agent count = 1.

## Health statuses

- `online`: heartbeat is fresh in the reviewed local file.
- `stale`: heartbeat is present but old.
- `unknown`: heartbeat is missing or cannot be judged.
- `review-required`: the local file requires operator review before trusting the status.

## Commands

```bash
node apps/dashboard/scripts/generate-local-real-agent-health-report.mjs
node apps/dashboard/scripts/generate-operator-agent-health-checklist.mjs
node apps/dashboard/scripts/test-local-real-agent-health.mjs
```

## No restart

Blocked actions:

- `restart-agent`
- `stop-agent`
- `start-agent`
- `production-gateway-connect`
- `mutation`

If health is `unknown` or `stale`, use the manual operator runbook outside the Dashboard. Do not add a restart button.

## Relationship to fixtures

`mock` and `gateway-stub` remain fixture/demo sources only. They must not be used as health truth.

## Production still no-go

production still no-go. Safety mode remains `read-only`, `mutationEnabled` remains false, and `productionWiring` remains disabled.
