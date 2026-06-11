# OpenClaw Dashboard Read-only Adapter Contract Review

## Purpose

Sprint 25A adds a read-only adapter contract review layer for future planning. It defines the contract shape that a future adapter would have to satisfy, but it does not implement a production adapter.

## Current State

- Contract status: `draft-only`
- Production status: `no-go-for-production`
- Production ready: `false`
- Adapter enabled: `false`
- Connected: `false`
- Endpoint configured: `false`
- Auth enabled: `false`
- Safety mode: `read-only`
- Simulator only: `true`

## Reports

- Contract review report: `apps/dashboard/data/generated/read-only-adapter-contract-review-report.json`
- Contract checklist: `apps/dashboard/data/generated/read-only-adapter-contract-checklist.json`
- Related simulator report: `apps/dashboard/data/generated/production-adapter-simulator-report.json`
- Related production entry gate report: `apps/dashboard/data/generated/production-entry-gate-report.json`

## Commands

```bash
node apps/dashboard/scripts/generate-read-only-adapter-contract-review-report.mjs
node apps/dashboard/scripts/generate-read-only-adapter-contract-checklist.mjs
node apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs
```

## Contract Rules

The contract is disabled by default. The allowed fields are documented in the generated report. The forbidden field list includes endpoint, host, Authorization, token, cookie, password, secret, credentials, webhook, contact data, mutation URLs, restart URLs, and deploy URLs.

The contract requires these fields to remain false:

- `adapterEnabled`
- `connected`
- `productionReady`
- `endpointConfigured`
- `authEnabled`
- `mutationEnabled`
- `restartEnabled`
- `productionGatewayEnabled`
- `deployEnabled`

## Blocked Actions

- `production-gateway-connect`
- `mutation`
- `restart-agent`
- `stop-agent`
- `start-agent`
- `deploy`
- `auth-token-use`

## What This Does Not Do

## Sprint 25B Local Operator RC

The final local operator release candidate audit references the contract review report. This remains a draft-only contract review and does not enable endpoint, auth, production connection, data return, mutation, restart, or deploy behavior.

- No production API.
- No production Gateway.
- No production endpoint.
- No endpoint input.
- No auth or token input.
- No Authorization header.
- No credentials include.
- No cookie or token handling.
- No mutation endpoint.
- No restart / stop / start.
- No deploy or CI workflow.

## Future Work

A real read-only production adapter requires a separate approved design, endpoint approval, secrets and auth architecture, security review, read-only gateway dry run, and manual sign-off outside Dashboard. Sprint 25A remains planning-only.
