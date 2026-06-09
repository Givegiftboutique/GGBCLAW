# OpenClaw Dashboard Gateway Contract Stub

Task: `TASK-20260609-OC-DASH-007`

This document defines a read-only Gateway contract stub for local dashboard acceptance. It is future-facing and not production wired in this scaffold.

## Safety Boundary

- Production wiring status: disabled in scaffold.
- Mutation status: not allowed.
- Data source: local `gateway-stub` fixtures only.
- Authentication, token, cookie, and secret handling are not implemented.
- No live gateway request is made by the Phase 07 dashboard.

## Response Envelope

Each read-only fixture uses this shape:

```json
{
  "meta": {
    "contractVersion": "gateway-read-only-v1",
    "fixtureVersion": "phase-07-gateway-stub-v1",
    "generatedAt": "2026-06-09T15:10:00+08:00",
    "source": "gateway-stub",
    "safetyMode": "read-only",
    "mutationEnabled": false,
    "productionWiring": "disabled",
    "endpoint": "/dashboard/agents"
  },
  "data": {},
  "links": {
    "self": "local://openclaw-dashboard-gateway-stub/dashboard/agents"
  },
  "errors": []
}
```

## Error Shape

```json
{
  "code": "gateway_stub.validation_failed",
  "message": "Local gateway-stub fixture failed read-only contract validation.",
  "severity": "warning",
  "details": []
}
```

Errors are local fixture validation records. They are not production gateway responses.

## Read-only Endpoints

### GET /dashboard/metrics

- Purpose: return dashboard KPI metrics.
- Response shape: `data.metrics[]`.
- Required fields: `id`, `label`, `value`, `trend`, `status`, `description`.
- Allowed enum values: `status = healthy | watch | blocked`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: local fixture only; no auth handling.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/agents

- Purpose: return agent registry list.
- Response shape: `data.agents[]`, `data.pagination`.
- Required fields: `id`, `name`, `role`, `runtime`, `model`, `workspace`, `sandbox`, `toolsProfile`, `status`, `lastHeartbeat`, `riskLevel`, `responsibilities`, `allowedActions`, `deniedActions`.
- Allowed enum values: `status = online | busy | degraded | offline`, `riskLevel = low | medium | high`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: future cursor fields are represented by local placeholder pagination.
- Security notes: allowed and denied actions are descriptive only.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/agents/:id

- Purpose: return one agent profile.
- Response shape: `data.agent`.
- Required fields: same as `GET /dashboard/agents`.
- Allowed enum values: same as `GET /dashboard/agents`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: local fixture only.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/tasks

- Purpose: return task run list.
- Response shape: `data.tasks[]`, `data.filters`, `data.pagination`.
- Required fields: `id`, `workflow`, `status`, `priority`, `attempt`, `ownerAgent`, `reviewer`, `createdAt`, `updatedAt`, `summary`.
- Allowed enum values: `status = queued | running | review_pending | succeeded | failed | timed_out | cancelled | lost`, `priority = P0 | P1 | P2 | P3`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: status and priority filters are represented by local placeholder values.
- Security notes: no task mutation fields.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/tasks/:id

- Purpose: return one task run.
- Response shape: `data.task`.
- Required fields: same as `GET /dashboard/tasks`.
- Allowed enum values: same as `GET /dashboard/tasks`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: local fixture only.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/reviews

- Purpose: return review gate records.
- Response shape: `data.reviews[]`, `data.pagination`.
- Required fields: `id`, `taskId`, `reviewer`, `verdict`, `policyChecks`, `notes`, `createdAt`.
- Allowed enum values: `verdict = pending | approved | rejected | needs_changes`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: future reviewer/task filters may be represented in fixture metadata only.
- Security notes: approve and reject controls remain disabled or mock-only.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/logs

- Purpose: return audit and trace events.
- Response shape: `data.auditEvents[]`, `data.pagination`.
- Required fields: `id`, `timestamp`, `severity`, `actor`, `event`, `redacted`.
- Allowed enum values: `severity = info | warning | error | critical`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: severity and text filtering are UI-local in the scaffold.
- Security notes: sensitive references must remain redacted.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/backups

- Purpose: return backup evidence manifests.
- Response shape: `data.backups[]`.
- Required fields: `id`, `taskId`, `verifyStatus`, `checksum`, `storageUri`, `createdAt`, `restoreTestedAt`, `evidenceChain`.
- Allowed enum values: `verifyStatus = verified | pending | failed`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: backup and restore actions are evidence-only in the scaffold.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/settings

- Purpose: return read-only dashboard settings summary.
- Response shape: `data.settings`.
- Required fields: `gatewayAuthMode`, `retentionPolicy`, `modelRouting`, `mcpServers`, `secretRefsHealth`, `productionMutation`.
- Allowed enum values: `productionMutation = disabled`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: no secret references are loaded.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/rbac

- Purpose: return RBAC summary derived from agent allowed and denied actions.
- Response shape: `data.rbac[]`.
- Required fields: `agentId`, `name`, `riskLevel`, `allowedActions`, `deniedActions`.
- Allowed enum values: `riskLevel = low | medium | high`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: descriptive only; not an enforcement backend.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

### GET /dashboard/source-status

- Purpose: return source health for the local gateway-stub mode.
- Response shape: `data.sourceStatus`.
- Required fields: `currentSource`, `requestedSource`, `health`, `validation`, `fallback`, `fallbackReason`, `lastLoadedAt`, `dataUrl`, `safetyMode`, `productionWiring`.
- Allowed enum values: `currentSource = gateway-stub`, `health = ok | warning | error`, `validation = passed | failed`, `fallback = none | mock`, `safetyMode = read-only`, `productionWiring = disabled`.
- Error shape: standard gateway-stub error envelope.
- Pagination/filter notes: no pagination.
- Security notes: no production source URL.
- Mutation status: not allowed.
- Production wiring status: disabled in scaffold.

## Explicit Non-goals

- No active mutation endpoints.
- No production gateway client.
- No auth, token, cookie, or secret handling.
- No database migration.
- No deployment or GitHub Actions workflow changes.
- No real approve, reject, backup, restore, production import, or production export action.
