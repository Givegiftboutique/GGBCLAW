# OpenClaw Dashboard WhatsApp Fake Webhook Fixture Runner

Sprint 28E adds an offline fixture runner for future WhatsApp webhook planning.

This is not a webhook implementation. It does not open a server, create a route, call a network API, read cookies or sessions, or use tokens. It reads committed fake fixtures only and produces redacted review queue reports for operator review.

## Safety Rules

- Mock only and fixture only.
- No WhatsApp API connection.
- No webhook endpoint or HTTP listener.
- No token, cookie, session, QR login, or Authorization handling.
- No raw private chat or real phone numbers.
- No Production connection.
- No auto reply or send-message behavior.

## Outputs

- `apps/dashboard/data/generated/whatsapp-fake-webhook-fixture-runner-report.json`
- `apps/dashboard/data/generated/whatsapp-fake-webhook-review-queue-report.json`

Both reports are redacted and contain only fake fixture-derived summaries.

## Sprint 28G Integration

28G adds a read-only fake provider sandbox that maps committed fake provider events into the 28D mock contract and then passes the mapped events through this 28E fake runner logic.

This remains fixture-only and read-only: no real WhatsApp API, no webhook endpoint, no HTTP listener, no network call, no token/cookie/session, no send/reply, and no production.
