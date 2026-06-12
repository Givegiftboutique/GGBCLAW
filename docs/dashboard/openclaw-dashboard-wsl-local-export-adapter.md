# OpenClaw Dashboard WSL Local Export Adapter

Sprint 26G adds a separate read-only adapter for local OpenClaw running inside WSL. It does not patch the installed OpenClaw runtime package or any `dist` file.

## Purpose

The Dashboard connector can already read `apps/dashboard/data/local/openclaw-local-export.json`, but the localhost OpenClaw gateway currently does not expose JSON Agent/task routes. The WSL export adapter fills that gap by reading only safe local state metadata and writing a Dashboard-readable local export file.

## Operator Command

Dry run first:

```powershell
.\apps\dashboard\scripts\generate-openclaw-local-export-from-wsl.ps1 -Distro "Ubuntu-24.04" -StateDir "<WSL_OPENCLAW_STATE_DIR>" -DryRun
```

If the dry run is safe, create the ignored local export:

```powershell
.\apps\dashboard\scripts\generate-openclaw-local-export-from-wsl.ps1 -Distro "Ubuntu-24.04" -StateDir "<WSL_OPENCLAW_STATE_DIR>"
```

Then rerun the Dashboard connector:

```bash
node apps/dashboard/scripts/run-local-openclaw-connector.mjs
```

## Output

Ignored local export, never commit:

```text
apps/dashboard/data/local/openclaw-local-export.json
```

Redacted adapter report:

```text
apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json
```

## Safety Rules

- Read-only metadata only.
- No restart, stop, start, mutation, deploy, or Production Gateway.
- No provider sign-in, WhatsApp live interface, external interface, tunnel, or LAN scan.
- No environment secret file, provider key, pass phrase, browser value, request sign-in header, sign-in material, or provider config read.
- No raw prompt, session, message, content, body, input, output, or response in the export.
- SQLite and session sources are treated cautiously; if a task source may contain sensitive rows, it is skipped and reported as a warning.

## Dashboard Behavior

When the local export source is `wsl-openclaw-safe-export-adapter`, the Dashboard shows that local OpenClaw is connected through a safe WSL export. If tasks are skipped, the UI explains that task contents may contain sensitive data and were not displayed automatically.

Production remains `no-go-for-production`.
