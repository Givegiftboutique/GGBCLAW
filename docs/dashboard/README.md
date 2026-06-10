# OpenClaw Dashboard Docs

Status: Internal Operator Beta.

狀態：內部 Operator Beta。

Production: no-go.

Production 暫不可上線。

## Quick start / 快速開始

在本地啟動 static dashboard：

```powershell
cd "C:\Users\marke\Documents\FOR GGB OPENCLAW\apps\dashboard"
python -m http.server 5173
```

打開：

```text
http://localhost:5173/?source=local-ingest#/dashboard
```

## Source Modes / 資料來源模式

以下 source mode values 保持原文，不要翻譯或改名。

- `mock`
- `json`
- `artifact`
- `gateway-stub`
- `local-ingest`
- `dev-gateway`

All source modes keep safety mode read-only, mutation enabled false, and production wiring disabled.

## Main References

- Operator runbook: `docs/dashboard/openclaw-dashboard-operator-runbook.md`
- Local ingest: `docs/dashboard/openclaw-dashboard-local-ingest.md`
- Dev gateway: `docs/dashboard/openclaw-dashboard-dev-gateway.md`
- Dev gateway live drill: `docs/dashboard/openclaw-dashboard-dev-gateway-live-drill.md`
- Operator daily workflow: `docs/dashboard/openclaw-dashboard-operator-daily-workflow.md`
- Operator incident drill: `docs/dashboard/openclaw-dashboard-operator-incident-drill.md`
- Internal static hosting dry run: `docs/dashboard/openclaw-dashboard-internal-static-hosting.md`
- Operator access checklist: `docs/dashboard/openclaw-dashboard-operator-access-checklist.md`
- RBAC: `docs/dashboard/openclaw-dashboard-rbac.md`
- Action drafts: `docs/dashboard/openclaw-dashboard-action-drafts.md`
- Release workflow: `docs/dashboard/openclaw-dashboard-operator-release-workflow.md`
- Observability: `docs/dashboard/openclaw-dashboard-observability.md`
- Production readiness: `docs/dashboard/openclaw-dashboard-production-readiness.md`
- Real local data pilot: `docs/dashboard/openclaw-dashboard-real-local-data-pilot.md`
- Snapshot refresh drill: `docs/dashboard/openclaw-dashboard-snapshot-refresh-drill.md`
- Repo hygiene: `docs/dashboard/openclaw-dashboard-repo-hygiene.md`
- Operator handoff: `docs/dashboard/openclaw-dashboard-operator-handoff.md`
- Troubleshooting: `docs/dashboard/openclaw-dashboard-troubleshooting.md`
- Manual smoke tests: `tests/manual-smoke-tests.md`

## Final Beta Checks

```bash
node apps/dashboard/scripts/generate-final-beta-audit.mjs
node apps/dashboard/scripts/verify-final-beta.mjs
node apps/dashboard/scripts/run-real-local-snapshot-refresh-drill.mjs
node apps/dashboard/scripts/test-real-local-data-pilot.mjs
node apps/dashboard/scripts/run-internal-static-hosting-dry-run.mjs
node apps/dashboard/scripts/generate-operator-access-checklist.mjs
node apps/dashboard/scripts/run-dashboard-quality-gates.mjs
node apps/dashboard/scripts/safety-scan-dashboard.mjs
node apps/dashboard/verify-dashboard.mjs
```

Final beta audit report:

```text
apps/dashboard/data/generated/final-beta-audit-report.json
```

Suggested final beta tag:

```text
v0.1.0-beta
```
