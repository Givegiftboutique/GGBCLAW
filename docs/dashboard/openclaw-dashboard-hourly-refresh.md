# OpenClaw Dashboard Hourly Refresh

Sprint 25C adds a simple refresh policy for local reports.

## Behavior

- Refresh interval: 60 minutes.
- Manual refresh button: reloads the current local dashboard page.
- Refresh source labels: `initial-load`, `manual`, and `hourly`.
- The dashboard displays last refresh time and next refresh time.

## Scope

The refresh policy only covers local dashboard reports and task files already used by the dashboard.

It does not fetch production. It does not call external provider wallets. It does not connect to OpenClaw Gateway.

## Report

`apps/dashboard/data/generated/hourly-refresh-policy-report.json`
# Sprint 26A Note

Hourly refresh now watches `apps/dashboard/data/generated/local-openclaw-connector-report.json`. The browser reloads the local report only; it does not call production or external providers.
