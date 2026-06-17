# TASK-20260609-OC-DASH-28I

Sprint 28I adds the WhatsApp read-only sandbox config gate.

Scope:
- Config gate only.
- Ignored local config contract.
- Disabled example config.
- Fail-closed validator and redacted report.
- No real WhatsApp API, webhook, endpoint, HTTP listener, network, token/cookie/session, `.env`, secret manager implementation, send/reply, auto-reply, mutation, restart, deploy, or production.

Verification:
- `node apps/dashboard/scripts/check-whatsapp-readonly-sandbox-config-gate.mjs`
- `node apps/dashboard/scripts/test-whatsapp-readonly-sandbox-config-gate.mjs`
- Dashboard quality gates, safety scan, and verifier.
