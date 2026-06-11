# OpenClaw Dashboard Local Operator Release Candidate

## Purpose

Sprint 25B creates a final local operator release candidate checkpoint for daily Dashboard use. It is a local-only, read-only audit layer.

This does not mean production is ready.

## Scope

- Operator Home
- Daily Operator Runbook
- local health and evidence reports
- reviewed health input assistant
- production entry gate hardening
- production adapter simulator
- read-only adapter contract review
- disabled read-only adapter draft
- dashboard stabilization audit

## Local Operator RC Status

The RC report uses one of these statuses:

- `local-operator-rc`
- `review-required`
- `blocked`
- `not-evaluated`

`review-required` can still be acceptable for local daily use when the remaining item is manual review of local health or evidence. It is not production approval.

## Commands

```bash
node apps/dashboard/scripts/run-local-operator-rc-audit.mjs
node apps/dashboard/scripts/generate-local-operator-release-candidate-report.mjs
```

## Report Path

```text
apps/dashboard/data/generated/local-operator-release-candidate-report.json
```

## Safety

- `productionReady` remains `false`
- production remains `no-go-for-production`
- adapter enabled remains `false`
- connected remains `false`
- endpoint and auth remain unconfigured
- mutation, restart, deploy, and production gateway connection remain disabled

Future production work requires a separate approval process outside the Dashboard.
