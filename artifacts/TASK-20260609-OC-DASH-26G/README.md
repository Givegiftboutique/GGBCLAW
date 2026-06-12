# TASK-20260609-OC-DASH-26G Artifacts

This folder records Sprint 26G artifact references.

## Scope

WSL Local OpenClaw Safe Export Adapter for Dashboard. Local-only, read-only, no production, no mutation, no restart, no deploy.

## Key Artifacts

- Adapter script: `apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.mjs`
- PowerShell helper: `apps/dashboard/scripts/generate-openclaw-local-export-from-wsl.ps1`
- Redacted report: `apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json`
- Ignored local export: `apps/dashboard/data/local/openclaw-local-export.json`

## Safety

The ignored local export must not be committed. The adapter skips raw prompt, session, message, content, body, input, output, response, token, key, password, secret, cookie, authorization, and credential fields.
