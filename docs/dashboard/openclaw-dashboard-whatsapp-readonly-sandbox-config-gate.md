# OpenClaw Dashboard WhatsApp Read-only Sandbox Config Gate

Sprint 28I is a config gate only. It adds an ignored local config contract and a fail-closed validator for a future manually approved WhatsApp read-only sandbox dry-run.

It does not connect to the real WhatsApp API, add a webhook, add an endpoint, start an HTTP listener, call network, read `.env`, use token/cookie/session data, implement a secret manager, send/reply, auto-reply, mutate data, or enable production.

## Files

- Example config: `apps/dashboard/config/whatsapp-readonly-sandbox.example.json`
- Ignored local config: `apps/dashboard/config/whatsapp-readonly-sandbox.local.json`
- Gate module: `apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js`
- Gate report: `apps/dashboard/data/generated/whatsapp-readonly-sandbox-config-gate-report.json`

## Gate Behavior

The committed example config is disabled and fail-closed. Missing config is blocked as `config_missing`. The example config is blocked as `sandbox_disabled`. Webhook, send message, auto-reply, production, `productionReady: true`, token configured, raw credential strings, and phone-like values are rejected.

The next phase can only prepare a manually approved read-only sandbox dry-run. It still cannot enable production, send/reply, webhook delivery, network calls, or app-facing sync.
