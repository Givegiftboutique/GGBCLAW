# OpenClaw Dashboard API Contract

This Phase 00 through Phase 07 scaffold does not call production APIs. The contracts below describe local read-only adapters, future read-only endpoints, and expected shapes.

Phase 02 adds a local read-only adapter layer with a mock adapter. Phase 03 wires local exported JSON and artifact manifest adapters only. Phase 07 adds `gateway-stub`, a local fixture source for a read-only gateway contract. These sources use static files served by the local dashboard server and do not call production APIs.

Gateway contract details: `docs/dashboard/openclaw-dashboard-gateway-contract.md`.

## Read-only Endpoints

- `GET /api/dashboard/overview`
- `GET /api/dashboard/agents`
- `GET /api/dashboard/agents/{agentId}`
- `GET /api/dashboard/tasks`
- `GET /api/dashboard/tasks/{taskId}`
- `GET /api/dashboard/reviews`
- `GET /api/dashboard/logs`
- `GET /api/dashboard/backups`
- `GET /api/dashboard/settings`
- `GET /api/dashboard/rbac`

## Forbidden in Scaffold

- `POST`, `PUT`, `PATCH`, and `DELETE` production mutations.
- Production approval or rejection.
- Production retry, cancel, restore, export, or deploy actions.
- Any request carrying secrets, tokens, passwords, cookies, or private gateway credentials.

## Future Disabled Mutations

The following are documented as future or disabled concepts only and are not implemented in Phase 02:

- approve review
- reject review
- run backup
- restore backup
- update settings
- delete task
- cancel task

Any future mutation must require RBAC, review policy, audit logging, rollback planning, and explicit production wiring outside this mock-only scaffold.

## Adapter Contract

The Phase 02 `DashboardDataAdapter` exposes read-only methods:

- `getMetrics()`
- `getAgents()`
- `getAgentById(id)`
- `getTasks(filters?)`
- `getTaskById(id)`
- `getReviews(filters?)`
- `getLogs(filters?)`
- `getBackups()`
- `getSettings()`
- `getRbacSummary()`

## Source Query Contract

Supported local query values:

- `?source=mock`
- `?source=json`
- `?source=artifact`
- `?source=gateway-stub`
- `?source=local-ingest`
- `?source=dev-gateway`
- `?source=json&data=./data/dashboard-export.sample.json`

Unsupported source values and failed local fetches must fall back to the mock adapter with source status health `warning`.

`?source=gateway-stub` reads local fixtures from `apps/dashboard/data/gateway-stub/`, validates the gateway contract envelope, maps it to the Dashboard data model, and displays `Production wiring: disabled`.

`?source=local-ingest` reads JSON-only local ingest files from `apps/dashboard/data/local-ingest/` and maps supported local shapes to the Dashboard data model.

`?source=dev-gateway` is disabled unless a safe local HTTP `baseUrl` is explicitly provided. It is read-only GET only, omits credentials, and falls back safely when missing, blocked, or unavailable.

## Import / Export Contract

Phase 04 adds local snapshot generation and validation only.

- Generated snapshot path: `apps/dashboard/data/generated/dashboard-export.generated.json`
- Schema version: `dashboard-export-v1`
- Safety mode: `read-only`
- Mutation enabled: `false`

Production import/export is not implemented. Dashboard import controls are disabled in the scaffold, and export is available only through the local generator script.

## Quality Gate Contract

Phase 05 adds local-only quality scripts:

- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`

These scripts do not call production APIs, do not modify deployment workflows, and do not add CI. They verify local snapshots, schema files, required docs, adapter files, route markers, safety markers, and forbidden active mutation functions.

## RBAC Stub Contract

Sprint 11A role simulation is local UI state only. It has no login endpoint, no auth provider, no token exchange, and no cookie handling.

Roles:

- `viewer`
- `operator`
- `reviewer`
- `admin`
- `audit-only`

Forbidden non-goal permissions such as `reviews:approve`, `reviews:reject`, `backups:restore`, `settings:update`, `gateway:write`, and `production:mutate` must not be granted.

## Action Draft Contract

Sprint 11A action drafts are local JSON previews only. They are not submitted to a gateway.

Required flags:

- `dryRun: true`
- `mutationEnabled: false`
- `productionWiring: disabled`
- `requiresHumanApproval: true`
- `notSubmitted: true`

Generated sample path:

```text
apps/dashboard/data/generated/action-drafts.sample.json
```

## Response Envelope

```json
{
  "data": {},
  "meta": {
    "source": "mock",
    "generatedAt": "2026-06-09T12:00:00+08:00",
    "readOnly": true
  },
  "errors": []
}
```

## Error Shape

```json
{
  "code": "dashboard.mock_only",
  "message": "Production mutation is disabled in the scaffold.",
  "severity": "info"
}
```
