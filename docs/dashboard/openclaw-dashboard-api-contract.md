# OpenClaw Dashboard API Contract

This Phase 00 / Phase 01 / Phase 02 scaffold does not call production APIs. The contracts below describe future read-only endpoints and expected shapes.

Phase 02 adds a local read-only adapter layer with a mock adapter. Phase 03 wires local exported JSON and artifact manifest adapters only. These use static files served by the local dashboard server and do not call production APIs.

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
- `?source=json&data=./data/dashboard-export.sample.json`

Unsupported source values and failed local fetches must fall back to the mock adapter with source status health `warning`.

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
