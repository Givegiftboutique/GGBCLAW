# TASK-20260609-OC-DASH-28B

## Title

WhatsApp Local Task Helper

## Scope

Local-only helper for cleaned WhatsApp task blocks. The helper builds an ignored local import JSON and a redacted generated report for the Dashboard.

## Safety

- No WhatsApp API
- No webhook
- No QR login
- No cookies or sessions
- No tokens, passwords, API keys, or credentials
- No production connection
- No mutation, restart, or deploy
- No raw chat dump in repo

## Local Files

- `apps/dashboard/data/local/whatsapp-task-helper-input.template.txt`
- `apps/dashboard/data/local/whatsapp-task-helper-input.example.txt`
- `apps/dashboard/data/local/whatsapp-task-helper-input.txt` (ignored)
- `apps/dashboard/data/generated/whatsapp-local-task-helper-report.json`

