# OpenClaw Dashboard Local Operator Release Candidate

## Purpose

Sprint 25B creates a final local operator release candidate checkpoint for daily Dashboard use. It is a local-only, read-only audit layer.

This does not mean production is ready.

## Scope

- Operator Home
- Sprint 25C operator UX first-screen panels
- local task inbox and WhatsApp visibility
- hourly local report refresh policy
- provider balance center
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

## Sprint 25C Usability Addendum

The RC audit now includes local-only task visibility, WhatsApp visibility, hourly refresh policy, and provider balance center reports. These are usability reports only. They do not connect WhatsApp, provider wallets, production APIs, or OpenClaw Gateway.

Real local input files such as `operator-task-inbox.json` and `provider-balance-center.json` remain ignored and must not be committed.

## Sprint 25D Chinese-first copy hardening

The Dashboard main surfaces now use Chinese-first operator language. Engineering enum values, raw keys, report paths, and permission keys are still available for review, but should be shown inside collapsed `技術詳情` / technical detail sections instead of the primary operator view. Production remains `no-go-for-production`; no production API/Gateway, endpoint input, auth/token input, mutation, restart, deploy, WhatsApp API, provider login, or secret handling is added.

## Sprint 25E Operator console visual redesign

Sprint 25E prepares the UI for RC2 consideration by redesigning the operator console. This does not change production readiness; Production remains `no-go-for-production`.
