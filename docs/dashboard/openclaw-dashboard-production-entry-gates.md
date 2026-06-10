# OpenClaw Dashboard Production Entry Gates

Status: `blocked`. Production remains `no-go-for-production`.

## Required Entry Gates

- Internal v1 tag exists.
- Security/privacy audit reviewed.
- Data retention reviewed.
- Production gateway contract approved.
- Fixture Quarantine + Single Agent Truth Alignment complete.
- Secrets architecture approved.
- Auth/RBAC architecture approved.
- Read-only gateway dry run completed.
- Production monitoring plan approved.
- Incident response owner assigned.
- Rollback plan approved.
- Production deploy plan approved.
- Controlled mutation plan remains future only.

## Single-Agent Truth Gate

Production entry gates remain blocked until fixture data is separated from operator truth. Mock and gateway-stub may keep 8 agents for lifecycle tests, but real/operator truth is expected to be 1 real agent. Do not use fixture data as production inventory evidence.

## Hard Blocker: Fixture Quarantine

Production entry must not treat the 8-agent fixture set as real operator truth. The current real operator environment is expected to have only 1 real agent. Fixture data must be isolated, labeled, and prevented from influencing production readiness or operator truth before any production gateway work begins.

## Manual Signoffs

- operator-owner
- technical-owner
- security-reviewer
- business-owner
- deployment-owner
- rollback-owner
- monitoring-owner

## Commands

```bash
node apps/dashboard/scripts/generate-production-entry-gates.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Report path:

```text
apps/dashboard/data/generated/production-entry-gates-report.json
```

Do not auto-approve. Do not mark production ready.
