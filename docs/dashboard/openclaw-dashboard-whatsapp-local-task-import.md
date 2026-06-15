# OpenClaw Dashboard WhatsApp Local Task Import

Sprint 28A adds a local-only way to bring manually prepared WhatsApp tasks into the Dashboard.

This is not a WhatsApp integration. The Dashboard does not call the WhatsApp API, does not use a webhook, does not read browser cookies or sessions, does not scan QR codes, and does not auto-reply.

## Safe Input

Use the template:

`apps/dashboard/data/local/whatsapp-task-import.template.json`

Copy it locally to:

`apps/dashboard/data/local/whatsapp-task-import.json`

The real import file is ignored by Git. Do not commit it.

Only include cleaned task summaries: title, short summary, status, priority, and next step.

Do not include full private chats, contact phone numbers, API keys, passwords, tokens, cookies, Authorization values, or credentials.

## Reports

Generate the redacted local report:

`node apps/dashboard/scripts/generate-whatsapp-local-task-import-report.mjs`

Then regenerate the task inbox report:

`node apps/dashboard/scripts/generate-local-task-inbox-report.mjs`

Dashboard reads `apps/dashboard/data/generated/whatsapp-local-task-import-report.json` and merges safe tasks into `apps/dashboard/data/generated/local-task-inbox-report.json`.

## Safety

The report keeps `whatsappApiConnected: false`, `webhookEnabled: false`, `authEnabled: false`, `productionReady: false`, `rawChatPrinted: false`, and `secretRedactionApplied: true`.

Future real WhatsApp sync requires a separate security-approved sprint.
