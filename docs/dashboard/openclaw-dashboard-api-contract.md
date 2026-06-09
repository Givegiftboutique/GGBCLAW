# OpenClaw Dashboard API Contract

This Phase 00 / Phase 01 scaffold does not call production APIs. The contracts below describe future read-only endpoints and expected shapes.

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
