# OpenClaw Dashboard WhatsApp Read-only Sandbox Dry-run

Sprint 28J is a dry-run gate only. It runs a local, fail-closed dry-run against the Sprint 28I config gate and writes a redacted report.

It does not connect to the real WhatsApp API, add a webhook, add an endpoint, start an HTTP listener, call network, read `.env`, use token/cookie/session data, implement a secret manager, send/reply, auto-reply, mutate data, restart, deploy, or enable production.

## Files

- Dry-run module: `apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-dry-run.js`
- Dry-run runner: `apps/dashboard/scripts/run-whatsapp-readonly-sandbox-dry-run.mjs`
- Dry-run report: `apps/dashboard/data/generated/whatsapp-readonly-sandbox-dry-run-report.json`
- Config gate dependency: `apps/dashboard/src/lib/whatsapp-sync/whatsapp-readonly-sandbox-config.js`

## Behavior

The runner reads the committed 28I example config by default and may detect the ignored local config path. Raw config values are never printed. The report remains fail-closed unless a future approved phase explicitly changes the gate. `allowNetworkCalls`, webhook, send message, auto-reply, production, `productionReady`, token configuration, and raw secret-like values remain blocked.

The next phase can only be a manual approval checklist or RC5 checkpoint, not production.
