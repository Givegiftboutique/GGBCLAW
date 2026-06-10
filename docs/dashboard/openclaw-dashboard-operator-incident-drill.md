# OpenClaw Dashboard Operator Incident Drill

Task: `TASK-20260609-OC-DASH-17A`

## Purpose

The incident drill creates a local-only report for operator triage practice. It uses generated observability and readiness data to build scenarios without sending external notifications or taking production action.

## Command

```bash
node apps/dashboard/scripts/run-operator-incident-drill.mjs
```

Report path:

```text
apps/dashboard/data/generated/operator-incident-drill-report.json
```

## Incident Scenarios

- stale source data
- agent lost / heartbeat stale
- task stuck / failed / timed out
- backup verification failed
- quality gate failed or stale
- safety scan failed or stale
- dev gateway blocked / unavailable
- production readiness no-go

## Triage Steps

1. Review local dashboard data and generated reports.
2. Capture local evidence refs.
3. Keep production action disabled.
4. Record operator notes in task memory or local handoff notes.

## Escalation Note

External escalation is disabled in the scaffold. The report keeps:

- `notificationSent: false`
- `externalEscalationSent: false`
- `mutationEnabled: false`
- `productionWiring: disabled`

## Troubleshooting

- If the report is missing, rerun observability and readiness generators.
- If safety flags change, stop and run the safety scan.
- If production action appears enabled, treat it as a blocker.
