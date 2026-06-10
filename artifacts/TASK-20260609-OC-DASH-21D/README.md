# TASK-20260609-OC-DASH-21D Artifacts

Sprint 21D adds operator source selection lockdown.

## Generated Reports

- `apps/dashboard/data/generated/operator-source-lockdown-report.json`
- `apps/dashboard/data/generated/operator-source-selection-checklist.json`

## Recommended Operator URL

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

## Safety Notes

- `mock` and `gateway-stub` remain fixture/demo sources only.
- Production remains `no-go-for-production`.
- No production gateway, mutation, auth/token/cookie handling, deploy/CI, or external notification delivery was added.
