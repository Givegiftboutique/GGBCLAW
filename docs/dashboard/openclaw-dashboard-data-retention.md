# OpenClaw Dashboard Data Retention Review

Scope: Internal Operator Beta. Retention policy status: `draft-for-internal-review`.

## Command

```bash
node apps/dashboard/scripts/generate-data-retention-review.mjs
```

Report path:

```text
apps/dashboard/data/generated/data-retention-review-report.json
```

## Data Classes

- generated reports
- dashboard snapshots
- local ingest samples
- operator evidence manifest
- incident drill report
- daily summary
- release manifest
- gateway fixture reports
- local dev gateway drill reports
- docs / runbooks
- task memory
- artifact notes

## Draft Guidance

- Generated reports: keep latest committed beta reports only.
- Local real snapshots: review before commit; avoid private data.
- Incident drill reports: internal-only; review before sharing.
- Evidence manifest: local-only references; no upload.
- Logs: summarize only; no raw secret-bearing logs.

## Cleanup

Regenerate sanitized reports instead of carrying stale copies. Do not commit private data, machine-local paths, runtime config files, raw credentials, or unreviewed local logs.

Production requires a separate formal privacy and data retention review.
