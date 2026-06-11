# OpenClaw Dashboard Single Agent Truth

Status: internal operator use only. Production still no-go. production still no-go.

## Sprint 21C Update

The operator truth candidate should use the dedicated single-agent snapshot:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

Run:

```bash
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs --data apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

When this snapshot is used, the truth report should show `status: pass`, `expectedRealAgentCount: 1`, and `actualRealAgentCount: 1`.

## Current Real Operator Assumption

The current real operator environment is expected to have 1 real agent.

Existing 8-agent data is mock / fixture / gateway-stub lifecycle test data only. Production track must not assume 8 real agents.

## Validate The Real Local Snapshot

Use local ingest as the operator truth candidate:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

Run:

```bash
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs
node apps/dashboard/scripts/test-fixture-quarantine.mjs
```

Report:

```text
apps/dashboard/data/generated/single-agent-truth-report.json
```

## If Actual Count Differs

Do not auto-edit data. Treat the report as warning or fail and review the real local source.

Required follow-up:

- confirm the real agent inventory source,
- regenerate the real local snapshot only from approved local data,
- keep fixture data quarantined,
- keep production no-go until the mismatch is reviewed.

## Production Track Impact

Production readiness remains blocked until fixture data is quarantined from operator truth and the single real agent assumption is aligned with the real source. This is a future prerequisite before any read-only production gateway work.
## Sprint 21D Operator Source Selection Lockdown

Use the recommended operator URL for the single-agent truth candidate:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

`mock` and `gateway-stub` remain high-warning fixture sources only. If 8 agents are visible, they are fixture data, not real inventory. Production still no-go.
## Sprint 22A local real agent health

Local real agent health is generated from a reviewed local file and aligned to the single-agent snapshot.
The health source is `local-file-only`; expected real agent count = 1.
If health is `unknown` or `stale`, use the manual runbook. The Dashboard has no restart action.
