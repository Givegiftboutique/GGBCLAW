# OpenClaw Dashboard Disabled Read-only Adapter Draft

## Purpose

Sprint 25A adds a disabled read-only adapter draft so the Dashboard can display future adapter readiness without making a production connection.

This draft is not a live adapter. It returns disabled status only.

## Disabled State

- Adapter name: `disabled-read-only-production-adapter-draft`
- Adapter enabled: `false`
- Connected: `false`
- Production ready: `false`
- Production status: `no-go-for-production`
- Endpoint configured: `false`
- Auth enabled: `false`
- Simulator only: `true`
- Safety mode: `read-only`
- Mutation enabled: `false`
- Restart enabled: `false`
- Production gateway enabled: `false`
- Deploy enabled: `false`
- Data returned: `false`
- Disabled reason: `disabled-by-default`

## Reports

- Disabled draft report: `apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json`
- Contract review report: `apps/dashboard/data/generated/read-only-adapter-contract-review-report.json`

## Commands

```bash
node apps/dashboard/scripts/generate-disabled-read-only-adapter-draft-report.mjs
node apps/dashboard/scripts/test-read-only-adapter-contract-and-draft.mjs
```

## Safety Guarantees

The draft does not use fetch, XMLHttpRequest, WebSocket, EventSource, endpoint construction, token lookup, cookie reads, Authorization headers, or credentials include.

The draft does not expose restart, stop, start, deploy, mutation, or production connect behavior.

## Operator Interpretation

If this panel is visible, it means the Dashboard is showing a disabled planning artifact. It does not mean production is wired. Operators should continue using the single-agent local-ingest operator view for daily work.

## Future Work

Any future real adapter must be a separate sprint with manual approval. This disabled draft must not be switched on in place.

## Sprint 25B Local Operator RC

The local operator RC audit references this disabled draft as proof that the future adapter surface remains off. `adapterEnabled`, `connected`, `endpointConfigured`, `authEnabled`, `dataReturned`, and `productionReady` remain `false`.
