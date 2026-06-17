# OpenClaw Dashboard WhatsApp Real API Preflight Gate

Sprint 28H adds a real WhatsApp API preflight gate.

This is preflight only. It is not a real WhatsApp API integration sprint, not a webhook implementation sprint, and not a production sprint.

## Scope

- Confirms the Dashboard remains local-only and fake-only.
- Confirms real API, webhook, token, auth, send/reply, mutation, and production remain disabled.
- Confirms safety design, secret manager design, mock contract, fake provider sandbox, and local fallback evidence exist.
- Writes `apps/dashboard/data/generated/whatsapp-real-api-preflight-gate-report.json`.

## Guardrails

- No real WhatsApp API.
- No webhook route or endpoint.
- No HTTP listener.
- No network call or polling client.
- No token, cookie, session, password, credential, or endpoint input.
- No `.env` read.
- No secret manager implementation.
- No QR login or WhatsApp Web login.
- No browser cookie/session read.
- No send, reply, auto reply, mutation, restart, deploy, or production.
- No real phone numbers, raw private chat, or real WhatsApp payloads.

## Required Blockers

- No real secret manager implementation.
- No approved real provider credentials.
- No webhook verification implementation.
- No privacy / deletion production approval.
- No legal / consent approval.
- No production data-retention policy implementation.
- No abuse/spam handling implementation.
- No operator approval workflow for real inbound events.
- No incident rollback runbook for real WhatsApp sync.

## Next Phase

28I can be read-only sync planning or ignored local config design only. It must still avoid production, app-facing sync, real network calls, webhook delivery, send/reply, and auto-reply.

## Sprint 28I Follow-up

Sprint 28I adds only a WhatsApp read-only sandbox config gate. It remains local-only and fail-closed with no real API, webhook, endpoint, HTTP listener, network, token/cookie/session, secret manager implementation, production, send, or reply.

## Sprint 28J Follow-up

Sprint 28J adds only a WhatsApp read-only sandbox dry-run gate. It remains local-only and fail-closed with no real API, webhook, endpoint, HTTP listener, network, token/cookie/session, secret manager implementation, production, send, or reply. The next phase can only be a manual approval checklist or RC5 checkpoint, not production.
