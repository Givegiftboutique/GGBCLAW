# OpenClaw Dashboard Dev Gateway

Task: `TASK-20260609-OC-DASH-09A`

The dev gateway adapter is read-only, disabled by default, and available only when explicitly requested by query string.

## Source Mode

```text
http://localhost:5173/?source=dev-gateway
http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787
http://localhost:5173/?source=dev-gateway&baseUrl=http://127.0.0.1:8787
```

Without `baseUrl`, no network request is made and the dashboard falls back safely.

## Allowed Base URLs

- `http://localhost:<port>`
- `http://127.0.0.1:<port>`
- `http://0.0.0.0:<port>`
- `http://dev.local:<port>`
- `http://openclaw-dev.local:<port>`

## Blocked Base URLs

- Production-like URLs.
- Hosts containing `prod`, `production`, `live`, `real`, `secret`, or `token`.
- Unlisted hosts.
- HTTPS API-style production hosts.

## Client Rules

- Read-only `GET` only.
- `credentials: "omit"` only.
- No auth headers.
- No cookies.
- No localStorage or sessionStorage token handling.
- No mutation endpoints.

## Fallback

Blocked, missing, or failed dev gateway sources fall back to gateway-stub, then generated snapshot, then mock.

## Sprint 16A Live Drill

Use the localhost fixture server to test the read-only dev gateway path without production wiring:

```bash
node apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs --port 8787
node apps/dashboard/scripts/run-dev-gateway-live-drill.mjs
node apps/dashboard/scripts/test-dev-gateway-live-drill.mjs
```

Report path: `apps/dashboard/data/generated/dev-gateway-live-drill-report.json`

Browser URL: `http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787`

Safety: localhost only, `credentials: "omit"`, no Authorization header, no cookie/token handling, no mutation method, production URL blocked.
