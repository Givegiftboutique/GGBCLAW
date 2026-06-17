# OpenClaw Dashboard WhatsApp Sync Safety Design

## Scope
This document defines future WhatsApp sync safety only. Current delivery remains local-only. There is no live WhatsApp API code in 28C.

## Current safe state
- Local helper input
- Local import JSON
- Dashboard reads sanitized task records
- No raw chat dump
- No token, cookie, or session handling

## Threat model
- Leaked phone numbers
- Raw private chat exposure
- Webhook spoofing
- Replay attacks
- Token leakage
- Accidental production connection
- Auto-reply mistakes
- Over-collection of conversation content
- Unauthorized dashboard access

## Data minimization
- Store task title, cleaned summary, status, and priority only
- Do not store full raw chat by default
- Do not store phone numbers unless explicitly approved later
- No media download by default
- No message history sync by default

## Secret handling
- No secrets in repo
- No secrets in generated reports
- No secrets in browser UI
- No secrets in logs
- Environment secret handling requires a separate approved sprint
- Rotation plan required before real API

## Webhook safety
- Require signature verification
- Require replay window
- Require idempotency key
- Require source allowlist
- Require rate limiting
- Require redacted logs
- Require dead-letter or quarantine for unsafe payloads
- Raw payload is not shown in UI

## API polling safety
- Read-only first
- No send or reply in first real sync
- No mutation until separate approval
- No auto reply until separate approval
- Explicit operator review before task creation

## UI rules
- No token input in browser
- No QR login button
- No production connect button
- Clear labels for local import, future sync, and disabled states
- Review-required state for unsafe content

## Retention and deletion
- Local import deletion steps must be documented
- Future synced data needs TTL
- Operator delete action requires audit trail without private content

## Production blockers
- Privacy policy
- Account deletion and data deletion path
- Secret manager
- Webhook verification
- Rate limit
- Logging redaction
- Abuse and spam handling
- Legal review
- User consent
- Test fixtures without real phone or private chat

## Future phase split
- 28D: webhook/API contract mock only, no network
- 28E: local fake webhook fixture runner
- 28F: secret manager design
- 28G: read-only sandbox with fake provider
- 28H: real WhatsApp API preflight, still no production
- 28I: real read-only sync behind local operator approval
- Auto-reply remains separate future phase

## 28D offline mock contract

28D adds only an offline mock contract. It does not add a webhook route or live API client.

## 28D-28F readiness bundle status

28D-28F remains offline/mock/design only. The fake webhook runner uses committed fixtures only and starts no listener, route, server, or network call. The secret manager work is a design document only; it adds no credential loader, token store, `.env` parser, provider login, or secret UI.
# Sprint 28G Note

28G adds a read-only fake provider sandbox only. It does not change the safety design into a real API or webhook implementation. There is still no endpoint, HTTP listener, network call, token/cookie/session, send/reply, mutation, or production wiring.

28H can be a real WhatsApp API preflight only, still no production and no app-facing sync.

# Sprint 28H Note

28H adds a real API preflight gate only. It does not connect WhatsApp API, add webhook, endpoint, HTTP listener, network call, token/cookie/session, secret manager implementation, send/reply, auto-reply, or production.

28I can be read-only sync planning or ignored local config design only, still no production.
