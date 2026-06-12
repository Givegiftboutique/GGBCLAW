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

## Safety

- Only localhost / 127.0.0.1 is allowed.
- Only GET is allowed.
- Local config is ignored by git and must not be committed.
- Local export files are ignored by git and must not be committed if they contain real tasks.
- Do not put API keys, passwords, tokens, cookies, Authorization headers, provider credentials, or Production URLs in local config.
- Dashboard will not restart, stop, start, mutate, deploy, or connect Production.
