# OpenClaw Dashboard Production Entry Gate Hardening

Sprint 24A adds a production entry gate hardening layer for local operator review. It does not implement production, does not connect a production gateway, and does not allow mutation, restart, deploy, or approval actions.

## Purpose

The gate summarizes whether the local-only operator evidence is ready for future external production review. It never marks the Dashboard as production ready.

## Gate Status

- `blocked`: unsafe guardrail changed, source is fixture data, agent count is not 1, production wiring is enabled, or an unsafe marker is detected.
- `review-required`: local evidence exists but needs manual review, such as unknown health, fallback evidence, missing reviewed health input, or missing manual approval.
- `local-only-ready`: local read-only checks are aligned, but production remains disabled and still needs external approval.
- `not-evaluated`: required local reports are missing.

## Required Before Production

- validated single-agent operator truth
- reviewed local health input
- evidence review clean
- daily runbook not blocked
- manual operator approval outside Dashboard
- production adapter still disabled

## Always False In This Sprint

`productionReady` remains `false`. Production status remains `no-go-for-production`.

## Blocked Actions

- production gateway connect
- mutation
- restart / stop / start agent
- deploy
- auth token use
- in-Dashboard approve

## Relationships

Daily Runbook and Operator Home display the production gate status so operators can see that production remains blocked or review-required. The reviewed health input assistant and local health evidence review feed the gate as local-only evidence.

Mock and gateway-stub remain fixtures and cannot be production readiness truth.

## Future Work

A future read-only production adapter would need separate design, security review, manual approval, and disabled-by-default rollout. Sprint 24A only documents and enforces the gate.

## Sprint 24B Production Adapter Simulator

Sprint 24B adds the disabled production adapter simulator report. The production entry gate now records the simulator path and verifies the adapter remains disabled, disconnected, and simulator-only. `productionReady` remains `false`.

## Sprint 25A Read-only Adapter Contract

Sprint 25A adds the read-only adapter contract review, disabled read-only adapter draft, and stabilization audit. The production entry gate references these report paths and still keeps `productionReady: false`, `adapterEnabled: false`, `connected: false`, `endpointConfigured: false`, `authEnabled: false`, and `dataReturned: false`.

Future real adapter work still requires separate approval outside Dashboard.

## Sprint 25B Local Operator RC

Sprint 25B consumes the production entry gate report in the local operator RC audit. The gate can remain `review-required`; it must not mark production ready or enable production gateway, endpoint, auth, mutation, restart, deploy, or adapter data return.
