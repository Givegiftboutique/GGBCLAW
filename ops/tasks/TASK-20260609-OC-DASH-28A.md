---
task: TASK-20260609-OC-DASH-28A
title: OpenClaw Dashboard WhatsApp Local Task Import Design
status: completed
scope: local-only dashboard task import
---

## Summary

Sprint 28A adds a local-only WhatsApp task import flow. Operators manually prepare sanitized task summaries in an ignored local JSON file. The Dashboard reads only generated redacted reports.

## Acceptance Criteria

- No WhatsApp API.
- No webhook.
- No QR login.
- No token, cookie, session, credential, or Authorization handling.
- Real import files are ignored and not committed.
- Safe WhatsApp tasks can merge into the local task inbox report.

## Commands Executed

- `node apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs`
- `node apps/dashboard/scripts/test-whatsapp-local-task-import.mjs`
- `node apps/dashboard/scripts/generate-local-task-inbox-report.mjs`
- `node apps/dashboard/scripts/run-dashboard-quality-gates.mjs`
- `node apps/dashboard/scripts/safety-scan-dashboard.mjs`
- `node apps/dashboard/verify-dashboard.mjs`

## Risk Notes

Real WhatsApp messages must remain local-only. Operators should enter cleaned task summaries only.
