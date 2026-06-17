# TASK-20260609-OC-DASH-28G

## Purpose

Build the WhatsApp read-only fake provider sandbox for OpenClaw Dashboard.

## Scope

- Fake provider interface for sanitized provider-like events.
- Fixture-backed event source only.
- Sandbox runner that maps events into Sprint 28D mock contract shape.
- Pass-through into Sprint 28E fake runner logic.
- Redacted sandbox report.
- UI disabled/offline provider status.
- Quality gate, safety scan, verifier, and RC audit wiring.

## Guardrails

- No real WhatsApp API.
- No webhook route, endpoint, server endpoint, or HTTP listener.
- No network calls or polling client.
- No endpoint, token, cookie, session, password, credential, QR login, or WhatsApp Web login.
- No `.env` read or secret manager implementation.
- No raw WhatsApp chat, real phone number, real private chat, real name, real address, or credential fixture.
- No send, reply, update, delete, auto reply, mutation, restart, deploy, or production.
- `productionReady` remains `false`.

## Verification

- `node apps/dashboard/scripts/run-whatsapp-readonly-fake-provider-sandbox.mjs`
- `node apps/dashboard/scripts/test-whatsapp-readonly-fake-provider-sandbox.mjs`
- 28D/28E/28F regression commands.
- Dashboard quality gates.
- Dashboard safety scan.
- Dashboard verifier.
- PowerShell launch regression.

## Next Phase

28H may evaluate real WhatsApp API preflight only. It must remain non-production and must not create app-facing sync, send/reply, webhook mutation, or production wiring.
