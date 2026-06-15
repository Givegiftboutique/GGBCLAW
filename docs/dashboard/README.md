# OpenClaw Dashboard Docs

## Sprint 27A: Safe Task Metadata Discovery

- [Safe task metadata discovery](./openclaw-dashboard-safe-task-metadata-discovery.md)
- Discovery report: `apps/dashboard/data/generated/wsl-openclaw-task-metadata-schema-discovery-report.json`
- Purpose: inspect WSL OpenClaw SQLite schema only, so operators can decide whether a future metadata-only task extraction is safe.
- Boundary: no raw rows, no task body/prompt/message/content/input/output, no secrets, no Production, no mutation, restart, or deploy.

## Sprint 26G: WSL Local OpenClaw Safe Export Adapter

- [WSL local export adapter](./openclaw-dashboard-wsl-local-export-adapter.md)
- Adapter report: `apps/dashboard/data/generated/wsl-openclaw-local-export-adapter-report.json`
- Ignored local export: `apps/dashboard/data/local/openclaw-local-export.json`
- Purpose: safely convert WSL OpenClaw state metadata into a Dashboard-readable local export without patching installed runtime `dist` files.
- Boundary: read-only metadata only; no `.env`, secrets, raw prompts/sessions/messages/content, Production, mutation, restart, or deploy.

## Sprint 26A: Local OpenClaw Read-only Connector MVP

- [Local OpenClaw read-only connector](./openclaw-dashboard-local-openclaw-readonly-connector.md)
- [Local OpenClaw real bridge](./openclaw-dashboard-local-openclaw-real-bridge.md)
- Connector report: `apps/dashboard/data/generated/local-openclaw-connector-report.json`
- Bridge report: `apps/dashboard/data/generated/openclaw-local-export-bridge-report.json`
- Local config template/example: `apps/dashboard/data/local/local-openclaw-connector.template.json`
- Real local config: `apps/dashboard/data/local/local-openclaw-connector.json` must stay untracked.
- Boundary: localhost / 127.0.0.1 only, GET only, local-only, read-only.
- Production remains no-go; no production gateway, endpoint/auth/token input, mutation, restart, deploy, or secrets are added.

## Sprint 25C: Operator UX + Task Visibility + Hourly Refresh + Balance Center

- [Operator UX polish](./openclaw-dashboard-operator-ux-polish.md)
- [Local task inbox](./openclaw-dashboard-local-task-inbox.md)
- [Hourly refresh](./openclaw-dashboard-hourly-refresh.md)
- [Provider balance center](./openclaw-dashboard-provider-balance-center.md)
- Task inbox report: `apps/dashboard/data/generated/local-task-inbox-report.json`
- WhatsApp visibility checklist: `apps/dashboard/data/generated/whatsapp-task-visibility-checklist.json`
- Hourly refresh policy: `apps/dashboard/data/generated/hourly-refresh-policy-report.json`
- Provider balance report: `apps/dashboard/data/generated/provider-balance-center-report.json`
- WhatsApp is not connected directly; local task inbox is the safe task entry.
- Balance Center is local-only and must not store passwords, API keys, tokens, cookies, or credentials in the repo.
- Production remains no-go; no production gateway, endpoint, auth/token input, mutation, restart, deploy, or CI is added.

## Sprint 25B: Final Local Operator Release Candidate Audit

- [Local operator release candidate](./openclaw-dashboard-local-operator-release-candidate.md)
- [Final local operator checklist](./openclaw-dashboard-local-operator-final-checklist.md)
- [Known risk register](./openclaw-dashboard-known-risk-register.md)
- RC report: `apps/dashboard/data/generated/local-operator-release-candidate-report.json`
- Final checklist: `apps/dashboard/data/generated/local-operator-final-checklist.json`
- Known risk register: `apps/dashboard/data/generated/local-operator-known-risk-register.json`
- Report index: `apps/dashboard/data/generated/local-operator-report-index.json`
- Required state: `productionReady false`, `adapterEnabled false`, `connected false`, `endpointConfigured false`, `authEnabled false`, `dataReturned false`.
- Production remains no-go; no production gateway, endpoint, auth/token input, mutation, restart, deploy, or CI is added.

## Sprint 25A: Read-only Adapter Contract + Disabled Draft

- [Read-only adapter contract review](./openclaw-dashboard-read-only-adapter-contract-review.md)
- [Disabled read-only adapter draft](./openclaw-dashboard-disabled-read-only-adapter-draft.md)
- [Dashboard stabilization audit](./openclaw-dashboard-stabilization-audit.md)
- Contract report: `apps/dashboard/data/generated/read-only-adapter-contract-review-report.json`
- Disabled draft report: `apps/dashboard/data/generated/disabled-read-only-adapter-draft-report.json`
- Contract checklist: `apps/dashboard/data/generated/read-only-adapter-contract-checklist.json`
- Stabilization audit: `apps/dashboard/data/generated/dashboard-stabilization-audit-report.json`
- Required state: `productionReady false`, `adapterEnabled false`, `connected false`, `endpointConfigured false`, `authEnabled false`, `dataReturned false`.
- Production remains no-go; no production gateway, endpoint, auth/token input, mutation, restart, deploy, or CI is added.

