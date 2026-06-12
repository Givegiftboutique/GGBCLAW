# OpenClaw Dashboard Local OpenClaw Read-only Connector

Sprint 26A adds a local-only read-only connector candidate for OpenClaw.

This is not production wiring. It only allows localhost / 127.0.0.1 and GET-style status reads. It does not use ???????????.

## What It Does

- Reads a local connector config if `apps/dashboard/data/local/local-openclaw-connector.json` exists.
- Falls back to the safe template/example when no local config exists.
- Produces `apps/dashboard/data/generated/local-openclaw-connector-report.json`.
- Shows "本機 OpenClaw 連接" in the operator console.
- Shows "本機 OpenClaw 未連接" when no local OpenClaw endpoint or export is available.

## Safe Local Config

Use the template:

```text
apps/dashboard/data/local/local-openclaw-connector.template.json
apps/dashboard/data/local/local-openclaw-connector.example.json
```

Operators may create this untracked file locally:

```text
apps/dashboard/data/local/local-openclaw-connector.json
```

The real local config must not be committed.

## Allowed Boundary

- `http://127.0.0.1:<port>`
- `http://localhost:<port>`
- GET only
- Local Dashboard data files only

Rejected:

- External domains
- Public IP or LAN IP endpoints
- Production domains
- Provider wallet URLs
- URLs containing ??????

## If Not Connected

`not-connected` means setup is missing or local OpenClaw is not running. It is not a Dashboard failure.

Next steps:

1. Confirm local OpenClaw has a read-only status endpoint or export file.
2. Create `apps/dashboard/data/local/local-openclaw-connector.json` from the template.
3. Re-run `node apps/dashboard/scripts/run-local-openclaw-connector.mjs`.

## Guardrails

- Production remains `no-go-for-production`.
- `productionReady` remains false.
- Production adapter `connected`, `endpointConfigured`, `authEnabled`, and `dataReturned` remain false.
- No mutation, restart, stop, start, deploy, production gateway, endpoint input, or auth input is added.

## Sprint 26B - Local OpenClaw Activation Assistant

Sprint 26B adds a local-only activation assistant for the read-only connector. Operators can create an ignored local config for localhost GET endpoints or an ignored local export file. No API key, password, token, auth input, mutation, restart, deploy, external API, or Production Gateway is added. Production remains `no-go-for-production`.

## Sprint 26D - Read-only Export Bridge

The Dashboard connector now treats `/api/local/export` as the preferred local JSON shape. If local OpenClaw responds on `/health` but does not provide `/api/local/export`, `/api/local/agents`, or `/api/local/tasks`, Dashboard shows that OpenClaw responded but has not provided the Agent/task list yet.

Bridge report:

```text
apps/dashboard/data/generated/openclaw-local-export-bridge-report.json
```

Real non-zero Agent/task counts require a localhost-only GET JSON export endpoint or a reviewed ignored local export file at `apps/dashboard/data/local/openclaw-local-export.json`.
# Sprint 26G WSL Safe Export Adapter

The connector can read exports created by `apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs`. When the export source is `wsl-openclaw-safe-export-adapter`, the Dashboard treats it as a local-only, read-only WSL metadata export. Real export files remain ignored and must not be committed.
