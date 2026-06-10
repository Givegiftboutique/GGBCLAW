# OpenClaw Dashboard Local Ingest

Task: `TASK-20260609-OC-DASH-09A`

Local ingest reads safe local JSON files and maps them into the existing Dashboard data model. CSV is documented as future work and is not parsed in Sprint 09A.

## Supported JSON Shapes

- `dashboardExport`
- `crawlerOutput`
- `agentRunLog`
- `taskMemoryIndex`
- `artifactIndex`

Sample path:

```text
apps/dashboard/data/local-ingest/
```

Open:

```text
http://localhost:5173/?source=local-ingest
http://localhost:5173/?source=local-ingest&data=./data/local-ingest/local-dashboard-ingest.sample.json
```

## Safety

- Local files only.
- No secrets, tokens, cookies, passwords, production endpoints, or absolute machine paths.
- `safetyMode` must be `read-only`.
- `mutationEnabled` must be `false`.
- Production wiring remains disabled.

## Fallback

If local ingest loading or validation fails, the dashboard falls back to the generated snapshot when available, then mock.

## Sprint 15A Real Local Data Pilot

Local ingest can load the generated sanitized pilot snapshot:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.generated.json
```

Generate it with:

```bash
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
```

The snapshot keeps safety mode read-only, mutation enabled false, production wiring disabled, absolute paths redacted, secrets redacted, and production endpoints blocked.
