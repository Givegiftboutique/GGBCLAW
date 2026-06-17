# OpenClaw Dashboard WhatsApp Read-only Fake Provider Sandbox

Sprint 28G adds a read-only fake provider sandbox for future WhatsApp provider planning.

This is fake provider sandbox only. It is not a WhatsApp API sprint, not a webhook sprint, and not a production sprint.

## Scope

- Fake provider interface: `whatsapp-readonly-fake-provider`.
- Provider mode: `offline-fixture-only`.
- Input source: committed fake fixture only.
- Sandbox runner: `apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs`.
- Redacted report: `apps/dashboard/data/generated/whatsapp-readonly-fake-provider-sandbox-report.json`.
- Integration path: fake provider event -> Sprint 28D mock contract -> Sprint 28E fake runner logic.

## Guardrails

- No real WhatsApp API.
- No webhook endpoint or route.
- No HTTP listener.
- No network call.
- No endpoint, token, cookie, session, password, or credential input.
- No `.env` read.
- No secret manager implementation.
- No QR login or WhatsApp Web login.
- No browser cookie/session read.
- No send, reply, update, delete, auto reply, mutation, restart, or deploy.
- No real phone numbers, real names, addresses, raw private chat, or raw WhatsApp payloads in fixtures or reports.
- `productionReady` remains `false`.

## Verification

Run:

```bash
node apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs
node apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

## Next Phase

Sprint 28H may be a real WhatsApp API preflight only if separately approved. 28H still must not enable production, app-facing sync, send/reply, webhook delivery, or mutation.

## Sprint 28H Update

28H is now a preflight gate only. It reads committed docs/reports and confirms the fake provider sandbox remains the only provider-like event source. No real API, webhook, endpoint, HTTP listener, network call, token/cookie/session, send/reply, auto-reply, or production is added.

## Sprint 28I Follow-up

Sprint 28I adds only an ignored local config gate for a future manually approved read-only sandbox dry-run. It still has no real WhatsApp API, webhook, endpoint, HTTP listener, network, token/cookie/session, production, send, or reply.

## Sprint 28J Follow-up

Sprint 28J remains separate from the fake provider sandbox. It is a local dry-run gate only and still has no real WhatsApp API, webhook, endpoint, HTTP listener, network, token/cookie/session, production, send, or reply.
