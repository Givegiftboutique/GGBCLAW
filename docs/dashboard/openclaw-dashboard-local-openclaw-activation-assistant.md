# OpenClaw Dashboard Local OpenClaw Activation Assistant

Sprint 26B adds a local-only activation assistant for the Sprint 26A read-only connector.

This is not Production. Production remains `no-go-for-production`.

## Purpose

The assistant helps an operator create and validate a local connector config without coding.

Use one of two safe paths:

- localhost read-only endpoint: `http://127.0.0.1:<port>` or `http://localhost:<port>`
- repo-local export file: `apps/dashboard/data/local/openclaw-local-export.json`

## Local Setup

Endpoint mode:

```powershell
.\apps\dashboard\scripts\setup-local-openclaw-connector.ps1 -BaseUrl "http://127.0.0.1:8787"
```

Export file mode:

```powershell
.\apps\dashboard\scripts\setup-local-openclaw-connector.ps1 -LocalExport "apps/dashboard/data/local/openclaw-local-export.json"
```

Then run:

```bash
node apps/dashboard/scripts/validate-local-openclaw-connector-activation.mjs
node apps/dashboard/scripts/run-local-openclaw-connector.mjs
```

## Sprint 26D Bridge Note

If activation succeeds through `/health` but the Dashboard still shows zero agents and zero tasks, local OpenClaw has not exposed the read-only JSON list yet. Add `/api/local/export` on the local OpenClaw side, or create a reviewed local export file at `apps/dashboard/data/local/openclaw-local-export.json`. Do not add API keys, passwords, tokens, auth inputs, mutation routes, restart routes, deploy routes, or production endpoints.

## Safety

- Only localhost / 127.0.0.1 is allowed.
- Only GET is allowed.
- Local config is ignored by git and must not be committed.
- Local export files are ignored by git and must not be committed if they contain real tasks.
- Do not put API keys, passwords, tokens, cookies, Authorization headers, provider credentials, or Production URLs in local config.
- Dashboard will not restart, stop, start, mutate, deploy, or connect Production.
# Sprint 26G WSL Export Path

If no localhost JSON Agent/task endpoint exists, the operator can use the WSL local export adapter to create `apps/dashboard/data/local/openclaw-local-export.json`. The activation assistant should still keep the config local-only, read-only, GET-only, and uncommitted.
