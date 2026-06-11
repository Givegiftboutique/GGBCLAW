# OpenClaw Dashboard Operator Usability MVP

Sprint 23A makes the daily operator path easier to use without weakening the local-only safety model.

## Purpose

Operators should not need to remember query strings, read JSON, or understand Git to open the correct Dashboard view. The recommended daily view is the single-agent `local-ingest` snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Production remains `no-go-for-production`. Restart, mutation, production gateway, deploy, auth, token, cookie, and secret flows remain disabled.

## Launch

From repo root:

```powershell
.\apps\dashboard\scripts\start-operator-dashboard.ps1
```

If port `5173` is busy:

```powershell
.\apps\dashboard\scripts\start-operator-dashboard.ps1 -Port 5174
```

Use `-NoBrowser` to print the local URL without opening a browser.

## What To See Daily

- Operator Home / Operator 首頁
- Recommended operator view / 建議 Operator 檢視
- `1` real agent expected
- `local-ingest` single-agent snapshot
- Local Real Agent Health panel
- Local Health Evidence Review panel
- Production status: `no-go-for-production`
- Restart: disabled
- Mutation: disabled
- Production gateway: disabled

## If 8 Agents Appear

You are probably viewing `mock` or `gateway-stub`. Those sources are fixture/demo coverage only and are not daily operator truth.

Open the recommended operator URL instead.

## If Health Is Unknown Or Stale

Use the local operator runbook. Do not restart, stop, or start an agent from the Dashboard.

## If Evidence Fallback Appears

Check the sanitized reviewed local health JSON example and regenerate the local health reports. Do not paste raw secret-like values into generated reports.

## Disabled Actions

- No restart button
- No stop/start button
- No mutation button
- No production gateway connect button
- No production deploy
- No auth/token/cookie/secrets in the frontend

## Generated Reports

```text
apps/dashboard/data/generated/operator-daily-usability-checklist.json
apps/dashboard/data/generated/operator-usability-troubleshooting-report.json
```

## Sprint 23B Daily Runbook Add-on

Daily Operator Runbook mode now appears with Operator Home. It summarizes today as `OK`, `Review Required`, `Blocked`, `Fixture Mode`, or `Unknown`, then lists status reasons, safe next steps, and blocked actions.

Reports:

```text
apps/dashboard/data/generated/daily-operator-summary-report.json
apps/dashboard/data/generated/daily-operator-runbook-checklist.json
```

Restart, mutation, production gateway, deploy, auth, token, cookie, and secret handling remain disabled.

## Sprint 25A Stabilization

The Operator Home now has companion panels for Read-only Adapter Contract Review, Disabled Read-only Adapter Draft, and Dashboard Stabilization Audit. These panels are visibility-only and keep `productionReady`, `adapterEnabled`, `connected`, `endpointConfigured`, `authEnabled`, and `dataReturned` false.
## Sprint 23C Reviewed Health Input Assistant

Operator Home now links the daily workflow with a Reviewed Health Input Assistant panel. Operators can see the template path, local input path, dry-run readiness, redaction policy, raw value policy, and the local-only commit policy without reading generated JSON directly.

## Sprint 24A Production Gate

Operator Home now surfaces the Production Entry Gate. The gate shows `productionReady false`, `no-go-for-production`, disabled production gateway, disabled mutation, disabled restart, and disabled deploy.

## Sprint 25B Local Operator RC

Operator Home now includes the Local Operator Release Candidate panel. It points to:

```text
apps/dashboard/data/generated/local-operator-release-candidate-report.json
apps/dashboard/data/generated/local-operator-final-checklist.json
apps/dashboard/data/generated/local-operator-known-risk-register.json
apps/dashboard/data/generated/local-operator-report-index.json
```

This is a local daily-use checkpoint only. It does not mark production ready.
