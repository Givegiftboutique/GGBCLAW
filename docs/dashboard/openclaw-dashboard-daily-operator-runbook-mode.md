# OpenClaw Dashboard Daily Operator Runbook Mode

## Purpose

Sprint 23B adds a daily operator runbook mode on top of the Operator Home. It turns the existing source, agent count, local health, local evidence, and production guardrails into a daily status and a small set of safe next steps.

This is still local-only and read-only. Production remains `no-go-for-production`.

## Daily Status Meanings

- `OK`: local-ingest single-agent source is aligned, one real agent is visible, and no unsafe guardrail is enabled.
- `Review Required`: local health is `unknown`, `stale`, or `review-required`, or local evidence fallback is active.
- `Blocked`: agent count is not 1, production status is no longer `no-go-for-production`, mutation/restart/production gateway is enabled, or evidence safety is unsafe.
- `Fixture Mode`: source is `mock` or `gateway-stub`; 8 agents are fixture/demo data, not daily operator truth.
- `Unknown`: reports are missing or cannot be classified safely.

## Daily Checklist

1. Confirm Operator Home is visible.
2. Confirm source is `local-ingest`.
3. Confirm agent count is 1.
4. Confirm Local Real Agent Health panel is visible.
5. Confirm Local Health Evidence Review panel is visible.
6. Confirm Daily Operator Runbook panel is visible.
7. Confirm production status is `no-go-for-production`.

## Review Required

If health is `unknown`, `stale`, or `review-required`, use the local runbook and do not restart from Dashboard.

If evidence fallback is active, inspect the reviewed local health JSON example and regenerate the local reports. Do not paste secrets, tokens, cookies, private paths, or raw logs into generated reports.

## Fixture Mode

If 8 agents appear, check the source badge. `mock` and `gateway-stub` are fixture/demo modes only. Open the recommended operator URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

## Blocked Actions

The Dashboard must not provide:

- `restart-agent`
- `stop-agent`
- `start-agent`
- `production-gateway-connect`
- `mutation`
- `deploy`
- auth/token/secret handling

## Reports

```text
apps/dashboard/data/generated/daily-operator-summary-report.json
apps/dashboard/data/generated/daily-operator-runbook-checklist.json
```

Run:

```bash
node apps/dashboard/scripts/generate-daily-operator-summary-report.mjs
node apps/dashboard/scripts/generate-daily-operator-runbook-checklist.mjs
node apps/dashboard/scripts/test-daily-operator-runbook.mjs
```

## Safety Boundary

Sprint 23B does not connect to production, does not add mutation, does not add restart/stop/start actions, does not read secrets, does not add deploy/CI, and does not change source mode values or route hash values.
## Sprint 23C Reviewed Health Assistant In Daily Runbook

The Daily Operator Runbook now includes reviewed health input readiness. If the readiness is `missing-local-input`, the safe next step is to copy the template locally and run the dry-run validator. If readiness is `unsafe-rejected`, remove unsafe fields and keep fallback active.

The runbook still blocks restart, mutation, deploy, and production gateway connection.

## Sprint 24A Production Entry Gate

Daily Runbook now references `apps/dashboard/data/generated/production-entry-gate-report.json`. Production gate status may be `blocked`, `review-required`, `local-only-ready`, or `not-evaluated`, but `productionReady` remains `false` and production stays `no-go-for-production`.

## Sprint 25B Local Operator RC

Daily Runbook feeds the final local operator release candidate audit. If daily status is `review-required`, the RC may still be local-use available, but production remains no-go and manual review remains required.

## Sprint 24B Production Adapter Simulator In Daily Runbook

Daily Runbook now also references `apps/dashboard/data/generated/production-adapter-simulator-report.json`. The adapter remains disabled, disconnected, simulator-only, and not production ready. If future production adapter work is discussed, operators must treat it as a separate approval track.

## Sprint 25A Adapter Contract Markers

Daily Runbook reports now also reference:

- `apps/dashboard/data/generated/read-only-adapter-contract-review-report.json`
- `apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json`
- `apps/dashboard/data/generated/dashboard-stabilization-audit-report.json`

These markers show that future adapter planning remains disabled-by-default. `productionReady`, `adapterEnabled`, `connected`, `endpointConfigured`, `authEnabled`, and `dataReturned` remain `false`.
