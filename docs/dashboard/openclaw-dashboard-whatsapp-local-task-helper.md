# OpenClaw Dashboard WhatsApp Local Task Helper

Sprint 28B adds a local-only helper for turning operator-cleaned WhatsApp task notes into the ignored local import JSON used by the Dashboard.

This is not a WhatsApp integration. The helper does not call WhatsApp API, does not create a webhook, does not scan QR login, does not read browser cookies or sessions, and does not auto-reply.

## Files

Committed templates:

```text
apps/dashboard/data/local/whatsapp-task-helper-input.template.txt
apps/dashboard/data/local/whatsapp-task-helper-input.example.txt
```

Ignored real input:

```text
apps/dashboard/data/local/whatsapp-task-helper-input.txt
apps/dashboard/data/local/whatsapp-task-helper-input.*.local.txt
```

Generated redacted report:

```text
apps/dashboard/data/generated/whatsapp-local-task-helper-report.json
```

## Usage

Prepare cleaned task blocks locally, then run:

```powershell
.\apps\dashboard\scripts\build-whatsapp-local-task-import.ps1 -Input "apps/dashboard/data/local/whatsapp-task-helper-input.txt"
```

The helper writes the ignored local import file only when the input is safe:

```text
apps/dashboard/data/local/whatsapp-task-import.json
```

## Safety

Do not paste raw private chat logs, phone numbers, addresses, payment details, passwords, API keys, tokens, cookies, Authorization values, or credentials.

If the helper sees phone-like or credential-like content, it marks the report as review-required or unsafe-rejected and does not expose raw text in generated reports.

Production remains `no-go-for-production`; mutation, restart, deploy, auth, webhook, and WhatsApp API remain disabled.
# WhatsApp Local Task Helper

This helper remains local-only. It prepares sanitized tasks for Dashboard import and does not connect to WhatsApp API.

## 28D mock contract note

The local helper remains the active operator flow. The mock contract does not connect to WhatsApp.

## 28D-28F readiness note

The local helper remains the active operator path. The fake webhook runner does not read helper input, open a webhook route, call the network, or create live WhatsApp tasks.
