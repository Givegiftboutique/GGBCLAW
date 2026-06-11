# OpenClaw Dashboard Docs

## Sprint 22C: Local Health Evidence Review

- [Local health evidence review](./openclaw-dashboard-local-health-evidence-review.md)
- Report path: `apps/dashboard/data/generated/local-health-evidence-review-report.json`
- Checklist path: `apps/dashboard/data/generated/operator-local-health-evidence-checklist.json`
- Evidence statuses: `reviewed-valid`, `missing-fallback`, `reviewed-invalid-fallback`, `sample-fallback`, `review-required`, `unsafe-rejected`
- Redaction applied; raw values never printed.
- Production still no-go; no restart, no mutation, no production gateway.

## Sprint 21C: Single-agent Local Snapshot

- [Single-agent local snapshot](./openclaw-dashboard-single-agent-local-snapshot.md)
- Snapshot path: `apps/dashboard/data/generated/real-local-dashboard-export.single-agent.generated.json`
- Browser URL: `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`
- Expected / actual real agent count: 1
- Production remains `no-go-for-production`.

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
- Operator source selection: `docs/dashboard/openclaw-dashboard-operator-source-selection.md`
- Source lockdown: `docs/dashboard/openclaw-dashboard-source-lockdown.md`
- Local health evidence review: `docs/dashboard/openclaw-dashboard-local-health-evidence-review.md`

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

## Sprint 21D Operator Source Selection Lockdown

Recommended operator URL:

```text
http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json
```

Run:

```bash
node apps/dashboard/scripts/generate-operator-source-lockdown-report.mjs
node apps/dashboard/scripts/generate-operator-source-selection-checklist.mjs
node apps/dashboard/scripts/test-operator-source-lockdown.mjs
```

Reports:

```text
apps/dashboard/data/generated/operator-source-lockdown-report.json
apps/dashboard/data/generated/operator-source-selection-checklist.json
```

`mock` and `gateway-stub` are explicit fixture/demo sources only and show high warning banners. The single-agent local-ingest snapshot is the operator truth candidate. Production still no-go.
## Sprint 22A Local Real Agent Health

- [Local agent health](openclaw-dashboard-local-agent-health.md)
- local real agent health source is `local-file-only`.
- Report path: `apps/dashboard/data/generated/local-real-agent-health-report.json`
- Checklist path: `apps/dashboard/data/generated/operator-agent-health-checklist.json`
- expected real agent count = 1.
- no restart, no mutation, production still no-go.

## Sprint 22B Sanitized Local Health Intake

- Reviewed example: `apps/dashboard/data/local/reviewed-local-agent-health.example.json`
- Optional local-only reviewed input: `apps/dashboard/data/local/reviewed-local-agent-health.json`
- Valid reviewed input: `healthSource = local-reviewed-json`
- Missing or invalid reviewed input: fallback to `healthSource = local-file-only`
- Guardrails: no production gateway, no restart, no mutation, no secrets, production remains `no-go-for-production`.

## Sprint 23A Operator Usability MVP

- [Operator usability MVP](openclaw-dashboard-operator-usability-mvp.md)
- Launch script: `apps/dashboard/scripts/start-operator-dashboard.ps1`
- Recommended URL: `http://localhost:5173/?source=local-ingest&data=./data/generated/real-local-dashboard-export.single-agent.generated.json`
- Daily checklist: `apps/dashboard/data/generated/operator-daily-usability-checklist.json`
- Troubleshooting report: `apps/dashboard/data/generated/operator-usability-troubleshooting-report.json`
- Production remains `no-go-for-production`; restart, mutation, and production gateway remain disabled.

## Sprint 23B Daily Operator Runbook Mode

- [Daily operator runbook mode](openclaw-dashboard-daily-operator-runbook-mode.md)
- Summary report: `apps/dashboard/data/generated/daily-operator-summary-report.json`
- Runbook checklist: `apps/dashboard/data/generated/daily-operator-runbook-checklist.json`
- Status values: `OK`, `Review Required`, `Blocked`, `Fixture Mode`, `Unknown`
- Safe next steps are shown in the UI; restart, mutation, deploy, and production gateway connection remain blocked.
