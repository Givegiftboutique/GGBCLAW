# OpenClaw Dashboard Dev Gateway Read-only Live Drill

Task: `TASK-20260609-OC-DASH-16A`

## Purpose

This drill verifies that the `dev-gateway` source can read a localhost-only gateway fixture server through read-only `GET` endpoints. It is a local operator drill only.

Production remains disabled. No production Gateway, production API, mutation endpoint, credentials, auth header, token, cookie, deploy workflow, or CI is used.

## Localhost Fixture Server

```bash
node apps/dashboard/scripts/start-dev-gateway-fixture-server.mjs --port 8787
```

The fixture server:

- Binds only to `127.0.0.1`.
- Uses Node built-in `http`.
- Serves data from `apps/dashboard/data/gateway-stub/*.json`.
- Returns `safetyMode: read-only`.
- Returns `mutationEnabled: false`.
- Returns `productionWiring: disabled`.
- Returns `fixtureServer: true`.
- Rejects `POST`, `PUT`, `PATCH`, and `DELETE` with HTTP 405.

## Allowed URLs

- `http://localhost:8787`
- `http://127.0.0.1:8787`

## Blocked URLs

- `https://production.example.com`
- `https://api.example.com`
- `https://live.example.com`
- `http://example.com`
- Any production-like or unlisted host.

## Read-only Endpoints

- `/health`
- `/dashboard/metrics`
- `/dashboard/agents`
- `/dashboard/agents/:id`
- `/dashboard/tasks`
- `/dashboard/tasks/:id`
- `/dashboard/reviews`
- `/dashboard/logs`
- `/dashboard/backups`
- `/dashboard/settings`
- `/dashboard/rbac`
- `/dashboard/source-status`

## Client Safety

- `credentials: "omit"`
- No Authorization header.
- No cookie handling.
- No token handling.
- No mutation method path in the dev gateway client.

## Drill Command

```bash
node apps/dashboard/scripts/run-dev-gateway-live-drill.mjs
node apps/dashboard/scripts/test-dev-gateway-live-drill.mjs
```

Report path:

```text
apps/dashboard/data/generated/dev-gateway-live-drill-report.json
```

## Browser Test URL

```text
http://localhost:5173/?source=dev-gateway&baseUrl=http://localhost:8787
```

## Troubleshooting

- If the dashboard falls back, confirm the fixture server is running on `127.0.0.1:8787`.
- If a production-like URL is blocked, that is expected.
- If a mutation method returns 405, that is expected.
- If credentials or Authorization markers appear, stop and rerun the safety scan.
