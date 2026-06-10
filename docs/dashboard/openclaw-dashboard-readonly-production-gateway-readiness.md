# OpenClaw Dashboard Read-only Production Gateway Readiness

Status: checklist only. Gateway connection status is `not-connected`.

## Purpose

This readiness checklist defines the controls required before any future read-only production gateway work. Sprint 21A does not fetch, proxy, connect, or configure a production gateway.

Sprint 21B adds a blocker: read-only production gateway work must wait for Fixture Quarantine + Single Agent Truth Alignment. 8 agents are fixture only; current real operator truth is expected to be 1 real agent. Gateway readiness remains `not-ready`.

## Required Gateway Controls

- Production gateway URL approval required.
- Network allowlist required.
- Read-only GET endpoints only.
- Mutation endpoints not exposed.
- Response schema stable.
- Source status endpoint required.
- Audit event endpoint read-only only.
- Fallback behavior documented.

## Security Controls

- No browser-stored secrets.
- No frontend auth header until security design is approved.
- Credentials remain omitted unless a future approved architecture exists.
- No token, cookie, password, or API key handling in the frontend.
- Security reviewer approval required.

## Reality Alignment Blocker

The current real operator environment is expected to have only 1 real agent. Existing 8-agent mock / fixture / gateway-stub data must be quarantined from operator truth before any read-only production gateway implementation.

Required future prerequisite:

```text
Fixture Quarantine + Single Agent Truth Alignment
```

## Commands

```bash
node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Report path:

```text
apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json
```

Production remains `no-go-for-production`.
