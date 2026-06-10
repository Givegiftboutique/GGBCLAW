# OpenClaw Dashboard Real Local Data Pilot

Task: `TASK-20260609-OC-DASH-15A`

## Purpose

Sprint 15A adds a local-only pilot path for discovering, sanitizing, normalizing, and viewing local OpenClaw data in the dashboard. It does not connect production API, production Gateway, or mutation endpoints.

## Supported Inputs

- CSV crawler output.
- JSON crawler output.
- Agent run logs.
- `ops/tasks` Markdown task memory.
- Artifact README or manifest index.
- Existing dashboard export JSON.

## Safe Path Rules

- Use relative paths for committed samples.
- Do not commit absolute machine paths.
- Do not read `.env`.
- Do not include secrets, tokens, cookies, passwords, API keys, or production endpoints.
- Discovery reports store display paths and hashes only.

## Redaction Behavior

The sanitizer redacts:

- API key, token, secret, password, cookie, authorization, bearer, private key markers.
- Email-like personal data.
- Absolute Windows user paths.
- Absolute POSIX home paths.
- Production-like URLs.

Markers include `[REDACTED_PATH]`, `[REDACTED_SECRET]`, `[REDACTED_EMAIL]`, and `[REDACTED_PRODUCTION_URL]`.

## Generated Snapshot

```text
apps/dashboard/data/generated/real-local-dashboard-export.generated.json
```

Open in browser:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

## Commands

```bash
node apps/dashboard/scripts/discover-real-local-data.mjs
node apps/dashboard/scripts/generate-real-local-dashboard-snapshot.mjs
node apps/dashboard/scripts/generate-real-local-data-pilot-report.mjs
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
```

## Troubleshooting

If a file is skipped, check the discovery report warnings. Files over 2MB, unsupported extensions, hidden secret-like files, binary files, and ignored directories are not included in the committed generated outputs.

Production remains no-go and mutation remains disabled.
