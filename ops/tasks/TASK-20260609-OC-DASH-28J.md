# TASK-20260609-OC-DASH-28J

Sprint 28J adds the WhatsApp read-only sandbox dry-run gate.

Scope:
- Dry-run gate only.
- Uses the 28I config validator.
- Detects example or ignored local config without printing raw values.
- Writes a redacted fail-closed dry-run report.
- No real WhatsApp API, webhook, endpoint, HTTP listener, network, token/cookie/session, `.env`, secret manager implementation, send/reply, auto-reply, mutation, restart, deploy, or production.

Verification:
- `node apps/dashboard/scripts/run-whatsapp-readonly-sandbox-dry-run.mjs`
- `node apps/dashboard/scripts/test-whatsapp-readonly-sandbox-dry-run.mjs`
- Dashboard quality gates, safety scan, and verifier.
