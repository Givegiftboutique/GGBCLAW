# OpenClaw Dashboard WhatsApp Sync Mock Contract

## Scope
28D is offline mock only. There is no live WhatsApp API, no webhook route, and no network call.

## Safety rules
- No token, cookie, session, password, or credential input
- No QR login
- No production connection
- No mutation, restart, or deploy
- No raw chat in fixtures or reports

## Next phase
28E is a local fake webhook fixture runner, still offline and still no network.

28G adds a read-only fake provider sandbox that maps fixture-backed provider events into this 28D mock contract before any runner logic. It remains fake provider only: no real WhatsApp API, no webhook, no endpoint, no HTTP listener, no network, no token/cookie/session, no send/reply, and no production.

28H can be a real WhatsApp API preflight only, still no production and no app-facing sync.
