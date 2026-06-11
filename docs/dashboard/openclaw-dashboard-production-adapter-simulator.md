# OpenClaw Dashboard Production Adapter Simulator

## Purpose

Sprint 24B adds a read-only production adapter simulator so the operator can review the future adapter contract shape without connecting to production.

This is a simulator only. It does not connect to a production gateway, does not store an endpoint, does not use auth, and does not enable mutation.

## Current Status

- Production status: `no-go-for-production`
- Adapter status: `simulator-only`
- Production ready: `false`
- Adapter enabled: `false`
- Connected: `false`
- Simulator only: `true`
- Endpoint configured: `false`
- Auth enabled: `false`
- Safety mode: `read-only`

## Files

- Sample: `apps/dashboard/data/production-simulator/read-only-production-adapter.sample.json`
- Report: `apps/dashboard/data/generated/production-adapter-simulator-report.json`
- Checklist: `apps/dashboard/data/generated/production-adapter-simulator-checklist.json`

## Commands

```bash
node apps/dashboard/scripts/generate-production-adapter-simulator-report.mjs
node apps/dashboard/scripts/generate-production-adapter-simulator-checklist.mjs
node apps/dashboard/scripts/test-production-adapter-simulator.mjs
```

## Blocked Actions

- `production-gateway-connect`
- `mutation`
- `restart-agent`
- `stop-agent`
- `start-agent`
- `deploy`
- `auth-token-use`

## What This Does Not Do

- No production API.
- No production Gateway.
- No endpoint input.
- No auth token input.
- No Authorization header.
- No credentials include.
- No cookie or token handling.
- No restart, stop, or start action.
- No deploy command.
- No production-ready claim.

## Future Work

A real production adapter requires a separate approved production design, endpoint approval, secrets architecture, auth/RBAC review, read-only gateway dry run, manual sign-off, and a new sprint. The current dashboard remains internal, local-first, and production no-go.
