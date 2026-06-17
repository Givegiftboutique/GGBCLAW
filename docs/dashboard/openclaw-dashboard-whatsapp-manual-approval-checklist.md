# OpenClaw Dashboard WhatsApp Manual Approval Checklist

Sprint 28K is a manual approval checklist and go/no-go gate only. Current status is `no-go`.

It does not connect to the real WhatsApp API, add a webhook, add an endpoint, start an HTTP listener, call network, read `.env`, use token/cookie/session data, implement a secret manager, send/reply, auto-reply, mutate data, restart, deploy, or enable production.

## Files

- Checklist module: `apps/dashboard/src/lib/whatsapp-sync/whatsapp-manual-approval-checklist.js`
- Go/no-go runner: `apps/dashboard/scripts/check-whatsapp-manual-approval-go-no-go.mjs`
- Go/no-go report: `apps/dashboard/data/generated/whatsapp-manual-approval-go-no-go-report.json`

## Required Blockers

- Operator approval missing
- Privacy policy approval missing
- Account/data deletion path missing
- Legal review missing
- User consent model missing
- Abuse/spam handling missing
- Incident rollback runbook missing
- Real secret manager not implemented
- Webhook verification not implemented
- Real provider credentials not approved
- Production data retention not approved
- Send/reply approval missing
- Auto-reply approval missing

## Boundary

28K keeps WhatsApp local-only, fake-only, and dry-run only. Production, real sync, send/reply, auto-reply, token/cookie/session handling, webhook setup, endpoint setup, HTTP listener, and network calls remain disabled.

The next phase can only be planning or an RC checkpoint, not production.