## Sprint 24B: Read-only Production Adapter Simulator

- [Production adapter simulator](./openclaw-dashboard-production-adapter-simulator.md)
- Sample path: `apps/dashboard/data/production-simulator/read-only-production-adapter.sample.json`
- Report path: `apps/dashboard/data/generated/production-adapter-simulator-report.json`
- Checklist path: `apps/dashboard/data/generated/production-adapter-simulator-checklist.json`
- Current state: `productionReady false`, `adapterEnabled false`, `connected false`, `simulatorOnly true`.
- Production still no-go; no endpoint, auth, token, cookie, restart, mutation, deploy, or production gateway connection.

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
## Sprint 23C Reviewed Health Input Assistant

Reviewed Health Input Assistant is documented in:

- [Reviewed Health Input Assistant](./openclaw-dashboard-reviewed-health-input-assistant.md)

Generated reports:

- `apps/dashboard/data/generated/reviewed-local-health-input-template-report.json`
- `apps/dashboard/data/generated/reviewed-local-health-input-dry-run-report.json`
- `apps/dashboard/data/generated/operator-reviewed-health-input-checklist.json`

The real `reviewed-local-agent-health.json` is local-only, ignored, and must not be committed. Production remains `no-go-for-production`; mutation, restart, and production gateway remain disabled.

## Sprint 24A - Production Entry Gate Hardening

- Guide: [Production Entry Gate Hardening](./openclaw-dashboard-production-entry-gate-hardening.md)
- Gate report: `apps/dashboard/data/generated/production-entry-gate-report.json`
- Gate checklist: `apps/dashboard/data/generated/production-entry-gate-checklist.json`
- `productionReady` remains `false`; production gateway, mutation, restart, deploy, and auth-token-use remain disabled.

## Sprint 25D: Chinese-first Operator UX Copy Hardening

- [Chinese operator UX copy hardening](./openclaw-dashboard-chinese-operator-ux-copy-hardening.md)
- Main titles now use `Agent 狀態`, `今日任務`, and `安全審查`.
- Raw technical keys are retained inside `技術詳情` only.
- Production remains no-go; no production gateway, endpoint, auth/token input, mutation, restart, deploy, or secret handling is added.

## Sprint 25E: Operator Console Visual Redesign

- [Operator console visual redesign](./openclaw-dashboard-operator-console-visual-redesign.md)
- Main UI now uses a modern command center, work queue task cards, Agent status cards, Balance / Refresh cards, and collapsed technical details.
- Production remains no-go; no production gateway, endpoint, auth/token input, mutation, restart, deploy, provider login, WhatsApp API, or secret handling is added.
## Sprint 26B

- [OpenClaw Dashboard Local OpenClaw Activation Assistant](openclaw-dashboard-local-openclaw-activation-assistant.md)
- Activation report: `apps/dashboard/data/generated/local-openclaw-activation-report.json`
- Local-only config/export files stay ignored and must not be committed.

## Sprint 26D

- [OpenClaw Dashboard Local OpenClaw Real Bridge](openclaw-dashboard-local-openclaw-real-bridge.md)
- Bridge report: `apps/dashboard/data/generated/openclaw-local-export-bridge-report.json`
- Preferred read-only endpoint: `/api/local/export`
- If only `/health` works, Dashboard stays connected-readonly but shows zero Agent/task counts with a clear explanation.

## Sprint 28A

- [WhatsApp local task import](openclaw-dashboard-whatsapp-local-task-import.md)
- Report: `apps/dashboard/data/generated/whatsapp-local-task-import-report.json`
- Real import file: `apps/dashboard/data/local/whatsapp-task-import.json` is ignored and must not be committed.
- No WhatsApp API, webhook, QR login, token/cookie/session, auto-reply, Production, mutation, restart, or deploy.

## Sprint 28B

- [WhatsApp local task helper](openclaw-dashboard-whatsapp-local-task-helper.md)
- Report: `apps/dashboard/data/generated/whatsapp-local-task-helper-report.json`
- Real helper input: `apps/dashboard/data/local/whatsapp-task-helper-input.txt` is ignored and must not be committed.
- The helper builds an ignored local import JSON from cleaned task blocks only.
- No WhatsApp API, webhook, QR login, token/cookie/session, raw chat dump, auto-reply, Production, mutation, restart, or deploy.
# Dashboard Docs

## WhatsApp safety
See the WhatsApp sync safety design for future-only constraints and blocker list.
# Dashboard Docs

## WhatsApp mock contract
Sprint 28D is offline mock only and adds a fake fixture contract layer for future review.
