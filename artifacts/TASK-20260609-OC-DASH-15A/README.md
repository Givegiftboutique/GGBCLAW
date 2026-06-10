# TASK-20260609-OC-DASH-15A Artifacts

## Summary

Sprint 15A adds real local data pilot discovery, sanitized snapshot generation, pilot report, and snapshot refresh drill artifacts.

## Generated Records

- `apps/dashboard/data/generated/real-local-data-discovery-report.json`
- `apps/dashboard/data/generated/real-local-dashboard-export.generated.json`
- `apps/dashboard/data/generated/real-local-data-pilot-report.json`

## Safety Notes

- Local-only.
- Read-only.
- Mutation disabled.
- Production wiring disabled.
- Absolute paths redacted.
- Secrets redacted.
- Production endpoints blocked.
- No network call.

## Browser URL

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```
