# OpenClaw Dashboard Single-agent Local Snapshot

Status: internal operator use only. Production still no-go.

## Purpose

Sprint 21C aligns the real local operator truth candidate with the current operating assumption: 1 real agent. The existing mock and gateway-stub 8-agent data remains in place for fixture, lifecycle, contract, and regression coverage.

## Why The Cleanup Exists

`apps/dashboard/data/generated/real-local-dashboard-export.generated.json` previously contained 5 agents. That file is retained as review evidence, not as operator truth.

The operator truth candidate snapshot is now:

```text
apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
```

It must contain exactly 1 agent and keep:

- `safetyMode: read-only`
- `mutationEnabled: false`
- `productionWiring: disabled`
- `productionStatus: no-go-for-production`

## Selection Rule

The cleanup generator uses a deterministic rule:

- select the validation-safe local orchestrator candidate when present,
- otherwise select the first validation-safe local candidate,
- reject validation-unsafe or duplicate generated records,
- record all rejected candidates in `singleAgentCleanup.rejectedCandidates`,
- keep `reviewRequired: true`.

This is not production approval and not a production gateway connection.

## Commands

```bash
node apps/dashboard/scripts/inspect-real-local-agent-inventory.mjs
node apps/dashboard/scripts/generate-single-agent-local-snapshot.mjs
node apps/dashboard/scripts/generate-single-agent-truth-report.mjs --data apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json
node apps/dashboard/scripts/test-single-agent-local-snapshot.mjs
```

Reports:

```text
apps/dashboard/data/generated/real-local-agent-inventory-inspection.json
apps/dashboard/data/generated/single-agent-truth-report.json
```

## Browser URL

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

The page should show:

- Operator Truth Candidate / Operator 真實資料候選
- Expected real agent count: 1 / 預期真實 agent 數量：1
- Actual real agent count: 1 / 實際真實 agent 數量：1
- Single-agent snapshot: loaded / 單 agent snapshot 已載入

## Relationship To Fixtures

Do not delete mock or gateway-stub fixtures.

- `mock`: 8 agents are fixture only.
- `gateway-stub`: 8 agents are contract fixture only.
- `local-ingest`: operator truth candidate after validation and human review.

Production still no-go.

## Sprint 21D Operator Source Selection Lockdown

The operator recommended URL is:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Default entry now shows an operator source selection notice instead of silently implying mock truth. `mock` and `gateway-stub` stay available for fixture coverage only and must display high warnings.
