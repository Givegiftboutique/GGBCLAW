# TASK-20260609-OC-DASH-28H

## Purpose

Build the WhatsApp real API preflight gate for OpenClaw Dashboard.

## Scope

- Preflight gate module.
- Preflight report generator.
- Tests for disabled real API, webhook, token, auth, send/reply, mutation, and production.
- UI disabled panel.
- Quality gate, safety scan, verifier, and RC audit wiring.

## Guardrails

- No real WhatsApp API.
- No webhook route, endpoint, server endpoint, HTTP listener, or polling client.
- No network calls.
- No endpoint, token, cookie, session, password, credential, QR login, or WhatsApp Web login.
- No `.env` read or secret manager implementation.
- No raw WhatsApp chat, real phone number, real private chat, real name, real address, or credential fixture.
- No send, reply, update, delete, auto reply, mutation, restart, deploy, or production.
- `productionReady` remains `false`.
- Leave `GGBCLAW/` untouched.

## Verification

- `node apps/dashboard/scripts/check-whatsapp-real-api-preflight-gate.mjs`
- `node apps/dashboard/scripts/test-whatsapp-real-api-preflight-gate.mjs`
- 28G/28D/28E/28F regression commands.
- Dashboard quality gates.
- Dashboard safety scan.
- Dashboard verifier.
- PowerShell launch regression.

## Next Phase

28I can be read-only sync planning or ignored local config design only. It must still avoid production, app-facing sync, real network calls, webhook delivery, send/reply, and auto-reply.
