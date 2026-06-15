# OpenClaw Dashboard Safe Task Metadata Discovery

Sprint 27A adds a local-only, read-only discovery step for OpenClaw task metadata.

This is not task extraction. It only checks whether the local WSL OpenClaw state has task-like SQLite tables and which column names exist.

## What It Reads

- SQLite file presence under the operator-provided WSL state directory.
- SQLite schema only: table names, column names, and column types.
- File and schema metadata needed to decide whether a future metadata-only extraction is safe.

## What It Does Not Read

- No raw SQLite rows.
- No task body, prompt, message, content, input, output, or response values.
- No env file.
- No credential, provider, WhatsApp, token, or key material.
- No Production API or Gateway.

## Column Safety Rules

Safe candidate columns are still only candidates until reviewed:

- `id`
- `task_id`
- `title`
- `name`
- `summary`
- `status`
- `state`
- `created_at`
- `updated_at`
- `last_updated`
- `last_seen_at`
- `source`
- `owner`
- `priority`

Forbidden columns must never be exported:

- prompt / message / content / body / input / output / response
- raw / payload
- token / key / password / secret / cookie / authorization / credential
- API key / auth / headers

Review-required columns are not allowed for automatic export:

- metadata / data / json / session / conversation / memory
- notes / description / result / error

## Operator Command

```powershell
node apps/dashboard/scripts/discover-wsl-openclaw-task-metadata-schema.mjs --distro Ubuntu-24.04 --state-dir <WSL_OPENCLAW_STATE_DIR> --dry-run
```

The report is written to:

```text
apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json
```

If the report says `ready-for-metadata-only-extraction-review`, the next sprint can consider metadata-only extraction. If it says `metadata-extraction-not-ready`, keep task display disabled.

## Safety Status

Production remains `no-go-for-production`. Mutation, restart, deploy, auth, and Production gateway remain disabled.
