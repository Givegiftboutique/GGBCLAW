# OpenClaw Dashboard Operator Source Selection

This page documents the Sprint 21D operator source selection lockdown.

recommended operator URL
mock/gateway-stub high warning
single-agent truth candidate
production still no-go

## Purpose

The operator-safe view is the single-agent local-ingest snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Use this URL when reviewing the current operator truth candidate.

## Source Types

- `local-ingest` with `real-local-dashboard-export.single-agent.generated.json`: operator truth candidate, expected real agent count `1`.
- `mock`: demo fixture data only. It may show 8 agents for lifecycle coverage and must not be treated as real inventory.
- `gateway-stub`: contract fixture data only. It may show 8 agents for gateway contract coverage and must not be treated as production agents.
- `json` and `artifact`: review required before operator use.
- `dev-gateway`: dev read-only test only, not operator truth.

## Browser Checklist

- Confirm the source badge before trusting any count.
- Confirm local-ingest single-agent view shows exactly 1 agent.
- If you see 8 agents, treat it as fixture-only.
- Confirm `productionStatus` remains `no-go-for-production`.
- Confirm `safetyMode` remains `read-only`.
- Confirm `mutationEnabled` remains `false`.
- Confirm `productionWiring` remains `disabled`.

## Not Allowed

- No production gateway connection.
- No production API.
- No mutation endpoint.
- No auth, token, cookie, password, API key, or Authorization header.
- No production deploy.

Production still no-go.
## Sprint 22A health source

After source selection, review local real agent health from `apps/dashboard/data/generated/local-real-agent-health-report.json`.
The health source is `local-file-only`, expected real agent count = 1, and production still no-go.
No restart action is available in the Dashboard.
# Sprint 22C Local Health Evidence Review

Use the local health evidence report to confirm reviewed JSON intake status before treating health as operator evidence:

```text
apps/dashboard/data/generated/local-health-evidence-review-report.json
```

Evidence review is local-only and read-only. Raw reviewed JSON values are never printed. Production still no-go; no restart, no mutation, no production gateway.
