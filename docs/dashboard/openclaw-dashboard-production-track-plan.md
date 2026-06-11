# OpenClaw Dashboard Production Track Plan

Status: planning-only. Production remains `no-go-for-production`.

## Purpose

Sprint 21A starts the production track planning layer for OpenClaw Dashboard v1.0.0 Internal. It does not connect to production, does not deploy, and does not add mutation, auth, token, cookie, or secret handling.

## Current State

- Current release: `v1.0.0-internal`
- Production status: `no-go-for-production`
- Production track status: `planning-only`
- Safety mode: `read-only`
- `mutationEnabled false`
- `productionWiring disabled`

## Reality Alignment Blocker

- Current real operator environment is expected to have only 1 real agent.
- Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only.
- Production track must not assume 8 real agents.
- Sprint 21C adds `apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json` as the one-agent operator truth candidate snapshot.
- The older 5-agent generated real local snapshot is review evidence only.
- Production readiness remains blocked until fixture data is quarantined from operator truth.
- Future prerequisite: Fixture Quarantine + Single Agent Truth Alignment before any read-only production gateway implementation.
- Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only.
- Production track must not assume 8 real agents.
- Production readiness remains blocked until fixture data is quarantined from operator truth.
- Future prerequisite: Fixture Quarantine + Single Agent Truth Alignment before any read-only production gateway implementation.

## Phases

- Phase P1: Read-only production gateway contract review.
- Phase P2: Security and secrets architecture.
- Phase P3: Auth / RBAC production design.
- Phase P4: Read-only production gateway dry run.
- Phase P5: Monitoring and incident response ownership.
- Phase P6: Controlled mutation design, future only.
- Phase P7: Production deploy plan, future only.

## Commands

```bash
node apps/dashboard/scripts/generate-production-track-plan.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Report path:

```text
apps/dashboard/data/generated/production-track-plan-report.json
```

## Not Allowed Yet

- Production gateway connection.
- Production deploy.
- Mutation endpoint.
- Browser secrets.
- Frontend auth header.
- Credentialed browser requests.
- External notification delivery.
- Automated production approval.

## Sprint 24A Production Entry Gate

Production entry is now guarded by `apps/dashboard/data/generated/production-entry-gate-report.json`. Even if local checks pass, `productionReady` remains false and the production adapter remains disabled by default.
