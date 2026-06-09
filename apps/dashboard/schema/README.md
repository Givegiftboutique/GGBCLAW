# OpenClaw Dashboard Import / Export Schemas

Schema version: `dashboard-export-v1`

## Files

- `dashboard-export.schema.json`: dashboard-readable export contract.
- `artifact-manifest.schema.json`: artifact manifest contract for local evidence replay.

## Required Export Sections

- metadata
- metrics
- agents
- tasks
- reviews
- auditEvents
- backups
- settings
- rbac
- sourceStatus
- artifacts

## Safety Rules

- No secrets, tokens, cookies, passwords, or API keys.
- No production endpoints.
- No production import/export action.
- No approve, reject, backup, restore, settings update, delete, or cancel mutation.
- `mutationEnabled` must be `false`.
- `safetyMode` must be `read-only`.

Timestamps should use ISO 8601 strings.
