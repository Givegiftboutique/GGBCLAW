# OpenClaw Dashboard Docs

## Sprint 21B: Fixture Quarantine + Single Agent Truth Alignment

- [Fixture quarantine](./openclaw-dashboard-fixture-quarantine.md)
- [Single-agent truth](./openclaw-dashboard-single-agent-truth.md)

8 agents are fixture only. The current real operator environment is expected to have a single real agent. `local-ingest` is the operator truth candidate after validation and human review. Production still `no-go-for-production`; no live production connection is enabled.

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
- Security privacy audit: `docs/dashboard/openclaw-dashboard-security-privacy-audit.md`
- Data retention: `docs/dashboard/openclaw-dashboard-data-retention.md`
- Operator security checklist: `docs/dashboard/openclaw-dashboard-operator-security-checklist.md`
- v1 internal release candidate: `docs/dashboard/openclaw-dashboard-v1-internal-release-candidate.md`
- Internal sign-off: `docs/dashboard/openclaw-dashboard-internal-signoff.md`
- Production track plan: `docs/dashboard/openclaw-dashboard-production-track-plan.md`
- Read-only production gateway readiness: `docs/dashboard/openclaw-dashboard-readonly-production-gateway-readiness.md`
- Production entry gates: `docs/dashboard/openclaw-dashboard-production-entry-gates.md`
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
node apps/dashboard/scripts/generate-security-privacy-audit.mjs
node apps/dashboard/scripts/test-generated-report-sanitization.mjs
node apps/dashboard/scripts/generate-data-retention-review.mjs
node apps/dashboard/scripts/generate-operator-security-checklist.mjs
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

## v1.0.0 Internal Release Candidate

```bash
node apps/dashboard/scripts/generate-internal-release-candidate.mjs
node apps/dashboard/scripts/generate-internal-signoff-package.mjs
node apps/dashboard/scripts/verify-v1-internal-release-candidate.mjs
node apps/dashboard/scripts/test-internal-release-candidate.mjs
```

Reports:

## Sprint 21A Production Track Planning

```bash
node apps/dashboard/scripts/generate-production-track-plan.mjs
node apps/dashboard/scripts/generate-readonly-production-gateway-readiness.mjs
node apps/dashboard/scripts/generate-production-entry-gates.mjs
node apps/dashboard/scripts/test-production-track-planning.mjs
```

Reports:

```text
apps/dashboard/data/generated/production-track-plan-report.json
apps/dashboard/data/generated/readonly-production-gateway-readiness-report.json
apps/dashboard/data/generated/production-entry-gates-report.json
```

Reality alignment blocker: current real operator environment is expected to have only 1 real agent. The 8-agent data is mock / fixture / gateway-stub lifecycle test data only, and production readiness remains blocked until Fixture Quarantine + Single Agent Truth Alignment is complete.

```text
apps/dashboard/data/generated/internal-release-candidate-report.json
apps/dashboard/data/generated/internal-signoff-package.json
```

Candidate tag: `v1.0.0-internal-rc1`.

Final internal tag after manual sign-off: `v1.0.0-internal`.

Production remains `no-go-for-production`; sign-off remains `pending` until humans approve.
