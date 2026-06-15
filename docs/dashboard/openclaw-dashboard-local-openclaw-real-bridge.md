# OpenClaw Dashboard Local OpenClaw Real Bridge

## Sprint 27A Task Metadata Discovery

The Dashboard bridge remains ready for safe local exports, but task count stays zero until a separate reviewed metadata-only extraction is approved. Sprint 27A only checks schema metadata and does not read task rows.

Sprint 26D documents the final gap between the Dashboard connector and the local OpenClaw service.

The Dashboard side is ready to read local-only JSON from:

```text
GET /api/local/export
GET /api/local/agents
GET /api/local/tasks
```

The recommended endpoint is `/api/local/export` because it can return agents and tasks in one read-only payload.

## Current Result

`http://127.0.0.1:18789/health` can respond, so the Dashboard can classify the local service as reachable. If `/api/local/export`, `/api/local/agents`, and `/api/local/tasks` are not available as JSON, the Dashboard keeps the connection read-only and shows zero agents and zero tasks with the reason:

```text
no-json-agents-tasks-endpoint-found
```

This means OpenClaw answered, but it has not exposed the local Agent/task list in the shape the Dashboard can read.

## Export Shape

`/api/local/export` should return:

```json
{
  "schemaVersion": "openclaw-local-export.v1",
  "generatedAt": "ISO timestamp",
  "source": "local-openclaw-readonly",
  "agents": [],
  "tasks": [],
  "safety": {
    "readOnly": true,
    "mutationEnabled": false,
    "restartEnabled": false,
    "deployEnabled": false,
    "productionGatewayEnabled": false,
    "authEnabled": false,
    "credentialRequired": false
  }
}
```

`/api/local/agents` may return `{ "agents": [] }`.

`/api/local/tasks` may return `{ "tasks": [] }`.

## Local Export File

If OpenClaw does not yet expose those endpoints, use a reviewed local export file:

```text
apps/dashboard/data/local/openclaw-local-export.json
```

That file is local-only and ignored by git. Do not commit real task, Agent, prompt, credential, or provider data.

## Safety Boundary

- localhost / 127.0.0.1 only
- HTTP GET only
- no production API or Gateway
- no API key, password, token, cookie, Authorization header, or credential
- no mutation, restart, stop, start, deploy, or write-back
- no WhatsApp/model/provider config changes
- generated report: `apps/dashboard/data/generated/openclaw-local-export-bridge-report.json`
# Sprint 26G WSL Export Adapter Note

If the installed WSL OpenClaw gateway has `/health` but no JSON Agent/task routes, use the separate WSL local export adapter instead of patching installed runtime `dist` files. The adapter writes only safe metadata to the ignored local export file and leaves Production disabled.
