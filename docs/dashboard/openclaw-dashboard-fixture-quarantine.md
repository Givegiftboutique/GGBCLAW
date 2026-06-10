# OpenClaw Dashboard Fixture Quarantine

Status: internal operator use only. Production still no-go. production still no-go.

## Sprint 21C Update

Fixture quarantine remains unchanged: `mock` and `gateway-stub` keep 8 fixture agents. The operator-facing `local-ingest` truth candidate now loads a separate one-agent snapshot at:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

The previous 5-agent generated local snapshot is review evidence only, not operator truth.

## Purpose

Sprint 21B keeps mock and gateway-stub data for contract tests, regression tests, and lifecycle demos, but quarantines it from operator truth. The problem is not that fixtures exist. The problem is that 8 agents can look like a real inventory if they are not clearly labeled.

## Fixture Sources

- `mock`: demo fixture data only.
- `gateway-stub`: contract fixture data only.
- Sample JSON files: review-required examples, not automatic truth.

8 agents are fixture only. They are valid for lifecycle coverage and gateway contract coverage, not for real operator inventory.

## Operator Truth Sources

- `local-ingest`: Operator truth candidate after validation and human review.
- Current real operator assumption: single real agent.
- Expected real agent count: 1.

Do not promote fixture counts into production planning. Do not use mock or gateway-stub as operator truth.

## Quarantine Rules

- Mock must be labeled Demo Fixture Data.
- Gateway stub must be labeled Contract Fixture Data.
- 8-agent lifecycle data must never be presented as real agents.
- Local ingest must show Operator Truth Candidate and expected count 1.
- Production still no-go until Fixture Quarantine + Single Agent Truth Alignment is reviewed.

## Commands

```bash
node apps/dashboard/scripts/generate-fixture-quarantine-report.mjs
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs
node apps/dashboard/scripts/test-fixture-quarantine.mjs
```

Reports:

- `apps/dashboard/data/generated/fixture-quarantine-report.json`
- `apps/dashboard/data/generated/single-agent-truth-report.json`

## How To Open Demo Data Intentionally

Use demo data only when testing UI flows:

```text
http://localhost:5173/?source=mock
http://localhost:5173/?source=gateway-stub
```

Both views must show fixture warnings.

## Production Blocker

Fixture Quarantine + Single Agent Truth Alignment is required before any read-only production gateway implementation. Production still no-go.
## Sprint 21D Source Lockdown

Fixture quarantine is now paired with operator source selection lockdown. `mock` and `gateway-stub` require explicit selection and demo acknowledgement; both have `defaultAllowed: false` for operator truth. The recommended operator URL is the local-ingest single-agent snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Production still no-go.
