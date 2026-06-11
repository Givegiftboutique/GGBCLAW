# OpenClaw Dashboard Local Operator Final Checklist

## Purpose

The final local operator checklist gives the operator a last local-use checklist before treating the Dashboard as the daily local checkpoint.

## Checklist

- Start Dashboard with `apps/dashboard/scripts/start-operator-dashboard.ps1`.
- Confirm Operator Home is visible.
- Confirm Daily Operator Runbook is visible.
- Confirm Local Health panel is visible.
- Confirm Evidence panel is visible.
- Confirm Reviewed Health Input Assistant is visible.
- Confirm Production Entry Gate is visible.
- Confirm Production Adapter Simulator is visible.
- Confirm Read-only Adapter Contract Review is visible.
- Confirm Disabled Adapter Draft is visible.
- Confirm Dashboard Stabilization Audit is visible.
- Confirm Local Operator Release Candidate panel is visible.
- Confirm source is `local-ingest` single-agent.
- Confirm agent count is 1.
- If 8 agents appear, treat the view as fixture/demo data.

## Not Allowed

- production gateway connection
- mutation
- restart / stop / start
- deploy
- auth/token/secrets
- committing `reviewed-local-agent-health.json`

## Report Path

```text
apps/dashboard/data/generated/local-operator-final-checklist.json
```
